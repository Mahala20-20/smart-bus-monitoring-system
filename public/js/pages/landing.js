// ==================== LANDING PAGE ====================
const LandingPage = {
  render() {
    return `
      ${Components.renderNavbar()}
      
      <section class="landing-hero">
        <div class="landing-hero-content">
          <div class="hero-text animate-slide-up">
            <h1>Never Board an <span class="highlight">Overcrowded</span> Bus Again</h1>
            <p>SmartBus gives you real-time crowd levels, live tracking, seat availability, and estimated arrivals — so you can plan your journey with confidence.</p>
            <div class="hero-cta">
              <button class="btn btn-primary btn-lg" onclick="Router.navigate('register')">
                Get Started Free →
              </button>
              <button class="btn btn-secondary btn-lg" onclick="Router.navigate('login')" style="background:rgba(255,255,255,0.08);color:white;border:1px solid rgba(255,255,255,0.15)">
                Sign In
              </button>
            </div>
            <div class="demo-creds">
              <h4>🔑 Demo Credentials</h4>
              <div class="cred-row">
                <span class="cred-role">Admin</span>
                <span class="cred-email">admin@smartbus.com</span>
                <span class="cred-pass">admin123</span>
              </div>
              <div class="cred-row">
                <span class="cred-role">Driver</span>
                <span class="cred-email">rajesh@smartbus.com</span>
                <span class="cred-pass">driver123</span>
              </div>
              <div class="cred-row">
                <span class="cred-role">Passenger</span>
                <span class="cred-email">passenger@smartbus.com</span>
                <span class="cred-pass">pass123</span>
              </div>
            </div>
          </div>
          <div class="hero-visual animate-scale">
            <div class="hero-bus-card">
              <div class="hbc-header">
                <span class="hbc-bus-no">🚌 MH-101</span>
                <span class="hbc-live">LIVE</span>
              </div>
              <div class="hbc-route">Andheri Station → CST Mumbai</div>
              <div class="hbc-crowd-row">
                <span class="hbc-crowd-label">Crowd Level</span>
                <span class="hbc-crowd-value">🟢 Low</span>
              </div>
              <div class="hbc-bar"><div class="hbc-bar-fill"></div></div>
              <div class="hbc-stats">
                <div class="hbc-stat"><div class="hbc-stat-val">18</div><div class="hbc-stat-lbl">Passengers</div></div>
                <div class="hbc-stat"><div class="hbc-stat-val">50</div><div class="hbc-stat-lbl">Capacity</div></div>
                <div class="hbc-stat"><div class="hbc-stat-val">32</div><div class="hbc-stat-lbl">Available</div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="landing-features">
        <div class="section-header">
          <h2>Smart Features for Smart Commuters</h2>
          <p>Everything you need to make informed travel decisions and avoid overcrowded buses.</p>
        </div>
        <div class="features-grid">
          <div class="feature-card animate-fade">
            <div class="feature-icon">📊</div>
            <h3>Real-Time Crowd Levels</h3>
            <p>Color-coded indicators show you exactly how crowded each bus is — green for empty, red for full.</p>
          </div>
          <div class="feature-card animate-fade">
            <div class="feature-icon">🗺️</div>
            <h3>Live Bus Tracking</h3>
            <p>See bus locations on an interactive map with real-time updates and estimated arrival times.</p>
          </div>
          <div class="feature-card animate-fade">
            <div class="feature-icon">🔍</div>
            <h3>Smart Route Search</h3>
            <p>Enter your source and destination to find all available buses, sorted by crowd level.</p>
          </div>
          <div class="feature-card animate-fade">
            <div class="feature-icon">💺</div>
            <h3>Seat Availability</h3>
            <p>Check exactly how many seats are available on each bus before you decide to board.</p>
          </div>
          <div class="feature-card animate-fade">
            <div class="feature-icon">🔔</div>
            <h3>Smart Notifications</h3>
            <p>Get alerts about delays, crowd changes, breakdowns, and approaching buses.</p>
          </div>
          <div class="feature-card animate-fade">
            <div class="feature-icon">📈</div>
            <h3>Analytics Dashboard</h3>
            <p>Administrators get detailed analytics on routes, occupancy patterns, and system performance.</p>
          </div>
        </div>
      </section>

      <section class="landing-how">
        <div class="section-header" style="text-align:center;margin-bottom:56px;">
          <h2>How It Works</h2>
          <p>A simple, seamless workflow connecting passengers, drivers, and administrators.</p>
        </div>
        <div class="how-steps">
          <div class="how-step animate-fade">
            <div class="how-step-number">1</div>
            <h3>Admin Sets Up</h3>
            <p>Administrators add buses, routes, stops, and assign drivers to create the transport network.</p>
          </div>
          <div class="how-step animate-fade">
            <div class="how-step-number">2</div>
            <h3>Driver Starts Trip</h3>
            <p>Drivers start trips, share GPS location, and update passenger counts as people board or alight.</p>
          </div>
          <div class="how-step animate-fade">
            <div class="how-step-number">3</div>
            <h3>System Calculates</h3>
            <p>The system computes crowd levels, seat availability, and estimated arrivals in real time.</p>
          </div>
          <div class="how-step animate-fade">
            <div class="how-step-number">4</div>
            <h3>Passengers Decide</h3>
            <p>Passengers search, compare options, and choose the least crowded bus for their journey.</p>
          </div>
        </div>
      </section>

      <section class="landing-cta">
        <h2>Ready to Travel Smarter?</h2>
        <p>Join SmartBus and never wait for an overcrowded bus again.</p>
        <button class="btn btn-lg" style="background:white;color:var(--navy-800);font-weight:700" onclick="Router.navigate('register')">
          Create Free Account →
        </button>
      </section>

      <footer class="landing-footer">
        <p>© 2024 SmartBus — Smart Bus Crowd Monitoring System. Built for better public transport.</p>
      </footer>
    `;
  }
};
