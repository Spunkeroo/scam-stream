// scam.stream — Main App Controller
const App = {
  currentSection: 'hero',

  init() {
    // Init all modules
    Ticker.init();
    Feed.init();
    Videos.init();
    Database.init();
    Submit.init();

    // Navigation
    this.bindNav();

    // Handle hash navigation
    const hash = window.location.hash.slice(1);
    if (hash) this.navigate(hash);

    // Mobile menu
    const menuBtn = document.getElementById('mobile-menu');
    if (menuBtn) {
      menuBtn.addEventListener('click', () => {
        document.getElementById('nav-links')?.classList.toggle('show');
      });
    }

    // Escape key closes video modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') Videos.closeModal();
    });

    // Set community report count in hero
    const reports = JSON.parse(localStorage.getItem('community_reports') || '[]');
    const statEl = document.getElementById('stat-reports');
    if (statEl) statEl.textContent = reports.length;
  },

  bindNav() {
    document.querySelectorAll('[data-nav]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = link.dataset.nav;
        this.navigate(section);
        // Close mobile menu
        document.getElementById('nav-links')?.classList.remove('show');
      });
    });
  },

  navigate(section) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));

    // Show target
    const target = document.getElementById(section);
    if (target) {
      target.classList.add('active');
      this.currentSection = section;
      window.location.hash = section;

      // Update active nav link
      document.querySelectorAll('[data-nav]').forEach(link => {
        link.classList.toggle('active', link.dataset.nav === section);
      });

      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },

  toast(message) {
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  }
};

// Boot
document.addEventListener('DOMContentLoaded', () => App.init());
