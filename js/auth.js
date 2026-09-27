/**
 * auth.js — Login/Signup modal logic
 * FIXED: admin redirect uses /admin (not admin.html), modal display:none on init
 */

// ─── Modal Control ─────────────────────────────────────────────────────────

function openLoginModal() {
  const overlay = document.getElementById('auth-modal-overlay');
  if (!overlay) { injectAuthModal(); setTimeout(openLoginModal, 50); return; }
  overlay.style.display = 'flex';
  // Force reflow for CSS transition
  overlay.offsetHeight;
  overlay.classList.add('active');
  showLoginTab();
}

function openSignupModal() {
  const overlay = document.getElementById('auth-modal-overlay');
  if (!overlay) { injectAuthModal(); setTimeout(openSignupModal, 50); return; }
  overlay.style.display = 'flex';
  overlay.offsetHeight;
  overlay.classList.add('active');
  showSignupTab();
}

function closeAuthModal() {
  const overlay = document.getElementById('auth-modal-overlay');
  if (!overlay) return;
  overlay.classList.remove('active');
  // Hide after transition completes
  setTimeout(() => { overlay.style.display = 'none'; }, 260);
}

function showLoginTab() {
  document.getElementById('login-form').style.display = 'block';
  document.getElementById('signup-form').style.display = 'none';
  document.getElementById('tab-login').classList.add('active');
  document.getElementById('tab-signup').classList.remove('active');
}

function showSignupTab() {
  document.getElementById('login-form').style.display = 'none';
  document.getElementById('signup-form').style.display = 'block';
  document.getElementById('tab-login').classList.remove('active');
  document.getElementById('tab-signup').classList.add('active');
}

// ─── Login ────────────────────────────────────────────────────────────────

async function handleLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('login-btn');
  setLoading(btn, true, 'Signing in...');

  try {
    const data = await API.post('/auth/login', {
      email: document.getElementById('login-email').value,
      password: document.getElementById('login-password').value
    });

    Auth.setSession(data.access_token, data.user);
    Toast.success(`Welcome back, ${data.user.name}!`);

    setTimeout(() => {
      closeAuthModal();
      setupNavbar();

      // FIXED: use route path, not .html filename
      if (data.user.role === 'admin') {
        window.location.href = '/admin';
      } else {
        if (typeof onAuthSuccess === 'function') onAuthSuccess(data.user);
      }
    }, 500);

  } catch (err) {
    Toast.error(err.message);
  } finally {
    setLoading(btn, false);
  }
}

// ─── Signup ────────────────────────────────────────────────────────────────

async function handleSignup(e) {
  e.preventDefault();
  const btn = document.getElementById('signup-btn');
  const password = document.getElementById('signup-password').value;

  if (password.length < 6) {
    Toast.error('Password must be at least 6 characters');
    return;
  }

  setLoading(btn, true, 'Creating account...');

  try {
    const data = await API.post('/auth/signup', {
      name: document.getElementById('signup-name').value,
      email: document.getElementById('signup-email').value,
      password
    });

    Auth.setSession(data.access_token, data.user);
    Toast.success(`Account created! Welcome, ${data.user.name}!`);

    setTimeout(() => {
      closeAuthModal();
      setupNavbar();
      if (typeof onAuthSuccess === 'function') onAuthSuccess(data.user);
    }, 500);

  } catch (err) {
    Toast.error(err.message);
  } finally {
    setLoading(btn, false);
  }
}

// ─── Auth Modal HTML ───────────────────────────────────────────────────────

function injectAuthModal() {
  // Don't inject twice
  if (document.getElementById('auth-modal-overlay')) return;

  const html = `
  <div id="auth-modal-overlay" class="modal-overlay" style="display:none" onclick="handleModalOverlayClick(event)">
    <div class="modal" onclick="event.stopPropagation()">
      <!-- Tabs -->
      <div style="display:flex;gap:4px;background:rgba(255,255,255,0.04);border-radius:10px;padding:4px;margin-bottom:28px">
        <button id="tab-login" onclick="showLoginTab()"
          style="flex:1;padding:10px;border-radius:8px;font-family:var(--font-display);font-weight:700;font-size:0.9rem;transition:var(--transition);">
          Login
        </button>
        <button id="tab-signup" onclick="showSignupTab()"
          style="flex:1;padding:10px;border-radius:8px;font-family:var(--font-display);font-weight:700;font-size:0.9rem;transition:var(--transition);">
          Sign Up
        </button>
      </div>

      <!-- Login Form -->
      <form id="login-form" onsubmit="handleLogin(event)">
        <div style="margin-bottom:24px">
          <h2 style="font-size:1.5rem;margin-bottom:6px">Welcome back</h2>
          <p style="color:var(--text-secondary);font-size:0.9rem">Sign in to your account</p>
        </div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input id="login-email" type="email" class="form-input" placeholder="you@example.com" required>
        </div>
        <div class="form-group">
          <label class="form-label">Password</label>
          <input id="login-password" type="password" class="form-input" placeholder="••••••••" required>
        </div>
        <button id="login-btn" type="submit" class="btn-primary" style="width:100%;justify-content:center;margin-top:8px">
          Sign In
        </button>
        <p style="text-align:center;margin-top:16px;color:var(--text-secondary);font-size:0.85rem">
          Don't have an account? <button type="button" onclick="showSignupTab()" style="background:none;color:var(--neon-green);font-weight:600;font-size:0.85rem">Sign Up</button>
        </p>
      </form>

      <!-- Signup Form -->
      <form id="signup-form" onsubmit="handleSignup(event)" style="display:none">
        <div style="margin-bottom:24px">
          <h2 style="font-size:1.5rem;margin-bottom:6px">Create account</h2>
          <p style="color:var(--text-secondary);font-size:0.9rem">Join thousands of learners</p>
        </div>
        <div class="form-group">
          <label class="form-label">Full Name</label>
          <input id="signup-name" type="text" class="form-input" placeholder="John Doe" required>
        </div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input id="signup-email" type="email" class="form-input" placeholder="you@example.com" required>
        </div>
        <div class="form-group">
          <label class="form-label">Password</label>
          <input id="signup-password" type="password" class="form-input" placeholder="Min. 6 characters" required>
        </div>
        <button id="signup-btn" type="submit" class="btn-primary" style="width:100%;justify-content:center;margin-top:8px">
          Create Account
        </button>
        <p style="text-align:center;margin-top:16px;color:var(--text-secondary);font-size:0.85rem">
          Already have an account? <button type="button" onclick="showLoginTab()" style="background:none;color:var(--neon-green);font-weight:600;font-size:0.85rem">Login</button>
        </p>
      </form>

      <!-- Close hint -->
      <p style="text-align:center;margin-top:16px;color:var(--text-muted);font-size:0.8rem">
        Press ESC or click outside to close
      </p>
    </div>
  </div>
  `;

  document.body.insertAdjacentHTML('beforeend', html);

  // Tab active/inactive styles
  const style = document.createElement('style');
  style.textContent = `
    #tab-login.active, #tab-signup.active {
      background: var(--neon-green) !important;
      color: #080c14 !important;
    }
    #tab-login:not(.active), #tab-signup:not(.active) {
      background: transparent !important;
      color: var(--text-secondary) !important;
    }
    /* Ensure modal overlay is hidden when not active */
    #auth-modal-overlay:not(.active) {
      pointer-events: none;
    }
  `;
  document.head.appendChild(style);

  // Set initial tab state
  showLoginTab();
}

function handleModalOverlayClick(e) {
  if (e.target.id === 'auth-modal-overlay') closeAuthModal();
}

// Close on ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeAuthModal();
});

// Inject modal when DOM is ready
document.addEventListener('DOMContentLoaded', injectAuthModal);