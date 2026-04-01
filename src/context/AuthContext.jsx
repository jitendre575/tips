import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);

            try {
                if (currentUser) {
                    // Sync user data from Firestore
                    const userRef = doc(db, 'users', currentUser.uid);

                    // Initial fetch
                    const userSnap = await getDoc(userRef);
                    if (!userSnap.exists()) {
                        const initialData = {
                            email: currentUser.email,
                            inrBalance: 0,
                            usdtBalance: 0,
                            balance: 0, // Legacy
                            totalDeposit: 0,
                            totalWithdraw: 0,
                            totalBets: 0,
                            isAdmin: false,
                            createdAt: new Date().toISOString()
                        };
                        await setDoc(userRef, initialData);
                        setUserData(initialData);
                    } else {
                        const data = userSnap.data();
                        // Migration logic: If user has old 'balance' but no 'inrBalance', move it
                        if (data.balance !== undefined && data.inrBalance === undefined) {
                            const migratedData = {
                                ...data,
                                inrBalance: data.balance,
                                usdtBalance: data.usdtBalance || 0
                            };
                            await updateDoc(userRef, {
                                inrBalance: data.balance,
                                usdtBalance: data.usdtBalance || 0
                            });
                            setUserData(migratedData);
                        } else {
                            setUserData(data);
                        }
                    }

                    // Real-time listener for balance updates
                    const unsubFirestore = onSnapshot(userRef, (doc) => {
                        if (doc.exists()) {
                            setUserData(doc.data());
                        }
                    }, (error) => {
                        console.error("Firestore snapshot error:", error);
                    });

                    setLoading(false);
                    return () => unsubFirestore();
                } else {
                    setUserData(null);
                    setLoading(false);
                }
            } catch (error) {
                console.error("Auth error:", error);
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const value = {
        user,
        userData,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
