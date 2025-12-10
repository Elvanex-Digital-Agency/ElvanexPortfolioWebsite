// /js/getPosts.js
import { db } from "./firebase.js";
import {
  collection,
  query,
  orderBy,
  getDocs
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const postsList = document.getElementById("postsList");

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
      const p = docSnap.data();
      const id = docSnap.id;

      const wrapper = document.createElement("article");
      wrapper.className = "blog-post";
      wrapper.style = "padding:12px 0;border-bottom:1px solid #f0f0f0;margin-bottom:18px;";

      const title = document.createElement("h2");
      title.innerHTML = `<a href="post.html?id=${id}" style="color:inherit;text-decoration:none;">${p.title}</a>`;
      title.style = "margin:0 0 8px;color:#0770fd;";

      const excerpt = document.createElement("p");
      excerpt.textContent = p.body.length > 300 ? p.body.substring(0, 300) + "..." : p.body;
      excerpt.style = "margin:0 0 8px;color:#333;line-height:1.6;";

      const readMore = document.createElement("a");
      readMore.href = `post.html?id=${id}`;
      readMore.textContent = "Read more →";
      readMore.style = "font-weight:600;color:#002fff;text-decoration:none;";

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
