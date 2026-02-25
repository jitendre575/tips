# 🏏 CricBet - Modern Cricket Betting Web App (Demo)

A premium, full-stack cricket betting dashboard built with **React**, **Tailwind CSS**, and **Firebase**. This is a demo application using virtual coins, perfect for learning sports betting logic and real-time data handling.

## ✨ Features

- **Attractive Landing Page**: Modern cricket-themed design with glassmorphism effects.
- **Firebase Auth**: Secure login/signup via Email & Password.
- **Live Dashboard**: Real-time match lists with team logos, odds, and status.
- **Advanced Betting Logic**:
  - Place bets using virtual coins.
  - **Powerplay Bonus**: 2x rewards if a six is hit in the first 4 overs (Admin triggered).
- **Admin Panel**: Add matches, update scores, declare winners, and settle bets instantly.
- **Leaderboard**: Compete with other users for the top balance.
- **Wallet Recharge**: Demo "Refill" button to add 5,000 coins for testing.
- **Responsive Design**: Fully optimized for Mobile and Desktop.

## 🛠️ Tech Stack

- **Frontend**: React (Vite), Tailwind CSS, Framer Motion, Lucide Icons.
- **Backend/DB**: Firebase Authentication, Firestore (Real-time DB).
- **Notifications**: React Hot Toast.

---

## 🚀 Getting Started Locally

### 1. Prerequisite
- Node.js (v18+)
- Firebase Account

### 2. Setup Firebase
1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Create a new project called "CricBet".
3. Add a **Web App** to get your Firebase Config.
4. Enable **Authentication** (Email/Password).
5. Enable **Cloud Firestore** and set rules to `allow read, write: if request.auth != null;`.

### 3. Installation
```powershell
# Clone or open the project directory
cd UNP

# Install dependencies
npm install

# Update Firebase config in src/firebase.js
# Replace placeholders with your actual Firebase project keys
```

### 4. Run Development Server
```powershell
npm run dev
```

---

## 🛠️ Admin Setup (Mandatory)

To use the Admin Panel, you need to mark your user as an admin manually in Firestore:
1. Sign up on the landing page.
2. Go to Firebase Console -> Firestore -> `users` collection.
3. Find your user ID and change `isAdmin: false` to `isAdmin: true`.
4. Refresh the app and you will see the **Admin** link in the navbar.

---

## 📦 Deployment Guide

### Push to GitHub
1. Create a repository on GitHub.
2. Run the following commands:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### Deploy on Vercel
1. Login to [Vercel](https://vercel.com/).
2. Click **Add New** -> **Project**.
3. Import your GitHub repository.
4. Vercel will automatically detect Vite. Click **Deploy**.
5. Your site is live!

---

## 📂 Folder Structure
```text
src/
├── components/       # Reusable UI (Navbar, MatchCard, BetModal)
├── context/          # Auth & Global State
├── pages/            # View Pages (Landing, Dashboard, Admin, History, Leaderboard)
├── firebase.js       # Firebase SDK Setup
├── index.css         # Tailwind & Custom Styles
└── App.jsx           # Routing & Layout
```

---

*Enjoy the game! (No real money involved)*
