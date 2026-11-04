const express = require('express');
const router = express.Router();
const env = require('../config/env');

const DEV_DEMO_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Real-time Features Dev Demo & Monitor</title>
  <!-- Load Socket.IO client directly from local server (no external CDN needed) -->
  <script src="/socket.io/socket.io.js"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0d1117;
      --card-bg: #161b22;
      --border: #30363d;
      --text: #c9d1d9;
      --text-muted: #8b949e;
      --primary: #58a6ff;
      --primary-hover: #1f6feb;
      --success: #2ea043;
      --warning: #d29922;
      --danger: #f85149;
      --purple: #bc8cff;
      --badge-price: #238636;
      --badge-cart: #1f6feb;
      --badge-stock: #d29922;
      --badge-avail: #8957e5;
      --badge-unavail: #da3633;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.5;
      padding: 24px;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
    }

    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 24px;
    }

    h1 {
      font-size: 1.5rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .status-badge {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 20px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .status-disconnected { background: #21262d; color: var(--text-muted); border: 1px solid var(--border); }
    .status-connected { background: rgba(46, 160, 67, 0.2); color: #3fb950; border: 1px solid var(--success); }
    .status-connecting { background: rgba(210, 153, 34, 0.2); color: #e3b341; border: 1px solid var(--warning); }
    .status-error { background: rgba(248, 81, 73, 0.2); color: #f85149; border: 1px solid var(--danger); }

    .grid {
      display: grid;
      grid-template-columns: 420px 1fr;
      gap: 24px;
    }

    @media (max-width: 960px) {
      .grid { grid-template-columns: 1fr; }
    }

    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
    }

    .card h2 {
      font-size: 1rem;
      font-weight: 600;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    label {
      display: block;
      font-size: 0.8rem;
      font-weight: 500;
      color: var(--text-muted);
      margin-bottom: 6px;
    }

    input, textarea {
      width: 100%;
      background: #0d1117;
      border: 1px solid var(--border);
      color: var(--text);
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
      padding: 8px 12px;
      border-radius: 6px;
      margin-bottom: 14px;
      outline: none;
    }

    input:focus, textarea:focus {
      border-color: var(--primary);
    }

    textarea {
      resize: vertical;
      min-height: 70px;
    }

    button {
      background: var(--primary);
      color: #fff;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
      transition: background 0.15s ease;
    }

    button:hover { background: var(--primary-hover); }
    button.secondary { background: #21262d; border: 1px solid var(--border); color: var(--text); }
    button.secondary:hover { background: #30363d; }
    button.danger { background: var(--danger); }
    button.danger:hover { background: #da3633; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }

    .btn-group {
      display: flex;
      gap: 10px;
      margin-bottom: 14px;
    }

    .sub-list {
      list-style: none;
      max-height: 180px;
      overflow-y: auto;
      border: 1px solid var(--border);
      border-radius: 6px;
      background: #0d1117;
      padding: 6px;
    }

    .sub-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
      padding: 6px 10px;
      border-radius: 4px;
      background: #161b22;
      margin-bottom: 4px;
    }

    .sub-item button {
      padding: 2px 8px;
      font-size: 0.7rem;
    }

    .stream-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
    }

    .filter-group {
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
    }

    .filter-btn {
      padding: 4px 10px;
      font-size: 0.75rem;
      border-radius: 12px;
      background: #21262d;
      color: var(--text-muted);
      border: 1px solid var(--border);
      cursor: pointer;
    }

    .filter-btn.active {
      background: var(--primary);
      color: white;
      border-color: var(--primary);
    }

    .event-log {
      height: 600px;
      overflow-y: auto;
      border: 1px solid var(--border);
      border-radius: 6px;
      background: #0d1117;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      font-family: 'JetBrains Mono', monospace;
    }

    .event-card {
      background: #161b22;
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 12px;
      transition: border-color 0.2s ease;
    }

    .event-card:hover {
      border-color: #58a6ff;
    }

    .event-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      font-size: 0.75rem;
    }

    .event-tag {
      padding: 2px 8px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 0.7rem;
      color: white;
    }

    .tag-product-priceUpdated { background: var(--badge-price); }
    .tag-cart-priceChanged { background: var(--badge-cart); }
    .tag-product-stockUpdated { background: var(--badge-stock); }
    .tag-product-availabilityChanged { background: var(--badge-avail); }
    .tag-cart-itemUnavailable { background: var(--badge-unavail); }

    .event-time { color: var(--text-muted); font-size: 0.75rem; }

    pre {
      background: #090d13;
      padding: 10px;
      border-radius: 4px;
      overflow-x: auto;
      font-size: 0.8rem;
      color: #79c0ff;
    }

    .instructions {
      font-size: 0.8rem;
      color: var(--text-muted);
      line-height: 1.6;
    }

    .instructions code {
      font-family: 'JetBrains Mono', monospace;
      background: #0d1117;
      padding: 2px 5px;
      border-radius: 4px;
      color: var(--primary);
    }

    .instructions ol {
      margin-left: 18px;
      margin-top: 8px;
    }

    .instructions li { margin-bottom: 6px; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div>
        <h1>⚡ Real-time Features Dev Demo & Monitor</h1>
        <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 4px;">
          Live Socket.IO event monitor for prices, stock, cart sync, and admin moderation.
        </p>
      </div>
      <div>
        <span id="connBadge" class="status-badge status-disconnected">Disconnected</span>
      </div>
    </header>

    <div class="grid">
      <!-- Left Column: Controls -->
      <div>
        <!-- Connection Card -->
        <div class="card">
          <h2>1. Connection & Auth</h2>
          <label for="serverUrl">Socket Server URL</label>
          <input type="text" id="serverUrl" value="">

          <label for="jwtToken">JWT Token (Customer, Vendor, or Admin)</label>
          <textarea id="jwtToken" placeholder="Paste Bearer token here..."></textarea>

          <div class="btn-group">
            <button id="btnConnect" onclick="connectSocket()">Connect</button>
            <button id="btnDisconnect" class="secondary" onclick="disconnectSocket()" disabled>Disconnect</button>
          </div>

          <div id="sessionInfo" style="display: none; margin-top: 10px; padding: 10px; background: #0d1117; border-radius: 6px; font-size: 0.75rem; font-family: 'JetBrains Mono', monospace;">
            <div><strong>Socket ID:</strong> <span id="infoSocketId">-</span></div>
            <div><strong>User ID:</strong> <span id="infoUserId">-</span></div>
            <div><strong>Role:</strong> <span id="infoRole">-</span></div>
            <div><strong>Personal Room:</strong> <span id="infoRoom">-</span></div>
          </div>
        </div>

        <!-- Subscriptions Card -->
        <div class="card">
          <h2>2. Product Subscriptions</h2>
          <label for="productInput">Product UUID(s) (comma-separated)</label>
          <input type="text" id="productInput" placeholder="e.g. 77a15e42-6857-470c-b5bc-c180d342cb51">

          <div class="btn-group">
            <button id="btnSubscribe" onclick="subscribeProducts()" disabled>Subscribe</button>
            <button id="btnUnsubscribe" class="secondary" onclick="unsubscribeProducts()" disabled>Unsubscribe</button>
          </div>

          <label>Active Product Subscriptions (<span id="subCount">0</span>/100):</label>
          <ul id="subList" class="sub-list">
            <li style="color: var(--text-muted); font-size: 0.75rem; padding: 6px 10px;">No active subscriptions</li>
          </ul>
        </div>

        <!-- Instructions Card -->
        <div class="card">
          <h2>📖 Testing Walkthrough</h2>
          <div class="instructions">
            <ol>
              <li>Log in via Postman (e.g. <code>POST /api/v1/customer/auth/verify-otp</code> or <code>POST /api/v1/vendor/auth/login</code>) and paste the returned <code>token</code> above.</li>
              <li>Click <strong>Connect</strong> to authenticate and join your personal room (<code>customer:&lt;id&gt;</code> or <code>vendor:&lt;id&gt;</code>).</li>
              <li>Paste a visible product's UUID into the input and click <strong>Subscribe</strong>.</li>
              <li>Trigger business operations in Postman:
                <ul style="margin-left: 14px; margin-top: 4px;">
                  <li>Vendor updates price $\\rightarrow$ watch <code>product:priceUpdated</code> and <code>cart:priceChanged</code>.</li>
                  <li>Customer places order $\\rightarrow$ watch <code>product:stockUpdated</code>.</li>
                  <li>Admin disables product $\\rightarrow$ watch <code>product:availabilityChanged</code> and <code>cart:itemUnavailable</code>.</li>
                </ul>
              </li>
            </ol>
          </div>
        </div>
      </div>

      <!-- Right Column: Live Event Stream -->
      <div>
        <div class="card" style="margin-bottom: 0;">
          <div class="stream-header">
            <h2>Live Event Stream (<span id="eventCount">0</span>)</h2>
            <div style="display: flex; gap: 8px;">
              <button class="secondary" style="padding: 4px 10px; font-size: 0.75rem;" onclick="clearLog()">Clear Stream</button>
            </div>
          </div>

          <div class="filter-group" style="margin-bottom: 12px;">
            <button class="filter-btn active" data-filter="ALL" onclick="setFilter('ALL')">All Events</button>
            <button class="filter-btn" data-filter="product:priceUpdated" onclick="setFilter('product:priceUpdated')">priceUpdated</button>
            <button class="filter-btn" data-filter="cart:priceChanged" onclick="setFilter('cart:priceChanged')">cart:priceChanged</button>
            <button class="filter-btn" data-filter="product:stockUpdated" onclick="setFilter('product:stockUpdated')">stockUpdated</button>
            <button class="filter-btn" data-filter="product:availabilityChanged" onclick="setFilter('product:availabilityChanged')">availabilityChanged</button>
            <button class="filter-btn" data-filter="cart:itemUnavailable" onclick="setFilter('cart:itemUnavailable')">itemUnavailable</button>
          </div>

          <div id="eventLog" class="event-log">
            <div style="color: var(--text-muted); text-align: center; margin-top: 150px; font-size: 0.85rem;">
              Waiting for Socket.IO connection and events...
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
    let socket = null;
    const activeSubscriptions = new Set();
    const eventRecords = [];
    let currentFilter = 'ALL';

    document.getElementById('serverUrl').value = window.location.origin;

    function parseJwt(token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
      } catch (e) {
        return null;
      }
    }

    function updateConnBadge(status, text) {
      const b = document.getElementById('connBadge');
      b.className = 'status-badge status-' + status;
      b.textContent = text;
    }

    function connectSocket() {
      if (typeof io === 'undefined') {
        alert('Socket.IO client library could not be loaded. Please ensure the server is running and reload the page.');
        updateConnBadge('error', 'io not loaded');
        return;
      }

      const url = document.getElementById('serverUrl').value.trim() || window.location.origin;
      const token = document.getElementById('jwtToken').value.trim();

      if (!token) {
        alert('Please paste a JWT token to connect.');
        return;
      }

      updateConnBadge('connecting', 'Connecting...');
      document.getElementById('btnConnect').disabled = true;

      socket = io(url, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socket.on('connect', () => {
        updateConnBadge('connected', 'Connected');
        document.getElementById('btnDisconnect').disabled = false;
        document.getElementById('btnSubscribe').disabled = false;
        document.getElementById('btnUnsubscribe').disabled = false;

        const decoded = parseJwt(token);
        document.getElementById('sessionInfo').style.display = 'block';
        document.getElementById('infoSocketId').textContent = socket.id;
        document.getElementById('infoUserId').textContent = decoded ? decoded.sub : 'Unknown';
        document.getElementById('infoRole').textContent = decoded ? decoded.role : 'Unknown';
        document.getElementById('infoRoom').textContent = decoded ? (decoded.role === 'admin' ? 'admin' : decoded.role + ':' + decoded.sub) : '-';

        addLogEntry('SYSTEM:CONNECTED', {
          socketId: socket.id,
          user: decoded,
          timestamp: new Date().toISOString()
        });
      });

      socket.on('connect_error', (err) => {
        updateConnBadge('error', 'Auth Error');
        document.getElementById('btnConnect').disabled = false;
        document.getElementById('btnDisconnect').disabled = true;
        document.getElementById('btnSubscribe').disabled = true;
        document.getElementById('btnUnsubscribe').disabled = true;
        document.getElementById('sessionInfo').style.display = 'none';

        addLogEntry('SYSTEM:ERROR', {
          message: err.message,
          data: err.data || null,
          timestamp: new Date().toISOString()
        });
      });

      socket.on('disconnect', (reason) => {
        updateConnBadge('disconnected', 'Disconnected');
        document.getElementById('btnConnect').disabled = false;
        document.getElementById('btnDisconnect').disabled = true;
        document.getElementById('btnSubscribe').disabled = true;
        document.getElementById('btnUnsubscribe').disabled = true;
        document.getElementById('sessionInfo').style.display = 'none';

        addLogEntry('SYSTEM:DISCONNECTED', {
          reason,
          timestamp: new Date().toISOString()
        });
      });

      // Register server business events
      const serverEvents = [
        'product:priceUpdated',
        'cart:priceChanged',
        'product:stockUpdated',
        'product:availabilityChanged',
        'cart:itemUnavailable'
      ];

      serverEvents.forEach(evt => {
        socket.on(evt, (payload) => {
          addLogEntry(evt, payload);
        });
      });
    }

    function disconnectSocket() {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
    }

    function subscribeProducts() {
      if (!socket || !socket.connected) return;
      const raw = document.getElementById('productInput').value.trim();
      if (!raw) return;

      const ids = raw.split(',').map(s => s.trim()).filter(Boolean);
      socket.emit('product:subscribe', { productIds: ids }, (ack) => {
        addLogEntry('ACK:product:subscribe', ack);
        if (ack && ack.success && Array.isArray(ack.subscribed)) {
          ack.subscribed.forEach(id => activeSubscriptions.add(id));
          renderSubscriptions();
        }
      });
    }

    function unsubscribeProducts() {
      if (!socket || !socket.connected) return;
      const raw = document.getElementById('productInput').value.trim();
      if (!raw) return;

      const ids = raw.split(',').map(s => s.trim()).filter(Boolean);
      socket.emit('product:unsubscribe', { productIds: ids }, (ack) => {
        addLogEntry('ACK:product:unsubscribe', ack);
        if (ack && ack.success && Array.isArray(ack.unsubscribed)) {
          ack.unsubscribed.forEach(id => activeSubscriptions.delete(id));
          renderSubscriptions();
        }
      });
    }

    function unsubscribeSingle(id) {
      if (!socket || !socket.connected) return;
      socket.emit('product:unsubscribe', { productIds: [id] }, (ack) => {
        addLogEntry('ACK:product:unsubscribe', ack);
        activeSubscriptions.delete(id);
        renderSubscriptions();
      });
    }

    function renderSubscriptions() {
      const list = document.getElementById('subList');
      document.getElementById('subCount').textContent = activeSubscriptions.size;
      if (activeSubscriptions.size === 0) {
        list.innerHTML = '<li style="color: var(--text-muted); font-size: 0.75rem; padding: 6px 10px;">No active subscriptions</li>';
        return;
      }

      list.innerHTML = '';
      activeSubscriptions.forEach(id => {
        const li = document.createElement('li');
        li.className = 'sub-item';
        li.innerHTML = '<span>' + id + '</span><button class="danger" onclick="unsubscribeSingle(\\'' + id + '\\')">Unsub</button>';
        list.appendChild(li);
      });
    }

    function addLogEntry(eventName, payload) {
      const entry = {
        id: Date.now() + Math.random(),
        eventName,
        payload,
        time: new Date().toLocaleTimeString()
      };

      eventRecords.unshift(entry);
      document.getElementById('eventCount').textContent = eventRecords.length;
      renderLog();
    }

    function getTagClass(eventName) {
      const sanitized = eventName.replace(':', '-');
      return 'tag-' + sanitized;
    }

    function renderLog() {
      const container = document.getElementById('eventLog');
      const filtered = currentFilter === 'ALL'
        ? eventRecords
        : eventRecords.filter(r => r.eventName === currentFilter);

      if (filtered.length === 0) {
        container.innerHTML = '<div style="color: var(--text-muted); text-align: center; margin-top: 150px; font-size: 0.85rem;">No matching events in stream.</div>';
        return;
      }

      container.innerHTML = '';
      filtered.forEach(item => {
        const div = document.createElement('div');
        div.className = 'event-card';

        const tagClass = getTagClass(item.eventName);
        div.innerHTML = \`
          <div class="event-meta">
            <div>
              <span class="event-tag \${tagClass}">\${item.eventName}</span>
            </div>
            <span class="event-time">\${item.time}</span>
          </div>
          <pre>\${JSON.stringify(item.payload, null, 2)}</pre>
        \`;
        container.appendChild(div);
      });
    }

    function setFilter(filter) {
      currentFilter = filter;
      document.querySelectorAll('.filter-btn').forEach(btn => {
        if (btn.getAttribute('data-filter') === filter) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
      renderLog();
    }

    function clearLog() {
      eventRecords.length = 0;
      document.getElementById('eventCount').textContent = '0';
      renderLog();
    }
  </script>
</body>
</html>
`;

/**
 * Serves the interactive developer testing demo page at GET /dev/realtime.
 * In production environments (NODE_ENV=production), returns 404 Not Found.
 */
router.get('/dev/realtime', (req, res) => {
  if (env.NODE_ENV === 'production') {
    return res.status(404).send('Cannot GET /dev/realtime - Not found in production.');
  }

  res.type('html').send(DEV_DEMO_HTML);
});

module.exports = router;

