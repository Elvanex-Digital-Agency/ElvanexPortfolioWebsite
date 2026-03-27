// blog/volunteers.js
// Admin volunteer management: 3-stage flow, real-time, 3-month tracker, comments
//
// Status flow:
//   pending  → "Verify Application"   → verified  (3-month clock starts)
//   verified → "Mark Session Complete"→ completed (comment input unlocks)
//   completed→ admin adds comment     → publicly verifiable

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

// ---------- 3-month tracker (from verifiedAt) ----------
function trackerInfo(verifiedAt) {
  if (!verifiedAt) return null;
  let vDate;
  if (verifiedAt.toDate) vDate = verifiedAt.toDate();
  else if (verifiedAt.seconds) vDate = new Date(verifiedAt.seconds * 1000);
  else return null;

  const now       = new Date();
  const daysSince = Math.floor((now - vDate) / (1000 * 60 * 60 * 24));
  const daysLeft  = Math.max(0, 90 - daysSince);
  return { daysSince, daysLeft };
}

function trackerBadge(info, status) {
  if (status === "pending") return "";
  if (status === "completed") {
    return `<span class="tracker-badge tracker-done"><i class="fa fa-graduation-cap" style="margin-right:5px"></i>Completed</span>`;
  }
  // verified
  if (!info) return "";
  if (info.daysLeft > 30) {
    return `<span class="tracker-badge tracker-green"><i class="fa fa-clock" style="margin-right:5px"></i>${info.daysLeft} days left</span>`;
  }
  if (info.daysLeft > 0) {
    return `<span class="tracker-badge tracker-amber"><i class="fa fa-exclamation-circle" style="margin-right:5px"></i>${info.daysLeft} days left</span>`;
  }
  return `<span class="tracker-badge tracker-red"><i class="fa fa-times-circle" style="margin-right:5px"></i>Window expired</span>`;
}

function statusBadge(status) {
  if (status === "completed") {
    return `<span class="status-badge status-completed"><i class="fa fa-check-circle" style="margin-right:5px"></i>Completed</span>`;
  }
  if (status === "verified") {
    return `<span class="status-badge status-verified"><i class="fa fa-user-check" style="margin-right:5px"></i>Verified</span>`;
  }
  return `<span class="status-badge status-pending"><i class="fa fa-hourglass-half" style="margin-right:5px"></i>Pending</span>`;
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

// ---------- Live data ----------
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

  const filtered = allVolunteers.filter(v => {
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

  const tracker    = trackerInfo(v.verifiedAt);
  const tBadge     = trackerBadge(tracker, v.status);
  const sBadge     = statusBadge(v.status);
  const skills     = (v.skillsets || []).map(s => `<span class="vol-skill-tag">${s}</span>`).join("");
  const avatarHtml = v.profilePicUrl
    ? `<img src="${v.profilePicUrl}" class="vol-avatar" alt="${v.name}" />`
    : `<div class="vol-avatar-placeholder"><i class="fa fa-user"></i></div>`;

  // Dates row — grows as volunteer progresses
  let datesHtml = `<i class="fa fa-calendar" style="margin-right:5px"></i>Applied: ${fmtDate(v.registeredAt)}`;
  if (v.verifiedAt)  datesHtml += ` &bull; <i class="fa fa-user-check" style="margin-right:5px"></i>Verified: ${fmtDate(v.verifiedAt)}`;
  if (v.completedAt) datesHtml += ` &bull; <i class="fa fa-graduation-cap" style="margin-right:5px"></i>Completed: ${fmtDate(v.completedAt)}`;

  // Action button — changes per stage
  let actionsHtml = "";
  if (v.status === "pending") {
    actionsHtml = `
      <button class="btn-verify" data-id="${v.id}">
        <i class="fa fa-check-double" style="margin-right:6px"></i>Verify Application
      </button>`;
  } else if (v.status === "verified") {
    actionsHtml = `
      <button class="btn-complete" data-id="${v.id}">
        <i class="fa fa-flag-checkered" style="margin-right:6px"></i>Mark Session Complete
      </button>`;
  } else {
    actionsHtml = `
      <button class="btn-complete" disabled>
        <i class="fa fa-check" style="margin-right:6px"></i>Session Completed
      </button>`;
  }

  // Comment input — only unlocks after completion
  const commentHtml = v.status === "completed" ? `
    ${v.adminComment ? `<div class="existing-comment"><i class="fa fa-quote-left" style="margin-right:6px;color:var(--brand)"></i>${v.adminComment}</div>` : ""}
    <div class="comment-area" style="margin-top:15px; border-top: 1px dashed #eee; padding-top: 12px;">
      <label for="comment-${v.id}" style="display:block; font-size:12px; font-weight:700; color:#444; margin-bottom:6px;">Add a comment about this student's contribution to the organization…</label>
      <div class="comment-flex" style="display:flex; gap:8px;">
        <input type="text" id="comment-${v.id}" value="${(v.adminComment || "").replace(/"/g, '&quot;')}" style="flex:1" />
        <button data-id="${v.id}" class="save-comment-btn" style="white-space:nowrap">
          <i class="fa fa-save" style="margin-right:5px"></i>Save
        </button>
      </div>
    </div>` : "";

  card.innerHTML = `
    ${avatarHtml}
    <div class="vol-body">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:6px;">
        <p class="vol-name">${v.name}</p>
        <span class="vol-id">${v.elvnxId}</span>
        ${sBadge}
        ${tBadge}
      </div>
      <div class="vol-dept">
        <span><i class="fa fa-briefcase" style="margin-right:5px"></i>${v.department || "-"}</span>
        <span style="margin:0 8px">&bull;</span>
        <span><i class="fa fa-envelope" style="margin-right:5px"></i>${v.email}</span>
        <span style="margin:0 8px">&bull;</span>
        <span><i class="fa fa-phone" style="margin-right:5px"></i>${v.phone || "-"}</span>
      </div>
      ${v.description ? `<p style="font-size:13px;color:#555;margin:8px 0 4px;">${v.description}</p>` : ""}
      ${skills ? `<div class="vol-skills">${skills}</div>` : ""}
      <div style="font-size:12px;color:#999;margin:8px 0 10px;">${datesHtml}</div>
      <div class="vol-actions">${actionsHtml}</div>
      ${commentHtml}
    </div>`;

  // --- Verify handler (pending → verified) ---
  const verifyBtn = card.querySelector(".btn-verify");
  if (verifyBtn) {
    verifyBtn.addEventListener("click", async (e) => {
      const btn = e.currentTarget;
      const id = btn.dataset.id;
      if (!confirm("Verify this volunteer's application? The 3-month session clock will start from today.")) return;
      try {
        btn.disabled = true;
        btn.textContent = "Verifying…";
        await updateDoc(doc(db, "volunteers", id), {
          status: "verified",
          verifiedAt: serverTimestamp()
        });
      } catch (err) {
        alert("Error: " + err.message);
        btn.disabled = false;
        btn.textContent = "Verify Application";
      }
    });
  }

  // --- Mark Complete handler (verified → completed) ---
  const completeBtn = card.querySelector(".btn-complete:not([disabled])");
  if (completeBtn) {
    completeBtn.addEventListener("click", async (e) => {
      const btn = e.currentTarget;
      const id = btn.dataset.id;
      if (!confirm("Mark this session as completed? The volunteer's certificate will become publicly verifiable.")) return;
      try {
        btn.disabled = true;
        btn.textContent = "Saving…";
        await updateDoc(doc(db, "volunteers", id), {
          status: "completed",
          completedAt: serverTimestamp()
        });
      } catch (err) {
        alert("Error: " + err.message);
        btn.disabled = false;
        btn.innerHTML = '<i class="fa fa-flag-checkered" style="margin-right:6px"></i>Mark Session Complete';
      }
    });
  }

  // --- Save comment handler (completed only) ---
  const saveCommentBtn = card.querySelector(".save-comment-btn");
  if (saveCommentBtn) {
    saveCommentBtn.addEventListener("click", async (e) => {
      const btn = e.currentTarget;
      const id = btn.dataset.id;
      const commentInput = card.querySelector(`#comment-${id}`);
      const comment = commentInput.value.trim();
      try {
        btn.textContent = "Saving…";
        await updateDoc(doc(db, "volunteers", id), { adminComment: comment });
        btn.innerHTML = '<i class="fa fa-check" style="margin-right:5px"></i>Saved';
        setTimeout(() => {
          btn.innerHTML = '<i class="fa fa-save" style="margin-right:5px"></i>Save';
        }, 2500);
      } catch (err) {
        alert("Error saving comment: " + err.message);
        btn.innerHTML = '<i class="fa fa-save" style="margin-right:5px"></i>Save';
      }
    });
  }

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
