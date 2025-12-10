import { auth } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

// --- LOGIN ---
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = "dashboard.html";
    } catch (err) {
      alert("Login failed: " + err.message);
    }
  });
}

// --- SIGNUP ---
const signupForm = document.getElementById("signupForm");
if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      alert("Signup successful. You can now log in.");
      window.location.href = "login.html";
    } catch (err) {
      alert("Signup failed: " + err.message);
    }
  });
}

// --- AUTH STATE & LOGOUT ---
onAuthStateChanged(auth, (user) => {
  const path = window.location.pathname;
  const file = path.split("/").pop();

  // Protect dashboard
  if (file === "dashboard.html" && !user) {
    window.location.href = "login.html";
  }

  // Redirect logged-in user away from login/signup
  if ((file === "login.html" || file === "signup.html") && user) {
    window.location.href = "dashboard.html";
  }

  // Logout button logic
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.onclick = async () => {
      try {
        await signOut(auth);
        window.location.href = "login.html";
      } catch (err) {
        alert("Logout error: " + err.message);
      }
    };
  }
});
