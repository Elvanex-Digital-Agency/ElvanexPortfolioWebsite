// /js/getPost.js
import { db } from "./firebase.js";
import { doc, getDoc, collection, query, orderBy, limit, getDocs, where } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// --- Helper: get query parameter ---
function getQueryParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

const id = getQueryParam("id");
const postContainer = document.getElementById("postContainer");

// --- Helper: format Firestore timestamp safely ---
function formatDate(timestamp) {
  if (!timestamp) return "";
  let date;

  if (timestamp.toDate) date = timestamp.toDate();
  else if (timestamp.seconds) date = new Date(timestamp.seconds * 1000);
  else if (timestamp instanceof Date) date = timestamp;
  else date = new Date(timestamp);

  const options = { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" };
  return date.toLocaleDateString(undefined, options);
}

// --- Render a single post ---
function renderPost(id, p) {
  postContainer.innerHTML = "";

  // Go Back Button
  const backBtn = document.createElement("button");
  backBtn.textContent = "← Go Back";
  backBtn.style = "margin-bottom:20px;padding:6px 12px;border:none;background:#7528FF;color:#fff;border-radius:4px;cursor:pointer;";
  backBtn.addEventListener("click", () => {
    window.history.back();
  });
  postContainer.appendChild(backBtn);

  // Title
  const title = document.createElement("h1");
  title.textContent = p.title;
  title.style = "color:#147aff;margin-bottom:8px;";
  postContainer.appendChild(title);

  // Meta
  const meta = document.createElement("p");
  meta.innerHTML = `<span style="color:#666;font-size:0.9rem;">${formatDate(p.createdAt)}</span>`;
  meta.style.marginTop = "0";
  meta.style.marginBottom = "14px";
  postContainer.appendChild(meta);

  // Body
  const body = document.createElement("div");
  body.innerHTML = `<p style="text-align: justify;line-height:1.7;color:#111;">${p.body.replace(/\n/g, "<br>")}</p>`;
  postContainer.appendChild(body);

  // Related Posts container
  const relatedContainer = document.createElement("div");
  relatedContainer.id = "relatedPosts";
  relatedContainer.style.marginTop = "40px";
  relatedContainer.innerHTML = "<h3 style='color:#147aff;margin-bottom:16px;'>Related Posts</h3>";
  postContainer.appendChild(relatedContainer);

  loadRelatedPosts(id, relatedContainer);
}

// --- Load current post ---
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

    renderPost(id, snap.data());
  } catch (err) {
    postContainer.innerHTML = "<p>Error loading post.</p>";
    console.error(err);
  }
}

// --- Load related posts ---
// --- Load related posts ---
async function loadRelatedPosts(currentId, container) {
  try {
    const postsRef = collection(db, "posts");
    const q = query(postsRef, orderBy("createdAt", "desc"), limit(10)); // fetch 10 latest

    const snap = await getDocs(q);

    if (snap.empty) {
      container.innerHTML += "<p>No related posts.</p>";
      return;
    }

    // Filter out current post in JS
    const related = snap.docs
      .filter(doc => doc.id !== currentId)
      .slice(0, 3); // limit to 3

    if (related.length === 0) {
      container.innerHTML += "<p>No related posts.</p>";
      return;
    }

    related.forEach((docSnap) => {
      const p = docSnap.data();
      const id = docSnap.id;

      const postLink = document.createElement("div");
      postLink.innerHTML = `<a href="post.html?id=${id}" style="color:#002fff;text-decoration:none;">• ${p.title}</a>`;
      postLink.style.marginBottom = "8px";

      container.appendChild(postLink);
    });
  } catch (err) {
    console.error(err);
    container.innerHTML += "<p>Error loading related posts.</p>";
  }
}


loadPost();
