// /js/getPost.js
import { db } from "./firebase.js";
import {
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// -------------------------------
// Get Query Param
// -------------------------------
function getQueryParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

const id = getQueryParam("id");
const postSlug = getQueryParam("slug"); // optional
const postContainer = document.getElementById("postContainer");

// -------------------------------
// Format Firestore Timestamp
// -------------------------------
function formatDate(timestamp) {
  if (!timestamp) return "";
  let date;

  if (timestamp.toDate) date = timestamp.toDate();
  else if (timestamp.seconds) date = new Date(timestamp.seconds * 1000);
  else if (timestamp instanceof Date) date = timestamp;
  else date = new Date(timestamp);

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

// -------------------------------
// Reading Time
// -------------------------------
function calcReadingTime(text) {
  if (!text) return "1 min read";
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200)) + " min read";
}

// -------------------------------
// Render Post
// -------------------------------
function renderPost(id, p) {
  postContainer.innerHTML = "";

  const content = p.content || p.body || "";
  const readingTime = calcReadingTime(content);

  // Go Back
  const backBtn = document.createElement("button");
  backBtn.textContent = "← Go Back";
  backBtn.style =
    "margin-bottom:20px;padding:6px 12px;border:none;background:#7528FF;color:#fff;border-radius:4px;cursor:pointer;";
  backBtn.onclick = () => window.history.back();
  postContainer.appendChild(backBtn);

  // Title
  const title = document.createElement("h1");
  title.textContent = p.title || "Untitled";
  title.style = "color:#147aff;margin-bottom:8px;";
  postContainer.appendChild(title);

  // Meta
  const meta = document.createElement("p");
  meta.style =
    "color:#666;font-size:0.9rem;margin-top:0;margin-bottom:14px;";
  meta.innerHTML = `
      ${formatDate(p.createdAt)} • ${readingTime}
  `;
  postContainer.appendChild(meta);

  // Image (Cloudinary)
  if (p.imageUrl) {
    const img = document.createElement("img");
    img.src = p.imageUrl;
    img.style =
      "width:100%;max-height:420px;border-radius:8px;object-fit:cover;margin:10px 0 25px;";
    postContainer.appendChild(img);
  }

  // Body / Content
  const body = document.createElement("div");
  body.innerHTML = `
    <div style="text-align: justify; line-height:1.7; color:#111; font-size:1.05rem;">
        ${content.replace(/\n/g, "<br>")}
    </div>
  `;
  postContainer.appendChild(body);

  // Related posts container
  const relatedContainer = document.createElement("div");
  relatedContainer.id = "relatedPosts";
  relatedContainer.style = "margin-top:40px";
  relatedContainer.innerHTML =
    "<h3 style='color:#147aff;margin-bottom:16px;'>Related Posts</h3>";
  postContainer.appendChild(relatedContainer);

  loadRelatedPosts(id, relatedContainer);
}

// -------------------------------
// Load Post
// -------------------------------
async function loadPost() {
  if (!id) {
    postContainer.innerHTML = "<p>No post ID provided.</p>";
    return;
  }

  try {
    const ref = doc(db, "posts", id);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      postContainer.innerHTML = "<p>Post not found.</p>";
      return;
    }

    const post = snap.data();

    // If slug in URL does not match post.slug → redirect to correct slug
    if (post.slug && post.slug !== postSlug) {
      window.location.href = `post.html?id=${id}&slug=${post.slug}`;
      return;
    }

    renderPost(id, post);
  } catch (err) {
    console.error(err);
    postContainer.innerHTML = "<p>Error loading post.</p>";
  }
}

// -------------------------------
// Load Related Posts
// -------------------------------
async function loadRelatedPosts(currentId, container) {
  try {
    const postsRef = collection(db, "posts");
    const q = query(postsRef, orderBy("createdAt", "desc"), limit(10));

    const snap = await getDocs(q);

    if (snap.empty) {
      container.innerHTML += "<p>No related posts.</p>";
      return;
    }

    const related = snap.docs
      .filter((d) => d.id !== currentId)
      .slice(0, 3);

    if (related.length === 0) {
      container.innerHTML += "<p>No related posts.</p>";
      return;
    }

    related.forEach((docSnap) => {
      const p = docSnap.data();
      const id = docSnap.id;

      const slug = p.slug ? `&slug=${p.slug}` : "";

      const item = document.createElement("div");
      item.style.marginBottom = "8px";
      item.innerHTML = `
        <a href="post.html?id=${id}${slug}" style="color:#002fff;text-decoration:none;">
          • ${p.title}
        </a>
      `;
      container.appendChild(item);
    });
  } catch (err) {
    console.error(err);
    container.innerHTML += "<p>Error loading related posts.</p>";
  }
}

loadPost();
