function selectRecommend(button) {
  document.querySelectorAll('.button-group button').forEach(btn => {
    btn.style.background = '#08060a';
    btn.style.color = '#e9d5ff';
  });
  button.style.background = 'linear-gradient(180deg, rgba(124,58,237,0.35), rgba(109,40,217,0.22))';
  button.style.color = '#e9d5ff';
  document.getElementById('recommendValue').value = button.value;
}

document.getElementById('bookReviewForm').addEventListener('submit', function(e) {
  e.preventDefault();
  alert('Review submitted! (This is a demo)');
});
