import { auth, db } from "./firebase.js";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {

  // -------------------- ELEMENTS --------------------
  const postForm = document.getElementById("postForm");
  const titleInput = document.getElementById("title");
  const bodyInput = document.getElementById("text");
  const adminPosts = document.getElementById("adminPosts");
  const cancelEditBtn = document.getElementById("cancelEdit");
  const yourPostsBtn = document.getElementById("yourPostsBtn");
  const submitBtn = postForm.querySelector('button[type="submit"]');

  let editingId = null;

  // -------------------- AUTH CHECK --------------------
  auth.onAuthStateChanged(user => {
    if (!user) window.location.href = "login.html";
  });

  // -------------------- HANDLE FORM SUBMIT --------------------
  postForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = titleInput.value.trim();
    const body = bodyInput.value.trim();
    if (!title || !body) return alert("Title and body required.");

    try {
      if (editingId) {
        // UPDATE POST
        const ref = doc(db, "posts", editingId);
        await updateDoc(ref, { title, body, updatedAt: serverTimestamp() });
        editingId = null;
        cancelEditBtn.style.display = "none";
        submitBtn.textContent = "Publish";
        alert("Post updated!");
      } else {
        // CREATE POST
        await addDoc(collection(db, "posts"), {
          title,
          body,
          author: auth.currentUser.email,
          createdAt: serverTimestamp()
        });
        alert("Post published!");
      }

      postForm.reset();
    } catch (err) {
      alert("Error saving post: " + err.message);
    }
  });

  // -------------------- CANCEL EDIT --------------------
  if (cancelEditBtn) {
    cancelEditBtn.addEventListener("click", () => {
      postForm.reset();
      editingId = null;
      cancelEditBtn.style.display = "none";
      submitBtn.textContent = "Publish";
    });
  }

  // -------------------- NAVIGATION --------------------
  if (yourPostsBtn) {
    yourPostsBtn.addEventListener("click", () => {
      window.scrollTo({ top: adminPosts.offsetTop, behavior: "smooth" });
    });
  }

  // -------------------- HELPER: GET QUERY PARAM --------------------
  function getQueryParam(name) {
    return new URL(window.location.href).searchParams.get(name);
  }

  // -------------------- LOAD POST IF EDIT --------------------
  const editId = getQueryParam("editId");
  if (editId) {
    const ref = doc(db, "posts", editId);
    getDoc(ref).then(snap => {
      if (snap.exists()) {
        const data = snap.data();
        titleInput.value = data.title || "";
        bodyInput.value = data.body || "";
        editingId = editId;
        if (cancelEditBtn) cancelEditBtn.style.display = "inline-block";
        if (submitBtn) submitBtn.textContent = "Update Post";

        // Scroll to form
        window.scrollTo({ top: postForm.offsetTop - 20, behavior: "smooth" });
      } else alert("Post not found.");
    }).catch(err => console.error(err));
  }

  // -------------------- REAL-TIME ADMIN POSTS --------------------
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
      container.style = "padding:12px;margin-bottom:12px;border:1px solid #eee;border-radius:8px;";

      const titleEl = document.createElement("h4");
      titleEl.textContent = data.title;
      titleEl.style = "margin:0 0 6px;color:#0770fd;";

      const bodyEl = document.createElement("p");
      bodyEl.textContent = data.body.length > 300 ? data.body.substring(0, 300) + "..." : data.body;
      bodyEl.style = "margin:0 0 8px;";

      const actions = document.createElement("div");

      const viewBtn = document.createElement("button");
      viewBtn.textContent = "View";
      viewBtn.style = "margin-right:8px;padding:6px 10px;cursor:pointer;";
      viewBtn.onclick = () => window.open(`post.html?id=${id}`, "_blank");

      const editBtn = document.createElement("button");
      editBtn.textContent = "Edit";
      editBtn.style = "margin-right:8px;padding:6px 10px;cursor:pointer;";
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
          alert("Delete failed: " + err.message);
        }
      };

      actions.appendChild(viewBtn);
      actions.appendChild(editBtn);
      actions.appendChild(delBtn);

      container.appendChild(titleEl);
      container.appendChild(bodyEl);
      container.appendChild(actions);

      adminPosts.appendChild(container);
    });
  });

});
