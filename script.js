import { collection, addDoc, serverTimestamp, getDocs } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-storage.js";

let defaultCoverUrl = '';
let booksData = new Map();
let selectedCoverUrl = '';

// Image preview function
function previewImage(input, boxId) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const textId = boxId.replace('Box', 'Text');
      const previewId = boxId.replace('Box', 'Preview');
      
      const textSpan = document.getElementById(textId);
      const previewImg = document.getElementById(previewId);
      
      if (textSpan) textSpan.style.display = 'none';
      if (previewImg) {
        previewImg.src = e.target.result;
        previewImg.style.display = 'block';
      }
    };
    reader.readAsDataURL(input.files[0]);
  }
}

async function loadBooksFromFirestore() {
  try {
    // Wait for Firebase services to be available
    let attempts = 0;
    while (!window.firebaseServices?.db && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    const { db } = window.firebaseServices;
    if (!db) {
      console.error('Firebase DB not available after waiting');
      return;
    }

    const select = document.getElementById('bookNameSelect');
    if (!select) return;

    const collectionNames = [
      'Book-of-the-Month',
      'Book-of-the-month',
      'Book-Of-The Month',
      'Book-Of-The-Month'
    ];

    let snapshot = null;
    let usedCollection = '';

    for (const name of collectionNames) {
      try {
        const result = await getDocs(collection(db, name));
        if (!result.empty) {
          snapshot = result;
          usedCollection = name;
          break;
        }
      } catch (error) {
        console.warn(`Unable to read collection: ${name}`, error);
      }
    }

    if (!snapshot) {
      console.error('No accessible Book-of-the-month collection found');
      return;
    }

    const seenTitles = new Set();
    snapshot.forEach(doc => {
      const data = doc.data();
      const bookName = data.BookName || data['BookName'] || data.bookName || data.title;
      if (!bookName || seenTitles.has(bookName)) return;

      seenTitles.add(bookName);
      booksData.set(bookName, data);

      const option = document.createElement('option');
      option.value = bookName;
      option.textContent = bookName;
      select.appendChild(option);
    });

    console.log(`Loaded ${booksData.size} books from Firestore (${usedCollection})`);
  } catch (error) {
    console.error('Error loading books:', error);
  }
}

function handleBookSelection() {
  const select = document.getElementById('bookNameSelect');
  if (!select) return;

  select.addEventListener('change', function() {
    const selectedBook = this.value;
    const bookData = booksData.get(selectedBook);
    
    if (!bookData) return;

    // Autofill author
    const authorInput = document.querySelector('input[name="author"]');
    if (authorInput) {
      authorInput.value = bookData.Author || bookData.author || bookData['Author'] || '';
    }

    // Update book cover preview
    const coverUrl = bookData.BookCoverUrl || bookData.bookCoverURL || bookData.coverUrl || bookData['Book Cover Url'] || bookData['BookCoverUrl'] || bookData['book-cover'] || bookData['Book-Cover'] || bookData['Book-Cover-Url'];
    if (coverUrl) {
      const normalizedCoverUrl = String(coverUrl).trim().replace(/\\/g, '/').replace(/^\.\//, '');
      const repoBaseUrl = 'https://sheryllindsay.github.io/Thursday_Night_Book_Club.github.io/';
      const resolvedCoverUrl = /^(https?:)?\/\//i.test(normalizedCoverUrl)
        ? normalizedCoverUrl
        : new URL(normalizedCoverUrl.replace(/^\//, ''), repoBaseUrl).toString();

      const repoScopedCoverUrl = resolvedCoverUrl.replace(
        /^https:\/\/sheryllindsay\.github\.io\//i,
        repoBaseUrl
      );

      selectedCoverUrl = repoScopedCoverUrl;
      const previewImg = document.getElementById('bookCoverPreview');
      const textSpan = document.getElementById('bookCoverText');
      if (previewImg) {
        previewImg.src = repoScopedCoverUrl;
        previewImg.style.display = 'block';
        if (textSpan) textSpan.style.display = 'none';
      }
    }
  });
}

// Make previewImage globally available
window.previewImage = previewImage;

// Form submission handler
async function submitReview() {
  try {
    const { db, storage } = window.firebaseServices;
    
    if (!db || !storage) {
      throw new Error('Firebase services not initialized');
    }

    // Show loading state
    const submitBtn = document.querySelector('.submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';

    // Collect form data
    const formData = new FormData(document.getElementById('bookReviewForm'));
    const reviewData = {
      timestamp: serverTimestamp(),
      title: formData.get('title'),
      reviewerName: formData.get('reviewerName'),
      author: formData.get('author'),
      genre: formData.get('genre'),
      daysToRead: formData.get('days'),
      pages: formData.get('pages'),
      favoriteCharacter: formData.get('favCharacter'),
      format: Array.from(document.querySelectorAll('input[name="format"]:checked')).map(cb => cb.value),
      ratings: {
        qualityOfWriting: formData.get('qw'),
        plotDevelopment: formData.get('pd'),
        characters: formData.get('c'),
        tension: formData.get('t'),
        sadness: formData.get('e'),
        romance: formData.get('f'),
        funny: formData.get('g'),
        easeOfReading: formData.get('h'),
        addictive: formData.get('i'),
        ending: formData.get('j')
      },
      favoriteQuote: formData.get('quote'),
      favoriteChapter: formData.get('favChapter'),
      favoriteScene: formData.get('favScene'),
      recommend: formData.get('recommend'),
      bookCoverURL: selectedCoverUrl || ''
    };

    console.log('Submitting review data:', reviewData);

    // Upload additional images if selected
    const imageInputs = document.querySelectorAll('input[name="images"]');
    reviewData.imageURLs = [];
    
    for (let input of imageInputs) {
      if (input.files && input.files[0]) {
        try {
          const imageFile = input.files[0];
          const imageRef = ref(storage, `book-images/${Date.now()}_${Math.random()}_${imageFile.name}`);
          await uploadBytes(imageRef, imageFile);
          const downloadURL = await getDownloadURL(imageRef);
          reviewData.imageURLs.push(downloadURL);
          console.log('Image uploaded');
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
        }
      }
    }

    // Save to Firestore
    console.log('Saving to Firestore');
    const docRef = await addDoc(collection(db, 'bookReviews'), reviewData);
    
    // Success message
    alert('Review saved successfully!');
    console.log('Document written with ID: ', docRef.id);
    
    // Reset form
    document.getElementById('bookReviewForm').reset();
    
    // Reset image previews
    const bookCoverPreview = document.getElementById('bookCoverPreview');
    const bookCoverText = document.getElementById('bookCoverText');
    if (bookCoverPreview) {
      bookCoverPreview.src = '';
      bookCoverPreview.style.display = 'none';
    }
    if (bookCoverText) {
      bookCoverText.textContent = 'Please select a Book';
      bookCoverText.style.display = 'block';
    }
    for (let i = 1; i <= 4; i++) {
      document.getElementById('imagePreview' + i).style.display = 'none';
      document.getElementById('imageText' + i).style.display = 'block';
    }

  } catch (error) {
    console.error('Error submitting review: ', error);
    alert('Error saving review: ' + error.message);
  } finally {
    // Restore button state
    const submitBtn = document.querySelector('.submit-btn');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Review';
  }
}

// Make submitReview globally available
window.submitReview = submitReview;

// Attach form submission handler when DOM is ready
function initializeForm() {
  // Load books from Firestore
  loadBooksFromFirestore();
  
  // Handle book selection changes
  handleBookSelection();

  const form = document.getElementById('bookReviewForm');
  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      await submitReview();
    });
  }

  // Attach image preview handlers for the 4 additional images
  for (let i = 1; i <= 4; i++) {
    const imageInput = document.getElementById('imageInput' + i);
    if (imageInput) {
      imageInput.addEventListener('change', function() {
        previewImage(this, 'imageBox' + i);
      });
    }
  }
}

// Check if DOM is already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeForm);
} else {
  initializeForm();
}
