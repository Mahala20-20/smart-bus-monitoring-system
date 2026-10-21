// ==================== AUTH PAGES ====================
const AuthPage = {
  renderLogin() {
    return `
      ${Components.renderNavbar()}
      <div class="auth-page">
        <div class="auth-card">
          <h2>Welcome Back</h2>
          <p class="auth-subtitle">Sign in to your SmartBus account</p>
          <form id="login-form" onsubmit="AuthPage.handleLogin(event)">
            <div class="form-group">
              <label class="form-label" for="login-email">Email Address</label>
              <input class="form-input" type="email" id="login-email" placeholder="your@email.com" required autocomplete="email">
            </div>
            <div class="form-group">
              <label class="form-label" for="login-password">Password</label>
              <input class="form-input" type="password" id="login-password" placeholder="Enter your password" required autocomplete="current-password">
            </div>
            <button class="btn btn-primary btn-full btn-lg" type="submit" id="login-btn">Sign In</button>
          </form>
          <div class="auth-toggle">
            Don't have an account? <a onclick="Router.navigate('register')">Sign up</a>
          </div>
          <div class="auth-divider">Quick Login</div>
          <div class="flex gap-2" style="flex-wrap:wrap">
            <button class="btn btn-secondary btn-sm" style="flex:1" onclick="AuthPage.quickLogin('admin@smartbus.com','admin123')">Admin Demo</button>
            <button class="btn btn-secondary btn-sm" style="flex:1" onclick="AuthPage.quickLogin('rajesh@smartbus.com','driver123')">Driver Demo</button>
            <button class="btn btn-secondary btn-sm" style="flex:1" onclick="AuthPage.quickLogin('passenger@smartbus.com','pass123')">Passenger Demo</button>
          </div>
        </div>
      </div>
    `;
  },

  renderRegister() {
    return `
      ${Components.renderNavbar()}
      <div class="auth-page">
        <div class="auth-card">
          <h2>Create Account</h2>
          <p class="auth-subtitle">Join SmartBus for a better commute</p>
          <form id="register-form" onsubmit="AuthPage.handleRegister(event)">
            <div class="form-group">
              <label class="form-label" for="reg-name">Full Name</label>
              <input class="form-input" type="text" id="reg-name" placeholder="Your full name" required>
            </div>
            <div class="form-group">
              <label class="form-label" for="reg-email">Email Address</label>
              <input class="form-input" type="email" id="reg-email" placeholder="your@email.com" required>
            </div>
            <div class="form-group">
              <label class="form-label" for="reg-phone">Phone Number</label>
              <input class="form-input" type="tel" id="reg-phone" placeholder="Your phone number">
            </div>
            <div class="form-group">
              <label class="form-label" for="reg-password">Password</label>
              <input class="form-input" type="password" id="reg-password" placeholder="Choose a strong password" required minlength="6">
            </div>
            <button class="btn btn-primary btn-full btn-lg" type="submit" id="register-btn">Create Account</button>
          </form>
          <div class="auth-toggle">
            Already have an account? <a onclick="Router.navigate('login')">Sign in</a>
          </div>
        </div>
      </div>
    `;
  },

  async handleLogin(e) {
    e.preventDefault();
    const btn = document.getElementById('login-btn');
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    
    if (!email || !password) return Components.showToast('Please fill all fields', 'warning');
    
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Signing in...';
    try {
      const { token, user } = await API.login(email, password);
      Store.login(token, user);
      Components.showToast(`Welcome back, ${user.name}!`, 'success');
      const page = user.role === 'admin' ? 'admin' : user.role === 'driver' ? 'driver' : 'passenger';
      Router.navigate(page);
    } catch (err) {
      Components.showToast(err.message || 'Login failed', 'error');
      btn.disabled = false;
      btn.textContent = 'Sign In';
    }
  },

  async handleRegister(e) {
    e.preventDefault();
    const btn = document.getElementById('register-btn');
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const password = document.getElementById('reg-password').value;
    
    if (!name || !email || !password) return Components.showToast('Please fill all required fields', 'warning');
    if (!Utils.isValidEmail(email)) return Components.showToast('Please enter a valid email', 'warning');
    if (password.length < 6) return Components.showToast('Password must be at least 6 characters', 'warning');
    
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Creating account...';
    try {
      const { token, user } = await API.register({ name, email, phone, password });
      Store.login(token, user);
      Components.showToast('Account created successfully!', 'success');
      Router.navigate('passenger');
    } catch (err) {
      Components.showToast(err.message || 'Registration failed', 'error');
      btn.disabled = false;
      btn.textContent = 'Create Account';
    }
  },

  async quickLogin(email, password) {
    try {
      const { token, user } = await API.login(email, password);
      Store.login(token, user);
      Components.showToast(`Logged in as ${user.name}`, 'success');
      const page = user.role === 'admin' ? 'admin' : user.role === 'driver' ? 'driver' : 'passenger';
      Router.navigate(page);
    } catch (err) {
      Components.showToast('Quick login failed. Please seed the database first.', 'error');
    }
  }
};
