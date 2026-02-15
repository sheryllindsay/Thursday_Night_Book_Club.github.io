import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBoEb3E2D0_cq5LVZ90ZLSDvJJlUJxtUIo",
  authDomain: "thursday-night-book-club.firebaseapp.com",
  projectId: "thursday-night-book-club",
  storageBucket: "thursday-night-book-club.firebasestorage.app",
  messagingSenderId: "984125064488",
  appId: "1:984125064488:web:4a872c2677e62424193c1d",
  measurementId: "G-0GLPH7YLNF"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function handleStartReview() {
  const button = document.getElementById('startReviewBtn');
  if (!button) return;

  button.addEventListener('click', () => {
    window.location.href = 'review.html';
  });
}

function createReviewCard(docId, data) {
  const card = document.createElement('div');
  card.className = 'card';

  const title = document.createElement('div');
  title.className = 'card-title';
  title.textContent = data.title || 'Untitled Book';

  const reviewer = document.createElement('div');
  reviewer.className = 'card-meta';
  reviewer.textContent = `Reviewer: ${data.reviewerName || 'Unknown'}`;

  const doc = document.createElement('div');
  doc.className = 'card-meta';
  doc.textContent = `Doc ID: ${docId}`;

  card.appendChild(title);
  card.appendChild(reviewer);
  card.appendChild(doc);

  return card;
}

async function loadReviews() {
  const list = document.getElementById('reviewList');
  if (!list) return;

  list.innerHTML = '';

  try {
    const snapshot = await getDocs(collection(db, 'bookReviews'));

    if (snapshot.empty) {
      const empty = document.createElement('div');
      empty.className = 'card';
      empty.innerHTML = '<div class="card-title">No reviews yet</div><div class="card-meta">Submit the first one!</div>';
      list.appendChild(empty);
      return;
    }

    snapshot.forEach(doc => {
      const card = createReviewCard(doc.id, doc.data());
      list.appendChild(card);
    });
  } catch (error) {
    const errorCard = document.createElement('div');
    errorCard.className = 'card';
    errorCard.innerHTML = `<div class="card-title">Unable to load reviews</div><div class="card-meta">${error.message}</div>`;
    list.appendChild(errorCard);
  }
}

function initLandingPage() {
  handleStartReview();
  loadReviews();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLandingPage);
} else {
  initLandingPage();
}
