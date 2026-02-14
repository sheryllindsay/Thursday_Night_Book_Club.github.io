import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-storage.js";

console.log('script.js module loaded!');

// Image preview function
function previewImage(input, boxId) {
  console.log('previewImage called with boxId:', boxId);
  if (input.files && input.files[0]) {
    console.log('File selected:', input.files[0].name);
    const reader = new FileReader();
    reader.onload = function(e) {
      const textId = boxId.replace('Box', 'Text');
      const previewId = boxId.replace('Box', 'Preview');
      
      console.log('Looking for textId:', textId, 'and previewId:', previewId);
      
      const textSpan = document.getElementById(textId);
      const previewImg = document.getElementById(previewId);
      
      console.log('Found textSpan:', textSpan, 'Found previewImg:', previewImg);
      
      if (textSpan) textSpan.style.display = 'none';
      if (previewImg) {
        previewImg.src = e.target.result;
        previewImg.style.display = 'block';
        console.log('Image preview should now be visible');
      }
    };
    reader.readAsDataURL(input.files[0]);
  } else {
    console.log('No file selected');
  }
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
      recommend: formData.get('recommend')
    };

    console.log('Submitting review data:', reviewData);

    // Upload book cover if selected
    const bookCoverInput = document.querySelector('input[name="bookCover"]');
    if (bookCoverInput && bookCoverInput.files && bookCoverInput.files[0]) {
      try {
        const coverFile = bookCoverInput.files[0];
        const coverRef = ref(storage, `book-covers/${Date.now()}_${coverFile.name}`);
        await uploadBytes(coverRef, coverFile);
        reviewData.bookCoverURL = await getDownloadURL(coverRef);
        console.log('Book cover uploaded');
      } catch (uploadError) {
        console.error('Error uploading book cover:', uploadError);
      }
    }

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
    document.getElementById('bookCoverPreview').style.display = 'none';
    document.getElementById('bookCoverText').style.display = 'block';
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
  console.log('initializeForm called');
  
  const form = document.getElementById('bookReviewForm');
  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      await submitReview();
    });
    console.log('Form submit handler attached');
  }

  // Attach image preview handlers
  const bookCoverInput = document.getElementById('bookCoverInput');
  console.log('bookCoverInput:', bookCoverInput);
  if (bookCoverInput) {
    bookCoverInput.addEventListener('change', function() {
      console.log('Book cover changed!');
      previewImage(this, 'bookCoverBox');
    });
    console.log('Book cover change handler attached');
  }

  // Attach image preview handlers for the 4 additional images
  for (let i = 1; i <= 4; i++) {
    const imageInput = document.getElementById('imageInput' + i);
    console.log('imageInput' + i + ':', imageInput);
    if (imageInput) {
      imageInput.addEventListener('change', function() {
        console.log('Image ' + i + ' changed!');
        previewImage(this, 'imageBox' + i);
      });
      console.log('Image ' + i + ' change handler attached');
    }
  }
  
  console.log('All handlers attached');
}

// Check if DOM is already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeForm);
} else {
  initializeForm();
}
