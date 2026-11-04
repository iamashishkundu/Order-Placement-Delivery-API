# Real-Time Features Manual Testing & Verification Guide

This guide details how to test and verify the **Socket.IO real-time capabilities** of the Order Placement & Delivery API using:
1. **Interactive Dev Demo Monitor** (`http://localhost:5000/dev/realtime`)
2. **Dedicated Postman Collection** (`postman/realtime.collection.json`) with interactive PM Visualizer
3. **Automated Integration Test Runner** (`npm run test:realtime`)

---

## 1. Automated Test Commands

### A. Socket.IO Headless Client-Server Suite (6 Categories)
Runs the programmatic integration suite with isolated socket connections across all 6 test categories:
```bash
npm run test:realtime
```

### B. Postman End-to-End Real-Time Scenarios Runner
Runs the full 41-assertion Postman scenarios collection via Newman:
```bash
npm run test:scenarios:realtime
```

---

## 2. Using the Postman Collection in Postman

The collection is saved at:
👉 **`postman/realtime.collection.json`**

Environment file:
👉 **`postman/payment.environment.json`**

### Import Instructions:
1. Open Postman $\rightarrow$ Click **Import** $\rightarrow$ Drag & drop `postman/realtime.collection.json` and `postman/payment.environment.json`.
2. Select the **Order Delivery API - Stripe Payment Test Environment** in the top right.
3. Open `http://localhost:5000/dev/realtime` in a browser tab alongside Postman.
4. Run requests in order:
   - **0. Setup & Auth**: Automatically seeds admin, registers and approves Vendor A, logs in Customer 1 and Customer 2, and creates a real-time product.
   - **Scenario 1**: Vendor updates price $\rightarrow$ Postman visualizer renders the emitted `product:priceUpdated` and `cart:priceChanged` payloads.
   - **Scenario 2**: Customer 1 places order $\rightarrow$ visualizer displays `product:stockUpdated` (`order_placed`). Customer 1 cancels $\rightarrow$ displays `order_cancelled`. Flash-sale checkout race demonstrates stock depletion and `cart:itemUnavailable` (`out_of_stock`).
   - **Scenario 3**: Vendor decreases stock $\rightarrow$ Customer 1 receives `cart:itemUnavailable` (`insufficient_stock`).
   - **Scenario 4**: Admin disables product and vendor toggles availability $\rightarrow$ visualizer displays `product:availabilityChanged` and `cart:itemUnavailable` (`product_disabled` / `product_unavailable`).
   - **Scenario 5**: Admin blocks Customer 1 $\rightarrow$ Customer 1's live browser socket is immediately disconnected (`io server disconnect`), and future OTP verification is blocked with 403 `ACCOUNT_BLOCKED`.
5. **Interactive Visualizer**: Every response in Postman includes a **Visualize** tab showing the emitted event, target room, expected payload, and a direct link to the Live Dev Monitor!

---

## 2. Interactive Browser Monitor (`GET /dev/realtime`)

In non-production environments (`NODE_ENV != 'production'`), an interactive browser-based Socket.IO dashboard is mounted at:

👉 **`http://localhost:5000/dev/realtime`**

*(Returns `404 Not Found` in production).*

### Dashboard Features
- **Connection & Auth**: Connect using your JWT token; view socket ID, authenticated user ID, role, and assigned personal room (`customer:<id>`, `vendor:<id>`, or `admin`).
- **Product Subscriptions**: Subscribe/unsubscribe to visible product UUIDs with a live count badge (capped at `SOCKET_MAX_SUBSCRIPTIONS`, default 100).
- **Live Event Stream**: Real-time event log with timestamps, color-coded badges, and formatted JSON payloads.
- **Filter**: Filter by event type (`product:priceUpdated`, `cart:priceChanged`, `product:stockUpdated`, `product:availabilityChanged`, `cart:itemUnavailable`).

---

## 3. Step-by-Step Manual Testing Walkthrough

### Step 3.1: Start the API Server
Ensure PostgreSQL is running and start the server:
```bash
npm run dev
```
The console will log:
```text
PostgreSQL database connected successfully.
Server running in [development] mode on port 5000
Socket.IO real-time engine attached and ready.
```

---

### Step 3.2: Obtain Authentication Tokens
Use Postman or curl to generate JWT tokens:

#### A. Customer Token
1. Request an OTP:
   ```http
   POST /api/v1/customer/auth/send-otp
   Content-Type: application/json

   { "phone": "+12025550199" }
   ```
2. Verify OTP (default development OTP is `123456`):
   ```http
   POST /api/v1/customer/auth/verify-otp
   Content-Type: application/json

   { "phone": "+12025550199", "otp": "123456" }
   ```
3. Copy `data.token` and `data.customer.id`.

#### B. Vendor Token
1. Log in with an approved vendor:
   ```http
   POST /api/v1/vendor/auth/login
   Content-Type: application/json

   { "email": "vendora@marketplace.com", "password": "Password123!" }
   ```
2. Copy `data.token` and `data.vendor.id`.

#### C. Admin Token
1. Log in with the seeded admin:
   ```http
   POST /api/v1/admin/auth/login
   Content-Type: application/json

   { "email": "admin@marketplace.com", "password": "AdminPassword123!" }
   ```
2. Copy `data.token`.

---

### Step 3.3: Connect Customer Socket & Subscribe to Product
1. Open **`http://localhost:5000/dev/realtime`** in your browser.
2. Paste the **Customer Token** into the JWT field and click **Connect**.
   - Status badge turns green: `CONNECTED`.
   - Personal room displays: `customer:<customerId>`.
3. Locate an existing visible product UUID (e.g., from `GET /api/v1/vendor/product`).
4. Enter the product UUID into the subscription input and click **Subscribe**.
   - An ACK card appears: `ACK:product:subscribe` with `subscribed: [ "<productId>" ]`.
   - The product is added to the active subscriptions list.

---

### Step 3.4: Test Real-Time Price Updates
1. **Add item to Customer's Cart**:
   ```http
   POST /api/v1/customer/cart/items
   Authorization: Bearer <Customer_Token>
   Content-Type: application/json

   { "productId": "<productId>", "quantity": 2 }
   ```
2. **Vendor changes product price**:
   In Postman, call:
   ```http
   PATCH /api/v1/vendor/product/<productId>
   Authorization: Bearer <Vendor_Token>
   Content-Type: application/json

   { "price": 29.99 }
   ```
3. **Observe the browser monitor**:
   You will immediately receive two events:
   - **`product:priceUpdated`** (broadcast to `product:<productId>` room):
     ```json
     {
       "productId": "<productId>",
       "oldPrice": 20.00,
       "newPrice": 29.99,
       "currency": "USD",
       "updatedAt": "2026-11-04T06:15:30.123Z"
     }
     ```
   - **`cart:priceChanged`** (sent privately to `customer:<customerId>` room):
     ```json
     {
       "productId": "<productId>",
       "oldPrice": 20.00,
       "newPrice": 29.99,
       "quantity": 2,
       "newLineTotal": 59.98,
       "updatedAt": "2026-11-04T06:15:30.125Z"
     }
     ```

---

### Step 3.5: Test Real-Time Stock Updates & Sold-Out Protection
1. **Customer places an order**:
   In Postman, place an order with COD or ONLINE:
   ```http
   POST /api/v1/customer/order
   Authorization: Bearer <Customer_Token>
   Content-Type: application/json

   { "addressId": "<addressId>", "paymentMethod": "COD" }
   ```
2. **Observe live stock update**:
   The browser monitor immediately logs:
   - **`product:stockUpdated`**:
     ```json
     {
       "productId": "<productId>",
       "stock": 8,
       "inStock": true,
       "reason": "order_placed",
       "updatedAt": "2026-11-04T06:18:10.456Z"
     }
     ```

3. **Customer cancels order**:
   In Postman, cancel the placed order:
   ```http
   PATCH /api/v1/customer/order/<orderId>/cancel
   Authorization: Bearer <Customer_Token>
   ```
4. **Observe stock restoration**:
   - **`product:stockUpdated`**:
     ```json
     {
       "productId": "<productId>",
       "stock": 10,
       "inStock": true,
       "reason": "order_cancelled",
       "updatedAt": "2026-11-04T06:19:22.789Z"
     }
     ```

---

### Step 3.6: Test Cart Item Unavailable Notifications
1. Customer has quantity 5 of `<productId>` in their cart.
2. In Postman, the vendor reduces stock below 5 (e.g. stock = 2):
   ```http
   PATCH /api/v1/vendor/product/<productId>/stock
   Authorization: Bearer <Vendor_Token>
   Content-Type: application/json

   { "stock": 2 }
   ```
3. **Observe the browser monitor**:
   - **`cart:itemUnavailable`** (delivered to customer's personal room):
     ```json
     {
       "productId": "<productId>",
       "availableStock": 2,
       "cartQuantity": 5,
       "reason": "insufficient_stock",
       "updatedAt": "2026-11-04T06:20:45.000Z"
     }
     ```
4. If vendor sets stock to `0`, `reason` becomes `"out_of_stock"`.

---

### Step 3.7: Test Admin Moderation & Immediate Disconnect
1. Keep the Customer connected on the browser monitor.
2. In Postman, call Admin Block Customer API:
   ```http
   PATCH /api/v1/admin/customer-management/<customerId>/block
   Authorization: Bearer <Admin_Token>
   ```
3. **Observe immediate socket disconnect**:
   - Status badge turns red: `DISCONNECTED`.
   - Event log receives `SYSTEM:DISCONNECTED` with reason `"io server disconnect"`.
   - Any attempt to reconnect with that token fails immediately with code `ACCOUNT_BLOCKED`.

---

## 4. Troubleshooting & FAQs

| Symptom | Cause | Solution |
| :--- | :--- | :--- |
| `UNAUTHORIZED` on connect | Missing token, expired JWT, or invalid signature | Ensure `auth: { token }` is sent with a valid, non-expired JWT. |
| `ACCOUNT_BLOCKED` on connect | Customer has `status = 'blocked'` in PostgreSQL | Check customer table or unblock via Admin API. |
| `APPROVAL_PENDING` on connect | Vendor has not been approved by Admin | Approve vendor via `PATCH /api/v1/admin/vendor-management/:id/approve`. |
| Product subscribe returned `rejected` | Product is deleted, disabled, or vendor is unapproved | Verify product has `isAvailable: true`, `isDisabledByAdmin: false`, and vendor profile is complete. |
| `RATE_LIMIT_EXCEEDED` | Client sent more than 60 socket events in 10 seconds | Throttle client-side event emission. |
| No events received in client | Client did not subscribe to product room, or event was not in user's personal room | Ensure you emitted `product:subscribe` for `product:<id>` events, and are connected with the correct customer token for `cart:*` events. |

