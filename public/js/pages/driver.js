// ==================== DRIVER DASHBOARD ====================
const DriverPage = {
  currentTab: 'dashboard',
  myTrips: [],
  activeTrip: null,
  locationWatchId: null,

  render() {
    const sidebarItems = [
      { id: 'dashboard', icon: '🏠', label: 'Dashboard', section: 'Navigation', page: 'driver' },
      { id: 'trip', icon: '🚌', label: 'Active Trip', section: 'Navigation', page: 'driver-trip' },
      { id: 'history', icon: '📜', label: 'Trip History', section: 'Navigation', page: 'driver-history' },
      { id: 'incidents', icon: '⚠️', label: 'Report Incident', section: 'Actions', page: 'driver-incident' },
      { id: 'profile', icon: '👤', label: 'Profile', section: 'More', page: 'driver-profile' }
    ];

    return `
      ${Components.renderNavbar()}
      <div class="dashboard">
        ${Components.renderSidebar(sidebarItems, this.currentTab)}
        <main class="main-content" id="driver-content">
          ${this.renderContent()}
        </main>
      </div>
    `;
  },

  renderContent() {
    switch (this.currentTab) {
      case 'dashboard': return this.renderDashboard();
      case 'trip': return this.renderActiveTrip();
      case 'history': return this.renderHistory();
      case 'incidents': return this.renderIncidentReport();
      case 'profile': return PassengerPage.renderProfile();
      default: return this.renderDashboard();
    }
  },

  renderDashboard() {
    return `
      <div class="page-header">
        <h1 class="page-title">Driver Dashboard</h1>
        <p class="page-subtitle">Manage your trips, update passenger counts, and share location.</p>
      </div>
      <div id="driver-dash-content">${Utils.loadingHTML('Loading your trips...')}</div>
    `;
  },

  renderActiveTrip() {
    if (!this.activeTrip) {
      return `
        <div class="page-header">
          <h1 class="page-title">Active Trip</h1>
        </div>
        ${Utils.emptyHTML('🚌', 'No Active Trip', 'You don\'t have an active trip right now. Start a scheduled trip from the dashboard.')}
      `;
    }

    const t = this.activeTrip;
    const crowd = t.crowd || { level: 'unknown', label: 'Unknown', color: '#999' };
    const pct = t.busCapacity > 0 ? Math.round((t.passengerCount / t.busCapacity) * 100) : 0;

    return `
      <div class="page-header">
        <h1 class="page-title">Active Trip — ${Utils.escapeHtml(t.busNumber || '')}</h1>
        <p class="page-subtitle">${Utils.escapeHtml(t.routeName || '')} · Started ${Utils.timeAgo(t.startedAt)}</p>
      </div>

      <div class="driver-panel">
        <div class="trip-status-card">
          <h3>TRIP STATUS</h3>
          <div class="trip-info-grid">
            <div class="trip-info-item">
              <div class="trip-info-label">Bus</div>
              <div class="trip-info-value">${Utils.escapeHtml(t.busNumber)}</div>
            </div>
            <div class="trip-info-item">
              <div class="trip-info-label">Route</div>
              <div class="trip-info-value">${Utils.escapeHtml(t.routeName)}</div>
            </div>
            <div class="trip-info-item">
              <div class="trip-info-label">Source</div>
              <div class="trip-info-value">${Utils.escapeHtml(t.routeSource || '')}</div>
            </div>
            <div class="trip-info-item">
              <div class="trip-info-label">Destination</div>
              <div class="trip-info-value">${Utils.escapeHtml(t.routeDestination || '')}</div>
            </div>
          </div>
        </div>

        <!-- Crowd Level -->
        <div class="card mb-4">
          <div class="card-header">
            <h3>👥 Passenger Count</h3>
            ${Utils.crowdBadge(crowd)}
          </div>
          <div class="card-body">
            <div class="passenger-counter">
              <button class="counter-btn" onclick="DriverPage.updateCount('decrement')">−</button>
              <div class="counter-value" id="passenger-count-display">${t.passengerCount || 0}</div>
              <button class="counter-btn" onclick="DriverPage.updateCount('increment')">+</button>
            </div>
            
            ${Utils.crowdBar(t.passengerCount || 0, t.busCapacity || 0)}
            
            <div class="flex justify-between mt-2 text-sm text-muted">
              <span>${t.passengerCount || 0} of ${t.busCapacity || 0} passengers</span>
              <span>${t.availableSeats || 0} seats available</span>
            </div>
            
            <div class="flex gap-2 mt-4">
              <div class="form-group" style="flex:1;margin:0">
                <input class="form-input" type="number" id="manual-count" placeholder="Manual count" min="0" max="${t.busCapacity || 100}">
              </div>
              <button class="btn btn-primary" onclick="DriverPage.setManualCount()">Set</button>
            </div>
            
            <button class="btn btn-danger btn-full mt-4" onclick="DriverPage.markFull()">
              🚫 Mark Bus as Full
            </button>
          </div>
        </div>

        <!-- Location Sharing -->
        <div class="card mb-4">
          <div class="card-header">
            <h3>📍 Location Sharing</h3>
            <div id="gps-status" class="text-sm text-muted">Not sharing</div>
          </div>
          <div class="card-body">
            <button class="btn btn-primary btn-full mb-4" id="share-location-btn" onclick="DriverPage.toggleLocationSharing()">
              📍 Start Sharing Location
            </button>
            <div id="last-location-info" class="text-sm text-muted">
              ${t.lastLocationUpdate ? `Last update: ${Utils.timeAgo(t.lastLocationUpdate)}` : 'No location shared yet'}
            </div>
            ${t.currentLocation ? `<div class="text-xs text-muted mt-2">Lat: ${t.currentLocation.lat?.toFixed(4)}, Lng: ${t.currentLocation.lng?.toFixed(4)}</div>` : ''}
            
            <div class="form-group mt-4" style="margin-bottom:0">
              <label class="form-label">Next Stop</label>
              <select class="form-select" id="next-stop-select" onchange="DriverPage.updateNextStop()">
                <option value="">Select next stop</option>
                ${(t.routeStops || []).map(s => `<option value="${s.name || s}" ${(s.name || s) === t.nextStop ? 'selected' : ''}>${s.name || s}</option>`).join('')}
              </select>
            </div>
          </div>
        </div>

        <!-- End Trip -->
        <button class="btn btn-danger btn-full btn-lg" onclick="DriverPage.endTrip()">
          🛑 End Trip
        </button>
      </div>
    `;
  },

  renderHistory() {
    return `
      <div class="page-header">
        <h1 class="page-title">Trip History</h1>
        <p class="page-subtitle">View your past and upcoming trips.</p>
      </div>
      <div id="trip-history">${Utils.loadingHTML('Loading trips...')}</div>
    `;
  },

  renderIncidentReport() {
    if (!this.activeTrip) {
      return `
        <div class="page-header">
          <h1 class="page-title">Report Incident</h1>
        </div>
        ${Utils.emptyHTML('⚠️', 'No Active Trip', 'Start a trip first to report incidents.')}
      `;
    }

    return `
      <div class="page-header">
        <h1 class="page-title">⚠️ Report Incident</h1>
        <p class="page-subtitle">Report delays, breakdowns, or emergencies for Bus ${Utils.escapeHtml(this.activeTrip.busNumber)}.</p>
      </div>
      <div class="card" style="max-width:600px">
        <div class="card-body">
          <form onsubmit="DriverPage.submitIncident(event)">
            <div class="form-group">
              <label class="form-label">Incident Type *</label>
              <select class="form-select" id="inc-type" required>
                <option value="">Select type</option>
                <option value="delay">Traffic Delay</option>
                <option value="breakdown">Breakdown</option>
                <option value="emergency">Emergency</option>
                <option value="diversion">Route Diversion</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Severity</label>
              <select class="form-select" id="inc-severity">
                <option value="low">Low</option>
                <option value="medium" selected>Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea class="form-textarea" id="inc-desc" placeholder="Describe the incident and its effect on the journey..."></textarea>
            </div>
            <button class="btn btn-warning btn-full" type="submit">⚠️ Submit Incident Report</button>
          </form>
        </div>
      </div>

      ${this.activeTrip.incidents?.length ? `
        <div class="card mt-4" style="max-width:600px">
          <div class="card-header"><h3>Recent Incidents</h3></div>
          <div class="card-body">
            ${this.activeTrip.incidents.map(i => `
              <div class="notification-item">
                <div class="notification-icon delay">⚠️</div>
                <div class="notification-content">
                  <div class="notification-title">${i.type?.charAt(0).toUpperCase() + i.type?.slice(1)} — ${i.severity}</div>
                  <div class="notification-message">${Utils.escapeHtml(i.description || 'No description')}</div>
                  <div class="notification-time">${Utils.timeAgo(i.createdAt)}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    `;
  },

  // ==================== ACTIONS ====================
  async loadDashboard() {
    try {
      this.myTrips = await API.getMyTrips();
      this.activeTrip = this.myTrips.find(t => t.status === 'active') || null;
      
      const content = document.getElementById('driver-dash-content');
      if (!content) return;

      const scheduled = this.myTrips.filter(t => t.status === 'scheduled');
      const active = this.myTrips.filter(t => t.status === 'active');
      const completed = this.myTrips.filter(t => t.status === 'completed');

      let html = `
        <div class="stat-grid mb-6">
          ${Components.renderStatCard('🚌', 'teal', active.length, 'Active Trips')}
          ${Components.renderStatCard('📅', 'blue', scheduled.length, 'Scheduled')}
          ${Components.renderStatCard('✅', 'green', completed.length, 'Completed')}
          ${Components.renderStatCard('👥', 'orange', this.activeTrip?.passengerCount || 0, 'Current Passengers')}
        </div>
      `;

      if (this.activeTrip) {
        const t = this.activeTrip;
        html += `
          <div class="card mb-4">
            <div class="card-header">
              <h3>🟢 Active Trip</h3>
              ${Utils.crowdBadge(t.crowd)}
            </div>
            <div class="card-body">
              <div class="grid-2">
                <div><strong>Bus:</strong> ${Utils.escapeHtml(t.busNumber)}</div>
                <div><strong>Route:</strong> ${Utils.escapeHtml(t.routeName)}</div>
                <div><strong>From:</strong> ${Utils.escapeHtml(t.routeSource || '')}</div>
                <div><strong>To:</strong> ${Utils.escapeHtml(t.routeDestination || '')}</div>
                <div><strong>Passengers:</strong> ${t.passengerCount}/${t.busCapacity}</div>
                <div><strong>Started:</strong> ${Utils.timeAgo(t.startedAt)}</div>
              </div>
              <div class="mt-4">
                <button class="btn btn-primary" onclick="DriverPage.currentTab='trip';Router.navigate('driver-trip')">
                  Manage Trip →
                </button>
              </div>
            </div>
          </div>
        `;
      }

      if (scheduled.length > 0) {
        html += `<h3 class="font-bold mb-4" style="font-size:16px;color:var(--navy-800)">📅 Scheduled Trips</h3>`;
        scheduled.forEach(t => {
          html += `
            <div class="card mb-4">
              <div class="card-body flex justify-between items-center">
                <div>
                  <strong>${Utils.escapeHtml(t.busNumber)}</strong> — ${Utils.escapeHtml(t.routeName)}<br>
                  <span class="text-sm text-muted">${Utils.escapeHtml(t.routeSource || '')} → ${Utils.escapeHtml(t.routeDestination || '')}</span><br>
                  <span class="text-xs text-muted">Scheduled: ${Utils.formatDate(t.scheduledStart)}</span>
                </div>
                <button class="btn btn-success" onclick="DriverPage.startTrip('${t.id}')">▶ Start Trip</button>
              </div>
            </div>
          `;
        });
      }

      if (completed.length > 0) {
        html += `<h3 class="font-bold mb-4 mt-6" style="font-size:16px;color:var(--navy-800)">✅ Recent Completed Trips</h3>`;
        completed.slice(0, 5).forEach(t => {
          html += `
            <div class="card mb-4" style="opacity:0.7">
              <div class="card-body">
                <strong>${Utils.escapeHtml(t.busNumber)}</strong> — ${Utils.escapeHtml(t.routeName)}<br>
                <span class="text-sm text-muted">Completed · ${t.passengerCount} passengers · ${Utils.formatDate(t.endedAt)}</span>
              </div>
            </div>
          `;
        });
      }

      if (this.myTrips.length === 0) {
        html = Utils.emptyHTML('🚌', 'No Trips Assigned', 'You don\'t have any trips assigned yet. Contact your administrator.');
      }

      content.innerHTML = html;
    } catch (err) {
      const content = document.getElementById('driver-dash-content');
      if (content) content.innerHTML = Utils.emptyHTML('❌', 'Failed to Load', err.message);
    }
  },

  async startTrip(tripId) {
    try {
      await API.startTrip(tripId);
      Components.showToast('Trip started successfully!', 'success');
      this.currentTab = 'trip';
      await this.loadDashboard();
      Router.navigate('driver-trip');
    } catch (err) {
      Components.showToast('Failed to start trip: ' + err.message, 'error');
    }
  },

  async endTrip() {
    if (!this.activeTrip) return;
    const ok = await Components.confirm('End Trip', 'Are you sure you want to end this trip? This action cannot be undone.');
    if (!ok) return;

    try {
      this.stopLocationSharing();
      await API.endTrip(this.activeTrip.id);
      Components.showToast('Trip ended successfully!', 'success');
      this.activeTrip = null;
      this.currentTab = 'dashboard';
      Router.navigate('driver');
    } catch (err) {
      Components.showToast('Failed to end trip: ' + err.message, 'error');
    }
  },

  async updateCount(action) {
    if (!this.activeTrip) return;
    try {
      const result = await API.updateOccupancy(this.activeTrip.id, { action });
      this.activeTrip.passengerCount = result.passengerCount;
      this.activeTrip.crowd = result.crowd;
      this.activeTrip.availableSeats = result.availableSeats;
      
      const display = document.getElementById('passenger-count-display');
      if (display) display.textContent = result.passengerCount;
      
      // Refresh the entire trip view for updated crowd bar
      const content = document.getElementById('driver-content');
      if (content) content.innerHTML = this.renderContent();
    } catch (err) {
      Components.showToast('Update failed: ' + err.message, 'error');
    }
  },

  async setManualCount() {
    if (!this.activeTrip) return;
    const input = document.getElementById('manual-count');
    const count = parseInt(input?.value);
    if (isNaN(count) || count < 0) return Components.showToast('Enter a valid count', 'warning');
    
    try {
      const result = await API.updateOccupancy(this.activeTrip.id, { passengerCount: count });
      this.activeTrip.passengerCount = result.passengerCount;
      this.activeTrip.crowd = result.crowd;
      this.activeTrip.availableSeats = result.availableSeats;
      Components.showToast(`Count updated to ${result.passengerCount}`, 'success');
      
      const content = document.getElementById('driver-content');
      if (content) content.innerHTML = this.renderContent();
    } catch (err) {
      Components.showToast('Update failed: ' + err.message, 'error');
    }
  },

  async markFull() {
    if (!this.activeTrip) return;
    try {
      const result = await API.markBusFull(this.activeTrip.id);
      this.activeTrip.passengerCount = result.passengerCount;
      Components.showToast('Bus marked as full', 'warning');
      
      const content = document.getElementById('driver-content');
      if (content) content.innerHTML = this.renderContent();
    } catch (err) {
      Components.showToast('Failed: ' + err.message, 'error');
    }
  },

  async toggleLocationSharing() {
    if (this.locationWatchId) {
      this.stopLocationSharing();
      return;
    }

    if (!navigator.geolocation) {
      Components.showToast('GPS is not supported by your browser', 'error');
      // Fall back to simulated location
      this.startSimulatedLocation();
      return;
    }

    const btn = document.getElementById('share-location-btn');
    const status = document.getElementById('gps-status');

    try {
      this.locationWatchId = navigator.geolocation.watchPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          try {
            await API.updateLocation(this.activeTrip.id, { latitude, longitude });
            if (status) status.innerHTML = '<span class="text-success">● Sharing live</span>';
            const info = document.getElementById('last-location-info');
            if (info) info.textContent = `Last update: just now (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
          } catch (err) {
            console.error('Location update failed:', err);
          }
        },
        (err) => {
          console.error('GPS error:', err);
          Components.showToast('GPS access denied. Using simulated location.', 'warning');
          this.startSimulatedLocation();
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
      );

      if (btn) btn.innerHTML = '🛑 Stop Sharing Location';
      if (status) status.innerHTML = '<span class="text-success">● Sharing live</span>';
    } catch (err) {
      this.startSimulatedLocation();
    }
  },

  startSimulatedLocation() {
    if (!this.activeTrip) return;
    const stops = this.activeTrip.routeStops || [];
    if (stops.length < 2) return;
    
    let stopIdx = 0;
    const btn = document.getElementById('share-location-btn');
    const status = document.getElementById('gps-status');
    
    if (btn) btn.innerHTML = '🛑 Stop Sharing (Simulated)';
    if (status) status.innerHTML = '<span class="text-warning">● Simulated GPS</span>';

    this.locationWatchId = setInterval(async () => {
      const from = stops[stopIdx];
      const to = stops[Math.min(stopIdx + 1, stops.length - 1)];
      
      // Interpolate position
      const progress = Math.random() * 0.5 + 0.25;
      const lat = from.lat + (to.lat - from.lat) * progress;
      const lng = from.lng + (to.lng - from.lng) * progress;
      
      try {
        await API.updateLocation(this.activeTrip.id, { latitude: lat, longitude: lng, nextStop: to.name });
        const info = document.getElementById('last-location-info');
        if (info) info.textContent = `Simulated: ${lat.toFixed(4)}, ${lng.toFixed(4)} — near ${to.name}`;
      } catch (err) {}
      
      stopIdx = (stopIdx + 1) % (stops.length - 1);
    }, 15000);
  },

  stopLocationSharing() {
    if (this.locationWatchId) {
      if (typeof this.locationWatchId === 'number' && navigator.geolocation) {
        navigator.geolocation.clearWatch(this.locationWatchId);
      }
      clearInterval(this.locationWatchId);
      this.locationWatchId = null;
    }
    const btn = document.getElementById('share-location-btn');
    const status = document.getElementById('gps-status');
    if (btn) btn.innerHTML = '📍 Start Sharing Location';
    if (status) status.innerHTML = 'Not sharing';
  },

  async updateNextStop() {
    if (!this.activeTrip) return;
    const stop = document.getElementById('next-stop-select')?.value;
    if (!stop) return;
    try {
      await API.updateLocation(this.activeTrip.id, {
        latitude: this.activeTrip.currentLocation?.lat || 19.076,
        longitude: this.activeTrip.currentLocation?.lng || 72.877,
        nextStop: stop
      });
      this.activeTrip.nextStop = stop;
      Components.showToast(`Next stop: ${stop}`, 'info');
    } catch (err) {}
  },

  async submitIncident(e) {
    e.preventDefault();
    if (!this.activeTrip) return;

    const type = document.getElementById('inc-type').value;
    const severity = document.getElementById('inc-severity').value;
    const description = document.getElementById('inc-desc').value.trim();

    if (!type) return Components.showToast('Select an incident type', 'warning');

    try {
      const incident = await API.reportIncident(this.activeTrip.id, { type, severity, description });
      this.activeTrip.incidents = this.activeTrip.incidents || [];
      this.activeTrip.incidents.push(incident);
      Components.showToast('Incident reported. Passengers will be notified.', 'success');
      
      document.getElementById('inc-type').value = '';
      document.getElementById('inc-desc').value = '';
      
      const content = document.getElementById('driver-content');
      if (content) content.innerHTML = this.renderContent();
    } catch (err) {
      Components.showToast('Report failed: ' + err.message, 'error');
    }
  },

  async loadHistory() {
    try {
      const trips = await API.getMyTrips();
      const historyDiv = document.getElementById('trip-history');
      if (!historyDiv) return;

      if (trips.length === 0) {
        historyDiv.innerHTML = Utils.emptyHTML('📜', 'No Trip History', 'Your completed trips will appear here.');
        return;
      }

      const html = `
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Bus</th>
                <th>Route</th>
                <th>Status</th>
                <th>Passengers</th>
                <th>Started</th>
                <th>Ended</th>
              </tr>
            </thead>
            <tbody>
              ${trips.map(t => `
                <tr>
                  <td><strong>${Utils.escapeHtml(t.busNumber)}</strong></td>
                  <td>${Utils.escapeHtml(t.routeName)}</td>
                  <td><span class="crowd-badge ${t.status === 'active' ? 'low' : t.status === 'scheduled' ? 'moderate' : 'unknown'}">${t.status}</span></td>
                  <td>${t.passengerCount}/${t.busCapacity}</td>
                  <td>${Utils.formatDateShort(t.startedAt)}</td>
                  <td>${Utils.formatDateShort(t.endedAt)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
      historyDiv.innerHTML = html;
    } catch (err) {
      const historyDiv = document.getElementById('trip-history');
      if (historyDiv) historyDiv.innerHTML = Utils.emptyHTML('❌', 'Failed to Load', err.message);
    }
  },

  async onMount() {
    if (this.currentTab === 'dashboard') {
      this.loadDashboard();
    } else if (this.currentTab === 'trip') {
      if (!this.activeTrip) {
        this.myTrips = await API.getMyTrips();
        this.activeTrip = this.myTrips.find(t => t.status === 'active') || null;
        const content = document.getElementById('driver-content');
        if (content) content.innerHTML = this.renderContent();
      }
    } else if (this.currentTab === 'history') {
      this.loadHistory();
    }
  }
};
