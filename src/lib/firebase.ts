// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBWPf0bDAM9zWAIJLlsVwgqHaELi70UavI",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "layai-8d755.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "layai-8d755",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "layai-8d755.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "261921951232",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:261921951232:web:b20b5f2de1c5a07d2c12e5",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-V621Y968FJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// 🔥 FIXED: Initialize Analytics with error handling to prevent 400 errors
let analytics = null;
if (typeof window !== 'undefined') {
  try {
    // Only initialize analytics if we have a valid environment
    if (process.env.NODE_ENV === 'production' && firebaseConfig.measurementId) {
      analytics = getAnalytics(app);
    }
  } catch (error) {
    console.warn('Analytics initialization failed (non-critical):', error);
  }
}

export { analytics };
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app; 