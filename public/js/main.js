const modal = document.getElementById('notificationModal');
const modalMessage = document.getElementById('modalMessage');
const modalTitle = document.getElementById('modalTitle');
const closeModalBtn = document.getElementById('closeModal');

if (closeModalBtn) {
  closeModalBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
  });
}

window.showNotification = (type, message) => {
  if (!modal || !modalMessage || !modalTitle) return;
  modalTitle.textContent = type === 'error' ? 'Error' : type === 'success' ? 'Success' : 'Info';
  modalMessage.textContent = message;
  modal.classList.remove('hidden');
  setTimeout(() => {
    modal.classList.add('hidden');
  }, 5000);
};

// Check authentication status and redirect if needed
window.checkAuth = async (redirectIfNot = true) => {
  try {
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    if (res.ok) {
      const user = await res.json();
      return user;
    }
    if (redirectIfNot) {
      window.location.href = '/login';
    }
    return null;
  } catch {
    if (redirectIfNot) {
      window.location.href = '/login';
    }
    return null;
  }
};

// Dark mode toggle (default dark)
window.toggleDarkMode = () => {
  const isDark = localStorage.getItem('darkMode') !== 'false';
  localStorage.setItem('darkMode', (!isDark).toString());
  applyDarkMode();
};

function applyDarkMode() {
  const isDark = localStorage.getItem('darkMode') !== 'false';
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}
applyDarkMode();

// CSRF token helper
window.getCsrfToken = () => {
  const match = document.cookie.match(/csrfToken=([^;]+)/);
  return match ? match[1] : null;
};

// Setup fetch with credentials and CSRF for non-GET
window.apiFetch = async (url, options = {}) => {
  const fetchOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };
  if (options.method && options.method !== 'GET') {
    const csrf = getCsrfToken();
    if (csrf) {
      fetchOptions.headers['X-CSRF-Token'] = csrf;
    }
  }
  const res = await fetch(url, fetchOptions);
  if (res.status === 401) {
    window.location.href = '/login';
    return null;
  }
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  return res.json();
};
