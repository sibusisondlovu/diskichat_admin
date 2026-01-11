import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// import { getAnalytics } from "firebase/analytics"; 


const firebaseConfig = {
    apiKey: "AIzaSyCQN_EBBeTSv8R1FAVFtMyVk1z7IwSqwcs",
    authDomain: "diskichatapp.firebaseapp.com",
    projectId: "diskichatapp",
    storageBucket: "diskichatapp.firebasestorage.app",
    messagingSenderId: "1043541561298",
    appId: "1:1043541561298:web:bab9f5de48ca0ab860820b",
    measurementId: "G-7G0W2C5N99"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
// const analytics = getAnalytics(app); 
