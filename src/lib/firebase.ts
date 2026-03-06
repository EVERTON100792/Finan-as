import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  projectId: "sistemafinanceiro-4b2a7",
  appId: "1:209029878461:web:c516902eff6e3c9120ddd4",
  storageBucket: "sistemafinanceiro-4b2a7.firebasestorage.app",
  apiKey: "AIzaSyDTpxIxU07pRW7TuIyM0Ea0T_uSH9D5Kw4",
  authDomain: "sistemafinanceiro-4b2a7.firebaseapp.com",
  messagingSenderId: "209029878461",
  measurementId: "G-16J3CLP7BD"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
