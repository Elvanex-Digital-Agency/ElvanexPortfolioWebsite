// /js/firebase.js
// Using Firebase modular SDK (v9+). No analytics.

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// Firebase config (from you)
const firebaseConfig = {
  apiKey: "AIzaSyAoQS0iEsnjIu0RC60DteVd2ng2dIEP298",
  authDomain: "elvanex-blog.firebaseapp.com",
  projectId: "elvanex-blog",
  storageBucket: "elvanex-blog.firebasestorage.app",
  messagingSenderId: "464403885382",
  appId: "1:464403885382:web:6ea14780c60c1bd20d0947",
  measurementId: "G-9C42JXG2M9"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
