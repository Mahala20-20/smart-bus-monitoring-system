// ==================== UTILITY FUNCTIONS ====================
const Utils = {
  // Time formatting
  timeAgo(dateStr) {
    if (!dateStr) return 'N/A';
    const now = new Date();
    const date = new Date(dateStr);
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  },

  formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  },

  formatDateShort(dateStr) {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit', month: 'short',
      hour: '2-digit', minute: '2-digit'
    });
  },

  // Generate initials
  getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  },

  // Debounce
  debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  },

  // Escape HTML
  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  // Generate crowd badge HTML
  crowdBadge(crowd) {
    if (!crowd) return '<span class="crowd-badge unknown">Unknown</span>';
    return `<span class="crowd-badge ${crowd.level}">${crowd.emoji || ''} ${crowd.label}</span>`;
  },

  // Crowd bar HTML
  crowdBar(count, capacity) {
    const pct = capacity > 0 ? Math.min(100, Math.round((count / capacity) * 100)) : 0;
    let level = 'low';
    if (pct > 95) level = 'full';
    else if (pct > 70) level = 'high';
    else if (pct > 40) level = 'moderate';
    return `<div class="crowd-bar"><div class="crowd-bar-fill ${level}" style="width:${pct}%"></div></div>`;
  },

  // Validate email
  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  // Loading spinner HTML
  loadingHTML(text = 'Loading...') {
    return `<div class="loading-spinner"><div class="spinner-ring"></div><div class="spinner-text">${text}</div></div>`;
  },

  // Empty state HTML
  emptyHTML(icon, title, message) {
    return `<div class="empty-state"><div class="empty-icon">${icon}</div><h3>${title}</h3><p>${message}</p></div>`;
  },

  // Unique ID
  uid() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
};
