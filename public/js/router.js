// ==================== CLIENT ROUTER ====================
const Router = {
  currentRoute: '',

  init() {
    window.addEventListener('hashchange', () => {
      this.resolve();
    });

    // Handle initial route on load
    const initialHash = window.location.hash.slice(1);
    this.resolve(initialHash || 'landing');
  },

  navigate(path) {
    if (!path) path = 'landing';
    const cleanPath = path.replace(/^#\/?/, '');
    if (window.location.hash !== `#${cleanPath}`) {
      window.location.hash = `#${cleanPath}`;
    } else {
      this.resolve(cleanPath);
    }
  },

  resolve(overridePath) {
    const rawHash = overridePath !== undefined ? overridePath : window.location.hash.slice(1);
    const path = (rawHash || 'landing').replace(/^\/+/, '');
    this.currentRoute = path;

    const appEl = document.getElementById('app');
    if (!appEl) return;

    // Check authentication and authorization
    const isLoggedIn = Store.isLoggedIn();
    const role = Store.getRole();

    const isPassengerRoute = [
      'passenger', 'search', 'map', 'favourites', 'notifications', 'feedback', 'profile'
    ].includes(path);

    const isDriverRoute = path.startsWith('driver');
    const isAdminRoute = path.startsWith('admin');

    // Redirect to login if unauthenticated on protected routes
    if (!isLoggedIn && (isPassengerRoute || isDriverRoute || isAdminRoute)) {
      Components.showToast('Please sign in to access this page', 'warning');
      this.navigate('login');
      return;
    }

    // Role-based restrictions
    if (isLoggedIn) {
      if (isAdminRoute && role !== 'admin') {
        Components.showToast('Access denied: Admin role required', 'error');
        this.navigate(role === 'driver' ? 'driver' : 'passenger');
        return;
      }
      if (isDriverRoute && role !== 'driver' && role !== 'admin') {
        Components.showToast('Access denied: Driver role required', 'error');
        this.navigate('passenger');
        return;
      }
    }

    // Close any open modals when navigating
    Components.closeModal();

    // Route: Landing
    if (path === 'landing' || path === '') {
      Store.set('currentPage', 'landing');
      appEl.innerHTML = LandingPage.render();
      window.scrollTo(0, 0);
      return;
    }

    // Route: Login
    if (path === 'login') {
      Store.set('currentPage', 'login');
      appEl.innerHTML = AuthPage.renderLogin();
      window.scrollTo(0, 0);
      return;
    }

    // Route: Register
    if (path === 'register') {
      Store.set('currentPage', 'register');
      appEl.innerHTML = AuthPage.renderRegister();
      window.scrollTo(0, 0);
      return;
    }

    // Route: Passenger Dashboard & Tabs
    if (isPassengerRoute) {
      Store.set('currentPage', 'passenger');
      const tabMap = {
        'passenger': 'search',
        'search': 'search',
        'map': 'map',
        'favourites': 'favourites',
        'notifications': 'notifications',
        'feedback': 'feedback',
        'profile': 'profile'
      };
      PassengerPage.currentTab = tabMap[path] || 'search';
      appEl.innerHTML = PassengerPage.render();
      window.scrollTo(0, 0);
      if (typeof PassengerPage.onMount === 'function') {
        PassengerPage.onMount();
      }
      return;
    }

    // Route: Driver Dashboard & Tabs
    if (isDriverRoute) {
      Store.set('currentPage', 'driver');
      const tabMap = {
        'driver': 'dashboard',
        'driver-trip': 'trip',
        'driver-history': 'history',
        'driver-incident': 'incidents',
        'driver-profile': 'profile'
      };
      DriverPage.currentTab = tabMap[path] || 'dashboard';
      appEl.innerHTML = DriverPage.render();
      window.scrollTo(0, 0);
      if (typeof DriverPage.onMount === 'function') {
        DriverPage.onMount();
      }
      return;
    }

    // Route: Admin Dashboard & Tabs
    if (isAdminRoute) {
      Store.set('currentPage', 'admin');
      const tabMap = {
        'admin': 'overview',
        'admin-analytics': 'analytics',
        'admin-buses': 'buses',
        'admin-routes': 'routes',
        'admin-drivers': 'drivers',
        'admin-trips': 'trips',
        'admin-incidents': 'incidents',
        'admin-feedback': 'feedback',
        'admin-announce': 'notifications',
        'admin-reports': 'reports',
        'admin-users': 'users'
      };
      AdminPage.currentTab = tabMap[path] || 'overview';
      appEl.innerHTML = AdminPage.render();
      window.scrollTo(0, 0);
      if (typeof AdminPage.onMount === 'function') {
        AdminPage.onMount();
      }
      return;
    }

    // Unknown route fallback
    Store.set('currentPage', 'landing');
    appEl.innerHTML = LandingPage.render();
    window.scrollTo(0, 0);
  }
};
