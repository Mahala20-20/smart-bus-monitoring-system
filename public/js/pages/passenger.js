// ==================== PASSENGER DASHBOARD ====================
const PassengerPage = {
  currentTab: 'search',
  searchResults: [],
  favourites: { buses: [], routes: [] },
  notifications: [],
  map: null,
  busMarkers: {},

  render() {
    const sidebarItems = [
      { id: 'search', icon: '🔍', label: 'Search Buses', section: 'Navigation', page: 'passenger' },
      { id: 'map', icon: '🗺️', label: 'Live Map', section: 'Navigation', page: 'map' },
      { id: 'favourites', icon: '⭐', label: 'Favourites', section: 'Navigation', page: 'favourites' },
      { id: 'notifications', icon: '🔔', label: 'Notifications', section: 'Navigation', page: 'notifications' },
      { id: 'feedback', icon: '📝', label: 'Feedback', section: 'More', page: 'feedback' },
      { id: 'profile', icon: '👤', label: 'Profile', section: 'More', page: 'profile' }
    ];

    return `
      ${Components.renderNavbar()}
      <div class="dashboard">
        ${Components.renderSidebar(sidebarItems, this.currentTab)}
        <main class="main-content" id="passenger-content">
          ${this.renderContent()}
        </main>
      </div>
    `;
  },

  renderContent() {
    switch (this.currentTab) {
      case 'search': return this.renderSearch();
      case 'map': return this.renderMap();
      case 'favourites': return this.renderFavourites();
      case 'notifications': return this.renderNotifications();
      case 'feedback': return this.renderFeedback();
      case 'profile': return this.renderProfile();
      default: return this.renderSearch();
    }
  },

  renderSearch() {
    return `
      <div class="page-header">
        <h1 class="page-title">Find Your Bus</h1>
        <p class="page-subtitle">Search by source and destination to find available buses sorted by crowd level.</p>
      </div>
      
      <div class="search-bar" style="max-width:100%;margin-bottom:32px">
        <div class="search-field">
          <span class="icon">📍</span>
          <input type="text" id="search-source" placeholder="Starting point (e.g., Andheri)" value="">
        </div>
        <button class="search-swap" onclick="PassengerPage.swapSearch()" title="Swap">⇅</button>
        <div class="search-field">
          <span class="icon">🎯</span>
          <input type="text" id="search-dest" placeholder="Destination (e.g., CST Mumbai)" value="">
        </div>
        <button class="btn-search" onclick="PassengerPage.doSearch()">
          🔍 Search Buses
        </button>
      </div>

      <div id="search-results">
        ${this.searchResults.length > 0 ? this.renderSearchResults() : this.renderRecentAndAll()}
      </div>
    `;
  },

  renderRecentAndAll() {
    return `
      <div id="all-buses-section">
        <h3 class="font-bold mb-4" style="color:var(--navy-800);font-size:18px">🚌 All Active Buses</h3>
        <div id="all-buses-list">${Utils.loadingHTML('Loading active buses...')}</div>
      </div>
    `;
  },

  renderSearchResults() {
    if (this.searchResults.length === 0) {
      return Utils.emptyHTML('🔍', 'No Buses Found', 'No buses match your search criteria. Try different stops.');
    }

    return `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-bold" style="color:var(--navy-800);font-size:18px">
          Found ${this.searchResults.length} bus${this.searchResults.length > 1 ? 'es' : ''} 
          <span class="text-muted text-sm font-semibold">(sorted by crowd level)</span>
        </h3>
        <button class="btn btn-ghost btn-sm" onclick="PassengerPage.clearSearch()">Clear Search</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:20px">
        ${this.searchResults.map(bus => Components.renderBusCard(bus, { showFav: true, showRoute: true, favourites: this.favourites.buses?.map(b => b.id) })).join('')}
      </div>
    `;
  },

  renderMap() {
    return `
      <div class="page-header">
        <h1 class="page-title">Live Bus Map</h1>
        <p class="page-subtitle">Track active buses on the map. Positions are simulated for demonstration.</p>
      </div>
      <div class="map-container" id="passenger-map-container">
        <div id="passenger-map" style="height:100%;width:100%"></div>
        <div class="map-sim-badge">⚠ SIMULATED POSITIONS</div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;margin-top:24px" id="map-bus-cards"></div>
    `;
  },

  renderFavourites() {
    return `
      <div class="page-header">
        <h1 class="page-title">⭐ Favourites</h1>
        <p class="page-subtitle">Your saved buses and routes for quick access.</p>
      </div>
      <div id="fav-content">${Utils.loadingHTML('Loading favourites...')}</div>
    `;
  },

  renderNotifications() {
    return `
      <div class="page-header">
        <h1 class="page-title">🔔 Notifications</h1>
        <p class="page-subtitle">Stay updated on bus delays, crowd changes, and service announcements.</p>
      </div>
      <div id="notif-list">${Utils.loadingHTML('Loading notifications...')}</div>
    `;
  },

  renderFeedback() {
    return `
      <div class="page-header">
        <h1 class="page-title">📝 Submit Feedback</h1>
        <p class="page-subtitle">Help us improve by sharing your experience or reporting issues.</p>
      </div>
      <div class="card" style="max-width:600px">
        <div class="card-body">
          <form onsubmit="PassengerPage.submitFeedback(event)">
            <div class="form-group">
              <label class="form-label">Feedback Type</label>
              <select class="form-select" id="fb-type">
                <option value="general">General Feedback</option>
                <option value="suggestion">Suggestion</option>
                <option value="complaint">Complaint</option>
                <option value="report">Report Incorrect Info</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Bus Number (Optional)</label>
              <input class="form-input" id="fb-bus" placeholder="e.g., MH-101">
            </div>
            <div class="form-group">
              <label class="form-label">Rating</label>
              <select class="form-select" id="fb-rating">
                <option value="">Select rating</option>
                <option value="5">⭐⭐⭐⭐⭐ Excellent</option>
                <option value="4">⭐⭐⭐⭐ Good</option>
                <option value="3">⭐⭐⭐ Average</option>
                <option value="2">⭐⭐ Poor</option>
                <option value="1">⭐ Very Poor</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Your Message *</label>
              <textarea class="form-textarea" id="fb-message" placeholder="Describe your experience or report an issue..." required></textarea>
            </div>
            <button class="btn btn-primary btn-full" type="submit">Submit Feedback</button>
          </form>
        </div>
      </div>
    `;
  },

  renderProfile() {
    const user = Store.get('user');
    return `
      <div class="page-header">
        <h1 class="page-title">👤 My Profile</h1>
        <p class="page-subtitle">Manage your account settings.</p>
      </div>
      <div class="card" style="max-width:600px">
        <div class="card-body">
          <form onsubmit="PassengerPage.updateProfile(event)">
            <div class="form-group">
              <label class="form-label">Full Name</label>
              <input class="form-input" id="prof-name" value="${Utils.escapeHtml(user?.name || '')}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Email (cannot be changed)</label>
              <input class="form-input" value="${Utils.escapeHtml(user?.email || '')}" disabled>
            </div>
            <div class="form-group">
              <label class="form-label">Phone</label>
              <input class="form-input" id="prof-phone" value="${Utils.escapeHtml(user?.phone || '')}">
            </div>
            <div class="divider"></div>
            <h3 class="font-bold mb-4" style="font-size:16px;color:var(--navy-800)">Change Password</h3>
            <div class="form-group">
              <label class="form-label">Current Password</label>
              <input class="form-input" type="password" id="prof-curpass" placeholder="Enter current password">
            </div>
            <div class="form-group">
              <label class="form-label">New Password</label>
              <input class="form-input" type="password" id="prof-newpass" placeholder="Enter new password" minlength="6">
            </div>
            <button class="btn btn-primary btn-full" type="submit">Save Changes</button>
          </form>
        </div>
      </div>
    `;
  },

  // ==================== ACTIONS ====================
  swapSearch() {
    const src = document.getElementById('search-source');
    const dest = document.getElementById('search-dest');
    if (src && dest) {
      const tmp = src.value;
      src.value = dest.value;
      dest.value = tmp;
    }
  },

  async doSearch() {
    const source = document.getElementById('search-source')?.value.trim();
    const dest = document.getElementById('search-dest')?.value.trim();
    if (!source && !dest) return Components.showToast('Enter a source or destination', 'warning');

    const resultsDiv = document.getElementById('search-results');
    if (resultsDiv) resultsDiv.innerHTML = Utils.loadingHTML('Searching buses...');

    try {
      const data = await API.searchBuses(source, dest);
      this.searchResults = data.results || [];
      if (resultsDiv) resultsDiv.innerHTML = this.renderSearchResults();
      if (this.searchResults.length === 0) {
        Components.showToast('No buses found for this route', 'info');
      }
    } catch (err) {
      Components.showToast('Search failed: ' + err.message, 'error');
      if (resultsDiv) resultsDiv.innerHTML = Utils.emptyHTML('❌', 'Search Failed', err.message);
    }
  },

  clearSearch() {
    this.searchResults = [];
    const src = document.getElementById('search-source');
    const dest = document.getElementById('search-dest');
    if (src) src.value = '';
    if (dest) dest.value = '';
    const resultsDiv = document.getElementById('search-results');
    if (resultsDiv) resultsDiv.innerHTML = this.renderRecentAndAll();
    this.loadAllBuses();
  },

  async loadAllBuses() {
    try {
      const buses = await API.getBuses();
      const list = document.getElementById('all-buses-list');
      if (!list) return;

      const active = buses.filter(b => b.activeTrip);
      if (active.length === 0) {
        list.innerHTML = Utils.emptyHTML('🚌', 'No Active Buses', 'No buses are currently running. Check back later.');
        return;
      }

      // Enrich with trip data
      const trips = await API.getTrips('active');
      const enriched = trips.map(t => ({
        ...t,
        busId: t.busId,
        busNumber: t.busNumber,
        busType: t.busType || '',
        routeName: t.routeName,
        source: t.routeSource,
        destination: t.routeDestination,
        stops: t.routeStops,
        passengerCount: t.passengerCount,
        capacity: t.busCapacity,
        availableSeats: t.availableSeats,
        crowd: t.crowd,
        currentLocation: t.currentLocation,
        lastLocationUpdate: t.lastLocationUpdate,
        nextStop: t.nextStop,
        delay: t.delay,
        tripStatus: t.status
      }));

      list.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:20px">
          ${enriched.map(bus => Components.renderBusCard(bus, { showFav: true, showRoute: false })).join('')}
        </div>
      `;
    } catch (err) {
      const list = document.getElementById('all-buses-list');
      if (list) list.innerHTML = Utils.emptyHTML('❌', 'Failed to Load', err.message);
    }
  },

  async initMap() {
    await new Promise(r => setTimeout(r, 100));
    const mapEl = document.getElementById('passenger-map');
    if (!mapEl) return;

    if (this.map) { this.map.remove(); this.map = null; }
    this.busMarkers = {};

    this.map = L.map('passenger-map').setView([19.076, 72.8777], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.updateMapBuses();
  },

  async updateMapBuses() {
    try {
      const trips = await API.getTrips('active');
      const cardsDiv = document.getElementById('map-bus-cards');

      trips.forEach(trip => {
        if (!trip.currentLocation) return;
        const { lat, lng } = trip.currentLocation;
        const crowd = trip.crowd || { level: 'unknown' };

        const busIcon = L.divIcon({
          className: `bus-marker-icon ${crowd.level}`,
          html: '🚌',
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        });

        if (this.busMarkers[trip.id]) {
          this.busMarkers[trip.id].setLatLng([lat, lng]);
        } else if (this.map) {
          this.busMarkers[trip.id] = L.marker([lat, lng], { icon: busIcon })
            .addTo(this.map)
            .bindPopup(`
              <strong>${trip.busNumber}</strong><br>
              ${trip.routeName}<br>
              ${Utils.crowdBadge(crowd)}<br>
              Passengers: ${trip.passengerCount}/${trip.busCapacity}<br>
              ${trip.nextStop ? `Next: ${trip.nextStop}<br>` : ''}
              Updated: ${Utils.timeAgo(trip.lastLocationUpdate)}
            `);
        }

        // Route line - add stop markers
        if (trip.routeStops?.length && this.map) {
          trip.routeStops.forEach(stop => {
            if (stop.lat && stop.lng) {
              const stopIcon = L.divIcon({ className: 'stop-marker-icon', iconSize: [12, 12], iconAnchor: [6, 6] });
              L.marker([stop.lat, stop.lng], { icon: stopIcon })
                .addTo(this.map)
                .bindPopup(`<strong>${stop.name}</strong>`);
            }
          });
        }
      });

      if (cardsDiv) {
        cardsDiv.innerHTML = trips.filter(t => t.currentLocation).map(t => Components.renderBusCard({
          busId: t.busId,
          busNumber: t.busNumber,
          routeName: t.routeName,
          source: t.routeSource,
          destination: t.routeDestination,
          passengerCount: t.passengerCount,
          capacity: t.busCapacity,
          availableSeats: t.availableSeats,
          crowd: t.crowd,
          nextStop: t.nextStop,
          delay: t.delay,
          lastLocationUpdate: t.lastLocationUpdate,
          tripStatus: t.status
        }, { showFav: true })).join('');
      }
    } catch (err) {
      console.error('Map update failed:', err);
    }
  },

  async loadFavourites() {
    try {
      const data = await API.getFavourites();
      this.favourites = data;
      const content = document.getElementById('fav-content');
      if (!content) return;

      let html = '';

      // Recent searches
      if (data.recentSearches?.length) {
        html += `<h3 class="font-bold mb-4" style="font-size:16px;color:var(--navy-800)">🕐 Recent Searches</h3>`;
        html += `<div class="flex gap-2 mb-6" style="flex-wrap:wrap">`;
        data.recentSearches.forEach(s => {
          html += `<button class="btn btn-secondary btn-sm" onclick="document.getElementById('search-source').value='${s.source||''}';document.getElementById('search-dest').value='${s.destination||''}';PassengerPage.currentTab='search';Router.navigate('passenger')">
            ${Utils.escapeHtml(s.source || '?')} → ${Utils.escapeHtml(s.destination || '?')}
          </button>`;
        });
        html += `</div>`;
      }

      // Favourite Routes
      if (data.routes?.length) {
        html += `<h3 class="font-bold mb-4" style="font-size:16px;color:var(--navy-800)">⭐ Favourite Routes</h3>`;
        html += `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;margin-bottom:24px">`;
        data.routes.forEach(route => {
          html += `
            <div class="card">
              <div class="card-body">
                <div class="flex justify-between items-center mb-2">
                  <strong>${Utils.escapeHtml(route.name)}</strong>
                  <button class="fav-btn active" onclick="App.toggleFavRoute('${route.id}')">★</button>
                </div>
                <div class="text-sm text-muted">📍 ${Utils.escapeHtml(route.source)} → ${Utils.escapeHtml(route.destination)}</div>
                <div class="text-xs text-muted mt-2">${route.stops?.length || 0} stops · ${route.distance || 'N/A'} · ${route.estimatedTime || 'N/A'}</div>
              </div>
            </div>
          `;
        });
        html += `</div>`;
      }

      // Favourite Buses
      if (data.buses?.length) {
        html += `<h3 class="font-bold mb-4" style="font-size:16px;color:var(--navy-800)">⭐ Favourite Buses</h3>`;
        data.buses.forEach(bus => {
          html += `
            <div class="card mb-4">
              <div class="card-body">
                <div class="flex justify-between items-center">
                  <div>
                    <strong style="font-size:18px">${Utils.escapeHtml(bus.busNumber)}</strong>
                    <span class="bus-type" style="margin-left:8px">${bus.type}</span>
                  </div>
                  <button class="fav-btn active" onclick="App.toggleFavBus('${bus.id}')">★</button>
                </div>
                <div class="text-sm text-muted mt-2">Capacity: ${bus.capacity} · Status: ${bus.status}</div>
              </div>
            </div>
          `;
        });
      }

      if (!data.routes?.length && !data.buses?.length && !data.recentSearches?.length) {
        html = Utils.emptyHTML('⭐', 'No Favourites Yet', 'Star a bus or route to save it here for quick access.');
      }

      content.innerHTML = html;
    } catch (err) {
      const content = document.getElementById('fav-content');
      if (content) content.innerHTML = Utils.emptyHTML('❌', 'Failed to Load', err.message);
    }
  },

  async loadNotifications() {
    try {
      const notifications = await API.getNotifications();
      const list = document.getElementById('notif-list');
      if (!list) return;

      if (notifications.length === 0) {
        list.innerHTML = Utils.emptyHTML('🔔', 'No Notifications', 'You\'re all caught up! Notifications about delays, crowd changes, and announcements will appear here.');
        return;
      }

      list.innerHTML = `
        <div class="card">
          ${notifications.map(n => {
            const iconClass = n.type?.includes('delay') ? 'delay' : n.type?.includes('crowd') || n.type?.includes('full') ? 'crowd' : n.type === 'announcement' ? 'announce' : n.type?.includes('breakdown') ? 'danger' : 'info';
            const iconEmoji = n.type?.includes('delay') ? '⏰' : n.type?.includes('crowd') || n.type?.includes('full') ? '👥' : n.type === 'announcement' ? '📢' : n.type?.includes('breakdown') ? '🔧' : '🔔';
            return `
              <div class="notification-item ${!n.read ? 'unread' : ''}" onclick="PassengerPage.markNotifRead('${n.id}', this)">
                <div class="notification-icon ${iconClass}">${iconEmoji}</div>
                <div class="notification-content">
                  <div class="notification-title">${Utils.escapeHtml(n.title)}</div>
                  <div class="notification-message">${Utils.escapeHtml(n.message)}</div>
                  <div class="notification-time">${Utils.timeAgo(n.createdAt)}</div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    } catch (err) {
      const list = document.getElementById('notif-list');
      if (list) list.innerHTML = Utils.emptyHTML('❌', 'Failed to Load', err.message);
    }
  },

  async markNotifRead(id, el) {
    try {
      await API.markNotificationRead(id);
      if (el) el.classList.remove('unread');
    } catch (err) {}
  },

  async submitFeedback(e) {
    e.preventDefault();
    const type = document.getElementById('fb-type').value;
    const message = document.getElementById('fb-message').value.trim();
    const rating = document.getElementById('fb-rating').value;

    if (!message) return Components.showToast('Please enter your feedback', 'warning');

    try {
      await API.submitFeedback({ type, message, rating: rating ? parseInt(rating) : null });
      Components.showToast('Feedback submitted successfully! Thank you.', 'success');
      document.getElementById('fb-message').value = '';
      document.getElementById('fb-rating').value = '';
    } catch (err) {
      Components.showToast('Failed to submit feedback: ' + err.message, 'error');
    }
  },

  async updateProfile(e) {
    e.preventDefault();
    const name = document.getElementById('prof-name').value.trim();
    const phone = document.getElementById('prof-phone').value.trim();
    const currentPassword = document.getElementById('prof-curpass').value;
    const newPassword = document.getElementById('prof-newpass').value;

    try {
      const data = { name, phone };
      if (newPassword) {
        data.currentPassword = currentPassword;
        data.newPassword = newPassword;
      }
      const updated = await API.updateProfile(data);
      Store.set('user', updated);
      localStorage.setItem('smartbus_user', JSON.stringify(updated));
      Components.showToast('Profile updated!', 'success');
    } catch (err) {
      Components.showToast('Update failed: ' + err.message, 'error');
    }
  },

  // Called after page render
  async onMount() {
    if (this.currentTab === 'search') {
      this.loadAllBuses();
    } else if (this.currentTab === 'map') {
      this.initMap();
    } else if (this.currentTab === 'favourites') {
      this.loadFavourites();
    } else if (this.currentTab === 'notifications') {
      this.loadNotifications();
    }
  }
};
