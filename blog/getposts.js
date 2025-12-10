// /js/getPosts.js
import { db } from "./firebase.js";
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const postsList = document.getElementById("postsList");
const prevBtn = document.getElementById("prevPage");
const nextBtn = document.getElementById("nextPage");
const pageNumber = document.getElementById("pageNumber");

let PAGE_SIZE = 5;
let lastVisible = null;
let firstVisible = null;
let currentPage = 1;
let pageStack = []; // To go back pages

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
          limit(PAGE_SIZE + 1) // fetch one extra
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
          startAt(prevCursor),
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

    // Determine if next page exists
    let posts = snap.docs;
    const hasNext = posts.length > PAGE_SIZE;
    if (hasNext) posts.pop(); // remove extra post

    posts.forEach((doc) => renderPost(doc.id, doc.data()));

    firstVisible = snap.docs[0];
    lastVisible = snap.docs[posts.length - 1];

    if (forward) pageStack.push(firstVisible);

    // Buttons
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = !hasNext;

    pageNumber.textContent = currentPage;

  } catch (err) {
    console.error(err);
    postsList.innerHTML = "<p>Error loading posts.</p>";
  }
}



function updateButtons() {
  pageNumber.textContent = currentPage;

  prevBtn.disabled = currentPage === 1;
  nextBtn.disabled = lastVisible == null;
}

function renderPost(id, p) {
  const wrapper = document.createElement("article");
  wrapper.className = "blog-post";
  wrapper.style = "padding:24px 0;border-bottom:1px solid #e5e5e5;margin-bottom:18px;";

  const title = document.createElement("h2");
  title.innerHTML = `<a href="post.html?id=${id}" style="color:#147aff;text-decoration:none;">${p.title}</a>`;
  title.style = "margin:0 0 8px;color:#7528FF;";

  const excerpt = document.createElement("p");
  excerpt.textContent =
    p.body.length > 300 ? p.body.substring(0, 300) + "..." : p.body;
  excerpt.style = "margin:0 0 8px;color:#333;line-height:1.6;";

  const readMore = document.createElement("a");
  readMore.href = `post.html?id=${id}`;
  readMore.textContent = "Read more →";
  readMore.style = "font-weight:600;color:#7528FF;text-decoration:none;";

  wrapper.appendChild(title);
  wrapper.appendChild(excerpt);
  wrapper.appendChild(readMore);

  postsList.appendChild(wrapper);
}

// -------- EVENT LISTENERS -------- //
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

// Load initial posts
loadPosts(true);
