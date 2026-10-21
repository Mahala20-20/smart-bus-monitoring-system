const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'smartbus_secret_key_2024';
const DB_DIR = path.join(__dirname, 'data');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ==================== DATABASE LAYER ====================
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

function readDB(name) {
  const file = path.join(DB_DIR, `${name}.json`);
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeDB(name, data) {
  fs.writeFileSync(path.join(DB_DIR, `${name}.json`), JSON.stringify(data, null, 2));
}

function findById(collection, id) {
  return readDB(collection).find(item => item.id === id);
}

function updateById(collection, id, updates) {
  const items = readDB(collection);
  const idx = items.findIndex(item => item.id === id);
  if (idx === -1) return null;
  items[idx] = { ...items[idx], ...updates, updatedAt: new Date().toISOString() };
  writeDB(collection, items);
  return items[idx];
}

function deleteById(collection, id) {
  const items = readDB(collection);
  const filtered = items.filter(item => item.id !== id);
  if (filtered.length === items.length) return false;
  writeDB(collection, filtered);
  return true;
}

// ==================== SSE (Server-Sent Events) ====================
const sseClients = new Set();

app.get('/api/sse', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  res.write('data: {"type":"connected"}\n\n');
  sseClients.add(res);
  req.on('close', () => sseClients.delete(res));
});

function broadcastSSE(type, data) {
  const msg = JSON.stringify({ type, data, timestamp: new Date().toISOString() });
  sseClients.forEach(client => {
    client.write(`data: ${msg}\n\n`);
  });
}

// ==================== AUTH MIDDLEWARE ====================
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function roleMiddleware(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    next();
  };
}

// ==================== CROWD LEVEL CALCULATION ====================
function getCrowdLevel(passengerCount, capacity) {
  if (capacity <= 0 || passengerCount == null) return { level: 'unknown', color: '#999', label: 'Unknown' };
  const ratio = passengerCount / capacity;
  if (ratio <= 0.4) return { level: 'low', color: '#22c55e', label: 'Low Crowd', emoji: '🟢' };
  if (ratio <= 0.7) return { level: 'moderate', color: '#eab308', label: 'Moderate Crowd', emoji: '🟡' };
  if (ratio <= 0.95) return { level: 'high', color: '#f97316', label: 'High Crowd', emoji: '🟠' };
  return { level: 'full', color: '#ef4444', label: 'Full / Overcrowded', emoji: '🔴' };
}

// ==================== AUTH ROUTES ====================
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password are required' });
    
    const users = readDB('users');
    if (users.find(u => u.email === email)) return res.status(400).json({ error: 'Email already registered' });
    
    const allowedRole = (role === 'driver' || role === 'admin') ? 'passenger' : (role || 'passenger');
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      id: uuidv4(),
      name,
      email,
      password: hashedPassword,
      phone: phone || '',
      role: allowedRole,
      favouriteBuses: [],
      favouriteRoutes: [],
      recentSearches: [],
      createdAt: new Date().toISOString()
    };
    users.push(user);
    writeDB('users', users);
    
    const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    const { password: _, ...safeUser } = user;
    res.status(201).json({ token, user: safeUser });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const users = readDB('users');
    const user = users.find(u => u.email === email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    const { password: _, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = findById('users', req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { password, ...safeUser } = user;
  res.json(safeUser);
});

app.put('/api/auth/profile', authMiddleware, async (req, res) => {
  const { name, phone, currentPassword, newPassword } = req.body;
  const users = readDB('users');
  const idx = users.findIndex(u => u.id === req.user.id);
  if (idx === -1) return res.status(404).json({ error: 'User not found' });
  
  if (name) users[idx].name = name;
  if (phone !== undefined) users[idx].phone = phone;
  
  if (newPassword) {
    if (!currentPassword || !(await bcrypt.compare(currentPassword, users[idx].password))) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    users[idx].password = await bcrypt.hash(newPassword, 10);
  }
  users[idx].updatedAt = new Date().toISOString();
  writeDB('users', users);
  const { password, ...safeUser } = users[idx];
  res.json(safeUser);
});

// ==================== BUS ROUTES ====================
app.get('/api/buses', (req, res) => {
  const buses = readDB('buses');
  const trips = readDB('trips');
  const enriched = buses.map(bus => {
    const activeTrip = trips.find(t => t.busId === bus.id && t.status === 'active');
    const crowd = getCrowdLevel(activeTrip?.passengerCount ?? bus.currentPassengers, bus.capacity);
    return {
      ...bus,
      activeTrip: activeTrip ? {
        id: activeTrip.id,
        routeId: activeTrip.routeId,
        passengerCount: activeTrip.passengerCount,
        status: activeTrip.status,
        startedAt: activeTrip.startedAt,
        lastLocationUpdate: activeTrip.lastLocationUpdate,
        currentLocation: activeTrip.currentLocation,
        nextStop: activeTrip.nextStop,
        delay: activeTrip.delay
      } : null,
      crowd,
      passengerCount: activeTrip?.passengerCount ?? bus.currentPassengers ?? 0,
      availableSeats: Math.max(0, bus.capacity - (activeTrip?.passengerCount ?? bus.currentPassengers ?? 0))
    };
  });
  res.json(enriched);
});

app.get('/api/buses/:id', (req, res) => {
  const bus = findById('buses', req.params.id);
  if (!bus) return res.status(404).json({ error: 'Bus not found' });
  const trips = readDB('trips');
  const activeTrip = trips.find(t => t.busId === bus.id && t.status === 'active');
  const crowd = getCrowdLevel(activeTrip?.passengerCount ?? bus.currentPassengers, bus.capacity);
  res.json({
    ...bus,
    activeTrip: activeTrip || null,
    crowd,
    passengerCount: activeTrip?.passengerCount ?? bus.currentPassengers ?? 0,
    availableSeats: Math.max(0, bus.capacity - (activeTrip?.passengerCount ?? bus.currentPassengers ?? 0))
  });
});

app.post('/api/buses', authMiddleware, roleMiddleware('admin'), (req, res) => {
  const { busNumber, registrationNumber, capacity, type, status } = req.body;
  if (!busNumber || !capacity) return res.status(400).json({ error: 'Bus number and capacity are required' });
  
  const buses = readDB('buses');
  if (buses.find(b => b.busNumber === busNumber)) return res.status(400).json({ error: 'Bus number already exists' });
  
  const bus = {
    id: uuidv4(),
    busNumber,
    registrationNumber: registrationNumber || '',
    capacity: parseInt(capacity),
    type: type || 'Regular',
    status: status || 'active',
    currentPassengers: 0,
    currentLocation: null,
    createdAt: new Date().toISOString()
  };
  buses.push(bus);
  writeDB('buses', buses);
  res.status(201).json(bus);
});

app.put('/api/buses/:id', authMiddleware, roleMiddleware('admin'), (req, res) => {
  const updated = updateById('buses', req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Bus not found' });
  res.json(updated);
});

app.delete('/api/buses/:id', authMiddleware, roleMiddleware('admin'), (req, res) => {
  if (!deleteById('buses', req.params.id)) return res.status(404).json({ error: 'Bus not found' });
  res.json({ message: 'Bus deleted' });
});

// ==================== ROUTE ROUTES ====================
app.get('/api/routes', (req, res) => {
  res.json(readDB('routes'));
});

app.get('/api/routes/:id', (req, res) => {
  const route = findById('routes', req.params.id);
  if (!route) return res.status(404).json({ error: 'Route not found' });
  res.json(route);
});

app.post('/api/routes', authMiddleware, roleMiddleware('admin'), (req, res) => {
  const { name, source, destination, stops, distance, estimatedTime } = req.body;
  if (!name || !source || !destination) return res.status(400).json({ error: 'Name, source, and destination are required' });
  
  const route = {
    id: uuidv4(),
    name,
    source,
    destination,
    stops: stops || [],
    distance: distance || '',
    estimatedTime: estimatedTime || '',
    status: 'active',
    createdAt: new Date().toISOString()
  };
  const routes = readDB('routes');
  routes.push(route);
  writeDB('routes', routes);
  res.status(201).json(route);
});

app.put('/api/routes/:id', authMiddleware, roleMiddleware('admin'), (req, res) => {
  const updated = updateById('routes', req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Route not found' });
  res.json(updated);
});

app.delete('/api/routes/:id', authMiddleware, roleMiddleware('admin'), (req, res) => {
  if (!deleteById('routes', req.params.id)) return res.status(404).json({ error: 'Route not found' });
  res.json({ message: 'Route deleted' });
});

// ==================== DRIVER MANAGEMENT ====================
app.get('/api/drivers', authMiddleware, roleMiddleware('admin'), (req, res) => {
  const users = readDB('users');
  const drivers = users.filter(u => u.role === 'driver').map(({ password, ...d }) => d);
  res.json(drivers);
});

app.post('/api/drivers', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  const { name, email, password, phone, licenseNumber } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password required' });
  
  const users = readDB('users');
  if (users.find(u => u.email === email)) return res.status(400).json({ error: 'Email already exists' });
  
  const hashedPassword = await bcrypt.hash(password, 10);
  const driver = {
    id: uuidv4(),
    name,
    email,
    password: hashedPassword,
    phone: phone || '',
    licenseNumber: licenseNumber || '',
    role: 'driver',
    status: 'active',
    createdAt: new Date().toISOString()
  };
  users.push(driver);
  writeDB('users', users);
  const { password: _, ...safeDriver } = driver;
  res.status(201).json(safeDriver);
});

app.put('/api/drivers/:id', authMiddleware, roleMiddleware('admin'), (req, res) => {
  const users = readDB('users');
  const idx = users.findIndex(u => u.id === req.params.id && u.role === 'driver');
  if (idx === -1) return res.status(404).json({ error: 'Driver not found' });
  const { password, role, ...updates } = req.body;
  users[idx] = { ...users[idx], ...updates, updatedAt: new Date().toISOString() };
  writeDB('users', users);
  const { password: _, ...safe } = users[idx];
  res.json(safe);
});

app.delete('/api/drivers/:id', authMiddleware, roleMiddleware('admin'), (req, res) => {
  const users = readDB('users');
  const idx = users.findIndex(u => u.id === req.params.id && u.role === 'driver');
  if (idx === -1) return res.status(404).json({ error: 'Driver not found' });
  users.splice(idx, 1);
  writeDB('users', users);
  res.json({ message: 'Driver deleted' });
});

// ==================== TRIP ROUTES ====================
app.get('/api/trips', (req, res) => {
  const trips = readDB('trips');
  const buses = readDB('buses');
  const routes = readDB('routes');
  const users = readDB('users');
  
  const enriched = trips.map(trip => {
    const bus = buses.find(b => b.id === trip.busId);
    const route = routes.find(r => r.id === trip.routeId);
    const driver = users.find(u => u.id === trip.driverId);
    return {
      ...trip,
      busNumber: bus?.busNumber || 'Unknown',
      busCapacity: bus?.capacity || 0,
      routeName: route?.name || 'Unknown',
      routeSource: route?.source || '',
      routeDestination: route?.destination || '',
      routeStops: route?.stops || [],
      driverName: driver?.name || 'Unknown',
      crowd: getCrowdLevel(trip.passengerCount, bus?.capacity || 0),
      availableSeats: Math.max(0, (bus?.capacity || 0) - (trip.passengerCount || 0))
    };
  });
  
  if (req.query.status) {
    return res.json(enriched.filter(t => t.status === req.query.status));
  }
  res.json(enriched);
});

app.get('/api/trips/:id', (req, res) => {
  const trip = findById('trips', req.params.id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  const bus = findById('buses', trip.busId);
  const route = findById('routes', trip.routeId);
  res.json({
    ...trip,
    busNumber: bus?.busNumber,
    busCapacity: bus?.capacity,
    routeName: route?.name,
    routeStops: route?.stops,
    crowd: getCrowdLevel(trip.passengerCount, bus?.capacity || 0),
    availableSeats: Math.max(0, (bus?.capacity || 0) - (trip.passengerCount || 0))
  });
});

app.post('/api/trips', authMiddleware, roleMiddleware('admin'), (req, res) => {
  const { busId, routeId, driverId, scheduledStart } = req.body;
  if (!busId || !routeId || !driverId) return res.status(400).json({ error: 'Bus, route, and driver are required' });
  
  const trip = {
    id: uuidv4(),
    busId,
    routeId,
    driverId,
    status: 'scheduled',
    passengerCount: 0,
    currentLocation: null,
    nextStop: null,
    delay: null,
    scheduledStart: scheduledStart || new Date().toISOString(),
    startedAt: null,
    endedAt: null,
    lastLocationUpdate: null,
    locationHistory: [],
    occupancyHistory: [],
    incidents: [],
    createdAt: new Date().toISOString()
  };
  const trips = readDB('trips');
  trips.push(trip);
  writeDB('trips', trips);
  broadcastSSE('trip_created', { tripId: trip.id });
  res.status(201).json(trip);
});

// Driver: Start trip
app.post('/api/trips/:id/start', authMiddleware, roleMiddleware('driver'), (req, res) => {
  const trips = readDB('trips');
  const idx = trips.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Trip not found' });
  if (trips[idx].driverId !== req.user.id) return res.status(403).json({ error: 'Not your assigned trip' });
  if (trips[idx].status === 'active') return res.status(400).json({ error: 'Trip already active' });
  
  trips[idx].status = 'active';
  trips[idx].startedAt = new Date().toISOString();
  trips[idx].updatedAt = new Date().toISOString();
  writeDB('trips', trips);
  broadcastSSE('trip_started', { tripId: trips[idx].id, busId: trips[idx].busId });
  res.json(trips[idx]);
});

// Driver: End trip
app.post('/api/trips/:id/end', authMiddleware, roleMiddleware('driver'), (req, res) => {
  const trips = readDB('trips');
  const idx = trips.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Trip not found' });
  if (trips[idx].driverId !== req.user.id) return res.status(403).json({ error: 'Not your assigned trip' });
  
  trips[idx].status = 'completed';
  trips[idx].endedAt = new Date().toISOString();
  trips[idx].updatedAt = new Date().toISOString();
  writeDB('trips', trips);
  broadcastSSE('trip_ended', { tripId: trips[idx].id, busId: trips[idx].busId });
  res.json(trips[idx]);
});

// Driver: Update passenger count
app.post('/api/trips/:id/occupancy', authMiddleware, roleMiddleware('driver'), (req, res) => {
  const { passengerCount, action } = req.body;
  const trips = readDB('trips');
  const idx = trips.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Trip not found' });
  if (trips[idx].driverId !== req.user.id) return res.status(403).json({ error: 'Not your assigned trip' });
  
  const bus = findById('buses', trips[idx].busId);
  let newCount = trips[idx].passengerCount || 0;
  
  if (action === 'increment') newCount = Math.min(newCount + 1, (bus?.capacity || 100));
  else if (action === 'decrement') newCount = Math.max(newCount - 1, 0);
  else if (passengerCount != null) newCount = Math.max(0, Math.min(parseInt(passengerCount), bus?.capacity || 100));
  else return res.status(400).json({ error: 'Provide passengerCount or action' });
  
  trips[idx].passengerCount = newCount;
  trips[idx].updatedAt = new Date().toISOString();
  trips[idx].occupancyHistory = trips[idx].occupancyHistory || [];
  trips[idx].occupancyHistory.push({ count: newCount, timestamp: new Date().toISOString() });
  writeDB('trips', trips);
  
  const crowd = getCrowdLevel(newCount, bus?.capacity || 0);
  broadcastSSE('occupancy_update', {
    tripId: trips[idx].id,
    busId: trips[idx].busId,
    passengerCount: newCount,
    capacity: bus?.capacity,
    crowd,
    availableSeats: Math.max(0, (bus?.capacity || 0) - newCount)
  });
  
  // Create notification for significant crowd changes
  if (crowd.level === 'full' || crowd.level === 'high') {
    const notification = {
      id: uuidv4(),
      type: 'crowd_change',
      title: `Bus ${bus?.busNumber} - ${crowd.label}`,
      message: `Bus ${bus?.busNumber} is now ${crowd.label.toLowerCase()}. ${Math.max(0, (bus?.capacity || 0) - newCount)} seats remaining.`,
      busId: trips[idx].busId,
      tripId: trips[idx].id,
      crowd,
      createdAt: new Date().toISOString(),
      forRoles: ['passenger']
    };
    const notifications = readDB('notifications');
    // Avoid duplicate
    const recent = notifications.find(n => n.busId === notification.busId && n.type === 'crowd_change' && 
      new Date(n.createdAt) > new Date(Date.now() - 5 * 60000));
    if (!recent) {
      notifications.push(notification);
      writeDB('notifications', notifications);
      broadcastSSE('notification', notification);
    }
  }
  
  res.json({ passengerCount: newCount, crowd, availableSeats: Math.max(0, (bus?.capacity || 0) - newCount) });
});

// Driver: Mark bus as full
app.post('/api/trips/:id/mark-full', authMiddleware, roleMiddleware('driver'), (req, res) => {
  const trips = readDB('trips');
  const idx = trips.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Trip not found' });
  if (trips[idx].driverId !== req.user.id) return res.status(403).json({ error: 'Not your assigned trip' });
  
  const bus = findById('buses', trips[idx].busId);
  trips[idx].passengerCount = bus?.capacity || trips[idx].passengerCount;
  trips[idx].updatedAt = new Date().toISOString();
  writeDB('trips', trips);
  
  broadcastSSE('bus_full', { tripId: trips[idx].id, busId: trips[idx].busId, busNumber: bus?.busNumber });
  
  const notification = {
    id: uuidv4(),
    type: 'bus_full',
    title: `Bus ${bus?.busNumber} is Full`,
    message: `Bus ${bus?.busNumber} has reached full capacity.`,
    busId: trips[idx].busId,
    tripId: trips[idx].id,
    createdAt: new Date().toISOString(),
    forRoles: ['passenger']
  };
  const notifications = readDB('notifications');
  notifications.push(notification);
  writeDB('notifications', notifications);
  broadcastSSE('notification', notification);
  
  res.json({ message: 'Bus marked as full', passengerCount: trips[idx].passengerCount });
});

// Driver: Update location
app.post('/api/trips/:id/location', authMiddleware, roleMiddleware('driver'), (req, res) => {
  const { latitude, longitude, nextStop } = req.body;
  if (latitude == null || longitude == null) return res.status(400).json({ error: 'Latitude and longitude required' });
  
  const trips = readDB('trips');
  const idx = trips.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Trip not found' });
  if (trips[idx].driverId !== req.user.id) return res.status(403).json({ error: 'Not your assigned trip' });
  
  const location = { lat: parseFloat(latitude), lng: parseFloat(longitude), timestamp: new Date().toISOString() };
  trips[idx].currentLocation = location;
  trips[idx].lastLocationUpdate = new Date().toISOString();
  if (nextStop) trips[idx].nextStop = nextStop;
  trips[idx].locationHistory = trips[idx].locationHistory || [];
  trips[idx].locationHistory.push(location);
  trips[idx].updatedAt = new Date().toISOString();
  writeDB('trips', trips);
  
  broadcastSSE('location_update', {
    tripId: trips[idx].id,
    busId: trips[idx].busId,
    location,
    nextStop: trips[idx].nextStop
  });
  
  res.json({ message: 'Location updated', location });
});

// Driver: Report incident
app.post('/api/trips/:id/incident', authMiddleware, roleMiddleware('driver'), (req, res) => {
  const { type, description, severity } = req.body;
  if (!type) return res.status(400).json({ error: 'Incident type required' });
  
  const trips = readDB('trips');
  const idx = trips.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Trip not found' });
  if (trips[idx].driverId !== req.user.id) return res.status(403).json({ error: 'Not your assigned trip' });
  
  const bus = findById('buses', trips[idx].busId);
  const incident = {
    id: uuidv4(),
    tripId: trips[idx].id,
    busId: trips[idx].busId,
    driverId: req.user.id,
    type,
    description: description || '',
    severity: severity || 'medium',
    status: 'reported',
    createdAt: new Date().toISOString()
  };
  
  trips[idx].incidents = trips[idx].incidents || [];
  trips[idx].incidents.push(incident);
  if (type === 'delay') trips[idx].delay = { reported: true, description, reportedAt: new Date().toISOString() };
  writeDB('trips', trips);
  
  const incidents = readDB('incidents');
  incidents.push(incident);
  writeDB('incidents', incidents);
  
  const notification = {
    id: uuidv4(),
    type: `incident_${type}`,
    title: `${type.charAt(0).toUpperCase() + type.slice(1)} - Bus ${bus?.busNumber}`,
    message: description || `A ${type} has been reported for Bus ${bus?.busNumber}.`,
    busId: trips[idx].busId,
    tripId: trips[idx].id,
    incidentId: incident.id,
    severity,
    createdAt: new Date().toISOString(),
    forRoles: ['passenger', 'admin']
  };
  const notifications = readDB('notifications');
  notifications.push(notification);
  writeDB('notifications', notifications);
  broadcastSSE('incident', { incident, notification });
  
  res.status(201).json(incident);
});

// Driver: Get my trips
app.get('/api/driver/my-trips', authMiddleware, roleMiddleware('driver'), (req, res) => {
  const trips = readDB('trips');
  const buses = readDB('buses');
  const routes = readDB('routes');
  const myTrips = trips.filter(t => t.driverId === req.user.id).map(trip => {
    const bus = buses.find(b => b.id === trip.busId);
    const route = routes.find(r => r.id === trip.routeId);
    return {
      ...trip,
      busNumber: bus?.busNumber,
      busCapacity: bus?.capacity,
      routeName: route?.name,
      routeSource: route?.source,
      routeDestination: route?.destination,
      routeStops: route?.stops || [],
      crowd: getCrowdLevel(trip.passengerCount, bus?.capacity || 0),
      availableSeats: Math.max(0, (bus?.capacity || 0) - (trip.passengerCount || 0))
    };
  });
  res.json(myTrips);
});

// ==================== SEARCH ROUTES ====================
app.get('/api/search/buses', (req, res) => {
  const { source, destination } = req.query;
  if (!source && !destination) return res.status(400).json({ error: 'Provide source or destination' });
  
  const routes = readDB('routes');
  const trips = readDB('trips');
  const buses = readDB('buses');
  
  const matchingRoutes = routes.filter(route => {
    const allStops = [route.source, ...(route.stops || []).map(s => s.name || s), route.destination]
      .map(s => (s || '').toLowerCase());
    const srcMatch = !source || allStops.some(s => s.includes(source.toLowerCase()));
    const destMatch = !destination || allStops.some(s => s.includes(destination.toLowerCase()));
    return srcMatch && destMatch;
  });
  
  const results = [];
  matchingRoutes.forEach(route => {
    const routeTrips = trips.filter(t => t.routeId === route.id && (t.status === 'active' || t.status === 'scheduled'));
    routeTrips.forEach(trip => {
      const bus = buses.find(b => b.id === trip.busId);
      if (!bus) return;
      const crowd = getCrowdLevel(trip.passengerCount, bus.capacity);
      results.push({
        tripId: trip.id,
        busId: bus.id,
        busNumber: bus.busNumber,
        busType: bus.type,
        routeId: route.id,
        routeName: route.name,
        source: route.source,
        destination: route.destination,
        stops: route.stops,
        distance: route.distance,
        estimatedTime: route.estimatedTime,
        passengerCount: trip.passengerCount,
        capacity: bus.capacity,
        availableSeats: Math.max(0, bus.capacity - (trip.passengerCount || 0)),
        crowd,
        currentLocation: trip.currentLocation,
        lastLocationUpdate: trip.lastLocationUpdate,
        nextStop: trip.nextStop,
        delay: trip.delay,
        tripStatus: trip.status,
        startedAt: trip.startedAt
      });
    });
    
    // Also show buses assigned to this route without active trips
    if (routeTrips.length === 0) {
      const routeBuses = buses.filter(b => b.status === 'active');
      // Just indicate the route exists
    }
  });
  
  // Sort: least crowded first
  results.sort((a, b) => (a.passengerCount / a.capacity) - (b.passengerCount / b.capacity));
  
  // Save search to user's recent searches if authenticated
  const authHeader = req.headers.authorization;
  if (authHeader) {
    try {
      const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
      const users = readDB('users');
      const userIdx = users.findIndex(u => u.id === decoded.id);
      if (userIdx !== -1) {
        users[userIdx].recentSearches = users[userIdx].recentSearches || [];
        users[userIdx].recentSearches.unshift({ source, destination, timestamp: new Date().toISOString() });
        users[userIdx].recentSearches = users[userIdx].recentSearches.slice(0, 10);
        writeDB('users', users);
      }
    } catch (e) {}
  }
  
  res.json({ results, matchingRoutes: matchingRoutes.length, totalBuses: results.length });
});

// ==================== FAVOURITES ====================
app.post('/api/favourites/bus', authMiddleware, (req, res) => {
  const { busId } = req.body;
  const users = readDB('users');
  const idx = users.findIndex(u => u.id === req.user.id);
  if (idx === -1) return res.status(404).json({ error: 'User not found' });
  users[idx].favouriteBuses = users[idx].favouriteBuses || [];
  if (!users[idx].favouriteBuses.includes(busId)) {
    users[idx].favouriteBuses.push(busId);
  } else {
    users[idx].favouriteBuses = users[idx].favouriteBuses.filter(id => id !== busId);
  }
  writeDB('users', users);
  res.json({ favouriteBuses: users[idx].favouriteBuses });
});

app.post('/api/favourites/route', authMiddleware, (req, res) => {
  const { routeId } = req.body;
  const users = readDB('users');
  const idx = users.findIndex(u => u.id === req.user.id);
  if (idx === -1) return res.status(404).json({ error: 'User not found' });
  users[idx].favouriteRoutes = users[idx].favouriteRoutes || [];
  if (!users[idx].favouriteRoutes.includes(routeId)) {
    users[idx].favouriteRoutes.push(routeId);
  } else {
    users[idx].favouriteRoutes = users[idx].favouriteRoutes.filter(id => id !== routeId);
  }
  writeDB('users', users);
  res.json({ favouriteRoutes: users[idx].favouriteRoutes });
});

app.get('/api/favourites', authMiddleware, (req, res) => {
  const user = findById('users', req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const buses = readDB('buses');
  const routes = readDB('routes');
  res.json({
    buses: (user.favouriteBuses || []).map(id => buses.find(b => b.id === id)).filter(Boolean),
    routes: (user.favouriteRoutes || []).map(id => routes.find(r => r.id === id)).filter(Boolean),
    recentSearches: user.recentSearches || []
  });
});

// ==================== FEEDBACK ====================
app.post('/api/feedback', authMiddleware, (req, res) => {
  const { busId, tripId, type, message, rating } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });
  
  const feedback = {
    id: uuidv4(),
    userId: req.user.id,
    userName: req.user.name,
    busId: busId || null,
    tripId: tripId || null,
    type: type || 'general',
    message,
    rating: rating || null,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  const feedbacks = readDB('feedback');
  feedbacks.push(feedback);
  writeDB('feedback', feedbacks);
  res.status(201).json(feedback);
});

app.get('/api/feedback', authMiddleware, roleMiddleware('admin'), (req, res) => {
  res.json(readDB('feedback'));
});

app.put('/api/feedback/:id', authMiddleware, roleMiddleware('admin'), (req, res) => {
  const updated = updateById('feedback', req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Feedback not found' });
  res.json(updated);
});

// ==================== NOTIFICATIONS ====================
app.get('/api/notifications', authMiddleware, (req, res) => {
  const notifications = readDB('notifications');
  const userNotifications = notifications.filter(n => {
    if (n.userId === req.user.id) return true;
    if (n.forRoles && n.forRoles.includes(req.user.role)) return true;
    if (!n.userId && !n.forRoles) return true;
    return false;
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(userNotifications.slice(0, 50));
});

app.put('/api/notifications/:id/read', authMiddleware, (req, res) => {
  const updated = updateById('notifications', req.params.id, { read: true, readAt: new Date().toISOString(), readBy: req.user.id });
  if (!updated) return res.status(404).json({ error: 'Notification not found' });
  res.json(updated);
});

// Admin: Send announcement
app.post('/api/notifications/announce', authMiddleware, roleMiddleware('admin'), (req, res) => {
  const { title, message, forRoles } = req.body;
  if (!title || !message) return res.status(400).json({ error: 'Title and message required' });
  
  const notification = {
    id: uuidv4(),
    type: 'announcement',
    title,
    message,
    forRoles: forRoles || ['passenger', 'driver'],
    createdAt: new Date().toISOString()
  };
  const notifications = readDB('notifications');
  notifications.push(notification);
  writeDB('notifications', notifications);
  broadcastSSE('notification', notification);
  res.status(201).json(notification);
});

// ==================== INCIDENTS ====================
app.get('/api/incidents', authMiddleware, (req, res) => {
  res.json(readDB('incidents').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

app.put('/api/incidents/:id', authMiddleware, roleMiddleware('admin'), (req, res) => {
  const updated = updateById('incidents', req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Incident not found' });
  res.json(updated);
});

// ==================== ANALYTICS ====================
app.get('/api/analytics', authMiddleware, roleMiddleware('admin'), (req, res) => {
  const users = readDB('users');
  const buses = readDB('buses');
  const routes = readDB('routes');
  const trips = readDB('trips');
  const incidents = readDB('incidents');
  const feedback = readDB('feedback');
  
  const activeTrips = trips.filter(t => t.status === 'active');
  const completedTrips = trips.filter(t => t.status === 'completed');
  
  const crowdedBuses = activeTrips.filter(t => {
    const bus = buses.find(b => b.id === t.busId);
    if (!bus) return false;
    return (t.passengerCount / bus.capacity) > 0.7;
  });
  
  const fullBuses = activeTrips.filter(t => {
    const bus = buses.find(b => b.id === t.busId);
    if (!bus) return false;
    return (t.passengerCount / bus.capacity) > 0.95;
  });
  
  const totalCapacity = activeTrips.reduce((sum, t) => {
    const bus = buses.find(b => b.id === t.busId);
    return sum + (bus?.capacity || 0);
  }, 0);
  
  const totalPassengers = activeTrips.reduce((sum, t) => sum + (t.passengerCount || 0), 0);
  
  // Route crowd data
  const routeCrowdData = {};
  activeTrips.forEach(t => {
    const bus = buses.find(b => b.id === t.busId);
    const route = routes.find(r => r.id === t.routeId);
    if (route && bus) {
      if (!routeCrowdData[route.id]) {
        routeCrowdData[route.id] = { name: route.name, totalPassengers: 0, totalCapacity: 0, busCount: 0 };
      }
      routeCrowdData[route.id].totalPassengers += t.passengerCount || 0;
      routeCrowdData[route.id].totalCapacity += bus.capacity;
      routeCrowdData[route.id].busCount++;
    }
  });
  
  // Incident stats
  const incidentStats = {};
  incidents.forEach(i => {
    incidentStats[i.type] = (incidentStats[i.type] || 0) + 1;
  });
  
  // Trips per day (last 7 days)
  const tripsPerDay = {};
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();
  
  last7Days.forEach(day => {
    tripsPerDay[day] = trips.filter(t => t.createdAt && t.createdAt.startsWith(day)).length;
  });
  
  // Occupancy over time for active trips
  const occupancyTimeline = activeTrips.map(t => {
    const bus = buses.find(b => b.id === t.busId);
    return {
      busNumber: bus?.busNumber,
      history: (t.occupancyHistory || []).slice(-20)
    };
  });
  
  res.json({
    totalUsers: users.length,
    totalPassengers: users.filter(u => u.role === 'passenger').length,
    totalDrivers: users.filter(u => u.role === 'driver').length,
    totalBuses: buses.length,
    activeBuses: buses.filter(b => b.status === 'active').length,
    totalRoutes: routes.length,
    activeRoutes: routes.filter(r => r.status === 'active').length,
    totalTrips: trips.length,
    activeTrips: activeTrips.length,
    completedTrips: completedTrips.length,
    scheduledTrips: trips.filter(t => t.status === 'scheduled').length,
    crowdedBuses: crowdedBuses.length,
    fullBuses: fullBuses.length,
    averageOccupancy: totalCapacity > 0 ? Math.round((totalPassengers / totalCapacity) * 100) : 0,
    totalPassengersNow: totalPassengers,
    totalCapacityNow: totalCapacity,
    totalIncidents: incidents.length,
    openIncidents: incidents.filter(i => i.status === 'reported' || i.status === 'investigating').length,
    totalFeedback: feedback.length,
    pendingFeedback: feedback.filter(f => f.status === 'pending').length,
    routeCrowdData: Object.values(routeCrowdData),
    incidentStats,
    tripsPerDay,
    occupancyTimeline,
    last7Days
  });
});

// ==================== REPORTS ====================
app.get('/api/reports', authMiddleware, roleMiddleware('admin'), (req, res) => {
  const { startDate, endDate, routeId } = req.query;
  const trips = readDB('trips');
  const buses = readDB('buses');
  const routes = readDB('routes');
  const incidents = readDB('incidents');
  
  let filteredTrips = trips;
  if (startDate) filteredTrips = filteredTrips.filter(t => t.createdAt >= startDate);
  if (endDate) filteredTrips = filteredTrips.filter(t => t.createdAt <= endDate + 'T23:59:59');
  if (routeId) filteredTrips = filteredTrips.filter(t => t.routeId === routeId);
  
  const reportData = filteredTrips.map(t => {
    const bus = buses.find(b => b.id === t.busId);
    const route = routes.find(r => r.id === t.routeId);
    return {
      tripId: t.id,
      busNumber: bus?.busNumber || 'Unknown',
      routeName: route?.name || 'Unknown',
      status: t.status,
      passengerCount: t.passengerCount,
      capacity: bus?.capacity || 0,
      occupancyRate: bus?.capacity ? Math.round((t.passengerCount / bus.capacity) * 100) : 0,
      startedAt: t.startedAt,
      endedAt: t.endedAt,
      incidentCount: (t.incidents || []).length,
      createdAt: t.createdAt
    };
  });
  
  const filteredIncidents = incidents.filter(i => {
    if (startDate && i.createdAt < startDate) return false;
    if (endDate && i.createdAt > endDate + 'T23:59:59') return false;
    return true;
  });
  
  res.json({
    trips: reportData,
    summary: {
      totalTrips: reportData.length,
      completedTrips: reportData.filter(t => t.status === 'completed').length,
      averageOccupancy: reportData.length > 0 ? Math.round(reportData.reduce((s, t) => s + t.occupancyRate, 0) / reportData.length) : 0,
      totalIncidents: filteredIncidents.length
    },
    incidents: filteredIncidents
  });
});

// Export reports as CSV
app.get('/api/reports/export', authMiddleware, roleMiddleware('admin'), (req, res) => {
  const { startDate, endDate } = req.query;
  const trips = readDB('trips');
  const buses = readDB('buses');
  const routes = readDB('routes');
  
  let filteredTrips = trips;
  if (startDate) filteredTrips = filteredTrips.filter(t => t.createdAt >= startDate);
  if (endDate) filteredTrips = filteredTrips.filter(t => t.createdAt <= endDate + 'T23:59:59');
  
  let csv = 'Trip ID,Bus Number,Route,Status,Passengers,Capacity,Occupancy %,Started,Ended,Incidents\n';
  filteredTrips.forEach(t => {
    const bus = buses.find(b => b.id === t.busId);
    const route = routes.find(r => r.id === t.routeId);
    csv += `${t.id},${bus?.busNumber || ''},${route?.name || ''},${t.status},${t.passengerCount},${bus?.capacity || ''},${bus?.capacity ? Math.round(t.passengerCount / bus.capacity * 100) : ''}%,${t.startedAt || ''},${t.endedAt || ''},${(t.incidents || []).length}\n`;
  });
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=bus_report.csv');
  res.send(csv);
});

// ==================== ADMIN USER MANAGEMENT ====================
app.get('/api/admin/users', authMiddleware, roleMiddleware('admin'), (req, res) => {
  const users = readDB('users').map(({ password, ...u }) => u);
  res.json(users);
});

// ==================== SEED DATA ====================
app.post('/api/seed', async (req, res) => {
  // Only seed if empty
  const buses = readDB('buses');
  if (buses.length > 0) return res.json({ message: 'Data already seeded' });
  
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = {
    id: uuidv4(),
    name: 'Admin User',
    email: 'admin@smartbus.com',
    password: adminPassword,
    phone: '9876543210',
    role: 'admin',
    createdAt: new Date().toISOString()
  };
  
  // Create driver users
  const driverPassword = await bcrypt.hash('driver123', 10);
  const drivers = [
    { id: uuidv4(), name: 'Rajesh Kumar', email: 'rajesh@smartbus.com', password: driverPassword, phone: '9876543211', licenseNumber: 'DL-2024-001', role: 'driver', status: 'active', createdAt: new Date().toISOString() },
    { id: uuidv4(), name: 'Suresh Patel', email: 'suresh@smartbus.com', password: driverPassword, phone: '9876543212', licenseNumber: 'DL-2024-002', role: 'driver', status: 'active', createdAt: new Date().toISOString() },
    { id: uuidv4(), name: 'Amit Singh', email: 'amit@smartbus.com', password: driverPassword, phone: '9876543213', licenseNumber: 'DL-2024-003', role: 'driver', status: 'active', createdAt: new Date().toISOString() },
    { id: uuidv4(), name: 'Vikram Sharma', email: 'vikram@smartbus.com', password: driverPassword, phone: '9876543214', licenseNumber: 'DL-2024-004', role: 'driver', status: 'active', createdAt: new Date().toISOString() },
    { id: uuidv4(), name: 'Priya Verma', email: 'priya@smartbus.com', password: driverPassword, phone: '9876543215', licenseNumber: 'DL-2024-005', role: 'driver', status: 'active', createdAt: new Date().toISOString() }
  ];
  
  // Create passenger
  const passengerPassword = await bcrypt.hash('pass123', 10);
  const passenger = {
    id: uuidv4(),
    name: 'Demo Passenger',
    email: 'passenger@smartbus.com',
    password: passengerPassword,
    phone: '9876543220',
    role: 'passenger',
    favouriteBuses: [],
    favouriteRoutes: [],
    recentSearches: [],
    createdAt: new Date().toISOString()
  };
  
  const users = [admin, ...drivers, passenger];
  writeDB('users', users);
  
  // Create buses
  const busData = [
    { id: uuidv4(), busNumber: 'MH-101', registrationNumber: 'MH-01-AB-1234', capacity: 50, type: 'AC', status: 'active', currentPassengers: 0, createdAt: new Date().toISOString() },
    { id: uuidv4(), busNumber: 'MH-102', registrationNumber: 'MH-01-CD-5678', capacity: 45, type: 'Non-AC', status: 'active', currentPassengers: 0, createdAt: new Date().toISOString() },
    { id: uuidv4(), busNumber: 'MH-103', registrationNumber: 'MH-01-EF-9012', capacity: 55, type: 'AC', status: 'active', currentPassengers: 0, createdAt: new Date().toISOString() },
    { id: uuidv4(), busNumber: 'MH-104', registrationNumber: 'MH-01-GH-3456', capacity: 40, type: 'Mini', status: 'active', currentPassengers: 0, createdAt: new Date().toISOString() },
    { id: uuidv4(), busNumber: 'MH-105', registrationNumber: 'MH-01-IJ-7890', capacity: 60, type: 'AC Volvo', status: 'active', currentPassengers: 0, createdAt: new Date().toISOString() },
    { id: uuidv4(), busNumber: 'MH-106', registrationNumber: 'MH-01-KL-2345', capacity: 50, type: 'Non-AC', status: 'active', currentPassengers: 0, createdAt: new Date().toISOString() },
    { id: uuidv4(), busNumber: 'MH-107', registrationNumber: 'MH-01-MN-6789', capacity: 45, type: 'AC', status: 'maintenance', currentPassengers: 0, createdAt: new Date().toISOString() },
    { id: uuidv4(), busNumber: 'MH-108', registrationNumber: 'MH-01-OP-0123', capacity: 55, type: 'AC Volvo', status: 'active', currentPassengers: 0, createdAt: new Date().toISOString() }
  ];
  writeDB('buses', busData);
  
  // Create routes with stops including coordinates
  const routeData = [
    {
      id: uuidv4(), name: 'Route A - Central Line', source: 'Andheri Station', destination: 'CST Mumbai',
      stops: [
        { name: 'Andheri Station', lat: 19.1197, lng: 72.8464, order: 1 },
        { name: 'Vile Parle', lat: 19.0968, lng: 72.8494, order: 2 },
        { name: 'Bandra Station', lat: 19.0544, lng: 72.8402, order: 3 },
        { name: 'Dadar Station', lat: 19.0186, lng: 72.8425, order: 4 },
        { name: 'Parel', lat: 18.9977, lng: 72.8389, order: 5 },
        { name: 'Mumbai Central', lat: 18.9712, lng: 72.8197, order: 6 },
        { name: 'Marine Lines', lat: 18.9438, lng: 72.8228, order: 7 },
        { name: 'CST Mumbai', lat: 18.9398, lng: 72.8355, order: 8 }
      ],
      distance: '24 km', estimatedTime: '75 min', status: 'active', createdAt: new Date().toISOString()
    },
    {
      id: uuidv4(), name: 'Route B - Western Express', source: 'Borivali Station', destination: 'Churchgate',
      stops: [
        { name: 'Borivali Station', lat: 19.2307, lng: 72.8567, order: 1 },
        { name: 'Kandivali', lat: 19.2047, lng: 72.8527, order: 2 },
        { name: 'Malad', lat: 19.1868, lng: 72.8484, order: 3 },
        { name: 'Goregaon', lat: 19.1663, lng: 72.8494, order: 4 },
        { name: 'Jogeshwari', lat: 19.1364, lng: 72.8492, order: 5 },
        { name: 'Andheri', lat: 19.1197, lng: 72.8464, order: 6 },
        { name: 'Bandra', lat: 19.0544, lng: 72.8402, order: 7 },
        { name: 'Lower Parel', lat: 18.9930, lng: 72.8292, order: 8 },
        { name: 'Churchgate', lat: 18.9322, lng: 72.8264, order: 9 }
      ],
      distance: '35 km', estimatedTime: '100 min', status: 'active', createdAt: new Date().toISOString()
    },
    {
      id: uuidv4(), name: 'Route C - Harbour Line', source: 'Panvel', destination: 'CST Mumbai',
      stops: [
        { name: 'Panvel', lat: 18.9894, lng: 73.1175, order: 1 },
        { name: 'Vashi', lat: 19.0771, lng: 72.9987, order: 2 },
        { name: 'Nerul', lat: 19.0330, lng: 73.0169, order: 3 },
        { name: 'Belapur', lat: 19.0224, lng: 73.0394, order: 4 },
        { name: 'Chembur', lat: 19.0623, lng: 72.8969, order: 5 },
        { name: 'Kurla', lat: 19.0726, lng: 72.8794, order: 6 },
        { name: 'Sion', lat: 19.0405, lng: 72.8621, order: 7 },
        { name: 'CST Mumbai', lat: 18.9398, lng: 72.8355, order: 8 }
      ],
      distance: '42 km', estimatedTime: '120 min', status: 'active', createdAt: new Date().toISOString()
    },
    {
      id: uuidv4(), name: 'Route D - Thane Express', source: 'Thane Station', destination: 'Dadar',
      stops: [
        { name: 'Thane Station', lat: 19.1860, lng: 72.9757, order: 1 },
        { name: 'Mulund', lat: 19.1726, lng: 72.9565, order: 2 },
        { name: 'Bhandup', lat: 19.1486, lng: 72.9378, order: 3 },
        { name: 'Vikhroli', lat: 19.1130, lng: 72.9258, order: 4 },
        { name: 'Ghatkopar', lat: 19.0860, lng: 72.9080, order: 5 },
        { name: 'Sion', lat: 19.0405, lng: 72.8621, order: 6 },
        { name: 'Dadar', lat: 19.0186, lng: 72.8425, order: 7 }
      ],
      distance: '22 km', estimatedTime: '65 min', status: 'active', createdAt: new Date().toISOString()
    },
    {
      id: uuidv4(), name: 'Route E - Navi Mumbai Connector', source: 'Vashi', destination: 'Andheri',
      stops: [
        { name: 'Vashi', lat: 19.0771, lng: 72.9987, order: 1 },
        { name: 'Airoli', lat: 19.1556, lng: 72.9998, order: 2 },
        { name: 'Mulund', lat: 19.1726, lng: 72.9565, order: 3 },
        { name: 'Powai', lat: 19.1176, lng: 72.9060, order: 4 },
        { name: 'JVLR Junction', lat: 19.1153, lng: 72.8834, order: 5 },
        { name: 'Andheri', lat: 19.1197, lng: 72.8464, order: 6 }
      ],
      distance: '28 km', estimatedTime: '80 min', status: 'active', createdAt: new Date().toISOString()
    }
  ];
  writeDB('routes', routeData);
  
  // Create active trips with simulated data
  const now = new Date();
  const tripData = [
    {
      id: uuidv4(), busId: busData[0].id, routeId: routeData[0].id, driverId: drivers[0].id,
      status: 'active', passengerCount: 18, currentLocation: { lat: 19.0544, lng: 72.8402, timestamp: now.toISOString() },
      nextStop: 'Dadar Station', delay: null, scheduledStart: new Date(now - 3600000).toISOString(),
      startedAt: new Date(now - 3600000).toISOString(), endedAt: null,
      lastLocationUpdate: now.toISOString(), locationHistory: [], occupancyHistory: [
        { count: 5, timestamp: new Date(now - 3600000).toISOString() },
        { count: 12, timestamp: new Date(now - 2400000).toISOString() },
        { count: 18, timestamp: new Date(now - 1200000).toISOString() }
      ], incidents: [], createdAt: new Date(now - 3600000).toISOString()
    },
    {
      id: uuidv4(), busId: busData[1].id, routeId: routeData[1].id, driverId: drivers[1].id,
      status: 'active', passengerCount: 38, currentLocation: { lat: 19.1364, lng: 72.8492, timestamp: now.toISOString() },
      nextStop: 'Andheri', delay: null, scheduledStart: new Date(now - 5400000).toISOString(),
      startedAt: new Date(now - 5400000).toISOString(), endedAt: null,
      lastLocationUpdate: now.toISOString(), locationHistory: [], occupancyHistory: [
        { count: 10, timestamp: new Date(now - 5400000).toISOString() },
        { count: 25, timestamp: new Date(now - 3600000).toISOString() },
        { count: 38, timestamp: new Date(now - 1800000).toISOString() }
      ], incidents: [], createdAt: new Date(now - 5400000).toISOString()
    },
    {
      id: uuidv4(), busId: busData[2].id, routeId: routeData[2].id, driverId: drivers[2].id,
      status: 'active', passengerCount: 52, currentLocation: { lat: 19.0623, lng: 72.8969, timestamp: now.toISOString() },
      nextStop: 'Kurla', delay: { reported: true, description: 'Heavy traffic on Eastern Express Highway', reportedAt: new Date(now - 900000).toISOString() },
      scheduledStart: new Date(now - 7200000).toISOString(),
      startedAt: new Date(now - 7200000).toISOString(), endedAt: null,
      lastLocationUpdate: now.toISOString(), locationHistory: [], occupancyHistory: [
        { count: 15, timestamp: new Date(now - 7200000).toISOString() },
        { count: 35, timestamp: new Date(now - 5400000).toISOString() },
        { count: 52, timestamp: new Date(now - 3600000).toISOString() }
      ], incidents: [
        { id: uuidv4(), tripId: '', busId: busData[2].id, driverId: drivers[2].id, type: 'delay', description: 'Heavy traffic on Eastern Express Highway', severity: 'medium', status: 'reported', createdAt: new Date(now - 900000).toISOString() }
      ], createdAt: new Date(now - 7200000).toISOString()
    },
    {
      id: uuidv4(), busId: busData[3].id, routeId: routeData[3].id, driverId: drivers[3].id,
      status: 'active', passengerCount: 8, currentLocation: { lat: 19.1486, lng: 72.9378, timestamp: now.toISOString() },
      nextStop: 'Vikhroli', delay: null, scheduledStart: new Date(now - 1800000).toISOString(),
      startedAt: new Date(now - 1800000).toISOString(), endedAt: null,
      lastLocationUpdate: now.toISOString(), locationHistory: [], occupancyHistory: [
        { count: 3, timestamp: new Date(now - 1800000).toISOString() },
        { count: 8, timestamp: new Date(now - 600000).toISOString() }
      ], incidents: [], createdAt: new Date(now - 1800000).toISOString()
    },
    {
      id: uuidv4(), busId: busData[4].id, routeId: routeData[4].id, driverId: drivers[4].id,
      status: 'active', passengerCount: 45, currentLocation: { lat: 19.1176, lng: 72.9060, timestamp: now.toISOString() },
      nextStop: 'JVLR Junction', delay: null, scheduledStart: new Date(now - 4200000).toISOString(),
      startedAt: new Date(now - 4200000).toISOString(), endedAt: null,
      lastLocationUpdate: now.toISOString(), locationHistory: [], occupancyHistory: [
        { count: 20, timestamp: new Date(now - 4200000).toISOString() },
        { count: 35, timestamp: new Date(now - 2400000).toISOString() },
        { count: 45, timestamp: new Date(now - 600000).toISOString() }
      ], incidents: [], createdAt: new Date(now - 4200000).toISOString()
    },
    // A scheduled trip
    {
      id: uuidv4(), busId: busData[5].id, routeId: routeData[0].id, driverId: drivers[0].id,
      status: 'scheduled', passengerCount: 0, currentLocation: null,
      nextStop: null, delay: null, scheduledStart: new Date(now.getTime() + 3600000).toISOString(),
      startedAt: null, endedAt: null,
      lastLocationUpdate: null, locationHistory: [], occupancyHistory: [],
      incidents: [], createdAt: now.toISOString()
    }
  ];
  
  // Fix incident tripId references
  if (tripData[2].incidents[0]) tripData[2].incidents[0].tripId = tripData[2].id;
  
  writeDB('trips', tripData);
  writeDB('incidents', tripData[2].incidents);
  writeDB('notifications', [
    {
      id: uuidv4(), type: 'announcement', title: 'Welcome to SmartBus!',
      message: 'Our Smart Bus Crowd Monitoring System is now live. Track buses, check crowd levels, and plan your journey efficiently!',
      forRoles: ['passenger', 'driver', 'admin'], createdAt: new Date(now - 86400000).toISOString()
    },
    {
      id: uuidv4(), type: 'incident_delay', title: 'Delay - Bus MH-103',
      message: 'Heavy traffic on Eastern Express Highway. Bus MH-103 on Route C may be delayed.',
      busId: busData[2].id, forRoles: ['passenger'], createdAt: new Date(now - 900000).toISOString()
    }
  ]);
  writeDB('feedback', [
    {
      id: uuidv4(), userId: passenger.id, userName: 'Demo Passenger', busId: busData[0].id,
      type: 'suggestion', message: 'The AC on Bus MH-101 was not working properly during my morning commute.', rating: 3,
      status: 'pending', createdAt: new Date(now - 172800000).toISOString()
    }
  ]);
  
  res.json({ message: 'Database seeded with demo data', credentials: {
    admin: { email: 'admin@smartbus.com', password: 'admin123' },
    driver: { email: 'rajesh@smartbus.com', password: 'driver123' },
    passenger: { email: 'passenger@smartbus.com', password: 'pass123' }
  }});
});

// ==================== CATCH-ALL ====================
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🚌 SmartBus Server running at http://localhost:${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api`);
  console.log(`\nSeed demo data: POST http://localhost:${PORT}/api/seed\n`);
});
