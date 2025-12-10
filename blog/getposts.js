// /js/getPosts.js
import { db } from "./firebase.js";
import {
  collection,
  query,
  orderBy,
  getDocs
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const postsList = document.getElementById("postsList");

function formatDate(timestamp) {
  if (!timestamp) return "";

  // Firestore Timestamp with toDate()
  if (typeof timestamp.toDate === "function") {
    try {
      const d = timestamp.toDate();
      if (!isNaN(d)) return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch (e) {}
  }

  // Firestore-like object with seconds (older SDKs / exported objects)
  if (timestamp && typeof timestamp.seconds === "number") {
    try {
      const d = new Date(timestamp.seconds * 1000);
      if (!isNaN(d)) return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch (e) {}
  }

  // If it's already a Date
  if (timestamp instanceof Date) {
    const d = timestamp;
    if (!isNaN(d)) return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  // If it's a number (likely milliseconds, sometimes seconds)
  if (typeof timestamp === "number") {
    // if it looks like seconds (10 digits), convert to ms
    const asMs = timestamp < 1e12 ? timestamp * 1000 : timestamp;
    const d = new Date(asMs);
    if (!isNaN(d)) return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  // If it's a string (ISO)
  if (typeof timestamp === "string") {
    const d = new Date(timestamp);
    if (!isNaN(d)) return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  // fallback
  return "";
}

// Estimate reading time (200 words/min)
function calcReadingTime(text) {
  if (!text) return "1 min read";
  const words = ("" + text).trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200)) + " min read";
}

async function loadPosts() {
  try {
    const postsRef = collection(db, "posts");
    const q = query(postsRef, orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

    if (snap.empty) {
      postsList.innerHTML = "<p>No posts yet.</p>";
      return;
    }

    snap.forEach((docSnap) => {
      const p = docSnap.data() || {};
      const id = docSnap.id;

      const wrapper = document.createElement("article");
      wrapper.className = "blog-post";
      wrapper.style = "padding:24px 0;border-bottom:1px solid #e5e5e5;margin-bottom:18px;";

      // -------- META INFO -------- //
      const meta = document.createElement("div");
      meta.className = "post-meta";
      meta.style = "font-size:14px;color:#666;margin-bottom:10px;display:flex;gap:12px;flex-wrap:wrap;";

      const createdAt = formatDate(p.createdAt);
      const author = p.author || "Elvanex Team";
      const readingTime = calcReadingTime(p.body || "");

      meta.innerHTML = `
        <span><i class="fa-regular fa-calendar"></i> ${createdAt}</span>
        <span><i class="fa-regular fa-user"></i> ${author}</span>
        <span><i class="fa-regular fa-clock"></i> ${readingTime}</span>
      `;

      // -------- TITLE -------- //
      const title = document.createElement("h2");
      title.innerHTML = `<a href="post.html?id=${id}" style="color:inherit;text-decoration:none;">${p.title || "Untitled"}</a>`;
      title.style = "margin:0 0 8px;color:#0770fd;";

      // -------- EXCERPT -------- //
      const excerpt = document.createElement("p");
      const bodyText = p.body || "";
      excerpt.textContent = bodyText.length > 300 ? bodyText.substring(0, 300) + "..." : bodyText;
      excerpt.style = "margin:0 0 8px;color:#333;line-height:1.6;";

      // -------- READ MORE -------- //
      const readMore = document.createElement("a");
      readMore.href = `post.html?id=${id}`;
      readMore.textContent = "Read more →";
      readMore.style = "font-weight:600;color:#7528FF;text-decoration:none;";

      // -------- APPEND ELEMENTS -------- //
      wrapper.appendChild(meta);
      wrapper.appendChild(title);
      wrapper.appendChild(excerpt);
      wrapper.appendChild(readMore);

      postsList.appendChild(wrapper);
    });
  } catch (err) {
    postsList.innerHTML = "<p>Could not load posts.</p>";
    console.error(err);
  }
}

loadPosts();
