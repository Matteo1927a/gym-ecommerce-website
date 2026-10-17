document.addEventListener("DOMContentLoaded", function () {
  const burgerBtn = document.getElementById('burgerBtn');
  const nav = document.getElementById('nav');

  if (burgerBtn && nav) {
    burgerBtn.addEventListener('click', () => {
      nav.classList.toggle('show');
    });
  }
});