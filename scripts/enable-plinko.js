// Quick script to add plinko to activeGames in Firebase
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, updateDoc, arrayUnion } = require('firebase/firestore');

const firebaseConfig = {
    apiKey: "AIzaSyAUswd0rJHOZMIyPwkbndY4as6eZqhp0B4",
    authDomain: "tips-94f01.firebaseapp.com",
    projectId: "tips-94f01",
    storageBucket: "tips-94f01.firebasestorage.app",
    messagingSenderId: "999742745034",
    appId: "1:999742745034:web:f23d9c2f841f66b5650733"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function enablePlinko() {
    try {
        await updateDoc(doc(db, 'settings', 'casino'), {
            activeGames: arrayUnion('plinko')
        });
        console.log('Plinko added to activeGames!');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

enablePlinko();
