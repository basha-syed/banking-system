/**
 * Application Core Router & Navigation Guard
 */

class App {
  static init() {
    window.addEventListener('hashchange', () => this.handleRouting());
    this.setupFormListeners();
    this.setupSidebarToggle();
    this.handleRouting();
  }

  // SPA Route Switcher
  static handleRouting() {
    const hash = window.location.hash.replace('#', '') || 'dashboard';
    const token = localStorage.getItem('apex_token');
    const user = JSON.parse(localStorage.getItem('apex_user') || '{}');

    const authSection = document.getElementById('auth-section');
    const appShell = document.getElementById('app-shell');

    // Public Auth Routes
    if (['login', 'register', 'forgot-password'].includes(hash)) {
      if (token) {
        window.location.hash = user.role === 'admin' ? 'admin' : 'dashboard';
        return;
      }
      authSection.style.display = 'flex';
      appShell.style.display = 'none';

      // Toggle internal auth sub-views
      document.getElementById('view-login').style.display = hash === 'login' ? 'block' : 'none';
      document.getElementById('view-register').style.display = hash === 'register' ? 'block' : 'none';
      document.getElementById('view-forgot-password').style.display = hash === 'forgot-password' ? 'block' : 'none';
      return;
    }

    // Protected Routes Guard
    if (!token) {
      window.location.hash = 'login';
      return;
    }

    authSection.style.display = 'none';
    appShell.style.display = 'flex';

    // Update Header User Info
    document.querySelectorAll('.user-name-display').forEach(el => el.textContent = user.fullName || 'User');
    document.querySelectorAll('.user-role-display').forEach(el => el.textContent = user.role || 'user');

    // Show/Hide Admin Nav link based on role
    const adminNavItem = document.getElementById('nav-item-admin');
    if (adminNavItem) {
      adminNavItem.style.display = user.role === 'admin' ? 'block' : 'none';
    }

    // Activate Nav Link
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-view') === hash);
    });

    // Hide all view pages, then show active
    document.querySelectorAll('.page-view').forEach(view => view.style.display = 'none');

    const activeView = document.getElementById(`page-${hash}`);
    if (activeView) {
      activeView.style.display = 'block';
    } else {
      document.getElementById('page-dashboard').style.display = 'block';
    }

    // Page Specific Initializers
    if (hash === 'dashboard') Dashboard.load();
    if (hash === 'transactions') Transactions.load();
    if (hash === 'admin') Admin.load();
    if (hash === 'profile') this.loadProfileData();
  }

  // Setup Form Submissions
  static setupFormListeners() {
    // Auth Forms
    document.getElementById('form-login')?.addEventListener('submit', (e) => Auth.handleLogin(e));
    document.getElementById('form-register')?.addEventListener('submit', (e) => Auth.handleRegister(e));
    document.getElementById('form-verify-otp')?.addEventListener('submit', (e) => Auth.handleVerifyOTP(e));

    // Deposit Form
    document.getElementById('form-deposit')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const amount = parseFloat(document.getElementById('deposit-amount').value);
      const description = document.getElementById('deposit-desc').value;
      try {
        const res = await API.post('/accounts/deposit', { amount, description });
        UI.showToast('success', 'Deposit Successful', res.message);
        document.getElementById('form-deposit').reset();
        window.location.hash = 'dashboard';
      } catch (err) {
        UI.showToast('error', 'Deposit Failed', err.message);
      }
    });

    // Withdraw Form
    document.getElementById('form-withdraw')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const amount = parseFloat(document.getElementById('withdraw-amount').value);
      const description = document.getElementById('withdraw-desc').value;
      try {
        const res = await API.post('/accounts/withdraw', { amount, description });
        UI.showToast('success', 'Withdrawal Successful', res.message);
        document.getElementById('form-withdraw').reset();
        window.location.hash = 'dashboard';
      } catch (err) {
        UI.showToast('error', 'Withdrawal Failed', err.message);
      }
    });

    // Beneficiary Account Verification on Transfer Form
    document.getElementById('transfer-acc-number')?.addEventListener('blur', async (e) => {
      const accNum = e.target.value.trim();
      const nameEl = document.getElementById('beneficiary-name-display');
      if (accNum.length >= 6) {
        try {
          const res = await API.get(`/accounts/verify-beneficiary/${accNum}`);
          nameEl.textContent = `Recipient: ${res.beneficiary.ownerName}`;
          nameEl.style.color = 'var(--accent-emerald)';
        } catch (err) {
          nameEl.textContent = 'Account not found or inactive';
          nameEl.style.color = 'var(--accent-rose)';
        }
      }
    });

    // Transfer Form
    document.getElementById('form-transfer')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const receiverAccountNumber = document.getElementById('transfer-acc-number').value.trim();
      const amount = parseFloat(document.getElementById('transfer-amount').value);
      const description = document.getElementById('transfer-desc').value;
      const otpCode = document.getElementById('transfer-otp-code').value;

      try {
        const res = await API.post('/accounts/transfer', {
          receiverAccountNumber,
          amount,
          description,
          otpCode
        });
        UI.showToast('success', 'Transfer Completed', res.message);
        document.getElementById('form-transfer').reset();
        document.getElementById('beneficiary-name-display').textContent = '';
        window.location.hash = 'dashboard';
      } catch (err) {
        UI.showToast('error', 'Transfer Failed', err.message);
      }
    });

    // Request Transfer Security OTP
    document.getElementById('btn-request-transfer-otp')?.addEventListener('click', async () => {
      try {
        const res = await API.post('/accounts/request-otp');
        UI.showToast('info', 'OTP Generated', `Security OTP Code: ${res.data.otpCodeDemo}`);
      } catch (err) {
        UI.showToast('error', 'OTP Error', err.message);
      }
    });

    // Profile & Password Update
    document.getElementById('form-profile')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fullName = document.getElementById('prof-fullname').value;
      const phone = document.getElementById('prof-phone').value;
      try {
        const res = await API.put('/users/profile', { fullName, phone });
        localStorage.setItem('apex_user', JSON.stringify(res.user));
        UI.showToast('success', 'Profile Updated', res.message);
      } catch (err) {
        UI.showToast('error', 'Update Failed', err.message);
      }
    });

    document.getElementById('form-password')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const currentPassword = document.getElementById('pass-current').value;
      const newPassword = document.getElementById('pass-new').value;
      try {
        const res = await API.put('/users/change-password', { currentPassword, newPassword });
        UI.showToast('success', 'Password Changed', res.message);
        document.getElementById('form-password').reset();
      } catch (err) {
        UI.showToast('error', 'Change Failed', err.message);
      }
    });
  }

  // Sidebar Toggle Helper for Mobile
  static setupSidebarToggle() {
    const btn = document.querySelector('.sidebar-toggle-btn');
    const sidebar = document.querySelector('.sidebar');
    if (btn && sidebar) {
      btn.addEventListener('click', () => sidebar.classList.toggle('open'));
    }
  }

  // Load Profile Form Values
  static async loadProfileData() {
    const user = JSON.parse(localStorage.getItem('apex_user') || '{}');
    const fnEl = document.getElementById('prof-fullname');
    const emailEl = document.getElementById('prof-email');
    const phoneEl = document.getElementById('prof-phone');

    if (fnEl) fnEl.value = user.fullName || '';
    if (emailEl) emailEl.value = user.email || '';
    if (phoneEl) phoneEl.value = user.phone || '';
  }
}

document.addEventListener('DOMContentLoaded', () => App.init());
