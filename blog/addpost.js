// /js/addPost.js
import { auth, db } from "./firebase.js";
import {
  addDoc,
  collection,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

const postForm = document.getElementById("postForm");
const titleInput = document.getElementById("title");
const textInput = document.getElementById("text");
const cancelEdit = document.getElementById("cancelEdit");
const imageFile = document.getElementById("imageInput").files[0];

let imageUrl = "";

  

let editingPostId = null;

// Ensure only logged-in users can post
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
  }
});

// Handle form submit
postForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = titleInput.value.trim();
  const body = textInput.value.trim();
  const user = auth.currentUser;

  if (!user) {
    alert("You must be logged in to create posts.");
    return;
  }

  try {
    if (editingPostId) {
      // Update an existing post
      const ref = doc(db, "posts", editingPostId);
      await updateDoc(ref, {
        title,
        body,
        updatedAt: Date.now(),
      });
      alert("Post updated!");
    } else {
      if (imageFile) {
        imageUrl = await uploadImageToCloudinary(imageFile);
      }
      // Create new post
      await addDoc(collection(db, "posts"), {
        title,
        body,
        author: user.email,
        imageUrl,
        createdAt: Date.now(),
      });
      alert("Post published!");
    }

    titleInput.value = "";
    textInput.value = "";
    editingPostId = null;
    cancelEdit.style.display = "none";

  } catch (err) {
    alert("Error saving post: " + err.message);
  }
});

// Cancel editing
cancelEdit.addEventListener("click", () => {
  titleInput.value = "";
  textInput.value = "";
  editingPostId = null;
  cancelEdit.style.display = "none";
});
