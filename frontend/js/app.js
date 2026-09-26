/**
 * InterviewAI Main Application Controller.
 * Initializes modules, single-scroll sticky floating bar, theme toggler, and toast engine.
 */

// Global Toast Notification Utility
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'fa-circle-info';
    if (type === 'success') icon = 'fa-circle-check text-success';
    else if (type === 'error') icon = 'fa-triangle-exclamation text-danger';
    else if (type === 'warning') icon = 'fa-bell text-warning';

    toast.innerHTML = `
        <i class="fa-solid ${icon}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 350);
    }, 4000);
}
window.showToast = showToast;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('[InterviewAI] Initializing platform...');

    // 1. Initialize Theme
    const savedTheme = localStorage.getItem('interviewai_theme') || 'theme-dark';
    document.body.className = savedTheme;
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const isDark = document.body.classList.contains('theme-dark');
            const newTheme = isDark ? 'theme-light' : 'theme-dark';
            document.body.className = newTheme;
            localStorage.setItem('interviewai_theme', newTheme);
        });
    }

    // 2. Single-Scroll Persistent Floating Bar (Login, Signout, Create Account immediately visible)
    const quickBar = document.getElementById('quickActionBar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 80) {
            quickBar?.classList.add('scrolled');
        } else {
            quickBar?.classList.remove('scrolled');
        }
    }, { passive: true });

    // 3. Initialize Modules
    if (window.Auth) {
        Auth.initEventListeners();
        await Auth.fetchCurrentUser();
    }

    if (window.Profile) {
        Profile.initEventListeners();
        await Profile.loadProfile();
    }

    if (window.Interview) {
        Interview.initATSAnalyzer();
        Interview.initMockRoom();
    }

    if (window.Billing) {
        Billing.initEventListeners();
    }

    // 4. Smooth Anchor Scrolling & Active Nav Highlighting
    const navLinks = document.querySelectorAll('.nav-link, .quick-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });

    console.log('[InterviewAI] Ready.');
});
