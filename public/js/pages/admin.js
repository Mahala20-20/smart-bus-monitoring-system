// ==================== ADMIN DASHBOARD ====================
const AdminPage = {
  currentTab: 'overview',
  charts: {},

  render() {
    const sidebarItems = [
      { id: 'overview', icon: '📊', label: 'Overview', section: 'Dashboard', page: 'admin' },
      { id: 'analytics', icon: '📈', label: 'Analytics', section: 'Dashboard', page: 'admin-analytics' },
      { id: 'buses', icon: '🚌', label: 'Manage Buses', section: 'Management', page: 'admin-buses' },
      { id: 'routes', icon: '🗺️', label: 'Manage Routes', section: 'Management', page: 'admin-routes' },
      { id: 'drivers', icon: '👤', label: 'Manage Drivers', section: 'Management', page: 'admin-drivers' },
      { id: 'trips', icon: '🎫', label: 'Manage Trips', section: 'Management', page: 'admin-trips' },
      { id: 'incidents', icon: '⚠️', label: 'Incidents', section: 'Operations', page: 'admin-incidents' },
      { id: 'feedback', icon: '📝', label: 'Feedback', section: 'Operations', page: 'admin-feedback' },
      { id: 'notifications', icon: '📢', label: 'Announcements', section: 'Operations', page: 'admin-announce' },
      { id: 'reports', icon: '📋', label: 'Reports', section: 'Operations', page: 'admin-reports' },
      { id: 'users', icon: '👥', label: 'Users', section: 'System', page: 'admin-users' }
    ];

    return `
      ${Components.renderNavbar()}
      <div class="dashboard">
        ${Components.renderSidebar(sidebarItems, this.currentTab)}
        <main class="main-content" id="admin-content">
          ${this.renderContent()}
        </main>
      </div>
    `;
  },

  renderContent() {
    switch (this.currentTab) {
      case 'overview': return this.renderOverview();
      case 'analytics': return this.renderAnalytics();
      case 'buses': return this.renderBuses();
      case 'routes': return this.renderRoutes();
      case 'drivers': return this.renderDrivers();
      case 'trips': return this.renderTrips();
      case 'incidents': return this.renderIncidents();
      case 'feedback': return this.renderFeedback();
      case 'notifications': return this.renderAnnouncements();
      case 'reports': return this.renderReports();
      case 'users': return this.renderUsers();
      default: return this.renderOverview();
    }
  },

  renderOverview() {
    return `
      <div class="page-header">
        <h1 class="page-title">Admin Dashboard</h1>
        <p class="page-subtitle">Monitor and manage the complete transport system.</p>
      </div>
      <div id="admin-overview">${Utils.loadingHTML('Loading dashboard...')}</div>
    `;
  },

  renderAnalytics() {
    return `
      <div class="page-header">
        <h1 class="page-title">📈 Analytics</h1>
        <p class="page-subtitle">Detailed analytics on routes, occupancy, and system performance.</p>
      </div>
      <div id="analytics-content">${Utils.loadingHTML('Loading analytics...')}</div>
    `;
  },

  renderBuses() {
    return `
      <div class="page-header flex justify-between items-center">
        <div>
          <h1 class="page-title">🚌 Manage Buses</h1>
          <p class="page-subtitle">Add, edit, and manage bus records.</p>
        </div>
        <button class="btn btn-primary" onclick="AdminPage.showBusForm()">+ Add Bus</button>
      </div>
      <div id="buses-list">${Utils.loadingHTML('Loading buses...')}</div>
    `;
  },

  renderRoutes() {
    return `
      <div class="page-header flex justify-between items-center">
        <div>
          <h1 class="page-title">🗺️ Manage Routes</h1>
          <p class="page-subtitle">Create and manage routes with stops.</p>
        </div>
        <button class="btn btn-primary" onclick="AdminPage.showRouteForm()">+ Add Route</button>
      </div>
      <div id="routes-list">${Utils.loadingHTML('Loading routes...')}</div>
    `;
  },

  renderDrivers() {
    return `
      <div class="page-header flex justify-between items-center">
        <div>
          <h1 class="page-title">👤 Manage Drivers</h1>
          <p class="page-subtitle">Register and manage drivers/conductors.</p>
        </div>
        <button class="btn btn-primary" onclick="AdminPage.showDriverForm()">+ Add Driver</button>
      </div>
      <div id="drivers-list">${Utils.loadingHTML('Loading drivers...')}</div>
    `;
  },

  renderTrips() {
    return `
      <div class="page-header flex justify-between items-center">
        <div>
          <h1 class="page-title">🎫 Manage Trips</h1>
          <p class="page-subtitle">Assign buses, routes, and drivers to trips.</p>
        </div>
        <button class="btn btn-primary" onclick="AdminPage.showTripForm()">+ Create Trip</button>
      </div>
      <div class="tabs" id="trip-tabs">
        <button class="tab active" onclick="AdminPage.filterTrips('all',this)">All</button>
        <button class="tab" onclick="AdminPage.filterTrips('active',this)">Active</button>
        <button class="tab" onclick="AdminPage.filterTrips('scheduled',this)">Scheduled</button>
        <button class="tab" onclick="AdminPage.filterTrips('completed',this)">Completed</button>
      </div>
      <div id="trips-list">${Utils.loadingHTML('Loading trips...')}</div>
    `;
  },

  renderIncidents() {
    return `
      <div class="page-header">
        <h1 class="page-title">⚠️ Incidents</h1>
        <p class="page-subtitle">Review and manage incident reports.</p>
      </div>
      <div id="incidents-list">${Utils.loadingHTML('Loading incidents...')}</div>
    `;
  },

  renderFeedback() {
    return `
      <div class="page-header">
        <h1 class="page-title">📝 Passenger Feedback</h1>
        <p class="page-subtitle">Review and respond to passenger feedback.</p>
      </div>
      <div id="feedback-list">${Utils.loadingHTML('Loading feedback...')}</div>
    `;
  },

  renderAnnouncements() {
    return `
      <div class="page-header">
        <h1 class="page-title">📢 Service Announcements</h1>
        <p class="page-subtitle">Send announcements to passengers and drivers.</p>
      </div>
      <div class="card" style="max-width:600px">
        <div class="card-body">
          <form onsubmit="AdminPage.sendAnnouncement(event)">
            <div class="form-group">
              <label class="form-label">Title *</label>
              <input class="form-input" id="ann-title" placeholder="Announcement title" required>
            </div>
            <div class="form-group">
              <label class="form-label">Message *</label>
              <textarea class="form-textarea" id="ann-message" placeholder="Write your announcement..." required></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Target Audience</label>
              <select class="form-select" id="ann-target">
                <option value="all">All Users</option>
                <option value="passenger">Passengers Only</option>
                <option value="driver">Drivers Only</option>
              </select>
            </div>
            <button class="btn btn-primary btn-full" type="submit">📢 Send Announcement</button>
          </form>
        </div>
      </div>
    `;
  },

  renderReports() {
    return `
      <div class="page-header">
        <h1 class="page-title">📋 Reports</h1>
        <p class="page-subtitle">Generate and export reports for analysis.</p>
      </div>
      <div class="card mb-4" style="max-width:700px">
        <div class="card-body">
          <div class="flex gap-4 items-center" style="flex-wrap:wrap">
            <div class="form-group" style="margin:0;flex:1;min-width:140px">
              <label class="form-label">Start Date</label>
              <input class="form-input" type="date" id="report-start">
            </div>
            <div class="form-group" style="margin:0;flex:1;min-width:140px">
              <label class="form-label">End Date</label>
              <input class="form-input" type="date" id="report-end">
            </div>
            <div class="form-group" style="margin:0;flex:1;min-width:140px">
              <label class="form-label">Route</label>
              <select class="form-select" id="report-route">
                <option value="">All Routes</option>
              </select>
            </div>
            <div class="flex gap-2" style="align-self:flex-end">
              <button class="btn btn-primary" onclick="AdminPage.generateReport()">Generate</button>
              <button class="btn btn-secondary" onclick="AdminPage.exportReport()">📥 Export CSV</button>
            </div>
          </div>
        </div>
      </div>
      <div id="report-content"></div>
    `;
  },

  renderUsers() {
    return `
      <div class="page-header">
        <h1 class="page-title">👥 Registered Users</h1>
        <p class="page-subtitle">View all registered users in the system.</p>
      </div>
      <div id="users-list">${Utils.loadingHTML('Loading users...')}</div>
    `;
  },

  // ==================== DATA LOADING ====================
  async loadOverview() {
    try {
      const analytics = await API.getAnalytics();
      const div = document.getElementById('admin-overview');
      if (!div) return;

      div.innerHTML = `
        <div class="stat-grid mb-6">
          ${Components.renderStatCard('👥', 'blue', analytics.totalUsers, 'Total Users')}
          ${Components.renderStatCard('🚌', 'teal', analytics.totalBuses, 'Total Buses')}
          ${Components.renderStatCard('🗺️', 'green', analytics.totalRoutes, 'Total Routes')}
          ${Components.renderStatCard('🎫', 'orange', analytics.activeTrips, 'Active Trips')}
          ${Components.renderStatCard('⚠️', 'red', analytics.crowdedBuses, 'Crowded Buses')}
          ${Components.renderStatCard('🚫', 'red', analytics.fullBuses, 'Full Buses')}
          ${Components.renderStatCard('📊', 'purple', analytics.averageOccupancy + '%', 'Avg Occupancy')}
          ${Components.renderStatCard('🔔', 'orange', analytics.openIncidents, 'Open Incidents')}
        </div>

        <div class="admin-grid">
          <div class="card">
            <div class="card-header"><h3>📊 Trips This Week</h3></div>
            <div class="card-body">
              <div class="chart-container" style="height:250px">
                <canvas id="trips-chart"></canvas>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header"><h3>🚌 Route Occupancy</h3></div>
            <div class="card-body">
              <div class="chart-container" style="height:250px">
                <canvas id="route-chart"></canvas>
              </div>
            </div>
          </div>

          <div class="card admin-grid-full">
            <div class="card-header"><h3>⚠️ Incident Statistics</h3></div>
            <div class="card-body">
              <div class="chart-container" style="height:250px">
                <canvas id="incident-chart"></canvas>
              </div>
            </div>
          </div>
        </div>
      `;

      // Trips per day chart
      setTimeout(() => {
        const tripsCtx = document.getElementById('trips-chart');
        if (tripsCtx) {
          new Chart(tripsCtx, {
            type: 'bar',
            data: {
              labels: analytics.last7Days?.map(d => d.split('-').slice(1).join('/')) || [],
              datasets: [{
                label: 'Trips',
                data: analytics.last7Days?.map(d => analytics.tripsPerDay[d] || 0) || [],
                backgroundColor: 'rgba(20,184,166,0.6)',
                borderColor: 'rgba(20,184,166,1)',
                borderWidth: 1,
                borderRadius: 6
              }]
            },
            options: {
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
            }
          });
        }

        // Route occupancy chart
        const routeCtx = document.getElementById('route-chart');
        if (routeCtx && analytics.routeCrowdData?.length) {
          new Chart(routeCtx, {
            type: 'doughnut',
            data: {
              labels: analytics.routeCrowdData.map(r => r.name),
              datasets: [{
                data: analytics.routeCrowdData.map(r => r.totalPassengers),
                backgroundColor: ['#14b8a6', '#2d5a9e', '#f97316', '#ef4444', '#eab308', '#8b5cf6'],
                borderWidth: 2,
                borderColor: '#fff'
              }]
            },
            options: {
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { position: 'right', labels: { font: { size: 11 } } } }
            }
          });
        }

        // Incident chart
        const incCtx = document.getElementById('incident-chart');
        if (incCtx) {
          const labels = Object.keys(analytics.incidentStats || {});
          const values = Object.values(analytics.incidentStats || {});
          new Chart(incCtx, {
            type: 'bar',
            data: {
              labels: labels.length ? labels : ['No incidents'],
              datasets: [{
                label: 'Incidents',
                data: values.length ? values : [0],
                backgroundColor: ['#ef4444', '#f97316', '#eab308', '#8b5cf6', '#64748b'],
                borderRadius: 6
              }]
            },
            options: {
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
            }
          });
        }
      }, 200);
    } catch (err) {
      const div = document.getElementById('admin-overview');
      if (div) div.innerHTML = Utils.emptyHTML('❌', 'Failed to Load', err.message);
    }
  },

  async loadAnalytics() {
    try {
      const analytics = await API.getAnalytics();
      const div = document.getElementById('analytics-content');
      if (!div) return;

      div.innerHTML = `
        <div class="stat-grid mb-6">
          ${Components.renderStatCard('👤', 'blue', analytics.totalPassengers, 'Passengers')}
          ${Components.renderStatCard('🚗', 'teal', analytics.totalDrivers, 'Drivers')}
          ${Components.renderStatCard('✅', 'green', analytics.completedTrips, 'Completed Trips')}
          ${Components.renderStatCard('📅', 'orange', analytics.scheduledTrips, 'Scheduled Trips')}
          ${Components.renderStatCard('👥', 'purple', analytics.totalPassengersNow, 'Passengers Now')}
          ${Components.renderStatCard('📝', 'blue', analytics.totalFeedback, 'Total Feedback')}
        </div>

        <div class="admin-grid">
          <div class="card">
            <div class="card-header"><h3>📊 Occupancy Over Time</h3></div>
            <div class="card-body">
              <div class="chart-container" style="height:300px">
                <canvas id="occupancy-timeline-chart"></canvas>
              </div>
            </div>
          </div>
          <div class="card">
            <div class="card-header"><h3>🚌 Bus Utilization</h3></div>
            <div class="card-body">
              ${analytics.routeCrowdData?.length ? analytics.routeCrowdData.map(r => {
                const pct = r.totalCapacity > 0 ? Math.round((r.totalPassengers / r.totalCapacity) * 100) : 0;
                return `
                  <div class="mb-4">
                    <div class="flex justify-between text-sm mb-1">
                      <span class="font-semibold">${Utils.escapeHtml(r.name)}</span>
                      <span class="text-muted">${r.totalPassengers}/${r.totalCapacity} (${pct}%)</span>
                    </div>
                    ${Utils.crowdBar(r.totalPassengers, r.totalCapacity)}
                  </div>
                `;
              }).join('') : '<p class="text-muted">No active route data available.</p>'}
            </div>
          </div>
        </div>
      `;

      // Occupancy timeline chart
      setTimeout(() => {
        const ctx = document.getElementById('occupancy-timeline-chart');
        if (ctx && analytics.occupancyTimeline?.length) {
          const datasets = analytics.occupancyTimeline.filter(t => t.history?.length).map((t, i) => ({
            label: t.busNumber,
            data: t.history.map(h => h.count),
            borderColor: ['#14b8a6', '#2d5a9e', '#f97316', '#ef4444', '#8b5cf6'][i % 5],
            backgroundColor: 'transparent',
            tension: 0.4,
            pointRadius: 3
          }));
          
          const maxLen = Math.max(...datasets.map(d => d.data.length), 1);
          new Chart(ctx, {
            type: 'line',
            data: {
              labels: Array.from({ length: maxLen }, (_, i) => `Update ${i + 1}`),
              datasets
            },
            options: {
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { position: 'top', labels: { font: { size: 11 } } } },
              scales: { y: { beginAtZero: true, title: { display: true, text: 'Passengers' } } }
            }
          });
        }
      }, 200);
    } catch (err) {
      const div = document.getElementById('analytics-content');
      if (div) div.innerHTML = Utils.emptyHTML('❌', 'Failed to Load', err.message);
    }
  },

  async loadBuses() {
    try {
      const buses = await API.getBuses();
      const div = document.getElementById('buses-list');
      if (!div) return;

      if (buses.length === 0) {
        div.innerHTML = Utils.emptyHTML('🚌', 'No Buses', 'Add your first bus to get started.');
        return;
      }

      div.innerHTML = `
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Bus Number</th>
                <th>Registration</th>
                <th>Type</th>
                <th>Capacity</th>
                <th>Status</th>
                <th>Crowd Level</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${buses.map(b => `
                <tr>
                  <td><strong>${Utils.escapeHtml(b.busNumber)}</strong></td>
                  <td>${Utils.escapeHtml(b.registrationNumber || '—')}</td>
                  <td><span class="bus-type">${Utils.escapeHtml(b.type)}</span></td>
                  <td>${b.capacity}</td>
                  <td><span class="crowd-badge ${b.status === 'active' ? 'low' : b.status === 'maintenance' ? 'moderate' : 'unknown'}">${b.status}</span></td>
                  <td>${b.activeTrip ? Utils.crowdBadge(b.crowd) : '<span class="text-muted">No trip</span>'}</td>
                  <td>
                    <div class="flex gap-2">
                      <button class="btn btn-ghost btn-sm" onclick="AdminPage.showBusForm('${b.id}')">✏️</button>
                      <button class="btn btn-ghost btn-sm" onclick="AdminPage.deleteBus('${b.id}')">🗑️</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      const div = document.getElementById('buses-list');
      if (div) div.innerHTML = Utils.emptyHTML('❌', 'Failed to Load', err.message);
    }
  },

  async loadRoutes() {
    try {
      const routes = await API.getRoutes();
      const div = document.getElementById('routes-list');
      if (!div) return;

      if (routes.length === 0) {
        div.innerHTML = Utils.emptyHTML('🗺️', 'No Routes', 'Create your first route to get started.');
        return;
      }

      div.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:16px">
          ${routes.map(r => `
            <div class="card">
              <div class="card-header">
                <h3>${Utils.escapeHtml(r.name)}</h3>
                <div class="flex gap-2">
                  <button class="btn btn-ghost btn-sm" onclick="AdminPage.showRouteForm('${r.id}')">✏️</button>
                  <button class="btn btn-ghost btn-sm" onclick="AdminPage.deleteRoute('${r.id}')">🗑️</button>
                </div>
              </div>
              <div class="card-body">
                <div class="text-sm mb-2">📍 <strong>${Utils.escapeHtml(r.source)}</strong> → <strong>${Utils.escapeHtml(r.destination)}</strong></div>
                <div class="text-xs text-muted mb-2">${r.stops?.length || 0} stops · ${r.distance || 'N/A'} · ${r.estimatedTime || 'N/A'}</div>
                <div class="text-xs text-muted">Status: <span class="crowd-badge ${r.status === 'active' ? 'low' : 'unknown'}">${r.status}</span></div>
                ${r.stops?.length ? `
                  <ul class="stop-list mt-4">
                    ${r.stops.map(s => `<li class="stop-item">${Utils.escapeHtml(s.name || s)}</li>`).join('')}
                  </ul>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } catch (err) {
      const div = document.getElementById('routes-list');
      if (div) div.innerHTML = Utils.emptyHTML('❌', 'Failed to Load', err.message);
    }
  },

  async loadDrivers() {
    try {
      const drivers = await API.getDrivers();
      const div = document.getElementById('drivers-list');
      if (!div) return;

      if (drivers.length === 0) {
        div.innerHTML = Utils.emptyHTML('👤', 'No Drivers', 'Register your first driver.');
        return;
      }

      div.innerHTML = `
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>License</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${drivers.map(d => `
                <tr>
                  <td><strong>${Utils.escapeHtml(d.name)}</strong></td>
                  <td>${Utils.escapeHtml(d.email)}</td>
                  <td>${Utils.escapeHtml(d.phone || '—')}</td>
                  <td>${Utils.escapeHtml(d.licenseNumber || '—')}</td>
                  <td><span class="crowd-badge ${d.status === 'active' ? 'low' : 'unknown'}">${d.status || 'active'}</span></td>
                  <td>
                    <div class="flex gap-2">
                      <button class="btn btn-ghost btn-sm" onclick="AdminPage.showDriverForm('${d.id}')">✏️</button>
                      <button class="btn btn-ghost btn-sm" onclick="AdminPage.deleteDriver('${d.id}')">🗑️</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      const div = document.getElementById('drivers-list');
      if (div) div.innerHTML = Utils.emptyHTML('❌', 'Failed to Load', err.message);
    }
  },

  _allTrips: [],

  async loadTrips(statusFilter) {
    try {
      this._allTrips = await API.getTrips();
      this.renderTripsTable(statusFilter);
    } catch (err) {
      const div = document.getElementById('trips-list');
      if (div) div.innerHTML = Utils.emptyHTML('❌', 'Failed to Load', err.message);
    }
  },

  renderTripsTable(statusFilter) {
    const div = document.getElementById('trips-list');
    if (!div) return;

    let filtered = this._allTrips;
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    if (filtered.length === 0) {
      div.innerHTML = Utils.emptyHTML('🎫', 'No Trips', 'Create a trip to assign a bus and driver to a route.');
      return;
    }

    div.innerHTML = `
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Bus</th>
              <th>Route</th>
              <th>Driver</th>
              <th>Status</th>
              <th>Passengers</th>
              <th>Crowd</th>
              <th>Started</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map(t => `
              <tr>
                <td><strong>${Utils.escapeHtml(t.busNumber)}</strong></td>
                <td>${Utils.escapeHtml(t.routeName)}</td>
                <td>${Utils.escapeHtml(t.driverName)}</td>
                <td><span class="crowd-badge ${t.status === 'active' ? 'low' : t.status === 'scheduled' ? 'moderate' : 'unknown'}">${t.status}</span></td>
                <td>${t.passengerCount}/${t.busCapacity}</td>
                <td>${Utils.crowdBadge(t.crowd)}</td>
                <td>${Utils.formatDateShort(t.startedAt || t.scheduledStart)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  filterTrips(status, btnEl) {
    document.querySelectorAll('#trip-tabs .tab').forEach(t => t.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');
    this.renderTripsTable(status);
  },

  async loadIncidents() {
    try {
      const incidents = await API.getIncidents();
      const div = document.getElementById('incidents-list');
      if (!div) return;

      if (incidents.length === 0) {
        div.innerHTML = Utils.emptyHTML('⚠️', 'No Incidents', 'No incidents have been reported.');
        return;
      }

      div.innerHTML = `
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr><th>Type</th><th>Severity</th><th>Description</th><th>Status</th><th>Reported</th><th>Actions</th></tr>
            </thead>
            <tbody>
              ${incidents.map(i => `
                <tr>
                  <td><strong>${i.type?.charAt(0).toUpperCase() + i.type?.slice(1)}</strong></td>
                  <td><span class="crowd-badge ${i.severity === 'high' || i.severity === 'critical' ? 'full' : i.severity === 'medium' ? 'high' : 'moderate'}">${i.severity}</span></td>
                  <td class="truncate" style="max-width:250px">${Utils.escapeHtml(i.description || 'No description')}</td>
                  <td><span class="crowd-badge ${i.status === 'resolved' ? 'low' : i.status === 'investigating' ? 'moderate' : 'high'}">${i.status}</span></td>
                  <td>${Utils.timeAgo(i.createdAt)}</td>
                  <td>
                    <select class="form-select" style="width:auto;padding:4px 8px;font-size:12px" onchange="AdminPage.updateIncidentStatus('${i.id}',this.value)">
                      <option value="reported" ${i.status === 'reported' ? 'selected' : ''}>Reported</option>
                      <option value="investigating" ${i.status === 'investigating' ? 'selected' : ''}>Investigating</option>
                      <option value="resolved" ${i.status === 'resolved' ? 'selected' : ''}>Resolved</option>
                    </select>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      const div = document.getElementById('incidents-list');
      if (div) div.innerHTML = Utils.emptyHTML('❌', 'Failed to Load', err.message);
    }
  },

  async loadFeedback() {
    try {
      const feedback = await API.getFeedback();
      const div = document.getElementById('feedback-list');
      if (!div) return;

      if (feedback.length === 0) {
        div.innerHTML = Utils.emptyHTML('📝', 'No Feedback', 'No passenger feedback received yet.');
        return;
      }

      div.innerHTML = `
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr><th>User</th><th>Type</th><th>Message</th><th>Rating</th><th>Status</th><th>Date</th><th>Actions</th></tr>
            </thead>
            <tbody>
              ${feedback.map(f => `
                <tr>
                  <td>${Utils.escapeHtml(f.userName)}</td>
                  <td><span class="crowd-badge unknown">${f.type}</span></td>
                  <td class="truncate" style="max-width:200px">${Utils.escapeHtml(f.message)}</td>
                  <td>${f.rating ? '⭐'.repeat(f.rating) : '—'}</td>
                  <td><span class="crowd-badge ${f.status === 'resolved' ? 'low' : f.status === 'reviewed' ? 'moderate' : 'high'}">${f.status}</span></td>
                  <td>${Utils.timeAgo(f.createdAt)}</td>
                  <td>
                    <select class="form-select" style="width:auto;padding:4px 8px;font-size:12px" onchange="AdminPage.updateFeedbackStatus('${f.id}',this.value)">
                      <option value="pending" ${f.status === 'pending' ? 'selected' : ''}>Pending</option>
                      <option value="reviewed" ${f.status === 'reviewed' ? 'selected' : ''}>Reviewed</option>
                      <option value="resolved" ${f.status === 'resolved' ? 'selected' : ''}>Resolved</option>
                    </select>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      const div = document.getElementById('feedback-list');
      if (div) div.innerHTML = Utils.emptyHTML('❌', 'Failed to Load', err.message);
    }
  },

  async loadUsers() {
    try {
      const users = await API.getUsers();
      const div = document.getElementById('users-list');
      if (!div) return;

      div.innerHTML = `
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Phone</th><th>Joined</th></tr>
            </thead>
            <tbody>
              ${users.map(u => `
                <tr>
                  <td><strong>${Utils.escapeHtml(u.name)}</strong></td>
                  <td>${Utils.escapeHtml(u.email)}</td>
                  <td><span class="nav-role-badge ${u.role}">${u.role}</span></td>
                  <td>${Utils.escapeHtml(u.phone || '—')}</td>
                  <td>${Utils.formatDateShort(u.createdAt)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      const div = document.getElementById('users-list');
      if (div) div.innerHTML = Utils.emptyHTML('❌', 'Failed to Load', err.message);
    }
  },

  // ==================== FORMS ====================
  async showBusForm(busId) {
    let bus = null;
    if (busId) {
      try { bus = await API.getBus(busId); } catch (e) {}
    }
    const title = bus ? 'Edit Bus' : 'Add New Bus';
    const content = `
      <form onsubmit="AdminPage.saveBus(event, '${busId || ''}')">
        <div class="form-group">
          <label class="form-label">Bus Number *</label>
          <input class="form-input" id="bus-number" value="${bus?.busNumber || ''}" placeholder="e.g., MH-201" required>
        </div>
        <div class="form-group">
          <label class="form-label">Registration Number</label>
          <input class="form-input" id="bus-reg" value="${bus?.registrationNumber || ''}" placeholder="e.g., MH-01-AB-1234">
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Capacity *</label>
            <input class="form-input" type="number" id="bus-capacity" value="${bus?.capacity || ''}" placeholder="e.g., 50" required min="1">
          </div>
          <div class="form-group">
            <label class="form-label">Type</label>
            <select class="form-select" id="bus-type">
              <option value="Regular" ${bus?.type === 'Regular' ? 'selected' : ''}>Regular</option>
              <option value="AC" ${bus?.type === 'AC' ? 'selected' : ''}>AC</option>
              <option value="Non-AC" ${bus?.type === 'Non-AC' ? 'selected' : ''}>Non-AC</option>
              <option value="AC Volvo" ${bus?.type === 'AC Volvo' ? 'selected' : ''}>AC Volvo</option>
              <option value="Mini" ${bus?.type === 'Mini' ? 'selected' : ''}>Mini</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <select class="form-select" id="bus-status">
            <option value="active" ${bus?.status === 'active' ? 'selected' : ''}>Active</option>
            <option value="maintenance" ${bus?.status === 'maintenance' ? 'selected' : ''}>Maintenance</option>
            <option value="retired" ${bus?.status === 'retired' ? 'selected' : ''}>Retired</option>
          </select>
        </div>
        <div class="flex gap-2 justify-between" style="margin-top:24px">
          <button type="button" class="btn btn-ghost" onclick="Components.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">${bus ? 'Update' : 'Add'} Bus</button>
        </div>
      </form>
    `;
    Components.showModal(title, content);
  },

  async saveBus(e, busId) {
    e.preventDefault();
    const data = {
      busNumber: document.getElementById('bus-number').value.trim(),
      registrationNumber: document.getElementById('bus-reg').value.trim(),
      capacity: parseInt(document.getElementById('bus-capacity').value),
      type: document.getElementById('bus-type').value,
      status: document.getElementById('bus-status').value
    };

    try {
      if (busId) {
        await API.updateBus(busId, data);
        Components.showToast('Bus updated!', 'success');
      } else {
        await API.createBus(data);
        Components.showToast('Bus added!', 'success');
      }
      Components.closeModal();
      this.loadBuses();
    } catch (err) {
      Components.showToast(err.message, 'error');
    }
  },

  async deleteBus(id) {
    const ok = await Components.confirm('Delete Bus', 'Are you sure you want to delete this bus? This cannot be undone.');
    if (!ok) return;
    try {
      await API.deleteBus(id);
      Components.showToast('Bus deleted', 'success');
      this.loadBuses();
    } catch (err) {
      Components.showToast(err.message, 'error');
    }
  },

  async showRouteForm(routeId) {
    let route = null;
    if (routeId) {
      try { route = await API.getRoute(routeId); } catch (e) {}
    }
    const title = route ? 'Edit Route' : 'Add New Route';
    const stopsStr = route?.stops?.map(s => `${s.name || s}${s.lat ? ` (${s.lat},${s.lng})` : ''}`).join('\n') || '';
    
    const content = `
      <form onsubmit="AdminPage.saveRoute(event, '${routeId || ''}')">
        <div class="form-group">
          <label class="form-label">Route Name *</label>
          <input class="form-input" id="route-name" value="${route?.name || ''}" placeholder="e.g., Route A - Central Line" required>
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Source *</label>
            <input class="form-input" id="route-source" value="${route?.source || ''}" placeholder="Starting point" required>
          </div>
          <div class="form-group">
            <label class="form-label">Destination *</label>
            <input class="form-input" id="route-dest" value="${route?.destination || ''}" placeholder="End point" required>
          </div>
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Distance</label>
            <input class="form-input" id="route-distance" value="${route?.distance || ''}" placeholder="e.g., 24 km">
          </div>
          <div class="form-group">
            <label class="form-label">Est. Time</label>
            <input class="form-input" id="route-time" value="${route?.estimatedTime || ''}" placeholder="e.g., 75 min">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Stops (one per line, format: Name or Name (lat,lng))</label>
          <textarea class="form-textarea" id="route-stops" rows="6" placeholder="Stop 1 (19.12,72.84)\nStop 2 (19.10,72.83)">${stopsStr}</textarea>
        </div>
        <div class="flex gap-2 justify-between" style="margin-top:24px">
          <button type="button" class="btn btn-ghost" onclick="Components.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">${route ? 'Update' : 'Add'} Route</button>
        </div>
      </form>
    `;
    Components.showModal(title, content, { large: true });
  },

  async saveRoute(e, routeId) {
    e.preventDefault();
    const stopsText = document.getElementById('route-stops').value.trim();
    const stops = stopsText.split('\n').filter(s => s.trim()).map((line, i) => {
      const match = line.match(/^(.+?)\s*\((-?\d+\.?\d*),\s*(-?\d+\.?\d*)\)\s*$/);
      if (match) {
        return { name: match[1].trim(), lat: parseFloat(match[2]), lng: parseFloat(match[3]), order: i + 1 };
      }
      return { name: line.trim(), order: i + 1 };
    });

    const data = {
      name: document.getElementById('route-name').value.trim(),
      source: document.getElementById('route-source').value.trim(),
      destination: document.getElementById('route-dest').value.trim(),
      distance: document.getElementById('route-distance').value.trim(),
      estimatedTime: document.getElementById('route-time').value.trim(),
      stops
    };

    try {
      if (routeId) {
        await API.updateRoute(routeId, data);
        Components.showToast('Route updated!', 'success');
      } else {
        await API.createRoute(data);
        Components.showToast('Route added!', 'success');
      }
      Components.closeModal();
      this.loadRoutes();
    } catch (err) {
      Components.showToast(err.message, 'error');
    }
  },

  async deleteRoute(id) {
    const ok = await Components.confirm('Delete Route', 'Are you sure?');
    if (!ok) return;
    try {
      await API.deleteRoute(id);
      Components.showToast('Route deleted', 'success');
      this.loadRoutes();
    } catch (err) { Components.showToast(err.message, 'error'); }
  },

  async showDriverForm(driverId) {
    let driver = null;
    if (driverId) {
      try {
        const drivers = await API.getDrivers();
        driver = drivers.find(d => d.id === driverId);
      } catch (e) {}
    }
    const title = driver ? 'Edit Driver' : 'Register New Driver';
    const content = `
      <form onsubmit="AdminPage.saveDriver(event, '${driverId || ''}')">
        <div class="form-group">
          <label class="form-label">Full Name *</label>
          <input class="form-input" id="drv-name" value="${driver?.name || ''}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Email *</label>
          <input class="form-input" type="email" id="drv-email" value="${driver?.email || ''}" required ${driver ? 'disabled' : ''}>
        </div>
        ${!driver ? `
          <div class="form-group">
            <label class="form-label">Password *</label>
            <input class="form-input" type="password" id="drv-pass" required minlength="6" placeholder="Min 6 characters">
          </div>
        ` : ''}
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Phone</label>
            <input class="form-input" id="drv-phone" value="${driver?.phone || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">License Number</label>
            <input class="form-input" id="drv-license" value="${driver?.licenseNumber || ''}">
          </div>
        </div>
        <div class="flex gap-2 justify-between" style="margin-top:24px">
          <button type="button" class="btn btn-ghost" onclick="Components.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">${driver ? 'Update' : 'Register'} Driver</button>
        </div>
      </form>
    `;
    Components.showModal(title, content);
  },

  async saveDriver(e, driverId) {
    e.preventDefault();
    const data = {
      name: document.getElementById('drv-name').value.trim(),
      phone: document.getElementById('drv-phone').value.trim(),
      licenseNumber: document.getElementById('drv-license').value.trim()
    };

    try {
      if (driverId) {
        await API.updateDriver(driverId, data);
        Components.showToast('Driver updated!', 'success');
      } else {
        data.email = document.getElementById('drv-email').value.trim();
        data.password = document.getElementById('drv-pass').value;
        await API.createDriver(data);
        Components.showToast('Driver registered!', 'success');
      }
      Components.closeModal();
      this.loadDrivers();
    } catch (err) {
      Components.showToast(err.message, 'error');
    }
  },

  async deleteDriver(id) {
    const ok = await Components.confirm('Delete Driver', 'Are you sure?');
    if (!ok) return;
    try {
      await API.deleteDriver(id);
      Components.showToast('Driver deleted', 'success');
      this.loadDrivers();
    } catch (err) { Components.showToast(err.message, 'error'); }
  },

  async showTripForm() {
    const [buses, routes, drivers] = await Promise.all([API.getBuses(), API.getRoutes(), API.getDrivers()]);
    
    const content = `
      <form onsubmit="AdminPage.saveTrip(event)">
        <div class="form-group">
          <label class="form-label">Bus *</label>
          <select class="form-select" id="trip-bus" required>
            <option value="">Select a bus</option>
            ${buses.filter(b => b.status === 'active').map(b => `<option value="${b.id}">${b.busNumber} (${b.type}, ${b.capacity} seats)</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Route *</label>
          <select class="form-select" id="trip-route" required>
            <option value="">Select a route</option>
            ${routes.filter(r => r.status === 'active').map(r => `<option value="${r.id}">${r.name} (${r.source} → ${r.destination})</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Driver *</label>
          <select class="form-select" id="trip-driver" required>
            <option value="">Select a driver</option>
            ${drivers.map(d => `<option value="${d.id}">${d.name} (${d.email})</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Scheduled Start</label>
          <input class="form-input" type="datetime-local" id="trip-start">
        </div>
        <div class="flex gap-2 justify-between" style="margin-top:24px">
          <button type="button" class="btn btn-ghost" onclick="Components.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Create Trip</button>
        </div>
      </form>
    `;
    Components.showModal('Create New Trip', content);
  },

  async saveTrip(e) {
    e.preventDefault();
    const data = {
      busId: document.getElementById('trip-bus').value,
      routeId: document.getElementById('trip-route').value,
      driverId: document.getElementById('trip-driver').value,
      scheduledStart: document.getElementById('trip-start').value ? new Date(document.getElementById('trip-start').value).toISOString() : undefined
    };

    try {
      await API.createTrip(data);
      Components.showToast('Trip created!', 'success');
      Components.closeModal();
      this.loadTrips();
    } catch (err) {
      Components.showToast(err.message, 'error');
    }
  },

  async updateIncidentStatus(id, status) {
    try {
      await API.updateIncident(id, { status });
      Components.showToast(`Incident marked as ${status}`, 'success');
    } catch (err) {
      Components.showToast(err.message, 'error');
    }
  },

  async updateFeedbackStatus(id, status) {
    try {
      await API.updateFeedback(id, { status });
      Components.showToast(`Feedback marked as ${status}`, 'success');
    } catch (err) {
      Components.showToast(err.message, 'error');
    }
  },

  async sendAnnouncement(e) {
    e.preventDefault();
    const title = document.getElementById('ann-title').value.trim();
    const message = document.getElementById('ann-message').value.trim();
    const target = document.getElementById('ann-target').value;
    
    const forRoles = target === 'all' ? ['passenger', 'driver'] : [target];
    
    try {
      await API.sendAnnouncement({ title, message, forRoles });
      Components.showToast('Announcement sent!', 'success');
      document.getElementById('ann-title').value = '';
      document.getElementById('ann-message').value = '';
    } catch (err) {
      Components.showToast(err.message, 'error');
    }
  },

  async generateReport() {
    const startDate = document.getElementById('report-start')?.value;
    const endDate = document.getElementById('report-end')?.value;
    const routeId = document.getElementById('report-route')?.value;
    
    const div = document.getElementById('report-content');
    if (div) div.innerHTML = Utils.loadingHTML('Generating report...');
    
    try {
      const data = await API.getReports({ startDate, endDate, routeId });
      if (!div) return;

      div.innerHTML = `
        <div class="stat-grid mb-4">
          ${Components.renderStatCard('🎫', 'teal', data.summary.totalTrips, 'Total Trips')}
          ${Components.renderStatCard('✅', 'green', data.summary.completedTrips, 'Completed')}
          ${Components.renderStatCard('📊', 'blue', data.summary.averageOccupancy + '%', 'Avg Occupancy')}
          ${Components.renderStatCard('⚠️', 'red', data.summary.totalIncidents, 'Incidents')}
        </div>
        ${data.trips.length > 0 ? `
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr><th>Bus</th><th>Route</th><th>Status</th><th>Passengers</th><th>Occupancy</th><th>Incidents</th><th>Date</th></tr>
              </thead>
              <tbody>
                ${data.trips.map(t => `
                  <tr>
                    <td><strong>${Utils.escapeHtml(t.busNumber)}</strong></td>
                    <td>${Utils.escapeHtml(t.routeName)}</td>
                    <td><span class="crowd-badge ${t.status === 'active' ? 'low' : 'unknown'}">${t.status}</span></td>
                    <td>${t.passengerCount}/${t.capacity}</td>
                    <td>${t.occupancyRate}%</td>
                    <td>${t.incidentCount}</td>
                    <td>${Utils.formatDateShort(t.startedAt || t.createdAt)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : Utils.emptyHTML('📋', 'No Data', 'No trips found for the selected filters.')}
      `;
    } catch (err) {
      if (div) div.innerHTML = Utils.emptyHTML('❌', 'Report Failed', err.message);
    }
  },

  exportReport() {
    const startDate = document.getElementById('report-start')?.value;
    const endDate = document.getElementById('report-end')?.value;
    API.exportReport({ startDate, endDate });
    Components.showToast('Report exported as CSV', 'success');
  },

  async loadReportRoutes() {
    try {
      const routes = await API.getRoutes();
      const select = document.getElementById('report-route');
      if (select) {
        routes.forEach(r => {
          const opt = document.createElement('option');
          opt.value = r.id;
          opt.textContent = r.name;
          select.appendChild(opt);
        });
      }
    } catch (e) {}
  },

  async onMount() {
    switch (this.currentTab) {
      case 'overview': this.loadOverview(); break;
      case 'analytics': this.loadAnalytics(); break;
      case 'buses': this.loadBuses(); break;
      case 'routes': this.loadRoutes(); break;
      case 'drivers': this.loadDrivers(); break;
      case 'trips': this.loadTrips(); break;
      case 'incidents': this.loadIncidents(); break;
      case 'feedback': this.loadFeedback(); break;
      case 'reports': this.loadReportRoutes(); break;
      case 'users': this.loadUsers(); break;
    }
  }
};
