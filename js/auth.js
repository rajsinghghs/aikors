/**
 * auth.js — FAANG-Level Login/Signup modal logic
 * Upgraded: Premium UI, Toggle Password, SVG Loaders, Bug fixes
 */

// ─── Modal Control ─────────────────────────────────────────────────────────

function openLoginModal() {
  const overlay = document.getElementById('auth-modal-overlay');
  if (!overlay) { injectAuthModal(); setTimeout(openLoginModal, 50); return; }
  
  overlay.style.display = 'flex';
  // Force reflow for CSS transition
  overlay.offsetHeight;
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden'; // Prevent background scrolling
  showLoginTab();
}

function openSignupModal() {
  const overlay = document.getElementById('auth-modal-overlay');
  if (!overlay) { injectAuthModal(); setTimeout(openSignupModal, 50); return; }
  
  overlay.style.display = 'flex';
  overlay.offsetHeight;
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  showSignupTab();
}

function closeAuthModal() {
  const overlay = document.getElementById('auth-modal-overlay');
  if (!overlay) return;
  
  overlay.classList.remove('active');
  document.body.style.overflow = ''; // Restore scrolling
  
  // Hide after transition completes (matching --transition timing)
  setTimeout(() => { overlay.style.display = 'none'; }, 200);
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

// ─── Toggle Password Visibility ────────────────────────────────────────────

function togglePassword(inputId, btnEl) {
  const input = document.getElementById(inputId);
  if (!input) return;
  
  if (input.type === 'password') {
    input.type = 'text';
    btnEl.innerHTML = Icons.eyeOff; // Use eye-off icon from utils.js
  } else {
    input.type = 'password';
    btnEl.innerHTML = Icons.eye; // Use regular eye icon
  }
}

// ─── Authentication Handlers ───────────────────────────────────────────────

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
    Toast.success(`Welcome back, ${data.user.name.split(' ')[0]}!`);
    
    setTimeout(() => {
      closeAuthModal();
      setupNavbar();
      // Role based redirection
      if (data.user.role === 'admin') {
        window.location.href = '/admin';
      } else {
        if (typeof onAuthSuccess === 'function') onAuthSuccess(data.user);
      }
    }, 600);
  } catch (err) {
    Toast.error(err.message);
  } finally {
    setLoading(btn, false);
  }
}

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
      password: password
    });
    
    Auth.setSession(data.access_token, data.user);
    Toast.success(`Welcome, ${data.user.name}!`);
    
    setTimeout(() => {
      closeAuthModal();
      setupNavbar();
      if (typeof onAuthSuccess === 'function') onAuthSuccess(data.user);
    }, 600);
  } catch (err) {
    Toast.error(err.message);
  } finally {
    setLoading(btn, false);
  }
}

// ─── Auth Modal HTML Injection ─────────────────────────────────────────────

function injectAuthModal() {
  if (document.getElementById('auth-modal-overlay')) return;
  
  const html = `
  <div id="auth-modal-overlay" class="auth-overlay" style="display:none" onclick="handleModalOverlayClick(event)">
    <div class="auth-modal" onclick="event.stopPropagation()">
      
      <!-- Close Button -->
      <button class="modal-close-btn" onclick="closeAuthModal()" aria-label="Close modal">✕</button>
      
      <!-- Logo/Brand Icon (Optional sleek touch) -->
      <div style="width:40px; height:40px; background:var(--primary); color:var(--on-primary); border-radius:var(--radius-md); display:flex; align-items:center; justify-content:center; margin-bottom: 24px; font-weight:800; font-family:var(--font-display);">
        AI
      </div>

      <!-- Segmented Control Tabs -->
      <div class="auth-tabs">
        <button id="tab-login" class="auth-tab" onclick="showLoginTab()">Log In</button>
        <button id="tab-signup" class="auth-tab" onclick="showSignupTab()">Sign Up</button>
      </div>
      
      <!-- Login Form -->
      <form id="login-form" onsubmit="handleLogin(event)">
        <div style="margin-bottom:24px">
          <h2 style="font-size:1.5rem; margin-bottom:4px; letter-spacing:-0.02em;">Welcome back</h2>
          <p style="color:var(--text-secondary); font-size:0.9rem">Enter your details to sign in.</p>
        </div>
        
        <div class="form-group">
          <label class="form-label">Email address</label>
          <input id="login-email" type="email" class="form-input" placeholder="you@example.com" required autocomplete="email">
        </div>
        
        <div class="form-group">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <label class="form-label" style="margin-bottom:0;">Password</label>
            <a href="#" style="font-size:0.8rem; color:var(--text-muted);">Forgot password?</a>
          </div>
          <div class="password-wrapper">
            <input id="login-password" type="password" class="form-input" placeholder="••••••••" required style="padding-right: 44px;">
            <button type="button" class="password-toggle" onclick="togglePassword('login-password', this)" aria-label="Toggle password visibility">
              ${Icons.eye}
            </button>
          </div>
        </div>
        
        <button id="login-btn" type="submit" class="btn-primary" style="width:100%; height:44px; margin-top:12px">
          Sign In
        </button>
      </form>
      
      <!-- Signup Form -->
      <form id="signup-form" onsubmit="handleSignup(event)" style="display:none">
        <div style="margin-bottom:24px">
          <h2 style="font-size:1.5rem; margin-bottom:4px; letter-spacing:-0.02em;">Create an account</h2>
          <p style="color:var(--text-secondary); font-size:0.9rem">Join our community today.</p>
        </div>
        
        <div class="form-group">
          <label class="form-label">Full Name</label>
          <input id="signup-name" type="text" class="form-input" placeholder="John Doe" required autocomplete="name">
        </div>
        
        <div class="form-group">
          <label class="form-label">Email address</label>
          <input id="signup-email" type="email" class="form-input" placeholder="you@example.com" required autocomplete="email">
        </div>
        
        <div class="form-group">
          <label class="form-label">Password</label>
          <div class="password-wrapper">
            <input id="signup-password" type="password" class="form-input" placeholder="Min. 6 characters" required minlength="6" style="padding-right: 44px;">
            <button type="button" class="password-toggle" onclick="togglePassword('signup-password', this)" aria-label="Toggle password visibility">
              ${Icons.eye}
            </button>
          </div>
        </div>
        
        <button id="signup-btn" type="submit" class="btn-primary" style="width:100%; height:44px; margin-top:12px">
          Create Account
        </button>
      </form>
      
    </div>
  </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', html);
  
  // Inject dedicated modal styles
  const style = document.createElement('style');
  style.textContent = `
    .auth-overlay {
      position: fixed; inset: 0; z-index: 2000;
      display: flex; align-items: center; justify-content: center;
      background: rgba(0, 0, 0, 0.4);
      -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px);
      opacity: 0; pointer-events: none;
      transition: opacity var(--transition);
      padding: 16px;
    }
    .auth-overlay.active {
      opacity: 1; pointer-events: auto;
    }
    .auth-modal {
      width: 100%; max-width: 420px;
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-xl);
      padding: 32px;
      box-shadow: var(--shadow-modal);
      position: relative;
      transform: scale(0.96) translateY(10px);
      transition: transform var(--transition);
    }
    .auth-overlay.active .auth-modal {
      transform: scale(1) translateY(0);
    }
    .modal-close-btn {
      position: absolute; top: 16px; right: 16px;
      width: 32px; height: 32px;
      display: flex; align-items: center; justify-content: center;
      border-radius: var(--radius-sm);
      color: var(--text-muted); font-size: 1.1rem;
      transition: var(--transition);
    }
    .modal-close-btn:hover { background: var(--bg-surface-hover); color: var(--text-primary); }
    
    .auth-tabs {
      display: flex; gap: 4px; padding: 4px;
      background: var(--bg-surface-hover);
      border-radius: var(--radius-md);
      margin-bottom: 28px;
    }
    .auth-tab {
      flex: 1; padding: 8px 12px;
      font-weight: 600; font-size: 0.85rem;
      border-radius: calc(var(--radius-md) - 4px);
      color: var(--text-secondary);
      transition: var(--transition);
    }
    .auth-tab.active {
      background: var(--bg-surface);
      color: var(--text-primary);
      box-shadow: var(--shadow-sm);
    }
    
    @media (max-width: 480px) {
      .auth-modal { padding: 24px; border-radius: var(--radius-lg); }
    }
  `;
  document.head.appendChild(style);
  
  showLoginTab();
}

function handleModalOverlayClick(e) {
  if (e.target.id === 'auth-modal-overlay') closeAuthModal();
}

// Close on ESC key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeAuthModal();
});

// Inject modal when DOM is ready
document.addEventListener('DOMContentLoaded', injectAuthModal);