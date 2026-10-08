/**
 * Auth Controller - Login, Register, OTP Verification, Password Recovery
 */

class Auth {
  // Handle Login Form Submit
  static async handleLogin(e) {
    e.preventDefault();
    const btn = document.getElementById('login-submit-btn');
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value.trim();

    if (!email || !password) {
      UI.showToast('error', 'Missing Fields', 'Please enter email and password.');
      return;
    }

    try {
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';

      const res = await API.post('/auth/login', { email, password });

      localStorage.setItem('apex_token', res.token);
      localStorage.setItem('apex_user', JSON.stringify(res.user));

      UI.showToast('success', 'Welcome Back', `Logged in as ${res.user.fullName}`);

      // Route based on role
      if (res.user.role === 'admin') {
        window.location.hash = 'admin';
      } else {
        window.location.hash = 'dashboard';
      }
    } catch (error) {
      UI.showToast('error', 'Authentication Failed', error.message);
    } finally {
      btn.disabled = false;
      btn.innerHTML = 'Sign In';
    }
  }

  // Handle Registration Form Submit
  static async handleRegister(e) {
    e.preventDefault();
    const btn = document.getElementById('register-submit-btn');
    const fullName = document.getElementById('reg-fullname').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const password = document.getElementById('reg-password').value.trim();
    const accountType = document.getElementById('reg-account-type').value;

    try {
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing Account...';

      const res = await API.post('/auth/register', {
        fullName,
        email,
        phone,
        password,
        accountType
      });

      // Save user registration temp ID for OTP verification modal
      window.pendingRegUserId = res.data.userId;

      // Show OTP verification modal
      document.getElementById('otp-demo-code').textContent = res.data.otpCodeDemo;
      UI.openModal('otp-modal');
      UI.showToast('info', 'OTP Generated', 'Verification code generated for your account.');
    } catch (error) {
      UI.showToast('error', 'Registration Failed', error.message);
    } finally {
      btn.disabled = false;
      btn.innerHTML = 'Create Account';
    }
  }

  // Handle OTP Verification Modal Submit
  static async handleVerifyOTP(e) {
    e.preventDefault();
    const code = document.getElementById('otp-input-code').value.trim();
    const userId = window.pendingRegUserId;

    if (!code) {
      UI.showToast('error', 'Invalid Code', 'Please enter 6-digit OTP code.');
      return;
    }

    try {
      const res = await API.post('/auth/verify-otp', {
        userId,
        code,
        type: 'registration'
      });

      localStorage.setItem('apex_token', res.token);
      localStorage.setItem('apex_user', JSON.stringify(res.user));

      UI.closeModal('otp-modal');
      UI.showToast('success', 'Account Activated', 'Your account has been verified successfully.');
      window.location.hash = 'dashboard';
    } catch (error) {
      UI.showToast('error', 'Verification Failed', error.message);
    }
  }

  // Handle Logout
  static logout() {
    localStorage.removeItem('apex_token');
    localStorage.removeItem('apex_user');
    UI.showToast('info', 'Logged Out', 'You have been safely logged out.');
    window.location.hash = 'login';
  }
}

window.Auth = Auth;
