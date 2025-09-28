document.addEventListener('DOMContentLoaded', () => {
    const nav = document.getElementById('mainNav');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    });

    // Logic to set the active link based on the current page
    const navLinks = document.querySelectorAll('.nav-link');
    const currentPath = window.location.pathname;

    navLinks.forEach(link => {
        link.classList.remove('active');
        // Match the root path correctly
        if (link.getAttribute('href') === '/' && currentPath === '/') {
            link.classList.add('active');
        } else if (link.getAttribute('href') !== '/' && currentPath.startsWith(link.getAttribute('href'))) {
            link.classList.add('active');
        }
    });
});