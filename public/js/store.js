// ==================== STATE MANAGEMENT ====================
const Store = {
  _state: {
    user: null,
    token: null,
    currentPage: 'landing',
    sidebarOpen: false,
    navOpen: false,
    notifications: [],
    unreadCount: 0
  },
  _listeners: [],

  get(key) {
    return this._state[key];
  },

  set(key, value) {
    this._state[key] = value;
    this._notify();
  },

  getState() {
    return { ...this._state };
  },

  subscribe(fn) {
    this._listeners.push(fn);
    return () => {
      this._listeners = this._listeners.filter(l => l !== fn);
    };
  },

  _notify() {
    this._listeners.forEach(fn => fn(this._state));
  },

  // Auth helpers
  isLoggedIn() {
    return !!this._state.token;
  },

  getRole() {
    return this._state.user?.role || null;
  },

  login(token, user) {
    localStorage.setItem('smartbus_token', token);
    localStorage.setItem('smartbus_user', JSON.stringify(user));
    this._state.token = token;
    this._state.user = user;
    this._notify();
  },

  logout() {
    localStorage.removeItem('smartbus_token');
    localStorage.removeItem('smartbus_user');
    this._state.token = null;
    this._state.user = null;
    this._state.currentPage = 'landing';
    this._notify();
  },

  restoreSession() {
    const token = localStorage.getItem('smartbus_token');
    const user = localStorage.getItem('smartbus_user');
    if (token && user) {
      try {
        this._state.token = token;
        this._state.user = JSON.parse(user);
        return true;
      } catch (e) {
        this.logout();
      }
    }
    return false;
  }
};
