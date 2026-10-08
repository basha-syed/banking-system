/**
 * UI Utilities, Toast Notifications, Theme Management & Modals
 */

class UI {
  static init() {
    this.initTheme();
    this.setupModalListeners();
  }

  // 1. Toast Notification System
  static showToast(type = 'success', title = '', message = '') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconClass = 'fa-check-circle';
    if (type === 'error') iconClass = 'fa-exclamation-circle';
    if (type === 'warning') iconClass = 'fa-exclamation-triangle';
    if (type === 'info') iconClass = 'fa-info-circle';

    toast.innerHTML = `
      <div class="toast-icon"><i class="fas ${iconClass}"></i></div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // 2. Modal Controller
  static openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
    }
  }

  static closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
    }
  }

  static setupModalListeners() {
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-overlay') || e.target.classList.contains('modal-close-btn')) {
        const activeModal = document.querySelector('.modal-overlay.active');
        if (activeModal) {
          activeModal.classList.remove('active');
        }
      }
    });
  }

  // 3. Theme Switcher (Light / Dark Mode)
  static initTheme() {
    const savedTheme = localStorage.getItem('apex_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.updateThemeIcon(savedTheme);
  }

  static toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('apex_theme', nextTheme);
    this.updateThemeIcon(nextTheme);
    this.showToast('info', 'Theme Updated', `Switched to ${nextTheme} mode.`);
  }

  static updateThemeIcon(theme) {
    const icon = document.querySelector('.theme-toggle-btn i');
    if (icon) {
      icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
  }

  // 4. Balance Counter Micro-Animation
  static animateBalance(elementId, targetAmount) {
    const el = document.getElementById(elementId);
    if (!el) return;

    const end = parseFloat(targetAmount);
    if (isNaN(end)) {
      el.textContent = '$0.00';
      return;
    }

    let start = 0;
    const duration = 1000; // 1 second
    const startTime = performance.now();

    function step(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const current = start + (end - start) * progress;
      
      el.textContent = `$${current.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }
}

window.UI = UI;
document.addEventListener('DOMContentLoaded', () => UI.init());
