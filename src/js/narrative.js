window.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("intro-modal");
  const slides = document.querySelectorAll(".slide");
  const nextBtn = document.getElementById("next-slide");
  const prevBtn = document.getElementById("prev-slide");
  const startBtn = document.getElementById("start-btn");

  let currentSlide = 0;

  function updateSlides() {
    slides.forEach((slide, index) => {
      slide.classList.toggle("active", index === currentSlide);
    });

    prevBtn.disabled = currentSlide === 0;
    nextBtn.disabled = currentSlide === slides.length - 1;
  }

  nextBtn.addEventListener("click", () => {
    if (currentSlide < slides.length - 1) {
      currentSlide++;
      updateSlides();
    }
  });

  prevBtn.addEventListener("click", () => {
    if (currentSlide > 0) {
      currentSlide--;
      updateSlides();
    }
  });

  startBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });
   
  const narrationText = document.getElementById("description").textContent;

  const utterance = new SpeechSynthesisUtterance(narrationText);
  utterance.lang = 'en-US'; // Optional: set language
  utterance.rate = 1;       // Optional: speech rate
  utterance.pitch = 1;      // Optional: pitch level

  // Speak the narration
  window.speechSynthesis.speak(utterance);
  updateSlides();
});