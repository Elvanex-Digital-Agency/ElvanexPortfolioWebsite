// /js/getPosts.js
import { db } from "./firebase.js";
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const postsList = document.getElementById("postsList");
const prevBtn = document.getElementById("prevPage");
const nextBtn = document.getElementById("nextPage");
const pageNumber = document.getElementById("pageNumber");

let PAGE_SIZE = 5;
let lastVisible = null;
let firstVisible = null;
let currentPage = 1;
let pageStack = [];

// -----------------------------------------
// Helper Functions
// -----------------------------------------
function formatDate(timestamp) {
  if (!timestamp) return "";

  if (typeof timestamp.toDate === "function") {
    try {
      const d = timestamp.toDate();
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    } catch {}
  }

  if (timestamp?.seconds) {
    const d = new Date(timestamp.seconds * 1000);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  }

  const d = new Date(timestamp);
  if (!isNaN(d))
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });

  return "";
}

function calcReadingTime(text) {
  if (!text) return "1 min read";
  const w = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(w / 200)) + " min read";
}

// -----------------------------------------
// Render Each Post
// -----------------------------------------
function renderPost(id, p) {
  const wrapper = document.createElement("article");
  wrapper.className = "blog-post";
  wrapper.style =
    "padding:24px 0;border-bottom:1px solid #e5e5e5;margin-bottom:18px;";

  // META INFO
  const meta = document.createElement("div");
  meta.className = "post-meta";
  meta.style =
    "font-size:14px;color:#666;margin-bottom:10px;display:flex;gap:12px;flex-wrap:wrap;";

  const createdAt = formatDate(p.createdAt);
  const author = "Elvanex Team";
  const content = p.content || p.body || "";
  const readingTime = calcReadingTime(content);

  meta.innerHTML = `
    <span><i class="fa fa-calendar"></i> ${createdAt}</span>
    <span><i class="fa fa-user"></i> ${author}</span>
    <span><i class="fa fa-clock"></i> ${readingTime}</span>
  `;

  const slug = p.slug ? `&slug=${p.slug}` : "";

  // TITLE
  const title = document.createElement("h2");
  title.innerHTML = `
    <a href="post.html?id=${id}${slug}" style="color:inherit;text-decoration:none;">
      ${p.title || "Untitled"}
    </a>`;
  title.style = "margin:0 0 8px;color:#0770fd;";

  // IMAGE (Cloudinary)
  let imageHTML = "";
  if (p.imageUrl) {
    imageHTML = `
      <img src="${p.imageUrl}" 
           style="width:100%;max-height:350px;object-fit:cover;border-radius:8px;margin:12px 0;">
    `;
  }

  // EXCERPT
  const excerpt = document.createElement("p");
  excerpt.textContent =
    content.length > 300 ? content.substring(0, 300) + "..." : content;
  excerpt.style = "margin:0 0 8px;color:#333;line-height:1.6;";

  // READ MORE
  const readMore = document.createElement("a");
  readMore.href = `post.html?id=${id}${slug}`;
  readMore.textContent = "Read more →";
  readMore.style = "font-weight:600;color:#7528FF;text-decoration:none;";

  wrapper.appendChild(meta);
  wrapper.appendChild(title);
  wrapper.innerHTML += imageHTML;
  wrapper.appendChild(excerpt);
  wrapper.appendChild(readMore);

  postsList.appendChild(wrapper);
}

// -----------------------------------------
// Pagination Load Function
// -----------------------------------------
async function loadPosts(forward = true) {
  postsList.innerHTML = `<p>Loading...</p>`;

  try {
    const postsRef = collection(db, "posts");
    let q;

    if (forward) {
      if (lastVisible) {
        q = query(
          postsRef,
          orderBy("createdAt", "desc"),
          startAfter(lastVisible),
          limit(PAGE_SIZE + 1)
        );
      } else {
        q = query(postsRef, orderBy("createdAt", "desc"), limit(PAGE_SIZE + 1));
      }
    } else {
      pageStack.pop();
      const prevCursor = pageStack[pageStack.length - 1];

      if (prevCursor) {
        q = query(
          postsRef,
          orderBy("createdAt", "desc"),
          startAfter(prevCursor),
          limit(PAGE_SIZE + 1)
        );
      } else {
        q = query(postsRef, orderBy("createdAt", "desc"), limit(PAGE_SIZE + 1));
      }
    }

    const snap = await getDocs(q);
    postsList.innerHTML = "";

    if (snap.empty) {
      postsList.innerHTML = "<p>No posts found.</p>";
      nextBtn.disabled = true;
      prevBtn.disabled = true;
      return;
    }

    let posts = snap.docs;
    const hasNext = posts.length > PAGE_SIZE;

    if (hasNext) posts.pop();

    posts.forEach((doc) => renderPost(doc.id, doc.data()));

    firstVisible = snap.docs[0];
    lastVisible = snap.docs[posts.length - 1];

    if (forward) pageStack.push(firstVisible);

    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = !hasNext;

    pageNumber.textContent = currentPage;
  } catch (err) {
    console.error(err);
    postsList.innerHTML = "<p>Error loading posts.</p>";
  }
}

// -----------------------------------------
// Pagination Events
// -----------------------------------------
nextBtn.addEventListener("click", () => {
  currentPage++;
  loadPosts(true);
});

prevBtn.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    loadPosts(false);
  }
});

// Initial Load
loadPosts(true);
