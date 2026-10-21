// ==================== REUSABLE COMPONENTS ====================
const Components = {
  // Toast notification
  showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toast-container');
    const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
    const id = Utils.uid();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.id = `toast-${id}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || 'ℹ'}</span>
      <span class="toast-message">${Utils.escapeHtml(message)}</span>
      <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
    `;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
  },

  // Modal
  showModal(title, content, opts = {}) {
    const container = document.getElementById('modal-container');
    const sizeClass = opts.large ? 'modal-lg' : '';
    container.innerHTML = `
      <div class="modal-overlay" onclick="if(event.target===this)Components.closeModal()">
        <div class="modal ${sizeClass}">
          <div class="modal-header">
            <h2>${title}</h2>
            <button class="modal-close" onclick="Components.closeModal()">✕</button>
          </div>
          <div class="modal-body">${content}</div>
          ${opts.footer ? `<div class="modal-footer">${opts.footer}</div>` : ''}
        </div>
      </div>
    `;
  },

  closeModal() {
    document.getElementById('modal-container').innerHTML = '';
  },

  // Confirm dialog
  confirm(title, message) {
    return new Promise(resolve => {
      const content = `<p style="color:var(--gray-600);font-size:14px;line-height:1.6">${message}</p>`;
      const footer = `
        <button class="btn btn-ghost" onclick="Components.closeModal();window._confirmResolve(false)">Cancel</button>
        <button class="btn btn-danger" onclick="Components.closeModal();window._confirmResolve(true)">Confirm</button>
      `;
      window._confirmResolve = resolve;
      this.showModal(title, content, { footer });
    });
  },

  // Navbar
  renderNavbar() {
    const user = Store.get('user');
    const isLoggedIn = Store.isLoggedIn();
    const role = Store.getRole();

    let navLinks = '';
    let userSection = '';

    if (!isLoggedIn) {
      navLinks = `
        <button class="nav-link" onclick="Router.navigate('landing')">Home</button>
        <button class="nav-link" onclick="Router.navigate('login')">Login</button>
        <button class="btn btn-primary btn-sm" onclick="Router.navigate('register')">Sign Up</button>
      `;
    } else {
      const dashPage = role === 'admin' ? 'admin' : role === 'driver' ? 'driver' : 'passenger';
      navLinks = `
        <button class="nav-link" onclick="Router.navigate('${dashPage}')">Dashboard</button>
        ${role === 'passenger' ? '<button class="nav-link" onclick="Router.navigate(\'search\')">Search</button>' : ''}
        ${role === 'passenger' ? '<button class="nav-link" onclick="Router.navigate(\'map\')">Map</button>' : ''}
      `;
      userSection = `
        <div class="nav-user">
          <div class="nav-avatar">${Utils.getInitials(user.name)}</div>
          <span class="nav-user-name">${Utils.escapeHtml(user.name)}</span>
          <span class="nav-role-badge ${role}">${role}</span>
        </div>
        <button class="nav-link" onclick="App.logout()" title="Logout">🚪</button>
      `;
    }

    return `
      <nav class="navbar" id="main-navbar">
        <div class="navbar-brand" onclick="Router.navigate(isLoggedIn ? '${role === 'admin' ? 'admin' : role === 'driver' ? 'driver' : 'passenger'}' : 'landing')">
          <div class="navbar-logo">🚌</div>
          <div class="navbar-title">Smart<span>Bus</span></div>
        </div>
        <button class="navbar-mobile-toggle" onclick="document.querySelector('.navbar-nav').classList.toggle('open')">☰</button>
        <div class="navbar-nav">
          ${navLinks}
          ${userSection}
        </div>
      </nav>
    `;
  },

  // Sidebar for dashboards
  renderSidebar(items, activeId) {
    const sections = {};
    items.forEach(item => {
      if (!sections[item.section]) sections[item.section] = [];
      sections[item.section].push(item);
    });

    let html = '';
    Object.entries(sections).forEach(([section, sItems]) => {
      html += `<div class="sidebar-section">`;
      html += `<div class="sidebar-label">${section}</div>`;
      sItems.forEach(item => {
        html += `
          <button class="sidebar-link ${item.id === activeId ? 'active' : ''}" onclick="Router.navigate('${item.page || item.id}')">
            <span class="icon">${item.icon}</span>
            ${item.label}
            ${item.badge ? `<span class="badge">${item.badge}</span>` : ''}
          </button>
        `;
      });
      html += `</div>`;
    });
    return `<aside class="sidebar" id="app-sidebar">${html}</aside>`;
  },

  // Bus card component
  renderBusCard(bus, opts = {}) {
    const crowd = bus.crowd || { level: 'unknown', label: 'Unknown', emoji: '' };
    const pct = bus.capacity > 0 ? Math.round(((bus.passengerCount || 0) / bus.capacity) * 100) : 0;
    const isFav = opts.favourites?.includes(bus.busId || bus.id);

    return `
      <div class="bus-card ${crowd.level} animate-fade" data-bus-id="${bus.busId || bus.id}">
        <div class="bus-card-header">
          <div>
            <div class="bus-number">${Utils.escapeHtml(bus.busNumber || 'N/A')}</div>
            <span class="bus-type">${Utils.escapeHtml(bus.busType || bus.type || '')}</span>
          </div>
          <div class="flex items-center gap-2">
            ${Utils.crowdBadge(crowd)}
            ${opts.showFav ? `<button class="fav-btn ${isFav ? 'active' : ''}" onclick="event.stopPropagation();App.toggleFavBus('${bus.busId || bus.id}')" title="Favourite">★</button>` : ''}
          </div>
        </div>
        ${bus.routeName ? `
          <div class="bus-route-info">
            <span>📍 ${Utils.escapeHtml(bus.source || bus.routeSource || '')}</span>
            <span class="route-arrow">→</span>
            <span>${Utils.escapeHtml(bus.destination || bus.routeDestination || '')}</span>
          </div>
        ` : ''}
        <div class="bus-stats">
          <div class="bus-stat">
            <div class="bus-stat-value">${bus.passengerCount ?? 0}</div>
            <div class="bus-stat-label">Passengers</div>
          </div>
          <div class="bus-stat">
            <div class="bus-stat-value">${bus.capacity || 0}</div>
            <div class="bus-stat-label">Capacity</div>
          </div>
          <div class="bus-stat">
            <div class="bus-stat-value">${bus.availableSeats ?? 0}</div>
            <div class="bus-stat-label">Available</div>
          </div>
        </div>
        ${Utils.crowdBar(bus.passengerCount || 0, bus.capacity || 0)}
        <div class="bus-card-footer">
          <div>
            ${bus.nextStop ? `<div class="bus-next-stop">Next: <strong>${Utils.escapeHtml(bus.nextStop)}</strong></div>` : ''}
            ${bus.delay ? `<div class="bus-delay">⚠ Delayed</div>` : ''}
          </div>
          <div>
            ${bus.lastLocationUpdate ? `<span class="text-xs text-muted">Updated ${Utils.timeAgo(bus.lastLocationUpdate)}</span>` : ''}
            ${bus.tripStatus === 'scheduled' ? '<span class="crowd-badge unknown">Scheduled</span>' : ''}
          </div>
        </div>
        ${opts.showRoute && bus.stops?.length ? `
          <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--gray-100)">
            <div class="text-xs font-semibold text-muted mb-2">ROUTE STOPS</div>
            <ul class="stop-list">
              ${(bus.stops || []).map((s, i) => {
                const stopName = s.name || s;
                const isCurrent = bus.nextStop === stopName;
                const isPassed = bus.nextStop && (bus.stops || []).findIndex(st => (st.name || st) === bus.nextStop) > i;
                return `<li class="stop-item ${isCurrent ? 'current' : ''} ${isPassed ? 'passed' : ''}">${Utils.escapeHtml(stopName)}</li>`;
              }).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    `;
  },

  // Stat card
  renderStatCard(icon, iconClass, value, label) {
    return `
      <div class="stat-card animate-fade">
        <div class="stat-icon ${iconClass}">${icon}</div>
        <div class="stat-value">${value}</div>
        <div class="stat-label">${label}</div>
      </div>
    `;
  }
};
