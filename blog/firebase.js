// /js/firebase.js
// Using Firebase modular SDK (v9+). No analytics.

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// Firebase config (from you)
const firebaseConfig = {
  apiKey: "AIzaSyB4-MOayzUOacDW1IqedFIoCiMXHGgsDQY",
  authDomain: "elvanexblog.firebaseapp.com",
  projectId: "elvanexblog",
  storageBucket: "elvanexblog.firebasestorage.app",
  messagingSenderId: "396500867406",
  appId: "1:396500867406:web:e914a4b40a7b86c918e61f",
  measurementId: "G-M5586DE2KW"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
