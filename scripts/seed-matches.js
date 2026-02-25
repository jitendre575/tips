import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Simple .env parser to avoid dependency issues
function getEnv() {
    const envPath = join(__dirname, '../.env');
    const content = fs.readFileSync(envPath, 'utf8');
    const config = {};
    content.split('\n').forEach(line => {
        const [key, ...value] = line.split('=');
        if (key && value) {
            config[key.trim()] = value.join('=').trim();
        }
    });
    return config;
}

const envConfig = getEnv();

const firebaseConfig = {
    apiKey: envConfig.VITE_FIREBASE_API_KEY,
    authDomain: envConfig.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: envConfig.VITE_FIREBASE_PROJECT_ID,
    storageBucket: envConfig.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: envConfig.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: envConfig.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const matches = [
    {
        teamA: "India",
        teamB: "Pakistan",
        oddsTeamA: 1.70,
        oddsTeamB: 2.15,
        matchTime: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
        status: "Live",
        currentScore: "185/4 (18.4)",
        tournament: "T20 WORLD CUP",
        sixInPowerplay: true,
        winner: null,
        createdAt: new Date().toISOString()
    },
    {
        teamA: "MI",
        teamB: "CSK",
        oddsTeamA: 1.90,
        oddsTeamB: 1.90,
        matchTime: new Date(Date.now() + 1000 * 60 * 60 * 5).toISOString(),
        status: "Upcoming",
        tournament: "IPL 2026",
        sixInPowerplay: false,
        winner: null,
        createdAt: new Date().toISOString()
    },
    {
        teamA: "Australia",
        teamB: "South Africa",
        oddsTeamA: 1.65,
        oddsTeamB: 2.25,
        matchTime: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
        status: "Upcoming",
        tournament: "ODI SERIES",
        sixInPowerplay: false,
        winner: null,
        createdAt: new Date().toISOString()
    }
];

async function seed() {
    console.log("Seeding matches to Firestore...");
    for (const match of matches) {
        try {
            await addDoc(collection(db, "matches"), match);
            console.log(`✅ Success: ${match.teamA} vs ${match.teamB}`);
        } catch (e) {
            console.error(`❌ Error adding ${match.teamA}:`, e.message);
        }
    }
    console.log("\nFinished seeding. Please refresh your browser.");
    process.exit(0);
}

seed();
