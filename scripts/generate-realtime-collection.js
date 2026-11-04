const fs = require('fs');
const path = require('path');

function visualizerSnippet(title, eventName, targetRoom, expectedPayloadJson, instructions) {
  const escapedPayload = expectedPayloadJson
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$');
  const escapedInstructions = instructions
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$');

  return `
    try {
      pm.visualizer.set(\`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0d1117; color: #c9d1d9; padding: 20px; margin: 0; }
            .card { background: #161b22; border: 1px solid #30363d; border-radius: 10px; padding: 22px; max-width: 680px; margin: 0 auto; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
            .badge { display: inline-block; background: rgba(56, 139, 253, 0.15); color: #58a6ff; border: 1px solid #388bfd; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
            h2 { margin: 10px 0 6px 0; color: #f0f6fc; font-size: 18px; }
            .meta { color: #8b949e; font-size: 13px; margin-bottom: 14px; }
            .highlight { background: #090d13; border: 1px solid #30363d; border-radius: 6px; padding: 12px; margin: 12px 0; font-family: monospace; font-size: 12px; color: #79c0ff; overflow-x: auto; }
            .tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; color: white; background: #238636; }
            .tag-room { background: #8957e5; }
            .steps { background: rgba(56, 139, 253, 0.08); border-left: 3px solid #58a6ff; border-radius: 4px; padding: 12px 16px; font-size: 13px; color: #c9d1d9; line-height: 1.5; margin-top: 14px; }
            .button { display: inline-block; background: #238636; color: white !important; font-weight: 600; text-decoration: none; padding: 9px 18px; border-radius: 6px; font-size: 13px; margin-top: 10px; }
            .button:hover { background: #2ea043; }
          </style>
        </head>
        <body>
          <div class="card">
            <span class="badge">Real-Time Event Broadcast</span>
            <h2>${title}</h2>
            <div class="meta">Target Room: <span class="tag tag-room">${targetRoom}</span> &bull; Event: <span class="tag">${eventName}</span></div>
            
            <div class="highlight">
              <strong>📡 Expected Socket Payload:</strong>
              <pre style="margin: 6px 0 0 0;">${escapedPayload}</pre>
            </div>

            <div class="steps">
              <strong>👁️ Real-Time Verification:</strong>
              <p style="margin: 4px 0 8px 0;">${escapedInstructions}</p>
              <a href="http://localhost:5000/dev/realtime" target="_blank" class="button">Open Live Dev Monitor &rarr;</a>
            </div>
          </div>
        </body>
        </html>
      \`);
    } catch (e) {
      console.log('Visualizer error:', e);
    }
  `;
}

function buildCollection() {
  const collection = {
    info: {
      _postman_id: "rt-feature-testing-collection-2026",
      name: "Order Placement & Delivery API - Real-Time Features Test Suite",
      description: "Interactive Postman collection for manual verification of Socket.IO real-time features (price updates, live stock display, cart synchronization, availability changes, and moderation disconnects).",
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    item: [
      // ==========================================
      // FOLDER 0: Setup & Auth
      // ==========================================
      {
        name: "0. Setup & Auth (Run Once)",
        description: "Creates admin, customer, vendor, and product prerequisites for real-time testing.",
        item: [
          {
            name: "0.1 Seeded Admin Login",
            request: {
              method: "POST",
              header: [{ key: "Content-Type", value: "application/json" }],
              body: {
                mode: "raw",
                raw: JSON.stringify({ email: "{{adminEmail}}", password: "{{adminPassword}}" }, null, 2)
              },
              url: { raw: "{{baseUrl}}/admin/auth/login", host: ["{{baseUrl}}"], path: ["admin", "auth", "login"] }
            },
            event: [{
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  "pm.test('Admin logged in (200)', function () {",
                  "    pm.expect(pm.response.code).to.eql(200);",
                  "    var j = pm.response.json();",
                  "    pm.environment.set('adminToken', j.data.token);",
                  "    var rId = Math.floor(100000 + Math.random() * 900000).toString();",
                  "    pm.environment.set('runId', rId);",
                  "});"
                ]
              }
            }]
          },
          {
            name: "0.2 Create Category",
            request: {
              method: "POST",
              header: [
                { key: "Content-Type", value: "application/json" },
                { key: "Authorization", value: "Bearer {{adminToken}}" }
              ],
              body: {
                mode: "raw",
                raw: JSON.stringify({ name: "Realtime Category {{runId}}", description: "Category for real-time tests" }, null, 2)
              },
              url: { raw: "{{baseUrl}}/admin/category", host: ["{{baseUrl}}"], path: ["admin", "category"] }
            },
            event: [{
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  "pm.test('Category created (201)', function () {",
                  "    pm.expect(pm.response.code).to.eql(201);",
                  "    var j = pm.response.json();",
                  "    pm.environment.set('categoryId', j.data.id);",
                  "});"
                ]
              }
            }]
          },
          {
            name: "0.3 Register Vendor A",
            request: {
              method: "POST",
              header: [{ key: "Content-Type", value: "application/json" }],
              body: {
                mode: "raw",
                raw: JSON.stringify({
                  ownerName: "Alice Vendor",
                  email: "vendora_{{runId}}@marketplace.com",
                  phone: "+12025550{{runId}}",
                  password: "Password123!"
                }, null, 2)
              },
              url: { raw: "{{baseUrl}}/vendor/auth/register", host: ["{{baseUrl}}"], path: ["vendor", "auth", "register"] }
            },
            event: [{
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  "pm.test('Vendor A registered (201)', function () {",
                  "    pm.expect(pm.response.code).to.eql(201);",
                  "    var j = pm.response.json();",
                  "    pm.environment.set('vendorAId', j.data.id);",
                  "});"
                ]
              }
            }]
          },
          {
            name: "0.4 Send & Verify Vendor A Phone OTP",
            request: {
              method: "POST",
              header: [{ key: "Content-Type", value: "application/json" }],
              body: {
                mode: "raw",
                raw: JSON.stringify({ phone: "+12025550{{runId}}" }, null, 2)
              },
              url: { raw: "{{baseUrl}}/vendor/auth/send-phone-otp", host: ["{{baseUrl}}"], path: ["vendor", "auth", "send-phone-otp"] }
            },
            event: [{
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  "pm.test('Phone OTP sent (200)', function () { pm.expect(pm.response.code).to.eql(200); });",
                  "pm.sendRequest({",
                  "    url: pm.environment.get('baseUrl') + '/vendor/auth/verify-phone-otp',",
                  "    method: 'POST',",
                  "    header: { 'Content-Type': 'application/json' },",
                  "    body: { mode: 'raw', raw: JSON.stringify({ phone: '+12025550' + pm.environment.get('runId'), otp: pm.environment.get('staticOtp') || '123456' }) }",
                  "}, function (err, res) {",
                  "    pm.test('Vendor A phone verified', function () { pm.expect(res.code).to.eql(200); });",
                  "});"
                ]
              }
            }]
          },
          {
            name: "0.5 Send & Verify Vendor A Email OTP",
            request: {
              method: "POST",
              header: [{ key: "Content-Type", value: "application/json" }],
              body: {
                mode: "raw",
                raw: JSON.stringify({ email: "vendora_{{runId}}@marketplace.com" }, null, 2)
              },
              url: { raw: "{{baseUrl}}/vendor/auth/send-email-otp", host: ["{{baseUrl}}"], path: ["vendor", "auth", "send-email-otp"] }
            },
            event: [{
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  "pm.test('Email OTP sent (200)', function () { pm.expect(pm.response.code).to.eql(200); });",
                  "pm.sendRequest({",
                  "    url: pm.environment.get('baseUrl') + '/vendor/auth/verify-email-otp',",
                  "    method: 'POST',",
                  "    header: { 'Content-Type': 'application/json' },",
                  "    body: { mode: 'raw', raw: JSON.stringify({ email: 'vendora_' + pm.environment.get('runId') + '@marketplace.com', otp: pm.environment.get('staticOtp') || '123456' }) }",
                  "}, function (err, res) {",
                  "    pm.test('Vendor A email verified', function () { pm.expect(res.code).to.eql(200); });",
                  "});"
                ]
              }
            }]
          },
          {
            name: "0.6 Admin Approve Vendor A",
            request: {
              method: "PATCH",
              header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
              url: { raw: "{{baseUrl}}/admin/vendor-management/{{vendorAId}}/approve", host: ["{{baseUrl}}"], path: ["admin", "vendor-management", "{{vendorAId}}", "approve"] }
            },
            event: [{
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  "pm.test('Vendor A approved by Admin (200)', function () { pm.expect(pm.response.code).to.eql(200); });"
                ]
              }
            }]
          },
          {
            name: "0.7 Login Vendor A & Create Profile",
            request: {
              method: "POST",
              header: [{ key: "Content-Type", value: "application/json" }],
              body: {
                mode: "raw",
                raw: JSON.stringify({ email: "vendora_{{runId}}@marketplace.com", password: "Password123!" }, null, 2)
              },
              url: { raw: "{{baseUrl}}/vendor/auth/login", host: ["{{baseUrl}}"], path: ["vendor", "auth", "login"] }
            },
            event: [{
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  "pm.test('Vendor A logged in (200)', function () {",
                  "    pm.expect(pm.response.code).to.eql(200);",
                  "    var j = pm.response.json();",
                  "    pm.environment.set('vendorAToken', j.data.token);",
                  "});",
                  "pm.sendRequest({",
                  "    url: pm.environment.get('baseUrl') + '/vendor/profile',",
                  "    method: 'POST',",
                  "    header: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + pm.environment.get('vendorAToken') },",
                  "    body: { mode: 'raw', raw: JSON.stringify({ shopName: 'Shop A ' + pm.environment.get('runId'), ownerName: 'Alice Vendor', addressLine: '123 Market St', city: 'San Francisco', state: 'CA', pincode: '94103' }) }",
                  "}, function (err, res) {",
                  "    pm.test('Vendor A profile ready (201)', function () { pm.expect(res.code).to.eql(201); });",
                  "});"
                ]
              }
            }]
          },
          {
            name: "0.8 Customer 1 Login via OTP",
            request: {
              method: "POST",
              header: [{ key: "Content-Type", value: "application/json" }],
              body: { mode: "raw", raw: JSON.stringify({ phone: "+1202777{{runId}}" }, null, 2) },
              url: { raw: "{{baseUrl}}/customer/auth/send-otp", host: ["{{baseUrl}}"], path: ["customer", "auth", "send-otp"] }
            },
            event: [{
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  "pm.test('Customer 1 OTP sent', function () { pm.expect(pm.response.code).to.eql(200); });",
                  "pm.sendRequest({",
                  "    url: pm.environment.get('baseUrl') + '/customer/auth/verify-otp',",
                  "    method: 'POST',",
                  "    header: { 'Content-Type': 'application/json' },",
                  "    body: { mode: 'raw', raw: JSON.stringify({ phone: '+1202777' + pm.environment.get('runId'), otp: pm.environment.get('staticOtp') || '123456' }) }",
                  "}, function (err, res) {",
                  "    pm.test('Customer 1 logged in', function () {",
                  "        pm.expect(res.code).to.eql(200);",
                  "        var j = res.json();",
                  "        pm.environment.set('customer1Token', j.data.token);",
                  "        pm.environment.set('customer1Id', j.data.customer.id);",
                  "    });",
                  "});"
                ]
              }
            }]
          },
          {
            name: "0.9 Customer 1 Add Delivery Address",
            request: {
              method: "POST",
              header: [
                { key: "Content-Type", value: "application/json" },
                { key: "Authorization", value: "Bearer {{customer1Token}}" }
              ],
              body: {
                mode: "raw",
                raw: JSON.stringify({ label: "Home", addressLine: "789 Pine St", city: "San Francisco", state: "CA", pincode: "94108" }, null, 2)
              },
              url: { raw: "{{baseUrl}}/customer/address", host: ["{{baseUrl}}"], path: ["customer", "address"] }
            },
            event: [{
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  "pm.test('Customer 1 address created (201)', function () {",
                  "    pm.expect(pm.response.code).to.eql(201);",
                  "    var j = pm.response.json();",
                  "    pm.environment.set('customer1AddressId', j.data.id);",
                  "});"
                ]
              }
            }]
          },
          {
            name: "0.10 Customer 2 Login via OTP",
            request: {
              method: "POST",
              header: [{ key: "Content-Type", value: "application/json" }],
              body: { mode: "raw", raw: JSON.stringify({ phone: "+1202888{{runId}}" }, null, 2) },
              url: { raw: "{{baseUrl}}/customer/auth/send-otp", host: ["{{baseUrl}}"], path: ["customer", "auth", "send-otp"] }
            },
            event: [{
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  "pm.test('Customer 2 OTP sent', function () { pm.expect(pm.response.code).to.eql(200); });",
                  "pm.sendRequest({",
                  "    url: pm.environment.get('baseUrl') + '/customer/auth/verify-otp',",
                  "    method: 'POST',",
                  "    header: { 'Content-Type': 'application/json' },",
                  "    body: { mode: 'raw', raw: JSON.stringify({ phone: '+1202888' + pm.environment.get('runId'), otp: pm.environment.get('staticOtp') || '123456' }) }",
                  "}, function (err, res) {",
                  "    pm.test('Customer 2 logged in', function () {",
                  "        pm.expect(res.code).to.eql(200);",
                  "        var j = res.json();",
                  "        pm.environment.set('customer2Token', j.data.token);",
                  "        pm.environment.set('customer2Id', j.data.customer.id);",
                  "    });",
                  "});"
                ]
              }
            }]
          },
          {
            name: "0.11 Customer 2 Add Delivery Address",
            request: {
              method: "POST",
              header: [
                { key: "Content-Type", value: "application/json" },
                { key: "Authorization", value: "Bearer {{customer2Token}}" }
              ],
              body: {
                mode: "raw",
                raw: JSON.stringify({ label: "Office", addressLine: "456 Mission St", city: "San Francisco", state: "CA", pincode: "94105" }, null, 2)
              },
              url: { raw: "{{baseUrl}}/customer/address", host: ["{{baseUrl}}"], path: ["customer", "address"] }
            },
            event: [{
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  "pm.test('Customer 2 address created (201)', function () {",
                  "    pm.expect(pm.response.code).to.eql(201);",
                  "    var j = pm.response.json();",
                  "    pm.environment.set('customer2AddressId', j.data.id);",
                  "});"
                ]
              }
            }]
          },
          {
            name: "0.12 Vendor A Creates Real-Time Pizza Product ($20, stock 10)",
            request: {
              method: "POST",
              header: [
                { key: "Content-Type", value: "application/json" },
                { key: "Authorization", value: "Bearer {{vendorAToken}}" }
              ],
              body: {
                mode: "raw",
                raw: JSON.stringify({
                  categoryId: "{{categoryId}}",
                  name: "Realtime Artisan Pizza {{runId}}",
                  description: "Fresh woodfired pizza monitored in real time",
                  price: 20.00,
                  stock: 10
                }, null, 2)
              },
              url: { raw: "{{baseUrl}}/vendor/product", host: ["{{baseUrl}}"], path: ["vendor", "product"] }
            },
            event: [{
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  "pm.test('Product created (201)', function () {",
                  "    pm.expect(pm.response.code).to.eql(201);",
                  "    var j = pm.response.json();",
                  "    pm.environment.set('realtimeProductId', j.data.id);",
                  "});",
                  visualizerSnippet(
                    "Setup Complete: Real-Time Product Ready",
                    "product:subscribe",
                    "product:{{realtimeProductId}}",
                    JSON.stringify({
                      customer1Token: "{{customer1Token}}",
                      customer1Id: "{{customer1Id}}",
                      realtimeProductId: "{{realtimeProductId}}",
                      price: 20.00,
                      stock: 10
                    }, null, 2),
                    "Open the Live Dev Monitor in your browser, connect using customer1Token, and subscribe to realtimeProductId."
                  )
                ]
              }
            }]
          }
        ]
      },

      // ==========================================
      // FOLDER 1: Scenario 1 - Price Updates
      // ==========================================
      {
        name: "Scenario 1: Real-Time Price Updates",
        description: "Tests vendor price change broadcasting to product subscribers and recalculation for cart holders.",
        item: [
          {
            name: "1.1 Customer 1 Adds 2 Pizzas to Cart",
            request: {
              method: "POST",
              header: [
                { key: "Content-Type", value: "application/json" },
                { key: "Authorization", value: "Bearer {{customer1Token}}" }
              ],
              body: {
                mode: "raw",
                raw: JSON.stringify({ productId: "{{realtimeProductId}}", quantity: 2 }, null, 2)
              },
              url: { raw: "{{baseUrl}}/customer/cart/items", host: ["{{baseUrl}}"], path: ["customer", "cart", "items"] }
            },
            event: [{
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  "pm.test('2 Pizzas added to cart (201)', function () { pm.expect(pm.response.code).to.eql(201); });"
                ]
              }
            }]
          },
          {
            name: "1.2 Vendor A Updates Pizza Price to $29.99",
            request: {
              method: "PATCH",
              header: [
                { key: "Content-Type", value: "application/json" },
                { key: "Authorization", value: "Bearer {{vendorAToken}}" }
              ],
              body: {
                mode: "raw",
                raw: JSON.stringify({ price: 29.99 }, null, 2)
              },
              url: { raw: "{{baseUrl}}/vendor/product/{{realtimeProductId}}", host: ["{{baseUrl}}"], path: ["vendor", "product", "{{realtimeProductId}}"] }
            },
            event: [{
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  "pm.test('Price updated in DB (200)', function () {",
                  "    pm.expect(pm.response.code).to.eql(200);",
                  "    pm.expect(parseFloat(pm.response.json().data.price)).to.eql(29.99);",
                  "});",
                  visualizerSnippet(
                    "Vendor Price Update ($20.00 -> $29.99)",
                    "product:priceUpdated & cart:priceChanged",
                    "product:{{realtimeProductId}} & customer:{{customer1Id}}",
                    JSON.stringify({
                      "product:priceUpdated": {
                        productId: "{{realtimeProductId}}",
                        oldPrice: 20.00,
                        newPrice: 29.99,
                        currency: "USD"
                      },
                      "cart:priceChanged": {
                        productId: "{{realtimeProductId}}",
                        oldPrice: 20.00,
                        newPrice: 29.99,
                        quantity: 2,
                        newLineTotal: 59.98
                      }
                    }, null, 2),
                    "Check the Live Dev Monitor. You should see product:priceUpdated with newPrice 29.99, and cart:priceChanged with newLineTotal 59.98."
                  )
                ]
              }
            }]
          },
          {
            name: "1.3 Customer 1 Verifies Cart Summary with New Price ($59.98)",
            request: {
              method: "GET",
              header: [{ key: "Authorization", value: "Bearer {{customer1Token}}" }],
              url: { raw: "{{baseUrl}}/customer/cart", host: ["{{baseUrl}}"], path: ["customer", "cart"] }
            },
            event: [{
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  "pm.test('Cart total reflects updated price (59.98)', function () {",
                  "    pm.expect(pm.response.code).to.eql(200);",
                  "    var j = pm.response.json();",
                  "    pm.expect(parseFloat(j.data.totalAmount)).to.eql(59.98);",
                  "});"
                ]
              }
            }]
          },
          {
            name: "1.4 Vendor A Reverts Pizza Price to $20.00",
            request: {
              method: "PATCH",
              header: [
                { key: "Content-Type", value: "application/json" },
                { key: "Authorization", value: "Bearer {{vendorAToken}}" }
              ],
              body: { mode: "raw", raw: JSON.stringify({ price: 20.00 }, null, 2) },
              url: { raw: "{{baseUrl}}/vendor/product/{{realtimeProductId}}", host: ["{{baseUrl}}"], path: ["vendor", "product", "{{realtimeProductId}}"] }
            },
            event: [{
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  "pm.test('Price reverted (200)', function () { pm.expect(pm.response.code).to.eql(200); });"
                ]
              }
            }]
          }
        ]
      },

      // ==========================================
      // FOLDER 2: Scenario 2 - Stock Updates
      // ==========================================
      {
        name: "Scenario 2: Real-Time Stock Updates & Sold-Out Protection",
        description: "Tests live stock broadcasts on order placement, cancellation, and flash-sale contention.",
        item: [
          {
            name: "2.1 Customer 1 Places COD Order (Takes 2 Units -> Stock 8)",
            request: {
              method: "POST",
              header: [
                { key: "Content-Type", value: "application/json" },
                { key: "Authorization", value: "Bearer {{customer1Token}}" }
              ],
              body: {
                mode: "raw",
                raw: JSON.stringify({ addressId: "{{customer1AddressId}}", paymentMethod: "COD" }, null, 2)
              },
              url: { raw: "{{baseUrl}}/customer/order", host: ["{{baseUrl}}"], path: ["customer", "order"] }
            },
            event: [{
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  "pm.test('Order placed (201)', function () {",
                  "    pm.expect(pm.response.code).to.eql(201);",
                  "    var j = pm.response.json();",
                  "    pm.environment.set('order1Id', j.data.id);",
                  "});",
                  visualizerSnippet(
                    "Stock Decrement on Order Placement",
                    "product:stockUpdated",
                    "product:{{realtimeProductId}}",
                    JSON.stringify({
                      productId: "{{realtimeProductId}}",
                      stock: 8,
                      inStock: true,
                      reason: "order_placed"
                    }, null, 2),
                    "Customer placed COD order for 2 units. Monitor logs product:stockUpdated with stock: 8 and reason: order_placed."
                  )
                ]
              }
            }]
          },
          {
            name: "2.2 Customer 1 Cancels COD Order (Stock Restores -> Stock 10)",
            request: {
              method: "PATCH",
              header: [{ key: "Authorization", value: "Bearer {{customer1Token}}" }],
              url: { raw: "{{baseUrl}}/customer/order/{{order1Id}}/cancel", host: ["{{baseUrl}}"], path: ["customer", "order", "{{order1Id}}", "cancel"] }
            },
            event: [{
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  "pm.test('Order cancelled (200)', function () { pm.expect(pm.response.code).to.eql(200); });",
                  visualizerSnippet(
                    "Stock Restoration on Cancellation",
                    "product:stockUpdated",
                    "product:{{realtimeProductId}}",
                    JSON.stringify({
                      productId: "{{realtimeProductId}}",
                      stock: 10,
                      inStock: true,
                      reason: "order_cancelled"
                    }, null, 2),
                    "Customer cancelled the order. Monitor logs product:stockUpdated restoring inventory to stock: 10 with reason: order_cancelled."
                  )
                ]
              }
            }]
          },
          {
            name: "2.3 Vendor A Creates Flash-Sale Product (Stock: 1)",
            request: {
              method: "POST",
              header: [
                { key: "Content-Type", value: "application/json" },
                { key: "Authorization", value: "Bearer {{vendorAToken}}" }
              ],
              body: {
                mode: "raw",
                raw: JSON.stringify({
                  categoryId: "{{categoryId}}",
                  name: "Flash Collectible {{runId}}",
                  description: "Single unit available",
                  price: 99.00,
                  stock: 1
                }, null, 2)
              },
              url: { raw: "{{baseUrl}}/vendor/product", host: ["{{baseUrl}}"], path: ["vendor", "product"] }
            },
            event: [{
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  "pm.test('Flash product created (201)', function () {",
                  "    pm.expect(pm.response.code).to.eql(201);",
                  "    var j = pm.response.json();",
                  "    pm.environment.set('flashProductId', j.data.id);",
                  "});"
                ]
              }
            }]
          },
          {
            name: "2.4 Customer 1 Adds Flash Item to Cart",
            request: {
              method: "POST",
              header: [
                { key: "Content-Type", value: "application/json" },
                { key: "Authorization", value: "Bearer {{customer1Token}}" }
              ],
              body: { mode: "raw", raw: JSON.stringify({ productId: "{{flashProductId}}", quantity: 1 }, null, 2) },
              url: { raw: "{{baseUrl}}/customer/cart/items", host: ["{{baseUrl}}"], path: ["customer", "cart", "items"] }
            },
            event: [{
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  "pm.test('Customer 1 carted flash item (201)', function () { pm.expect(pm.response.code).to.eql(201); });"
                ]
              }
            }]
          },
          {
            name: "2.5 Customer 2 Adds Flash Item to Cart",
            request: {
              method: "POST",
              header: [
                { key: "Content-Type", value: "application/json" },
                { key: "Authorization", value: "Bearer {{customer2Token}}" }
              ],
              body: { mode: "raw", raw: JSON.stringify({ productId: "{{flashProductId}}", quantity: 1 }, null, 2) },
              url: { raw: "{{baseUrl}}/customer/cart/items", host: ["{{baseUrl}}"], path: ["customer", "cart", "items"] }
            },
            event: [{
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  "pm.test('Customer 2 carted flash item (201)', function () { pm.expect(pm.response.code).to.eql(201); });"
                ]
              }
            }]
          },
          {
            name: "2.6 Customer 1 Places Order (Claims Only Unit)",
            request: {
              method: "POST",
              header: [
                { key: "Content-Type", value: "application/json" },
                { key: "Authorization", value: "Bearer {{customer1Token}}" }
              ],
              body: { mode: "raw", raw: JSON.stringify({ addressId: "{{customer1AddressId}}", paymentMethod: "COD" }, null, 2) },
              url: { raw: "{{baseUrl}}/customer/order", host: ["{{baseUrl}}"], path: ["customer", "order"] }
            },
            event: [{
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  "pm.test('Customer 1 claimed unit (201)', function () { pm.expect(pm.response.code).to.eql(201); });",
                  visualizerSnippet(
                    "Flash-Sale Stock Depletion & Cart Depletion Alert",
                    "product:stockUpdated & cart:itemUnavailable",
                    "product:{{flashProductId}} & customer:{{customer2Id}}",
                    JSON.stringify({
                      "product:stockUpdated": {
                        productId: "{{flashProductId}}",
                        stock: 0,
                        inStock: false,
                        reason: "order_placed"
                      },
                      "cart:itemUnavailable": {
                        productId: "{{flashProductId}}",
                        availableStock: 0,
                        cartQuantity: 1,
                        reason: "out_of_stock"
                      }
                    }, null, 2),
                    "Customer 1 claimed the sole unit. Product room receives stockUpdated (stock: 0). Customer 2's room receives cart:itemUnavailable (out_of_stock)."
                  )
                ]
              }
            }]
          },
          {
            name: "2.7 Customer 2 Tries to Checkout -> 409 INSUFFICIENT_STOCK",
            request: {
              method: "POST",
              header: [
                { key: "Content-Type", value: "application/json" },
                { key: "Authorization", value: "Bearer {{customer2Token}}" }
              ],
              body: { mode: "raw", raw: JSON.stringify({ addressId: "{{customer2AddressId}}", paymentMethod: "COD" }, null, 2) },
              url: { raw: "{{baseUrl}}/customer/order", host: ["{{baseUrl}}"], path: ["customer", "order"] }
            },
            event: [{
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  "pm.test('Customer 2 blocked with 409 Conflict', function () {",
                  "    pm.expect(pm.response.code).to.eql(409);",
                  "    pm.expect(pm.response.json().error.code).to.eql('INSUFFICIENT_STOCK');",
                  "});"
                ]
              }
            }]
          }
        ]
      },

      // ==========================================
      // FOLDER 3: Scenario 3 - Cart Unavailability
      // ==========================================
      {
        name: "Scenario 3: Cart Unavailability & Stock Depletion",
        description: "Tests cart:itemUnavailable events when vendor decreases stock below cart quantities or drops stock to 0.",
        item: [
          {
            name: "3.1 Customer 1 Adds 5 Pizzas to Cart",
            request: {
              method: "POST",
              header: [
                { key: "Content-Type", value: "application/json" },
                { key: "Authorization", value: "Bearer {{customer1Token}}" }
              ],
              body: { mode: "raw", raw: JSON.stringify({ productId: "{{realtimeProductId}}", quantity: 5 }, null, 2) },
              url: { raw: "{{baseUrl}}/customer/cart/items", host: ["{{baseUrl}}"], path: ["customer", "cart", "items"] }
            },
            event: [{
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  "pm.test('Customer 1 added 5 units to cart (201)', function () { pm.expect(pm.response.code).to.eql(201); });"
                ]
              }
            }]
          },
          {
            name: "3.2 Vendor A Decreases Stock to 2 Units",
            request: {
              method: "PATCH",
              header: [
                { key: "Content-Type", value: "application/json" },
                { key: "Authorization", value: "Bearer {{vendorAToken}}" }
              ],
              body: { mode: "raw", raw: JSON.stringify({ stock: 2 }, null, 2) },
              url: { raw: "{{baseUrl}}/vendor/product/{{realtimeProductId}}/stock", host: ["{{baseUrl}}"], path: ["vendor", "product", "{{realtimeProductId}}", "stock"] }
            },
            event: [{
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  "pm.test('Vendor updated stock to 2 (200)', function () { pm.expect(pm.response.code).to.eql(200); });",
                  visualizerSnippet(
                    "Stock Drops Below Cart Quantity",
                    "cart:itemUnavailable",
                    "customer:{{customer1Id}}",
                    JSON.stringify({
                      productId: "{{realtimeProductId}}",
                      availableStock: 2,
                      cartQuantity: 5,
                      reason: "insufficient_stock"
                    }, null, 2),
                    "Customer 1 requested 5 units, but vendor reduced stock to 2. Customer receives cart:itemUnavailable with reason: insufficient_stock."
                  )
                ]
              }
            }]
          },
          {
            name: "3.3 Vendor A Sets Stock to 0 Units",
            request: {
              method: "PATCH",
              header: [
                { key: "Content-Type", value: "application/json" },
                { key: "Authorization", value: "Bearer {{vendorAToken}}" }
              ],
              body: { mode: "raw", raw: JSON.stringify({ stock: 0 }, null, 2) },
              url: { raw: "{{baseUrl}}/vendor/product/{{realtimeProductId}}/stock", host: ["{{baseUrl}}"], path: ["vendor", "product", "{{realtimeProductId}}", "stock"] }
            },
            event: [{
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  "pm.test('Vendor set stock to 0 (200)', function () { pm.expect(pm.response.code).to.eql(200); });",
                  visualizerSnippet(
                    "Product Completely Out of Stock",
                    "cart:itemUnavailable",
                    "customer:{{customer1Id}}",
                    JSON.stringify({
                      productId: "{{realtimeProductId}}",
                      availableStock: 0,
                      cartQuantity: 5,
                      reason: "out_of_stock"
                    }, null, 2),
                    "Stock reached 0. Customer receives cart:itemUnavailable with reason: out_of_stock."
                  )
                ]
              }
            }]
          },
          {
            name: "3.4 Vendor A Restores Stock to 10 Units",
            request: {
              method: "PATCH",
              header: [
                { key: "Content-Type", value: "application/json" },
                { key: "Authorization", value: "Bearer {{vendorAToken}}" }
              ],
              body: { mode: "raw", raw: JSON.stringify({ stock: 10 }, null, 2) },
              url: { raw: "{{baseUrl}}/vendor/product/{{realtimeProductId}}/stock", host: ["{{baseUrl}}"], path: ["vendor", "product", "{{realtimeProductId}}", "stock"] }
            },
            event: [{
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  "pm.test('Stock restored to 10 (200)', function () { pm.expect(pm.response.code).to.eql(200); });"
                ]
              }
            }]
          }
        ]
      },

      // ==========================================
      // FOLDER 4: Scenario 4 - Availability & Moderation
      // ==========================================
      {
        name: "Scenario 4: Product Availability & Moderation",
        description: "Tests availability broadcasts on admin disable/enable, vendor toggle, and vendor soft-delete.",
        item: [
          {
            name: "4.1 Customer 1 Adds 1 Pizza to Cart",
            request: {
              method: "POST",
              header: [
                { key: "Content-Type", value: "application/json" },
                { key: "Authorization", value: "Bearer {{customer1Token}}" }
              ],
              body: { mode: "raw", raw: JSON.stringify({ productId: "{{realtimeProductId}}", quantity: 1 }, null, 2) },
              url: { raw: "{{baseUrl}}/customer/cart/items", host: ["{{baseUrl}}"], path: ["customer", "cart", "items"] }
            },
            event: [{
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  "pm.test('Item in cart (200 or 201)', function () { pm.expect([200, 201]).to.include(pm.response.code); });"
                ]
              }
            }]
          },
          {
            name: "4.2 Admin Disables Product",
            request: {
              method: "PATCH",
              header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
              url: { raw: "{{baseUrl}}/admin/product/{{realtimeProductId}}/disable", host: ["{{baseUrl}}"], path: ["admin", "product", "{{realtimeProductId}}", "disable"] }
            },
            event: [{
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  "pm.test('Product disabled by Admin (200)', function () { pm.expect(pm.response.code).to.eql(200); });",
                  visualizerSnippet(
                    "Admin Product Disable",
                    "product:availabilityChanged & cart:itemUnavailable",
                    "product:{{realtimeProductId}} & customer:{{customer1Id}}",
                    JSON.stringify({
                      "product:availabilityChanged": {
                        productId: "{{realtimeProductId}}",
                        isVisible: false
                      },
                      "cart:itemUnavailable": {
                        productId: "{{realtimeProductId}}",
                        availableStock: 0,
                        cartQuantity: 1,
                        reason: "product_disabled"
                      }
                    }, null, 2),
                    "Product disabled by admin. Subscribers receive isVisible: false. Cart holders receive cart:itemUnavailable (product_disabled)."
                  )
                ]
              }
            }]
          },
          {
            name: "4.3 Admin Re-Enables Product",
            request: {
              method: "PATCH",
              header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
              url: { raw: "{{baseUrl}}/admin/product/{{realtimeProductId}}/enable", host: ["{{baseUrl}}"], path: ["admin", "product", "{{realtimeProductId}}", "enable"] }
            },
            event: [{
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  "pm.test('Product re-enabled (200)', function () { pm.expect(pm.response.code).to.eql(200); });",
                  visualizerSnippet(
                    "Admin Product Re-Enable",
                    "product:availabilityChanged",
                    "product:{{realtimeProductId}}",
                    JSON.stringify({
                      productId: "{{realtimeProductId}}",
                      isVisible: true
                    }, null, 2),
                    "Product enabled. Subscribers receive product:availabilityChanged with isVisible: true."
                  )
                ]
              }
            }]
          },
          {
            name: "4.4 Vendor A Toggles Availability Off",
            request: {
              method: "PATCH",
              header: [
                { key: "Content-Type", value: "application/json" },
                { key: "Authorization", value: "Bearer {{vendorAToken}}" }
              ],
              body: { mode: "raw", raw: JSON.stringify({ isAvailable: false }, null, 2) },
              url: { raw: "{{baseUrl}}/vendor/product/{{realtimeProductId}}/availability", host: ["{{baseUrl}}"], path: ["vendor", "product", "{{realtimeProductId}}", "availability"] }
            },
            event: [{
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  "pm.test('Availability toggled to false (200)', function () { pm.expect(pm.response.code).to.eql(200); });",
                  visualizerSnippet(
                    "Vendor Toggles Availability Off",
                    "product:availabilityChanged & cart:itemUnavailable",
                    "product:{{realtimeProductId}} & customer:{{customer1Id}}",
                    JSON.stringify({
                      "product:availabilityChanged": {
                        productId: "{{realtimeProductId}}",
                        isVisible: false
                      },
                      "cart:itemUnavailable": {
                        productId: "{{realtimeProductId}}",
                        availableStock: 0,
                        reason: "product_unavailable"
                      }
                    }, null, 2),
                    "Vendor turned off product availability. Subscribers receive isVisible: false. Cart holders receive cart:itemUnavailable (product_unavailable)."
                  )
                ]
              }
            }]
          },
          {
            name: "4.5 Vendor A Toggles Availability On",
            request: {
              method: "PATCH",
              header: [
                { key: "Content-Type", value: "application/json" },
                { key: "Authorization", value: "Bearer {{vendorAToken}}" }
              ],
              body: { mode: "raw", raw: JSON.stringify({ isAvailable: true }, null, 2) },
              url: { raw: "{{baseUrl}}/vendor/product/{{realtimeProductId}}/availability", host: ["{{baseUrl}}"], path: ["vendor", "product", "{{realtimeProductId}}", "availability"] }
            },
            event: [{
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  "pm.test('Availability restored to true (200)', function () { pm.expect(pm.response.code).to.eql(200); });"
                ]
              }
            }]
          },
          {
            name: "4.6 Vendor A Soft-Deletes Product",
            request: {
              method: "DELETE",
              header: [{ key: "Authorization", value: "Bearer {{vendorAToken}}" }],
              url: { raw: "{{baseUrl}}/vendor/product/{{realtimeProductId}}", host: ["{{baseUrl}}"], path: ["vendor", "product", "{{realtimeProductId}}"] }
            },
            event: [{
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  "pm.test('Product soft deleted (200)', function () { pm.expect(pm.response.code).to.eql(200); });",
                  visualizerSnippet(
                    "Vendor Soft-Deletes Product",
                    "product:availabilityChanged & cart:itemUnavailable",
                    "product:{{realtimeProductId}} & customer:{{customer1Id}}",
                    JSON.stringify({
                      "product:availabilityChanged": {
                        productId: "{{realtimeProductId}}",
                        isVisible: false
                      },
                      "cart:itemUnavailable": {
                        productId: "{{realtimeProductId}}",
                        availableStock: 0,
                        reason: "product_deleted"
                      }
                    }, null, 2),
                    "Vendor deleted the product. Subscribers receive isVisible: false. Cart holders receive cart:itemUnavailable with reason: product_deleted."
                  )
                ]
              }
            }]
          }
        ]
      },

      // ==========================================
      // FOLDER 5: Scenario 5 - Moderation Enforcement
      // ==========================================
      {
        name: "Scenario 5: Moderation Enforcement & Live Disconnect",
        description: "Tests immediate socket termination when admin blocks a customer or vendor.",
        item: [
          {
            name: "5.1 Admin Blocks Customer 1",
            request: {
              method: "PATCH",
              header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
              url: { raw: "{{baseUrl}}/admin/customer-management/{{customer1Id}}/block", host: ["{{baseUrl}}"], path: ["admin", "customer-management", "{{customer1Id}}", "block"] }
            },
            event: [{
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  "pm.test('Customer 1 blocked by Admin (200)', function () { pm.expect(pm.response.code).to.eql(200); });",
                  visualizerSnippet(
                    "Admin Blocks Customer 1 (Immediate Disconnect)",
                    "io server disconnect",
                    "customer:{{customer1Id}}",
                    JSON.stringify({
                      action: "disconnectUser",
                      targetUserId: "{{customer1Id}}",
                      role: "customer",
                      disconnectReason: "io server disconnect"
                    }, null, 2),
                    "Customer 1 was blocked by admin. If Customer 1 had an active socket open on the Dev Monitor, it is instantly terminated."
                  )
                ]
              }
            }]
          },
          {
            name: "5.2 Customer 1 Login Attempt Rejected (ACCOUNT_BLOCKED)",
            request: {
              method: "POST",
              header: [{ key: "Content-Type", value: "application/json" }],
              body: {
                mode: "raw",
                raw: JSON.stringify({ phone: "+1202777{{runId}}" }, null, 2)
              },
              url: { raw: "{{baseUrl}}/customer/auth/send-otp", host: ["{{baseUrl}}"], path: ["customer", "auth", "send-otp"] }
            },
            event: [
              {
                listen: "test",
                script: {
                  type: "text/javascript",
                  exec: [
                    "pm.test('Blocked customer rejected (403 ACCOUNT_BLOCKED)', function () {",
                    "    pm.expect(pm.response.code).to.eql(403);",
                    "    pm.expect(pm.response.json().error.code).to.eql('ACCOUNT_BLOCKED');",
                    "});",
                    visualizerSnippet(
                      "Blocked Customer Access Denied",
                      "ACCOUNT_BLOCKED",
                      "customer:{{customer1Id}}",
                      JSON.stringify({
                        status: 403,
                        error: "ACCOUNT_BLOCKED",
                        message: "Your customer account has been blocked."
                      }, null, 2),
                      "Customer 1 cannot request OTP or connect via socket while blocked."
                    )
                  ]
                }
              }
            ]
          },
          {
            name: "5.3 Admin Unblocks Customer 1",
            request: {
              method: "PATCH",
              header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
              url: { raw: "{{baseUrl}}/admin/customer-management/{{customer1Id}}/unblock", host: ["{{baseUrl}}"], path: ["admin", "customer-management", "{{customer1Id}}", "unblock"] }
            },
            event: [{
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  "pm.test('Customer 1 unblocked (200)', function () { pm.expect(pm.response.code).to.eql(200); });"
                ]
              }
            }]
          }
        ]
      }
    ]
  };

  const outputPath = path.join(__dirname, '..', 'postman', 'realtime.collection.json');
  fs.writeFileSync(outputPath, JSON.stringify(collection, null, 2), 'utf8');
  console.log(`Successfully generated Postman collection at: ${outputPath}`);
}

buildCollection();
