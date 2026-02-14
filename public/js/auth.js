document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(loginForm);
      try {
        await API.auth.login({
          username: formData.get('username'),
          password: formData.get('password')
        });
        window.location.href = '/dashboard';
      } catch (err) {
        showNotification('error', err.message);
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(registerForm);
      const password = formData.get('password');
      const confirm = formData.get('confirmPassword');
      if (password !== confirm) {
        showNotification('error', 'Passwords do not match');
        return;
      }
      try {
        await API.auth.register({
          username: formData.get('username'),
          email: formData.get('email'),
          password: password
        });
        showNotification('success', 'Registration successful! Please login.');
        setTimeout(() => window.location.href = '/login', 2000);
      } catch (err) {
        showNotification('error', err.message);
      }
    });
  }

  // Logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await API.auth.logout();
      window.location.href = '/';
    });
  }
});
