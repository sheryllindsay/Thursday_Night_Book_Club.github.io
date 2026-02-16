import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

async function waitForDb() {
  let attempts = 0;
  while (!window.firebaseServices?.db && attempts < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }
  return window.firebaseServices?.db || null;
}

function setInputValue(selector, value) {
  const input = document.querySelector(selector);
  if (!input || value === undefined || value === null) return;
  input.value = value;
}

function setTextareaValue(name, value) {
  const field = document.querySelector(`textarea[name="${name}"]`);
  if (!field || value === undefined || value === null) return;
  field.value = value;
}

function setRadioValue(name, value) {
  if (!value) return;
  const radio = document.querySelector(`input[name="${name}"][value="${value}"]`);
  if (radio) radio.checked = true;
}

function setCheckboxValues(name, values) {
  if (!Array.isArray(values)) return;
  const boxes = document.querySelectorAll(`input[name="${name}"]`);
  boxes.forEach(box => {
    if (values.includes(box.value)) {
      box.checked = true;
    }
  });
}

function setCover(url) {
  const previewImg = document.getElementById('bookCoverPreview');
  const textSpan = document.getElementById('bookCoverText');
  if (!previewImg || !textSpan) return;

  if (url) {
    previewImg.src = url;
    previewImg.style.display = 'block';
    textSpan.style.display = 'none';
  } else {
    previewImg.style.display = 'none';
    textSpan.textContent = 'No cover available';
    textSpan.style.display = 'block';
  }
}

function setImages(urls) {
  for (let i = 1; i <= 2; i++) {
    const img = document.getElementById(`imagePreview${i}`);
    const text = document.getElementById(`imageText${i}`);
    const url = Array.isArray(urls) ? urls[i - 1] : '';

    if (!img || !text) continue;

    if (url) {
      img.src = url;
      img.style.display = 'block';
      text.style.display = 'none';
    } else {
      img.style.display = 'none';
      text.textContent = 'No image';
      text.style.display = 'block';
    }
  }
}

function lockFields() {
  const fields = document.querySelectorAll('input, textarea, select');
  fields.forEach(field => {
    if (field.type === 'checkbox' || field.type === 'radio') {
      field.disabled = true;
    } else {
      field.disabled = true;
      field.readOnly = true;
    }
  });
}

async function loadReview() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) return;

  const db = await waitForDb();
  if (!db) return;

  const reviewRef = doc(db, 'bookReviews', id);
  const snapshot = await getDoc(reviewRef);
  if (!snapshot.exists()) return;

  const data = snapshot.data();

  const select = document.getElementById('bookNameSelect');
  if (select) {
    const title = data.title || 'Untitled Book';
    select.innerHTML = '';
    const option = document.createElement('option');
    option.value = title;
    option.textContent = title;
    option.selected = true;
    select.appendChild(option);
  }

  setInputValue('input[name="reviewerName"]', data.reviewerName || '');
  setInputValue('input[name="author"]', data.author || '');
  setInputValue('input[name="genre"]', data.genre || '');
  setInputValue('input[name="days"]', data.daysToRead || '');
  setInputValue('input[name="pages"]', data.pages || '');
  setInputValue('input[name="favCharacter"]', data.favoriteCharacter || '');

  setTextareaValue('quote', data.favoriteQuote || '');
  setTextareaValue('favChapter', data.favoriteChapter || '');
  setTextareaValue('favScene', data.favoriteScene || '');

  setCheckboxValues('format', data.format || []);

  const ratings = data.ratings || {};
  setRadioValue('qw', ratings.qualityOfWriting || '');
  setRadioValue('pd', ratings.plotDevelopment || '');
  setRadioValue('c', ratings.characters || '');
  setRadioValue('t', ratings.tension || '');
  setRadioValue('e', ratings.sadness || '');
  setRadioValue('f', ratings.romance || '');
  setRadioValue('g', ratings.funny || '');
  setRadioValue('h', ratings.easeOfReading || '');
  setRadioValue('i', ratings.addictive || '');
  setRadioValue('j', ratings.ending || '');

  setRadioValue('recommend', data.recommend || '');
  setCover(data.bookCoverURL || '');
  setImages(data.imageURLs || []);

  lockFields();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadReview);
} else {
  loadReview();
}
