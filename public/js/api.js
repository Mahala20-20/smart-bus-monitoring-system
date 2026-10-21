// ==================== API SERVICE ====================
const API = {
  BASE: '/api',
  
  getToken() {
    return localStorage.getItem('smartbus_token');
  },

  getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  },

  async request(method, endpoint, body = null) {
    try {
      const opts = { method, headers: this.getHeaders() };
      if (body && method !== 'GET') opts.body = JSON.stringify(body);
      const res = await fetch(`${this.BASE}${endpoint}`, opts);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      return data;
    } catch (err) {
      console.error(`API ${method} ${endpoint}:`, err);
      throw err;
    }
  },

  get(endpoint) { return this.request('GET', endpoint); },
  post(endpoint, body) { return this.request('POST', endpoint, body); },
  put(endpoint, body) { return this.request('PUT', endpoint, body); },
  delete(endpoint) { return this.request('DELETE', endpoint); },

  // Auth
  login(email, password) { return this.post('/auth/login', { email, password }); },
  register(data) { return this.post('/auth/register', data); },
  getProfile() { return this.get('/auth/me'); },
  updateProfile(data) { return this.put('/auth/profile', data); },

  // Buses
  getBuses() { return this.get('/buses'); },
  getBus(id) { return this.get(`/buses/${id}`); },
  createBus(data) { return this.post('/buses', data); },
  updateBus(id, data) { return this.put(`/buses/${id}`, data); },
  deleteBus(id) { return this.delete(`/buses/${id}`); },

  // Routes
  getRoutes() { return this.get('/routes'); },
  getRoute(id) { return this.get(`/routes/${id}`); },
  createRoute(data) { return this.post('/routes', data); },
  updateRoute(id, data) { return this.put(`/routes/${id}`, data); },
  deleteRoute(id) { return this.delete(`/routes/${id}`); },

  // Trips
  getTrips(status) { return this.get(`/trips${status ? `?status=${status}` : ''}`); },
  getTrip(id) { return this.get(`/trips/${id}`); },
  createTrip(data) { return this.post('/trips', data); },
  startTrip(id) { return this.post(`/trips/${id}/start`); },
  endTrip(id) { return this.post(`/trips/${id}/end`); },
  updateOccupancy(id, data) { return this.post(`/trips/${id}/occupancy`, data); },
  markBusFull(id) { return this.post(`/trips/${id}/mark-full`); },
  updateLocation(id, data) { return this.post(`/trips/${id}/location`, data); },
  reportIncident(id, data) { return this.post(`/trips/${id}/incident`, data); },

  // Driver
  getMyTrips() { return this.get('/driver/my-trips'); },

  // Search
  searchBuses(source, destination) {
    const params = new URLSearchParams();
    if (source) params.set('source', source);
    if (destination) params.set('destination', destination);
    return this.get(`/search/buses?${params}`);
  },

  // Favourites
  toggleFavBus(busId) { return this.post('/favourites/bus', { busId }); },
  toggleFavRoute(routeId) { return this.post('/favourites/route', { routeId }); },
  getFavourites() { return this.get('/favourites'); },

  // Feedback
  submitFeedback(data) { return this.post('/feedback', data); },
  getFeedback() { return this.get('/feedback'); },
  updateFeedback(id, data) { return this.put(`/feedback/${id}`, data); },

  // Notifications
  getNotifications() { return this.get('/notifications'); },
  markNotificationRead(id) { return this.put(`/notifications/${id}/read`); },
  sendAnnouncement(data) { return this.post('/notifications/announce', data); },

  // Incidents
  getIncidents() { return this.get('/incidents'); },
  updateIncident(id, data) { return this.put(`/incidents/${id}`, data); },

  // Drivers (admin)
  getDrivers() { return this.get('/drivers'); },
  createDriver(data) { return this.post('/drivers', data); },
  updateDriver(id, data) { return this.put(`/drivers/${id}`, data); },
  deleteDriver(id) { return this.delete(`/drivers/${id}`); },

  // Analytics & Reports
  getAnalytics() { return this.get('/analytics'); },
  getReports(params) {
    const qs = new URLSearchParams(params).toString();
    return this.get(`/reports?${qs}`);
  },
  exportReport(params) {
    const qs = new URLSearchParams(params).toString();
    window.open(`${this.BASE}/reports/export?${qs}`, '_blank');
  },

  // Admin
  getUsers() { return this.get('/admin/users'); },

  // Seed
  seedData() { return this.post('/seed'); }
};
