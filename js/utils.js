/**
 * utils.js — FAANG-Level Utilities
 * Added: Professional SVG Icons, Premium Loading States, Smooth Toast Animations.
 */

// ─── API Base ───────────────────────────────────────────────────────────────
const API_BASE = '/api';

// ─── High-Quality SVG Icons (Lucide Style) ──────────────────────────────────
const Icons = {
  check: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
  error: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`,
  info: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`,
  loader: `<svg class="spinner" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>`,
  eye: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`,
  eyeOff: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`,
  logout: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>`
};

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
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    
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

// ─── FAANG-Style Toast Notifications ──────────────────────────────────────────
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
    
    const iconSvg = Icons[type] || Icons.info;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    toast.innerHTML = `
      <div class="toast-icon">${iconSvg}</div>
      <div class="toast-content">${message}</div>
    `;
    
    this.container.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('hiding');
      setTimeout(() => toast.remove(), 250); // wait for fadeOut animation
    }, duration);
  },
  success: (msg) => Toast.show(msg, 'success'),
  error: (msg) => Toast.show(msg, 'error'),
  info: (msg) => Toast.show(msg, 'info')
};

// ─── Navbar Helpers (Cleaned up for FAANG look) ───────────────────────────────
function setupNavbar() {
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 10);
      if(window.scrollY > 10) {
        navbar.style.borderBottomColor = 'var(--border-strong)';
        navbar.style.boxShadow = 'var(--shadow-sm)';
      } else {
        navbar.style.borderBottomColor = 'var(--border)';
        navbar.style.boxShadow = 'none';
      }
    });
  }
  
  const navActions = document.getElementById('nav-actions');
  if (!navActions) return;
  
  const user = Auth.getUser();
  if (Auth.isLoggedIn() && user) {
    const firstName = user.name.split(' ')[0];
    navActions.innerHTML = `
      <div style="display:flex; align-items:center; gap: 16px;">
        <span style="color:var(--text-secondary); font-size:0.9rem; font-weight:500; display:none; @media(min-width: 600px){display:block;}">
          Hey, ${firstName}
        </span>
        ${Auth.isAdmin() ? `<a href="/admin" class="btn-ghost" style="height: 36px;">Admin</a>` : ''}
        <a href="/dashboard" class="btn-primary" style="height: 36px;">Dashboard</a>
        <button onclick="logout()" class="btn-ghost" style="height: 36px; padding: 0 10px;" title="Logout">
          ${Icons.logout}
        </button>
      </div>
    `;
  } else {
    navActions.innerHTML = `
      <button onclick="openLoginModal()" class="btn-ghost" style="height: 36px;">Log in</button>
      <button onclick="openSignupModal()" class="btn-primary" style="height: 36px;">Sign up</button>
    `;
  }
}

function logout() {
  Auth.clear();
  Toast.success('Logged out successfully');
  setTimeout(() => window.location.href = '/', 800);
}

// ─── Price & Date Formatting ──────────────────────────────────────────────────
function formatPrice(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}

// ─── Premium Loading State (Button with SVG Spinner) ──────────────────────────
function setLoading(btn, loading, text = 'Processing...') {
  if (!btn) return;
  
  if (loading) {
    btn.disabled = true;
    btn.dataset.originalHtml = btn.innerHTML; // store original HTML completely
    // Add spinner and text side by side
    btn.innerHTML = `${Icons.loader} <span>${text}</span>`;
  } else {
    btn.disabled = false;
    if (btn.dataset.originalHtml) {
      btn.innerHTML = btn.dataset.originalHtml;
    } else {
      btn.textContent = text;
    }
  }
}

// ─── Skeleton Loader Helper ───────────────────────────────────────────────────
function productSkeleton() {
  return `
    <div class="product-card" style="pointer-events:none;">
      <div class="skeleton" style="width:100%; aspect-ratio: 16/9; border-radius: var(--radius-lg) var(--radius-lg) 0 0;"></div>
      <div class="product-card-body">
        <div class="skeleton" style="height:18px; width:70%; margin-bottom:8px;"></div>
        <div class="skeleton" style="height:14px; width:100%; margin-bottom:4px;"></div>
        <div class="skeleton" style="height:14px; width:85%; margin-bottom:20px;"></div>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div class="skeleton" style="height:24px; width:60px;"></div>
          <div class="skeleton" style="height:36px; width:90px; border-radius: var(--radius-md);"></div>
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