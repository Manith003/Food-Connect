// About Page JavaScript

// Initialize page
function initAboutPage() {
    // Add entrance animations
    const elements = document.querySelectorAll('.slide-up, .fade-in');
    elements.forEach((el, index) => {
        el.style.animationDelay = `${index * 0.1}s`;
    });
}

// Initialize page when ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAboutPage);
} else {
    initAboutPage();
}