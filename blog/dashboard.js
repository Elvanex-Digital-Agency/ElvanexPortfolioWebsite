// /js/dashboard.js
import { auth, db } from "./firebase.js";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const postForm = document.getElementById("postForm");
const titleInput = document.getElementById("title");
const bodyInput = document.getElementById("text");
const adminPosts = document.getElementById("adminPosts");
const cancelEditBtn = document.getElementById("cancelEdit");

let editingId = null;

// Ensure only logged-in users can stay here is handled in auth.js

// Create post
postForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = titleInput.value.trim();
  const body = bodyInput.value.trim();
  if (!title || !body) {
    alert("Title and body required.");
    return;
  }

  try {
    if (editingId) {
      // update existing
      const ref = doc(db, "posts", editingId);
      await updateDoc(ref, {
        title,
        body,
        updatedAt: serverTimestamp()
      });
      editingId = null;
      cancelEditBtn.style.display = "none";
    } else {
      // add new
      await addDoc(collection(db, "posts"), {
        title,
        body,
        createdAt: serverTimestamp()
      });
    }
    postForm.reset();
  } catch (err) {
    alert("Error saving post: " + err.message);
  }
});

// Cancel edit
if (cancelEditBtn) {
  cancelEditBtn.addEventListener("click", () => {
    editingId = null;
    postForm.reset();
    cancelEditBtn.style.display = "none";
  });
}

// Real-time list of posts for admin (with edit + delete)
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
    editBtn.onclick = async () => {
      // fill form with existing data
      const docRef = doc(db, "posts", id);
      const d = await getDoc(docRef);
      if (d.exists()) {
        const post = d.data();
        titleInput.value = post.title || "";
        bodyInput.value = post.body || "";
        editingId = id;
        cancelEditBtn.style.display = "inline-block";
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };

    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.style = "padding:6px 10px;cursor:pointer;background:#ff3b3b;color:#fff;border:none;border-radius:6px;";
    delBtn.onclick = async () => {
      const ok = confirm("Delete this post? This cannot be undone.");
      if (!ok) return;
      try {
        await deleteDoc(doc(db, "posts", id));
      } catch (err) {
        alert("Delete failed: " + err.message);
      }
    };

    const viewBtn = document.createElement("button");
    viewBtn.textContent = "View";
    viewBtn.style = "margin-right:8px;padding:6px 10px;cursor:pointer;";
    viewBtn.onclick = () => {
      // open post in public view
      window.open(`/html/post.html?id=${id}`, "_blank");
    };

    actions.appendChild(viewBtn);
    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    container.appendChild(titleEl);
    container.appendChild(bodyEl);
    container.appendChild(actions);

    adminPosts.appendChild(container);
  });

  if (snapshot.empty) {
    adminPosts.innerHTML = "<p>No posts yet.</p>";
  }
});
