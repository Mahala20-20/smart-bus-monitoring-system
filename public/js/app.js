// ==================== APPLICATION ROOT ====================
const App = {
  sseSource: null,

  init() {
    // 1. Restore persistent user session if stored
    Store.restoreSession();

    // 2. Initialize client router
    Router.init();

    // 3. Connect to Server-Sent Events (SSE) for real-time crowd updates
    this.initSSE();

    // 4. Setup periodic notification checks
    this.setupPollers();

    // 5. Global click listener to close responsive mobile navigation
    document.addEventListener('click', (e) => {
      const nav = document.querySelector('.navbar-nav');
      const toggle = document.querySelector('.navbar-mobile-toggle');
      if (nav && toggle && !nav.contains(e.target) && !toggle.contains(e.target)) {
        nav.classList.remove('open');
      }
    });

    console.log('🚌 SmartBus Web Application initialized successfully.');
  },

  logout() {
    Store.logout();
    Components.showToast('You have been logged out successfully', 'info');
    Router.navigate('landing');
  },

  async toggleFavBus(busId) {
    if (!Store.isLoggedIn()) {
      Components.showToast('Please sign in to save favourites', 'warning');
      Router.navigate('login');
      return;
    }
    try {
      const res = await API.toggleFavBus(busId);
      Components.showToast(res.message || 'Favourites updated', 'success');

      // Refresh current page data if relevant
      if (Store.get('currentPage') === 'passenger') {
        if (PassengerPage.currentTab === 'favourites') {
          PassengerPage.loadFavourites();
        } else if (PassengerPage.currentTab === 'search') {
          PassengerPage.loadAllBuses();
        }
      }
    } catch (err) {
      Components.showToast(err.message || 'Failed to update favourite', 'error');
    }
  },

  async toggleFavRoute(routeId) {
    if (!Store.isLoggedIn()) {
      Components.showToast('Please sign in to save favourites', 'warning');
      Router.navigate('login');
      return;
    }
    try {
      const res = await API.toggleFavRoute(routeId);
      Components.showToast(res.message || 'Favourites updated', 'success');

      if (Store.get('currentPage') === 'passenger' && PassengerPage.currentTab === 'favourites') {
        PassengerPage.loadFavourites();
      }
    } catch (err) {
      Components.showToast(err.message || 'Failed to update favourite', 'error');
    }
  },

  initSSE() {
    try {
      if (typeof EventSource !== 'undefined') {
        this.sseSource = new EventSource('/api/sse');

        this.sseSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleRealtimeEvent(data);
          } catch (e) {
            // Ignore parse errors on heartbeat
          }
        };

        this.sseSource.onerror = () => {
          // Native EventSource auto-reconnects
        };
      }
    } catch (e) {
      console.warn('Real-time updates not supported:', e);
    }
  },

  handleRealtimeEvent(event) {
    if (!event) return;

    // Refresh passenger map markers if viewing live map
    if (Store.get('currentPage') === 'passenger' && PassengerPage.currentTab === 'map' && PassengerPage.map) {
      if (typeof PassengerPage.initMap === 'function') {
        PassengerPage.initMap();
      }
    }

    // Refresh driver active trip if driver is currently viewing active trip
    if (Store.get('currentPage') === 'driver' && DriverPage.currentTab === 'trip') {
      if (typeof DriverPage.loadActiveTrip === 'function') {
        DriverPage.loadActiveTrip();
      }
    }
  },

  setupPollers() {
    // Check notifications every minute for logged-in users
    setInterval(async () => {
      if (Store.isLoggedIn()) {
        try {
          const notes = await API.getNotifications();
          if (Array.isArray(notes)) {
            const unread = notes.filter(n => !n.read).length;
            Store.set('unreadCount', unread);
          }
        } catch (e) {
          // Silent polling failure
        }
      }
    }, 60000);
  }
};

// Initialize application when DOM content is loaded
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
