import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDbE3amp-8_EzxFyKRIAqJeUGpsOdHaUo0",
  authDomain: "todu-app-98955.firebaseapp.com",
  projectId: "todu-app-98955",
  storageBucket: "todu-app-98955.firebasestorage.app",
  messagingSenderId: "429966552589",
  appId: "1:429966552589:web:765ed2ebd943754bb2ef44",
  measurementId: "G-0LR5QXG1Q0"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);