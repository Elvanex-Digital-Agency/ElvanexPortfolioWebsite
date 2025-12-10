import { auth, db } from "./firebase.js";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  deleteDoc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const adminPosts = document.getElementById("adminPosts");

// Redirect if not logged in
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
onAuthStateChanged(auth, (user) => {
  if (!user) window.location.href = "login.html";
});

// Real-time posts
const postsRef = collection(db, "posts");
const q = query(postsRef, orderBy("createdAt", "desc"));

onSnapshot(q, (snapshot) => {
  adminPosts.innerHTML = "";
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const id = docSnap.id;

    const container = document.createElement("div");
    container.className = "admin-post-card";
    container.style = "padding:12px;margin-bottom:12px;border:1px solid #eee;border-radius:8px;";

    const titleEl = document.createElement("h4");
    titleEl.textContent = data.title;
    titleEl.style = "margin:0 0 6px;color:#0770fd;";

    const bodyEl = document.createElement("p");
    bodyEl.textContent = data.body.length > 300 ? data.body.substring(0, 300) + "..." : data.body;
    bodyEl.style = "margin:0 0 8px;";

    const actions = document.createElement("div");

    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.style = "margin-right:8px;padding:6px 10px;cursor:pointer;";
    editBtn.onclick = () => {
      window.location.href = "./dashboard.html"; // Redirect to dashboard for editing
    };

    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.style = "padding:6px 10px;cursor:pointer;background:#ff3b3b;color:#fff;border:none;border-radius:6px;";
    delBtn.onclick = async () => {
      if (confirm("Delete this post?")) {
        await deleteDoc(doc(db, "posts", id));
      }
    };

    const viewBtn = document.createElement("button");
    viewBtn.textContent = "View";
    viewBtn.style = "margin-right:8px;padding:6px 10px;cursor:pointer;";
    viewBtn.onclick = () => window.open(`/html/post.html?id=${id}`, "_blank");

    actions.appendChild(viewBtn);
    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    container.appendChild(titleEl);
    container.appendChild(bodyEl);
    container.appendChild(actions);

    adminPosts.appendChild(container);
  });

  if (snapshot.empty) adminPosts.innerHTML = "<p>No posts yet.</p>";
});
