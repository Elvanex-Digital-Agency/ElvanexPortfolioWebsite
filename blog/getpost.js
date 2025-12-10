// /js/getPost.js
import { db } from "./firebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

function getQueryParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

const id = getQueryParam("id");
const postContainer = document.getElementById("postContainer");

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
    const p = snap.data();

    const title = document.createElement("h1");
    title.textContent = p.title;
    title.style = "color:#0770fd;margin-bottom:8px;";

    const meta = document.createElement("p");
    meta.textContent = p.createdAt ? new Date(p.createdAt.seconds * 1000).toLocaleString() : "";
    meta.style = "font-size:0.9rem;color:#666;margin-top:0;margin-bottom:14px;";

    const body = document.createElement("div");
    body.innerHTML = `<p style="line-height:1.7;color:#111;">${p.body.replace(/\n/g, "<br>")}</p>`;

    postContainer.appendChild(title);
    postContainer.appendChild(meta);
    postContainer.appendChild(body);
  } catch (err) {
    postContainer.innerHTML = "<p>Error loading post.</p>";
    console.error(err);
  }
}

loadPost();
