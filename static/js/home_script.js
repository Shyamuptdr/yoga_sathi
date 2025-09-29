document.addEventListener('DOMContentLoaded', () => {

    // Preloader
    const preloader = document.querySelector('.preloader');
    window.addEventListener('load', () => {
        preloader.style.opacity = '0';
        setTimeout(() => {
            preloader.style.display = 'none';
        }, 500); // Match this with CSS transition time
    });

    // Responsive Navigation
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        const icon = hamburger.querySelector('i');
        icon.classList.toggle('fa-bars');
        icon.classList.toggle('fa-times');
    });

    // Professional Slider
    const slides = document.querySelectorAll('.slide');
    let currentIndex = 0;

    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.classList.remove('active');
            if (i === index) {
                slide.classList.add('active');
            }
        });
    }

    function nextSlide() {
        currentIndex = (currentIndex + 1) % slides.length;
        showSlide(currentIndex);
    }
    
    // Initial slide
    showSlide(currentIndex);
    setInterval(nextSlide, 5000); // Change slide every 5 seconds

    // Asana Popup (Modal)
    const asanaCards = document.querySelectorAll('.asana-card');
    const popup = document.getElementById('asana-popup');
    const popupImg = document.getElementById('popup-img'); // Get the image element
    const popupTitle = document.getElementById('popup-title');
    const popupDetails = document.getElementById('popup-details');
    const closeBtn = document.querySelector('.close-btn');
    const startSessionBtn = document.getElementById('startSessionBtn'); // MODIFIED: Get the button by ID

    asanaCards.forEach(card => {
        card.addEventListener('click', () => {
            const title = card.getAttribute('data-title'); // Get title from data-title
            const details = card.getAttribute('data-details');
            const imgSrc = card.getAttribute('data-img'); // Get image source from data-img
            const targetUrl = card.getAttribute('data-target-url'); // MODIFIED: Get the target URL from the card
            
            popupTitle.innerText = title;
            popupDetails.innerText = details;
            popupImg.src = imgSrc; // Set the image source
            popupImg.alt = title; // Set alt text for accessibility

            // MODIFIED: Set the dynamic onclick for the Start Session button
            if (startSessionBtn && targetUrl) {
                startSessionBtn.onclick = () => {
                    window.location.href = targetUrl;
                };
            }
            
            popup.classList.add('active');
        });
    });

    function closePopup() {
        popup.classList.remove('active');
    }

    closeBtn.addEventListener('click', closePopup);
    popup.addEventListener('click', (e) => {
        if (e.target === popup) {
            closePopup();
        }
    });
    
    // Scroll Reveal Animation
    const revealElements = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15 // Trigger when 15% of the element is visible
    });

    revealElements.forEach(el => {
        revealObserver.observe(el);
    });

});