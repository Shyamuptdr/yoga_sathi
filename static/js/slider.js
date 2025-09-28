// static/js/slider.js

document.addEventListener("DOMContentLoaded", () => {
    const slides = document.querySelectorAll(".pro-slide");
    const dotsContainer = document.querySelector(".slider-dots");
    if (slides.length === 0) return;

    let currentSlide = 0;
    let slideInterval;

    // Create dots
    slides.forEach((_, index) => {
        const dot = document.createElement("span");
        dot.classList.add("dot");
        dot.addEventListener("click", () => {
            goToSlide(index);
        });
        dotsContainer.appendChild(dot);
    });

    const dots = document.querySelectorAll(".dot");

    function goToSlide(index) {
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));

        slides[index].classList.add('active');
        dots[index].classList.add('active');
        currentSlide = index;
        
        // Restart autoplay timer
        clearInterval(slideInterval);
        slideInterval = setInterval(nextSlide, 6000);
    }

    function nextSlide() {
        let nextIndex = (currentSlide + 1) % slides.length;
        goToSlide(nextIndex);
    }

    // Initial setup
    goToSlide(0);
});