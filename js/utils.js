/**
 * utils.js — Shared utilities for auth, API calls, toasts, and helpers
 * FIXED: API_BASE is now relative (works on any host/port)
 */

// ─── API Base — Relative so it works on any server ───────────────────────────
const API_BASE = '/api';

// ─── Auth Token Management ────────────────────────────────────────────────────

const Auth = {
  getToken: () => localStorage.getItem('cv_token'),
  getUser: () => {
    const raw = localStorage.getItem('cv_user');
    try { return raw ? JSON.parse(raw) : null; } catch { return null; }
  },
  setSession: (token, user) => {
    localStorage.setItem('cv_token', token);
    localStorage.setItem('cv_user', JSON.stringify(user));
  },
  clear: () => {
    localStorage.removeItem('cv_token');
    localStorage.removeItem('cv_user');
  },
  isLoggedIn: () => !!localStorage.getItem('cv_token'),
  isAdmin: () => {
    const user = Auth.getUser();
    return user && user.role === 'admin';
  }
};

// ─── API Client ───────────────────────────────────────────────────────────────

const API = {
  async request(path, options = {}) {
    const token = Auth.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };

    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers
    });

    // Token expired — log out silently
    if (res.status === 401) {
      Auth.clear();
      window.location.href = '/';
      return;
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message = data.detail || `Request failed: ${res.status}`;
      throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
    }

    return data;
  },

  get: (path) => API.request(path),
  post: (path, body) => API.request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => API.request(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path) => API.request(path, { method: 'DELETE' }),

  // Multipart file upload
  upload: (path, formData) => {
    const token = Auth.getToken();
    return fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData
    }).then(async r => {
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.detail || 'Upload failed');
      return d;
    });
  }
};

// ─── Toast Notifications ──────────────────────────────────────────────────────

const Toast = {
  container: null,

  init() {
    this.container = document.getElementById('toast-container');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      document.body.appendChild(this.container);
    }
  },

  show(message, type = 'info', duration = 4000) {
    if (!this.container) this.init();

    const icons = { success: '✓', error: '✕', info: 'ℹ' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${icons[type] || icons.info}</span><span>${message}</span>`;

    this.container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('hiding');
      setTimeout(() => toast.remove(), 250);
    }, duration);
  },

  success: (msg) => Toast.show(msg, 'success'),
  error: (msg) => Toast.show(msg, 'error'),
  info: (msg) => Toast.show(msg, 'info')
};

// ─── Navbar Helpers ───────────────────────────────────────────────────────────

function setupNavbar() {
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 20);
    });
  }

  const navActions = document.getElementById('nav-actions');
  if (!navActions) return;

  const user = Auth.getUser();
  if (Auth.isLoggedIn() && user) {
    navActions.innerHTML = `
      <span style="color:var(--text-secondary);font-size:0.85rem">Hi, ${user.name.split(' ')[0]}</span>
      ${Auth.isAdmin() ? `<a href="/admin" class="btn-nav btn-ghost" style="padding:6px 14px">Admin</a>` : ''}
      <a href="/dashboard" class="btn-nav btn-ghost" style="padding:6px 14px">Dashboard</a>
      <button onclick="logout()" class="btn-nav btn-ghost" style="padding:6px 14px">Logout</button>
    `;
  } else {
    navActions.innerHTML = `
      <button onclick="openLoginModal()" class="btn-nav btn-ghost" style="padding:6px 14px">Login</button>
      <button onclick="openSignupModal()" class="btn-nav btn-primary" style="padding:6px 18px">Get Started</button>
    `;
  }
}

function logout() {
  Auth.clear();
  Toast.success('Logged out successfully');
  setTimeout(() => window.location.href = '/', 800);
}

// ─── Price Formatting ─────────────────────────────────────────────────────────

function formatPrice(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(amount);
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}

// ─── Loading State Helpers ────────────────────────────────────────────────────

function setLoading(btn, loading, text = 'Processing...') {
  if (loading) {
    btn.disabled = true;
    btn.dataset.original = btn.textContent;
    btn.textContent = text;
    btn.style.opacity = '0.7';
  } else {
    btn.disabled = false;
    btn.textContent = btn.dataset.original || text;
    btn.style.opacity = '1';
  }
}

// ─── Skeleton Loader ──────────────────────────────────────────────────────────

function productSkeleton() {
  return `
    <div class="product-card">
      <div class="skeleton" style="width:100%;aspect-ratio:16/9"></div>
      <div class="product-card-body">
        <div class="skeleton" style="height:18px;width:60%;margin-bottom:10px"></div>
        <div class="skeleton" style="height:14px;width:100%;margin-bottom:6px"></div>
        <div class="skeleton" style="height:14px;width:80%;margin-bottom:16px"></div>
        <div style="display:flex;justify-content:space-between">
          <div class="skeleton" style="height:28px;width:80px"></div>
          <div class="skeleton" style="height:36px;width:90px;border-radius:100px"></div>
        </div>
      </div>
    </div>
  `;
}

// ─── Discount Calculator ──────────────────────────────────────────────────────

function discountPercent(price, original) {
  if (!original || original <= price) return null;
  return Math.round(((original - price) / original) * 100);
}

// Init on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  Toast.init();
  setupNavbar();
});