// blog/volunteers.js
// Admin volunteer management: real-time list, 3-month tracker, mark complete, add comment

import { auth, db } from "./firebase.js";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

// Auth guard
onAuthStateChanged(auth, (user) => {
  if (!user) window.location.href = "login.html";
});

const listEl       = document.getElementById("volunteerList");
const statusFilter = document.getElementById("statusFilter");
const searchInput  = document.getElementById("searchInput");

// ---------- 3-month tracker helper ----------
function trackerInfo(registeredAt) {
  if (!registeredAt) return null;
  let regDate;
  if (registeredAt.toDate) regDate = registeredAt.toDate();
  else if (registeredAt.seconds) regDate = new Date(registeredAt.seconds * 1000);
  else return null;

  const now = new Date();
  const daysSince = Math.floor((now - regDate) / (1000 * 60 * 60 * 24));
  const daysLeft  = Math.max(0, 90 - daysSince);

  return { daysSince, daysLeft };
}

function trackerBadge(info, status) {
  if (!info) return "";
  if (status === "completed") {
    return `<span class="tracker-badge tracker-done"><i class="fa fa-graduation-cap me-1"></i>Completed</span>`;
  }
  if (info.daysLeft > 30) {
    return `<span class="tracker-badge tracker-green"><i class="fa fa-clock me-1"></i>${info.daysLeft} days left</span>`;
  }
  if (info.daysLeft > 0) {
    return `<span class="tracker-badge tracker-amber"><i class="fa fa-exclamation-circle me-1"></i>${info.daysLeft} days left</span>`;
  }
  return `<span class="tracker-badge tracker-red"><i class="fa fa-times-circle me-1"></i>Window expired</span>`;
}

// ---------- Format date ----------
function fmtDate(ts) {
  if (!ts) return "";
  let d;
  if (ts.toDate) d = ts.toDate();
  else if (ts.seconds) d = new Date(ts.seconds * 1000);
  else return "";
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

// ---------- All volunteers (live) ----------
let allVolunteers = [];

const q = query(collection(db, "volunteers"), orderBy("registeredAt", "desc"));
onSnapshot(q, (snapshot) => {
  allVolunteers = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  renderList();
});

// ---------- Filter + search ----------
statusFilter.addEventListener("change", renderList);
searchInput.addEventListener("input", renderList);

function renderList() {
  const filterStatus = statusFilter.value;
  const search = searchInput.value.trim().toLowerCase();

  let filtered = allVolunteers.filter(v => {
    const matchStatus = !filterStatus || v.status === filterStatus;
    const matchSearch = !search ||
      (v.name || "").toLowerCase().includes(search) ||
      (v.elvnxId || "").toLowerCase().includes(search) ||
      (v.department || "").toLowerCase().includes(search) ||
      (v.email || "").toLowerCase().includes(search);
    return matchStatus && matchSearch;
  });

  listEl.innerHTML = "";

  if (!filtered.length) {
    listEl.innerHTML = `<p style="text-align:center;color:#888;margin-top:40px;">No volunteers found.</p>`;
    return;
  }

  filtered.forEach(v => listEl.appendChild(buildCard(v)));
}

// ---------- Build card ----------
function buildCard(v) {
  const card = document.createElement("div");
  card.className = "vol-card";

  const tracker = trackerInfo(v.registeredAt);
  const tBadge  = trackerBadge(tracker, v.status);
  const sBadge  = v.status === "completed"
    ? `<span class="status-badge status-completed"><i class="fa fa-check-circle me-1"></i>Completed</span>`
    : `<span class="status-badge status-pending"><i class="fa fa-clock me-1"></i>Pending</span>`;

  const skills = (v.skillsets || []).map(s => `<span class="vol-skill-tag">${s}</span>`).join("");

  const avatarHtml = v.profilePicUrl
    ? `<img src="${v.profilePicUrl}" class="vol-avatar" alt="${v.name}" />`
    : `<div class="vol-avatar-placeholder"><i class="fa fa-user"></i></div>`;

  card.innerHTML = `
    ${avatarHtml}
    <div class="vol-body">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:4px;">
        <p class="vol-name">${v.name}</p>
        <span class="vol-id">${v.elvnxId}</span>
        ${sBadge}
        ${tBadge}
      </div>
      <div class="vol-dept"><i class="fa fa-briefcase me-1"></i>${v.department || "-"} &bull; <i class="fa fa-envelope me-1"></i>${v.email} &bull; <i class="fa fa-phone me-1"></i>${v.phone || "-"}</div>
      ${v.description ? `<p style="font-size:13px;color:#555;margin:6px 0;">${v.description}</p>` : ""}
      ${skills ? `<div class="vol-skills">${skills}</div>` : ""}
      <div style="font-size:12px;color:#999;margin-bottom:8px;">
        <i class="fa fa-calendar me-1"></i>Registered: ${fmtDate(v.registeredAt)}
        ${v.completedAt ? ` &bull; <i class="fa fa-graduation-cap me-1"></i>Completed: ${fmtDate(v.completedAt)}` : ""}
      </div>
      ${v.adminComment ? `<div class="existing-comment"><i class="fa fa-quote-left me-1" style="color:var(--brand)"></i>${v.adminComment}</div>` : ""}

      <!-- Actions -->
      <div class="vol-actions">
        <button
          class="btn-complete"
          data-id="${v.id}"
          ${v.status === "completed" ? "disabled" : ""}
        >
          <i class="fa fa-check me-1"></i>${v.status === "completed" ? "Session Completed" : "Mark Session Complete"}
        </button>
      </div>

      <!-- Comment input -->
      <div class="comment-wrap">
        <input type="text" placeholder="Add / update admin comment…" id="comment-${v.id}" value="${(v.adminComment || "").replace(/"/g, '&quot;')}" />
        <button data-id="${v.id}" class="save-comment-btn"><i class="fa fa-save me-1"></i>Save</button>
      </div>
    </div>`;

  // Mark complete handler
  card.querySelector(".btn-complete").addEventListener("click", async (e) => {
    const id = e.currentTarget.dataset.id;
    if (!confirm("Mark this volunteer session as completed? This will allow their certificate to be verified publicly.")) return;
    try {
      await updateDoc(doc(db, "volunteers", id), {
        status: "completed",
        completedAt: serverTimestamp()
      });
    } catch (err) {
      alert("Error: " + err.message);
    }
  });

  // Save comment handler
  card.querySelector(".save-comment-btn").addEventListener("click", async (e) => {
    const id = e.currentTarget.dataset.id;
    const commentInput = card.querySelector(`#comment-${id}`);
    const comment = commentInput.value.trim();
    try {
      e.currentTarget.textContent = "Saving…";
      await updateDoc(doc(db, "volunteers", id), { adminComment: comment });
      e.currentTarget.innerHTML = '<i class="fa fa-check me-1"></i>Saved';
      setTimeout(() => { e.currentTarget.innerHTML = '<i class="fa fa-save me-1"></i>Save'; }, 2000);
    } catch (err) {
      alert("Error saving comment: " + err.message);
    }
  });

  return card;
}

// Logout
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    const { signOut } = await import("https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js");
    await signOut(auth);
    window.location.href = "login.html";
  });
}
