// dashboard.js
import { auth, db } from "./firebase.js";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  limit
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import {onAuthStateChanged} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

// ---------- CONFIG: Cloudinary ----------
const CLOUDINARY_CLOUD = "dblvhd450";        // <-- replace if needed
const CLOUDINARY_PRESET = "elvanexblog";     // <-- replace if needed

// ---------- ELEMENTS ----------
const postForm = document.getElementById("postForm");
const titleInput = document.getElementById("title");
const bodyInput = document.getElementById("text");
const imageInput = document.getElementById("imageInput");
const imagePreview = document.getElementById("imagePreview");
const adminPosts = document.getElementById("adminPosts");
const cancelEditBtn = document.getElementById("cancelEdit");
const slugPreview = document.getElementById("slugPreview");
const submitBtn = document.getElementById("submitBtn");

let editingId = null;
let existingImageUrl = ""; // keep track when editing

// Ensure user is authenticated
onAuthStateChanged(auth, user => {
  if (!user) window.location.href = "login.html";
});

// ---------- UTIL: slugify ----------
function slugify(text) {
  return (text || "")
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")    // remove non-word
    .replace(/[\s_-]+/g, "-")    // collapse spaces & underscores
    .replace(/^-+|-+$/g, "");    // trim - from start/end
}

// Ensure slug is unique; append counter if needed
async function ensureUniqueSlug(baseSlug, docIdToIgnore = null) {
  let slug = baseSlug;
  let counter = 0;

  while (true) {
    const q = query(collection(db, "posts"), where("slug", "==", slug), limit(1));
    const snaps = await getDocs(q);
    const found = snaps.docs.find(d => d.id !== docIdToIgnore);

    if (!found) return slug;

    counter++;
    slug = `${baseSlug}-${counter}`;
  }
}

// ---------- Cloudinary upload ----------
async function uploadImageToCloudinary(file) {
  if (!file) return "";
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_PRESET);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
    method: "POST",
    body: formData
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error("Cloudinary upload failed: " + text);
  }

  const data = await res.json();
  return data.secure_url || "";
}

// ---------- Image preview handler ----------
imageInput.addEventListener("change", () => {
  imagePreview.innerHTML = "";
  const f = imageInput.files[0];
  if (!f) {
    if (existingImageUrl) {
      imagePreview.innerHTML = `<img src="${existingImageUrl}" style="max-width:220px;border-radius:8px;">`;
    }
    return;
  }
  const url = URL.createObjectURL(f);
  imagePreview.innerHTML = `<img src="${url}" style="max-width:220px;border-radius:8px;">`;
});

// ---------- Update slug preview while typing title ----------
titleInput.addEventListener("input", () => {
  const s = slugify(titleInput.value);
  slugPreview.textContent = s ? s : "(will be generated)";
});

// ---------- Helper: get query param ----------
function getQueryParam(name) {
  return new URL(window.location.href).searchParams.get(name);
}

// ---------- LOAD POST IF EDIT MODE (editId query param) ----------
const editId = getQueryParam("editId");
if (editId) {
  (async () => {
    try {
      const ref = doc(db, "posts", editId);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        alert("Post not found for editing.");
        return;
      }
      const data = snap.data();
      titleInput.value = data.title || "";
      bodyInput.value = data.body || "";
      existingImageUrl = data.imageUrl || "";
      if (existingImageUrl) {
        imagePreview.innerHTML = `<img src="${existingImageUrl}" style="max-width:220px;border-radius:8px;">`;
      }
      editingId = editId;
      cancelEditBtn.style.display = "inline-block";
      submitBtn.textContent = "Update Post";
      slugPreview.textContent = data.slug || slugify(data.title || "");
      // scroll to form
      window.scrollTo({ top: postForm.offsetTop - 20, behavior: "smooth" });
    } catch (err) {
      console.error("Load edit post error:", err);
    }
  })();
}

// ---------- CANCEL EDIT ----------
cancelEditBtn.addEventListener("click", () => {
  postForm.reset();
  imagePreview.innerHTML = "";
  existingImageUrl = "";
  editingId = null;
  cancelEditBtn.style.display = "none";
  submitBtn.textContent = "Publish";
  slugPreview.textContent = "";
  // remove editId from URL (optional)
  if (window.history.replaceState) {
    const url = new URL(window.location.href);
    url.searchParams.delete("editId");
    window.history.replaceState({}, document.title, url.toString());
  }
});

// ---------- FORM SUBMIT: CREATE / UPDATE ----------
postForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = titleInput.value.trim();
  const body = bodyInput.value.trim();
  if (!title || !body) return alert("Title and body required.");

  submitBtn.disabled = true;
  submitBtn.textContent = editingId ? "Updating..." : "Publishing...";

  try {
    // generate base slug
    const baseSlug = slugify(title) || `post-${Date.now()}`;
    const uniqueSlug = await ensureUniqueSlug(baseSlug, editingId || null);

    // handle image upload (if a new file selected)
    let imageUrlToSave = existingImageUrl || "";
    const newFile = imageInput.files[0];
    if (newFile) {
      // upload and replace (no delete of old image here)
      imageUrlToSave = await uploadImageToCloudinary(newFile);
    }

    if (editingId) {
      // UPDATE
      const ref = doc(db, "posts", editingId);
      await updateDoc(ref, {
        title,
        body,
        slug: uniqueSlug,
        imageUrl: imageUrlToSave || "",
        updatedAt: serverTimestamp(),
        author: auth.currentUser?.email || "Admin"
      });
      alert("Post updated!");
    } else {
      // CREATE
      await addDoc(collection(db, "posts"), {
        title,
        body,
        slug: uniqueSlug,
        imageUrl: imageUrlToSave || "",
        author: auth.currentUser?.email || "Admin",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      alert("Post published!");
    }

    // reset UI
    postForm.reset();
    imagePreview.innerHTML = "";
    existingImageUrl = "";
    editingId = null;
    cancelEditBtn.style.display = "none";
    submitBtn.textContent = "Publish";
    slugPreview.textContent = "";
  } catch (err) {
    console.error(err);
    alert("Error saving post: " + (err.message || err));
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Publish";
  }
});

// ---------- LIVE ADMIN POSTS (real-time) ----------
const postsRef = collection(db, "posts");
const q = query(postsRef, orderBy("createdAt", "desc"));

onSnapshot(q, (snapshot) => {
  adminPosts.innerHTML = "";
  if (snapshot.empty) {
    adminPosts.innerHTML = "<p>No posts yet.</p>";
    return;
  }

  snapshot.forEach((docSnap) => {
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
    titleEl.textContent = data.title;
    titleEl.style = "margin:0 0 6px;color:#0770fd;";

    const bodyEl = document.createElement("p");
    bodyEl.textContent = (data.body || "").length > 220 ? (data.body || "").substring(0, 220) + "..." : (data.body || "");
    bodyEl.style = "margin:0 0 8px;color:#333;font-size:14px;";

    const small = document.createElement("div");
    small.style = "font-size:12px;color:#666;margin-bottom:8px;";
    small.textContent = `Author: ${data.author || "Elvanex Team"} • Slug: ${data.slug || "-"}`;

    const actions = document.createElement("div");
    actions.style = "display:flex;gap:8px";

    const viewBtn = document.createElement("button");
    viewBtn.textContent = "View";
    viewBtn.style = "padding:6px 10px;cursor:pointer;";
    // Option A url: include slug && id
    viewBtn.onclick = () => window.open(`post.html?slug=${encodeURIComponent(data.slug)}&id=${id}`, "_blank");

    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.style = "padding:6px 10px;cursor:pointer;";
    editBtn.onclick = () => {
      // redirect to dashboard with editId
      window.location.href = `dashboard.html?editId=${id}`;
    };

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
