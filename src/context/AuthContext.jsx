import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
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
                        // Initialize user in Firestore if not exists
                        const initialData = {
                            email: currentUser.email,
                            balance: 1000, // Starting bonus
                            isAdmin: false,
                            createdAt: new Date().toISOString()
                        };
                        await setDoc(userRef, initialData);
                        setUserData(initialData);
                    } else {
                        setUserData(userSnap.data());
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
