import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// import { getAnalytics } from "firebase/analytics"; 

// TODO: Replace with your web app's Firebase configuration
// You can copy this from your Firebase Console > Project Settings > General > Your apps > Web app
const firebaseConfig = {
    apiKey: "AIzaSy...",
    authDomain: "diskichat.firebaseapp.com",
    projectId: "diskichat",
    storageBucket: "diskichat.appspot.com",
    messagingSenderId: "...",
    appId: "...",
    measurementId: "..."
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
// const analytics = getAnalytics(app); 
