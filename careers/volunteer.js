// careers/volunteer.js
// Volunteer registration: Cloudinary upload → unique ELVNX ID → Firestore save

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// ---------- Firebase Config ----------
const firebaseConfig = {
  apiKey: "AIzaSyB4-MOayzUOacDW1IqedFIoCiMXHGgsDQY",
  authDomain: "elvanexblog.firebaseapp.com",
  projectId: "elvanexblog",
  storageBucket: "elvanexblog.firebasestorage.app",
  messagingSenderId: "396500867406",
  appId: "1:396500867406:web:e914a4b40a7b86c918e61f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ---------- Cloudinary ----------
const CLOUDINARY_CLOUD = "dblvhd450";
const CLOUDINARY_PRESET = "elvanexblog";

// ---------- DOM ----------
const form = document.getElementById("volunteerForm");
const picInput = document.getElementById("picInput");
const picPreview = document.getElementById("picPreview");
const skillInput = document.getElementById("skillInput");
const addSkillBtn = document.getElementById("addSkillBtn");
const skillTags = document.getElementById("skillTags");
const submitBtn = document.getElementById("submitVolBtn");
const successScreen = document.getElementById("successScreen");
const successId = document.getElementById("successId");
const formWrap = document.getElementById("volunteerFormWrap");
const progressWrap = document.getElementById("progressWrap");
const progressFill = document.getElementById("progressFill");
const uploadStatus = document.getElementById("uploadStatus");

// ---------- Skills tag list ----------
let skills = [];

function renderTags() {
  skillTags.innerHTML = "";
  skills.forEach((s, i) => {
    const tag = document.createElement("div");
    tag.className = "tag";
    tag.innerHTML = `${s}<button type="button" aria-label="Remove ${s}">×</button>`;
    tag.querySelector("button").addEventListener("click", () => {
      skills.splice(i, 1);
      renderTags();
    });
    skillTags.appendChild(tag);
  });
}

addSkillBtn.addEventListener("click", () => {
  const val = skillInput.value.trim();
  if (val && !skills.includes(val)) {
    skills.push(val);
    renderTags();
  }
  skillInput.value = "";
  skillInput.focus();
});

skillInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") { e.preventDefault(); addSkillBtn.click(); }
});

// ---------- Profile pic preview ----------
picInput.addEventListener("change", () => {
  const file = picInput.files[0];
  if (!file) return;
  picPreview.src = URL.createObjectURL(file);
  picPreview.style.display = "block";
});

// ---------- Cloudinary upload ----------
async function uploadToCloudinary(file) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", CLOUDINARY_PRESET);

  progressWrap.style.display = "block";
  progressFill.style.width = "30%";
  uploadStatus.style.display = "block";
  uploadStatus.textContent = "Uploading profile picture…";

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
    method: "POST",
    body: fd
  });

  progressFill.style.width = "70%";

  if (!res.ok) {
    const txt = await res.text();
    throw new Error("Image upload failed: " + txt);
  }

  const data = await res.json();
  progressFill.style.width = "100%";
  uploadStatus.textContent = "Image uploaded ✓";
  return data.secure_url || "";
}

// ---------- Generate unique ELVNX ID ----------
async function generateUniqueId() {
  let attempts = 0;
  while (attempts < 20) {
    const num = String(Math.floor(1000 + Math.random() * 9000));
    const candidate = `ELVNX-${num}`;

    const q = query(collection(db, "volunteers"), where("elvnxId", "==", candidate));
    const snap = await getDocs(q);

    if (snap.empty) return candidate;
    attempts++;
  }
  // Fallback with timestamp
  return `ELVNX-${Date.now().toString().slice(-6)}`;
}

// ---------- Form Submit ----------
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name    = document.getElementById("volName").value.trim();
  const email   = document.getElementById("volEmail").value.trim();
  const phone   = document.getElementById("volPhone").value.trim();
  const dept    = document.getElementById("volDept").value;
  const desc    = document.getElementById("volDesc").value.trim();
  const picFile = picInput.files[0];

  if (!name || !email || !phone || !dept || !desc) {
    alert("Please fill in all required fields.");
    return;
  }

  if (!picFile) {
    alert("Please upload a profile picture.");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting…";

  try {
    // 1. Upload profile pic
    const profilePicUrl = await uploadToCloudinary(picFile);

    // 2. Generate unique ID
    uploadStatus.textContent = "Generating your certificate ID…";
    progressFill.style.width = "85%";
    const elvnxId = await generateUniqueId();

    // 3. Save to Firestore
    uploadStatus.textContent = "Saving your application…";
    progressFill.style.width = "95%";

    await addDoc(collection(db, "volunteers"), {
      elvnxId,
      name,
      email,
      phone,
      department: dept,
      description: desc,
      skillsets: skills,
      profilePicUrl,
      status: "pending",       // "pending" | "completed"
      adminComment: "",
      registeredAt: serverTimestamp(),
      completedAt: null
    });

    progressFill.style.width = "100%";

    // 4. Show success screen
    successId.textContent = elvnxId;
    formWrap.style.display = "none";
    successScreen.style.display = "block";

  } catch (err) {
    console.error(err);
    alert("Error submitting application: " + (err.message || err));
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit Application";
    progressWrap.style.display = "none";
    uploadStatus.style.display = "none";
  }
});

