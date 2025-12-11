import { auth, db } from "./firebase.js";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const adminPosts = document.getElementById("adminPosts");

// Ensure only logged-in users
auth.onAuthStateChanged(user => {
  if (!user) window.location.href = "login.html";
});

// Format Firestore timestamp safely
function formatDate(timestamp) {
  if (!timestamp) return "";
  let date;
  if (timestamp.toDate) date = timestamp.toDate();
  else if (timestamp.seconds) date = new Date(timestamp.seconds * 1000);
  else if (timestamp instanceof Date) date = timestamp;
  else date = new Date(timestamp);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// Calculate reading time
function calcReadingTime(text) {
  if (!text) return "1 min read";
  const words = (text || "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200)) + " min read";
}

// Real-time posts list
const postsRef = collection(db, "posts");
const q = query(postsRef, orderBy("createdAt", "desc"));

onSnapshot(q, snapshot => {
  adminPosts.innerHTML = "";
  if (snapshot.empty) {
    adminPosts.innerHTML = "<p>No posts yet.</p>";
    return;
  }

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const id = docSnap.id;

    const container = document.createElement("div");
    container.className = "admin-post-card";
    container.style = "padding:12px;margin-bottom:12px;border:1px solid #eee;border-radius:8px;display:flex;gap:12px;align-items:flex-start;";

    // image (small)
    const imgWrap = document.createElement("div");
    imgWrap.style = "min-width:120px;max-width:120px;flex:0 0 120px;";
    if (data.imageUrl) {
      imgWrap.innerHTML = `<img src="${data.imageUrl}" style="width:120px;height:70px;object-fit:cover;border-radius:6px;">`;
    } else {
      imgWrap.innerHTML = `<div style="width:120px;height:70px;background:#f5f5f5;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#aaa;font-size:12px;">No image</div>`;
    }

    const metaWrap = document.createElement("div");
    metaWrap.style = "flex:1";

    const titleEl = document.createElement("h4");
    titleEl.textContent = data.title || "Untitled";
    titleEl.style = "margin:0 0 6px;color:#0770fd;";

    const small = document.createElement("div");
    small.style = "font-size:12px;color:#666;margin-bottom:8px;";
    small.textContent = `Author: ${data.author || "Elvanex Team"} • Slug: ${data.slug || "-"} • Published: ${formatDate(data.createdAt)} • ${calcReadingTime(data.body || "")}`;

    const bodyEl = document.createElement("p");
    bodyEl.textContent = (data.body || "").length > 220 ? (data.body || "").substring(0, 220) + "..." : (data.body || "");
    bodyEl.style = "margin:0 0 8px;color:#333;font-size:14px;";

    const actions = document.createElement("div");
    actions.style = "display:flex;gap:8px";

    const viewBtn = document.createElement("button");
    viewBtn.textContent = "View";
    viewBtn.style = "padding:6px 10px;cursor:pointer;";
    viewBtn.onclick = () => window.open(`post.html?slug=${encodeURIComponent(data.slug)}&id=${id}`, "_blank");

    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.style = "padding:6px 10px;cursor:pointer;";
    editBtn.onclick = () => window.location.href = `dashboard.html?editId=${id}`;

    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.style = "padding:6px 10px;cursor:pointer;background:#ff3b3b;color:#fff;border:none;border-radius:6px;";
    delBtn.onclick = async () => {
      if (!confirm("Delete this post? This cannot be undone.")) return;
      try {
        await deleteDoc(doc(db, "posts", id));
        alert("Post deleted!");
      } catch (err) {
        console.error(err);
        alert("Delete failed: " + (err.message || err));
      }
    };

    actions.appendChild(viewBtn);
    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    metaWrap.appendChild(titleEl);
    metaWrap.appendChild(small);
    metaWrap.appendChild(bodyEl);
    metaWrap.appendChild(actions);

    container.appendChild(imgWrap);
    container.appendChild(metaWrap);
    adminPosts.appendChild(container);
  });
});
