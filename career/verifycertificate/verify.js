// career/verifycertificate/verify.js
// Public certificate lookup — no auth required

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

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

const certIdInput = document.getElementById("certIdInput");
const verifyBtn   = document.getElementById("verifyBtn");
const resultArea  = document.getElementById("resultArea");

// Allow pressing Enter to search
certIdInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") verifyBtn.click();
});

// Auto-uppercase the input as user types
certIdInput.addEventListener("input", () => {
  certIdInput.value = certIdInput.value.toUpperCase();
});

verifyBtn.addEventListener("click", async () => {
  const rawId = certIdInput.value.trim().toUpperCase();

  if (!rawId) {
    resultArea.innerHTML = "<p class='text-center text-muted mt-4'>Please enter a certificate ID.</p>";
    return;
  }

  // Basic format check
  if (!/^ELVNX-\d{4,}$/.test(rawId)) {
    resultArea.innerHTML = `
      <div class="not-found">
        <i class="fa fa-exclamation-circle d-block"></i>
        <h5>Invalid Format</h5>
        <p>IDs look like <strong>ELVNX-8930</strong>. Please check and try again.</p>
      </div>`;
    return;
  }

  verifyBtn.disabled = true;
  verifyBtn.innerHTML = '<i class="fa fa-spinner fa-spin me-2"></i>Searching…';
  resultArea.innerHTML = "";

  try {
    const q = query(
      collection(db, "volunteers"),
      where("elvnxId", "==", rawId)
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      resultArea.innerHTML = `
        <div class="not-found">
          <i class="fa fa-times-circle d-block"></i>
          <h5>No Record Found</h5>
          <p>The ID <strong>${rawId}</strong> does not match any Elvanex certificate. Please double-check the ID and try again.</p>
        </div>`;
      return;
    }

    const data = snap.docs[0].data();

    if (data.status !== "completed") {
      resultArea.innerHTML = `
        <div class="cert-card">
          <span class="status-badge status-pending mb-3 d-inline-block">
            <i class="fa fa-clock me-1"></i>Pending
          </span>
          <h5>${rawId}</h5>
          <p class="text-muted">This certificate has been registered but has not yet been issued. Please check back after the volunteer programme is completed.</p>
        </div>`;
      return;
    }

    // Format registration date
    let regDate = "";
    if (data.registeredAt?.seconds) {
      regDate = new Date(data.registeredAt.seconds * 1000).toLocaleDateString("en-US", {
        day: "numeric", month: "long", year: "numeric"
      });
    }

    let completedDate = "";
    if (data.completedAt?.seconds) {
      completedDate = new Date(data.completedAt.seconds * 1000).toLocaleDateString("en-US", {
        day: "numeric", month: "long", year: "numeric"
      });
    }

    // Skills tags HTML
    const skillsHtml = (data.skillsets || []).length
      ? data.skillsets.map(s => `<span class="cert-skill-tag">${s}</span>`).join("")
      : "";

    // Admin comment
    const commentHtml = data.adminComment
      ? `<div class="cert-comment"><i class="fa fa-quote-left me-2" style="color:var(--brand)"></i>${data.adminComment}</div>`
      : "";

    resultArea.innerHTML = `
      <div class="cert-card">
       <div class="cert-id-badge">${data.elvnxId}</div>
        <div class="mb-2">
          <span class="status-badge status-completed">
            <i class="fa fa-check-circle me-1"></i>Verified
          </span>
        </div>

            

        ${data.profilePicUrl
          ? `<img src="${data.profilePicUrl}" alt="${data.name}" class="cert-avatar" />`
          : `<div style="width:110px;height:110px;border-radius:50%;background:#f0eaff;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;border:4px solid var(--brand)"><i class="fa fa-user fa-2x" style="color:var(--brand)"></i></div>`
        }

   

        <div class="cert-name">${data.name}</div>
        <div class="cert-dept">${data.department || "Volunteer"}</div>

        ${data.description
          ? `<p style="color:#555;font-size:0.95rem;line-height:1.6;max-width:420px;margin:0 auto 16px;">${data.description}</p>`
          : ""}

        ${skillsHtml ? `<div class="cert-skills">${skillsHtml}</div>` : ""}

        <div style="font-size:13px;color:#999;margin-bottom:8px;">
          ${regDate ? `<span><i class="fa fa-calendar me-1"></i>Registered: ${regDate}</span>` : ""}
          ${completedDate ? `&nbsp;&bull;&nbsp;<span><i class="fa fa-graduation-cap me-1"></i>Completed: ${completedDate}</span>` : ""}
        </div>

        ${commentHtml}

        <div style="margin-top:24px;padding-top:20px;border-top:1px solid #f0eaff;">
          <img src="../../img/logo.png" alt="Elvanex" style="width:40px;opacity:.7;" />
          <p style="font-size:12px;color:#aaa;margin-top:6px;">This certificate is issued by Elvanex Digital Agency</p>
        </div>
      </div>`;

  } catch (err) {
    console.error(err);
    resultArea.innerHTML = `<p class="text-center text-danger mt-4">Error verifying certificate. Please try again.</p>`;
  } finally {
    verifyBtn.disabled = false;
    verifyBtn.innerHTML = '<i class="fa fa-shield-alt me-2"></i>Verify Certificate';
  }
});
