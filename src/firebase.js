import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAUswd0rJHOZMIyPwkbndY4as6eZqhp0B4",
    authDomain: "tips-94f01.firebaseapp.com",
    projectId: "tips-94f01",
    storageBucket: "tips-94f01.firebasestorage.app",
    messagingSenderId: "999742745034",
    appId: "1:999742745034:web:f23d9c2f841f66b5650733"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
