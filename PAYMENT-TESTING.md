# Stripe Payment Testing Guide

> A beginner-friendly, end-to-end testing playbook for the **Order Placement & Delivery API** Stripe payment integration.
> Covers automated Newman suites, real-browser checkout testing, test credit cards, Stripe CLI webhooks, refund cycles, and dispute handling.

---

## Table of Contents
1. [Section A: Architecture Overview](#section-a-architecture-overview)
2. [Section B: Setup & Prerequisites](#section-b-setup--prerequisites)
3. [Section C: Stripe Test Cards Reference](#section-c-stripe-test-cards-reference)
4. [Section D: How to Verify Results](#section-d-how-to-verify-results)
5. [Section E: Manual Test Cases (M1 through M10)](#section-e-manual-test-cases-m1-through-m10)
6. [Section F: Interactive Postman Scenarios Collection](#section-f-interactive-postman-scenarios-collection)
7. [Section G: Troubleshooting Common Issues](#section-g-troubleshooting-common-issues)
8. [Section H: Test Results Checklist & Evidence](#section-h-test-results-checklist--evidence)
9. [Section I: Cleanup & Security Safety](#section-i-cleanup--security-safety)

---

## Section A: Architecture Overview

The payment engine supports two payment options: **Cash on Delivery (COD)** and **Stripe Online Checkout (ONLINE)**.

1. **COD Orders**: Placed immediately. Items enter `placed` status right away, inventory is decremented, and vendors can see and fulfill the order immediately.
2. **ONLINE Orders**: When placed with `paymentMethod: "ONLINE"`, the order is created with `paymentStatus: "pending"`, and all items are marked `pending_payment`.
3. **Hosted Stripe Checkout**: The customer receives a secure hosted Stripe Checkout URL (`checkoutUrl`).
4. **Temporary Stock Reservation**: Product inventory is decremented at order creation to prevent overselling during checkout.
5. **Webhooks as Single Source of Truth**: The client redirect URL is purely informational. The order is **only** marked `paid` when Stripe cryptographically verifies and forwards `checkout.session.completed`.
6. **Vendor Visibility Isolation**: Vendors **cannot** see online orders while they are `pending_payment`. Only after payment confirmation do items become `placed` and visible to vendors.
7. **Session Expiration & Fallback**: If a customer abandons checkout, Stripe emits `checkout.session.expired` (or the background stale-payments cron executes), which cancels the order and automatically restores reserved inventory.
8. **Automated Refunds**: If an order is cancelled before fulfillment or if a late payment arrives after local cancellation, the system automatically triggers a full refund via the Stripe API.
9. **Disputes Lifecycle**: Incoming disputes (`charge.dispute.created`) are recorded against the payment record and surfaced on the Admin dashboard without auto-cancelling the order.

---

## Section B: Setup & Prerequisites

Follow these steps in exact order to prepare your local testing environment:

### Step 1: Verify PostgreSQL & Migrations
Ensure PostgreSQL is running and seeded:
```bash
# Verify database connection and seed state
npm run dev
```

### Step 2: Configure `.env`
Ensure your `.env` contains the required Stripe test variables:
```env
# Stripe Sandbox / Test API Credentials
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_signing_secret_here

# Redirect URLs
STRIPE_SUCCESS_URL=http://localhost:5000/api/v1/payments/success
STRIPE_CANCEL_URL=http://localhost:5000/api/v1/payments/cancel

# Timeout & Currency
CHECKOUT_EXPIRY_MINUTES=30
CURRENCY=usd
```

> [!WARNING]
> Always use your **Test Key** (`sk_test_...`). Never use live API keys (`sk_live_...`) or real credit cards.

### Step 3: Install & Authenticate the Stripe CLI
Download and install the official Stripe CLI for Windows, macOS, or Linux:
- **Windows (Scoop)**: `scoop install stripe`
- **Windows (Direct Download)**: [Download stripe_windows_x86_64.zip from GitHub releases](https://github.com/stripe/stripe-cli/releases) and add `stripe.exe` to your PATH.
- **macOS (Homebrew)**: `brew install stripe/stripe-cli/stripe`

Authenticate with your Stripe account in test mode:
```bash
stripe login
```
Follow the browser prompt to grant test-mode CLI access.

### Step 4: Do NOT Use Dashboard Webhook Destinations
> [!IMPORTANT]
> If you are on the Stripe Dashboard screen titled **"Create an event destination"** (or **"Webhooks"**):
> **Click CANCEL.**
> You do **not** configure a webhook endpoint in the Stripe dashboard for local testing (`localhost`). Public tunnels (localtunnel / ngrok) are prone to disconnects, tunnel warning interstitials, and signature mismatches.
> The **Stripe CLI** forwards webhooks directly to your local port securely.

### Step 5: Start the Backend & Stripe CLI Forwarder
Open two separate terminal windows:

**Terminal 1 (Backend API):**
```bash
npm run dev
# Server runs on http://localhost:5000
```

**Terminal 2 (Stripe CLI Webhook Listener):**
Run either the convenient project script:
```bash
npm run stripe:listen
```
Or the manual CLI command:
```bash
stripe listen --api-key sk_test_your_stripe_secret_key_here --forward-to localhost:5000/api/v1/webhooks/stripe --events checkout.session.completed,checkout.session.expired,charge.refunded,charge.dispute.created,charge.dispute.closed
```

> [!IMPORTANT]
> Always pass `--api-key <sk_test key>` (which `npm run stripe:listen` does automatically by reading your `.env`) so the CLI listens to the exact same Stripe account that generated your Checkout session.

When you run this command, the CLI prints:
```text
> Ready! You are using Stripe CLI version 1.x.x
> Your webhook signing secret is whsec_679h4ri2lhFE6KyLGr6EJi72g0GxgS1j (^C to quit)
```

1. Copy the `whsec_...` value.
2. Open your `.env` file and set:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_679h4ri2lhFE6KyLGr6EJi72g0GxgS1j
   ```
3. Restart Terminal 1 so the server loads the matching webhook secret.

### Step 6: Verify Automatic Test Suite (Pre-Flight Check)
Run the automated Newman test suite. All tests must pass before starting manual browser testing:
```bash
npm run test:payment
```
Expect **59/59 assertions passed, 0 failed**. An HTML report will be generated at `postman/reports/payment-report.html`.

---

## Section C: Stripe Test Cards Reference

Use only official Stripe sandbox test cards. 
- **Expiry Date**: Any future month and year (e.g., `12/28`).
- **CVC**: Any 3 digits (e.g., `123`).
- **Billing ZIP / Postal Code**: Any valid postal code (e.g., `90210` or `10001`).

| Card Number | Card Type / Scenario | Expected Behavior |
| :--- | :--- | :--- |
| `4242 4242 4242 4242` | **Standard Success (Visa)** | Immediately succeeds with no friction or 3DS. |
| `4000 0000 0000 0002` | **Generic Decline** | Checkout form shows inline error: *"Your card was declined."* Allows retrying with another card. |
| `4000 0000 0000 0999` | **Insufficient Funds** | Checkout shows error: *"Your card has insufficient funds."* |
| `4000 0027 6000 3184` | **3D Secure (Always Challenge)** | Standard Stripe 3DS card. Pops up a test modal asking to click *"Complete authentication"*. |
| `4000 0000 0000 3220` | **3D Secure (3DS2 Required)** | All-zeros middle format. Simulates 3DS2 challenge authentication. |
| `4000 0000 0000 0259` | **Dispute / Fraud Trigger** | Official Stripe dispute card. Payment succeeds and Stripe automatically creates a `fraudulent` dispute. |

> [!CAUTION]
> **NEVER** enter real credit or debit card numbers in Stripe test mode.

---

## Section D: How to Verify Results

For every manual test case, verify outcomes across four independent layers:

### 1. Newman Verification Command
Run the verification command for that specific case ID:
```bash
npm run test:payment:manual:verify -- M1
```
- **Green (`200 OK`)**: Database states, payment status, and order item lifecycle match expected rules.
- **Red (`AssertionError`)**: Discrepancy detected (e.g., webhook did not arrive, status remained pending).

### 2. Stripe CLI Listener Logs (Terminal 2)
Watch Terminal 2 while performing actions. You should see incoming events responded to with `200 OK`:
```text
2026-10-30 03:20:00   --> checkout.session.completed [evt_1Q...]
2026-10-30 03:20:00  <--  [200] POST http://localhost:5000/api/v1/webhooks/stripe [checkout.session.completed]
```

### 3. Stripe Dashboard (Sandbox Mode)
1. Navigate to: `https://dashboard.stripe.com/test/`
2. **Payments**: Check that the payment shows **Succeeded** ($20.00 USD) and has matching metadata `orderId`.
3. **Developers &rarr; Workbench / Events**: View raw event payloads and delivery attempts.
4. **Refunds / Disputes**: Confirm refund status or simulated disputes.

### 4. Direct Database Queries (PostgreSQL)
Run these SQL queries via `psql` or pgAdmin:
```sql
-- Check order and payment status
SELECT id, "orderNumber", "totalAmount", status, "paymentStatus", "paymentMethod"
FROM orders
WHERE id = '<orderId>';

-- Check item fulfillment statuses
SELECT id, "productId", quantity, "priceAtPurchase", status
FROM order_items
WHERE "orderId" = '<orderId>';

-- Check payment record and provider IDs
SELECT id, "orderId", "totalAmount", status, "providerSessionId", "providerPaymentIntentId", "refundedAmount", "isDisputed"
FROM payments
WHERE "orderId" = '<orderId>';

-- Check product stock
SELECT id, title, stock, price
FROM products
WHERE id = '<productId>';
```

---

## Section E: Manual Test Cases (M1 through M10)

### M1: Real Payment Happy Path
* **Goal**: Confirm end-to-end payment completion using a valid card.
* **Preconditions**: Stripe CLI running; server online.
* **Execution**:
  1. Run setup:
     ```bash
     npm run test:payment:manual:setup -- M1
     ```
  2. Open the printed `Checkout URL` in your browser.
  3. Enter card `4242 4242 4242 4242`, MM/YY `12/28`, CVC `123`, ZIP `90210`.
  4. Click **Pay**. Browser redirects to success page.
  5. Terminal 2 displays: `200 POST ... [checkout.session.completed]`.
  6. Run verification:
     ```bash
     npm run test:payment:manual:verify -- M1
     ```
* **Expected Verification**:
  - `orders.paymentStatus` = `'paid'`
  - `order_items.status` = `'placed'`
  - `payments.status` = `'paid'`, `providerPaymentIntentId` populated (`pi_...`).
  - Vendors can now view the order in their dashboard.

---

### M2: Declined Card Retry on Same Checkout Session
* **Goal**: Verify that a declined card does not corrupt the order or create duplicate payment records, and customer can retry on the same page.
* **Execution**:
  1. Run setup:
     ```bash
     npm run test:payment:manual:setup -- M2
     ```
  2. Open the `Checkout URL`.
  3. Enter declined card `4000 0000 0000 0002`, any future date, CVC `123`. Click **Pay**.
  4. Notice the inline error: *"Your card was declined."*
  5. On the same page, replace the card number with `4242 4242 4242 4242` and click **Pay**.
  6. Wait for successful redirect.
  7. Run verification:
     ```bash
     npm run test:payment:manual:verify -- M2
     ```
* **Expected Verification**:
  - Exactly one `payments` row exists for this order.
  - `orders.paymentStatus` = `'paid'`.

---

### M3: 3D Secure (3DS) Authentication Flow
* **Goal**: Validate strong customer authentication (SCA) challenge handling.
* **Execution**:
  1. Run setup:
     ```bash
     npm run test:payment:manual:setup -- M3
     ```
  2. Open the `Checkout URL`.
  3. Enter 3DS test card `4000 0027 6000 3184` (or `4000 0000 0000 3220`), future date, CVC `123`. Click **Pay**.
  4. A popup modal appears: *"Customer Authentication"*.
  5. Click the button: **Complete authentication**.
  6. Wait for redirect to success URL.
  7. Run verification:
     ```bash
     npm run test:payment:manual:verify -- M3
     ```
* **Expected Verification**:
  - 3DS challenge succeeds; `checkout.session.completed` received with 200.
  - Order status is `paid`, items are `placed`.

---

### M4: Abandoned Checkout Session Expiry & Stock Restoral
* **Goal**: Ensure abandoned checkout sessions release inventory and cancel the order.
* **Execution**:
  1. Run setup:
     ```bash
     npm run test:payment:manual:setup -- M4
     ```
  2. Note the initial product stock. Open the `Checkout URL` in browser, but **do not pay**.
  3. In a terminal, immediately expire the session:
     ```bash
     npm run stripe:expire
     # Or manually via Stripe CLI:
     # stripe checkout sessions expire <providerSessionId> --api-key <your_sk_test_key>
     ```
     *(Alternatively, wait for expiration or trigger the stale payment cron).*
  4. Terminal 2 logs `200 POST ... [checkout.session.expired]`.
  5. Run verification:
     ```bash
     npm run test:payment:manual:verify -- M4
     ```
* **Expected Verification**:
  - `orders.paymentStatus` = `'failed'`
  - `order_items.status` = `'cancelled'`
  - `products.stock` restored back by +1.

---

### M5: Customer Cancels Before Submitting Payment
* **Goal**: Customer clicks cancel on the Stripe-hosted checkout page.
* **Execution**:
  1. Run setup (automatically opens your default browser):
     ```bash
     npm run test:payment:manual:setup -- M5
     ```
  2. Open the page (via auto-open, clicking `http://localhost:5000/pay`, or the direct URL).
  3. Click the **Cancel** or **← Back to Store** link at top-left of the Stripe page.
  4. Confirm browser redirects to `STRIPE_CANCEL_URL` (displays clean "Payment Cancelled" page).
  5. Run verification:
     ```bash
     npm run test:payment:manual:verify -- M5
     ```
* **Expected Verification**:
  - Order remains `pending_payment` until expiration or customer explicit cancellation.
  - Calling `POST /api/v1/customer/order/<orderId>/cancel` successfully marks it cancelled and restores stock.

---

### M6: Customer Cancels After Payment (Full Automated Refund)
* **Goal**: Validate that cancelling a paid order before vendor preparation automatically issues a Stripe refund.
* **Execution**:
  1. Run setup:
     ```bash
     npm run test:payment:manual:setup -- M6
     ```
  2. Open the `Checkout URL` and pay with `4242 4242 4242 4242`.
  3. Confirm Terminal 2 logs `checkout.session.completed` (200).
  4. Cancel the order via the customer API:
     ```bash
     # Option A (Convenient 1-command shortcut):
     npm run order:cancel

     # Option B (Manual cURL / Postman):
     # PATCH http://localhost:5000/api/v1/customer/order/<orderId>/cancel
     # Header: Authorization: Bearer <customer1Token>
     ```
  5. Terminal 2 logs `200 POST ... [charge.refunded]`.
  6. Run verification:
     ```bash
     npm run test:payment:manual:verify -- M6
     ```
* **Expected Verification**:
  - `orders.paymentStatus` = `'refunded'`
  - `order_items.status` = `'cancelled'`
  - `products.stock` restored.
  - Stripe Dashboard shows payment marked **Refunded**.

---

### M7: Refund Initiated From Stripe Dashboard
* **Goal**: Merchant initiates refund from Stripe Dashboard; system synchronizes state.
* **Execution**:
  1. Run setup:
     ```bash
     npm run test:payment:manual:setup -- M7
     ```
  2. Open `Checkout URL` and pay with `4242 4242 4242 4242`.
  3. Open Stripe Dashboard &rarr; **Payments** (Test Mode).
  4. Locate the $20.00 payment and click **Refund**. Confirm full refund.
  5. Terminal 2 logs `200 POST ... [charge.refunded]`.
  6. Run verification:
     ```bash
     npm run test:payment:manual:verify -- M7
     ```
* **Expected Verification**:
  - `orders.paymentStatus` = `'refunded'`
  - `payments.status` = `'refunded'`, `payments.refundedAmount` = `20.00`.

---

### M8: Charge Dispute / Chargeback Simulation & Resolution
* **Goal**: Ingest dispute webhook, alert admin, and update resolution upon closure.
* **Execution**:
  1. Run setup:
     ```bash
     npm run test:payment:manual:setup -- M8
     ```
  2. Open `Checkout URL` (or `http://localhost:5000/pay`) and pay with dispute card `4000 0000 0000 0259`.
  3. Stripe automatically generates a dispute (or in Stripe Dashboard &rarr; **Payments**, view the dispute).
  4. Terminal 2 logs `200 POST ... [charge.dispute.created]`.
  5. In Stripe Dashboard, click **Close dispute** (or accept/resolve).
  6. Terminal 2 logs `200 POST ... [charge.dispute.closed]`.
  7. Run verification:
     ```bash
     npm run test:payment:manual:verify -- M8
     ```
* **Expected Verification**:
  - `payments.isDisputed` = `true`.
  - Admin endpoint `GET /api/v1/admin/order?disputed=true` lists this order.
  - Vendors and customer endpoints **hide** internal dispute fields.

---

### M9: Missed Webhook Fallback (Cron Reconciler)
* **Goal**: Validate recovery when webhooks fail to arrive or network was down.
* **Execution**:
  1. Stop Terminal 2 (Stripe CLI listener) using `Ctrl+C`.
  2. Run setup:
     ```bash
     npm run test:payment:manual:setup -- M9
     ```
  3. Open `Checkout URL` and pay with `4242 4242 4242 4242`.
  4. Webhook is missed. Order remains `pending_payment` in local DB.
  5. Trigger the reconciliation job:
     ```bash
     npm run payments:reconcile
     ```
  6. Restart Stripe CLI listener in Terminal 2 (`npm run stripe:listen`).
  7. Run verification:
     ```bash
     npm run test:payment:manual:verify -- M9
     ```
* **Expected Verification**:
  - Backend retrieves session status directly from Stripe API (`payment_status === 'paid'`) and marks order `paid`.

---

### M10: Late Payment After Local Expiration (Auto-Refund Race Guard)
* **Goal**: Customer completes payment in browser tab after local order was expired or cancelled.
* **Execution**:
  1. Run setup:
     ```bash
     npm run test:payment:manual:setup -- M10
     ```
  2. Open the `Checkout URL` in your browser, but **do not submit payment yet**.
  3. In a terminal, expire the order locally:
     ```bash
     npm run order:expire:local
     ```
     *(This marks the order `failed` locally and restores inventory, while leaving the Stripe checkout session active in your browser).*
  4. Return to the open browser tab and click **Pay** with `4242 4242 4242 4242`.
  5. Stripe completes charge and forwards `checkout.session.completed`.
  6. The webhook handler detects the order is already failed/cancelled, ignores inventory, and automatically issues a full Stripe refund with reason `duplicate` (Race Guard)!
  7. Run verification:
     ```bash
     npm run test:payment:manual:verify -- M10
     ```
* **Expected Verification**:
  - Order stays cancelled.
  - Payment record reflects automatic refund (`refunded`).
  - Terminal 2 logs automatic refund issuance.

---

## Section F: Interactive Postman Scenarios Collection

For developers and QA engineers who prefer testing directly within the **Postman desktop application**, we provide an interactive scenario collection:
* **Collection File**: `postman/scenarios.collection.json`
* **Environment File**: `postman/payment.environment.json`

This collection models complete real-world stories: **Vendor creates product -> Customer places order -> Plays through realistic operational scenario**.

### 1. How to Import into Postman
1. Open the Postman Desktop App.
2. Click **Import** (top-left).
3. Select both files:
   - `postman/scenarios.collection.json`
   - `postman/payment.environment.json`
4. In Postman's top-right environment dropdown, select: **`Order Placement & Delivery API (Test Environment)`**.

---

### 2. Folder 0: Setup & Auth (Run Once)
Before running scenarios, open folder `0. Setup & Auth (Run Once)` and execute requests `0.1` through `0.16` (or click **Run folder**):
* **0.1 Seeded Admin Login**: Logs in Super Admin (`adminToken`).
* **0.2 Create Category**: Sets up active category for vendor listings (`categoryId`).
* **0.3 Register Vendor A**: Creates initial unverified Vendor A account (`vendorAId`).
* **0.4 Send Phone OTP (Vendor A)**: Triggers SMS OTP to vendor's phone number.
* **0.5 Verify Phone OTP (Vendor A)**: Submits OTP to verify vendor's phone number.
* **0.6 Send Email OTP (Vendor A)**: Triggers email OTP to vendor's email address.
* **0.7 Verify Email OTP (Vendor A)**: Submits OTP to verify vendor's email address.
* **0.8 Admin Approve Vendor A**: Admin reviews verified vendor and grants approval.
* **0.9 Vendor A Login**: Logs in approved Vendor A and acquires `vendorAToken`.
* **0.10 Vendor A Create Profile**: Creates shop details; vendor is now authorized to sell.
* **0.11 Customer 1 Send OTP**: Requests login OTP for Customer 1.
* **0.12 Customer 1 Verify OTP & Login**: Verifies OTP, logs in, and saves `customer1Token`.
* **0.13 Customer 1 Add Delivery Address**: Adds verified shipping address (`customer1AddressId`).
* **0.14 Customer 2 Send OTP**: Requests login OTP for Customer 2.
* **0.15 Customer 2 Verify OTP & Login**: Verifies OTP, logs in, and saves `customer2Token`.
* **0.16 Customer 2 Add Delivery Address**: Adds verified shipping address (`customer2AddressId`).

---

### 3. Step-by-Step Scenario Walkthrough

#### Scenario 1: Happy Path E2E Order & Full Fulfillment
* **1.1 Vendor Creates Product**: Vendor A creates `Artisan Pizza` ($25.00, stock: 10).
* **1.2 Customer Adds 2 Units to Cart**: Customer 1 adds 2 pizzas to cart ($50.00 total).
* **1.3 Customer Places ONLINE Order**: Returns checkout link and displays Postman **Visualize** card.
  * In the **Visualize** tab, click **Open Checkout (Short Link)** (opens `http://localhost:5000/pay`).
  * Pay with standard Visa test card: `4242 4242 4242 4242`.
  * Stripe CLI forwards `checkout.session.completed`.
* **1.4 Verify Order State is Paid**: Admin audits order; confirms `paymentStatus = 'paid'` and item `status = 'placed'`.
* **1.5 Vendor Views Incoming Order**: Vendor A sees the paid order in their orders list.
* **1.6 Vendor Advances Status: placed -> preparing**: Vendor moves order to kitchen preparation.
* **1.7 Vendor Advances Status: preparing -> out_for_delivery**: Courier picks up order.
* **1.8 Vendor Advances Status: out_for_delivery -> delivered**: Delivered to customer.
* **1.9 Admin Checks Dashboard & Revenue Metrics**: Super Admin verifies financial breakdown reflects the $50 completed revenue.

---

#### Scenario 2: Cancellation & Automated Full Stripe Refund
* **2.1 Vendor Checks Initial Product Stock**: Records baseline inventory count.
* **2.2 Customer Adds 1 Unit to Cart**: Customer 1 adds item to cart.
* **2.3 Customer Places ONLINE Order**: Renders Visualizer card.
  * Open `http://localhost:5000/pay` and pay with card `4242 4242 4242 4242`.
* **2.4 Customer Cancels Paid Order**: Customer calls cancel API while item is still `placed`.
  * Backend automatically calls `stripe.refunds.create` before DB update.
  * Returns `paymentStatus: "refunded"` and Stripe refund ID (`re_...`).
* **2.5 Verify Product Stock Restored**: Confirms inventory increased back to original baseline.

---

#### Scenario 3: Vendor Preparing Lockout (409 Guard)
* **3.1 Customer Adds 1 Unit to Cart**: Customer 1 adds item to cart.
* **3.2 Customer Places ONLINE Order**: Customer orders and pays via `http://localhost:5000/pay`.
* **3.3 Vendor Moves Item to Preparing**: Vendor starts food preparation.
* **3.4 Customer Attempts to Cancel**:
  * Customer calls cancel API.
  * Server strictly blocks cancellation with **HTTP 409 Conflict** (`ORDER_NOT_CANCELLABLE`) to protect vendor costs!

---

#### Scenario 4: Stock Depletion & Sold-Out Protection (Flash Sale)
* **4.1 Vendor Creates Flash-Sale Item**: Vendor A creates a limited item with `stock: 1`.
* **4.2 Customer 1 Adds Flash-Sale Item to Cart**: Customer 1 adds item to cart.
* **4.3 Customer 1 Places ONLINE Order**: Customer 1 orders the only unit. Stock drops to 0.
* **4.4 Customer 2 Tries to Order Same Item**: Customer 2 tries to add unit to cart.
  * Server immediately rejects request with **HTTP 400/409 INSUFFICIENT_STOCK**.
* **4.5 Vendor Verifies Remaining Stock is Exactly 0**: Vendor confirms inventory is safely depleted without overselling.

---

#### Scenario 5: Abandoned Checkout Session Expiration
* **5.1 Vendor Checks Product Stock**: Records baseline stock.
* **5.2 Customer Adds 1 Unit to Cart**: Customer 1 adds item to cart.
* **5.3 Customer Places ONLINE Order (Stock Reserved)**: Order created; 1 unit reserved.
  * Customer abandons checkout.
  * Run in terminal: `npm run stripe:expire`
* **5.4 Verify Order Status is Failed**: Admin confirms `paymentStatus = 'failed'` and items marked `'cancelled'`.
* **5.5 Verify Stock Returned Back to Original Baseline**: Product inventory restored.

---

#### Scenario 6: Fraud Dispute / Chargeback Simulation & Audit
* **6.1 Customer Adds 1 Unit to Cart**: Customer 1 adds item to cart.
* **6.2 Customer Places ONLINE Order**:
  * Open `http://localhost:5000/pay`.
  * Pay with Stripe's official dispute trigger card: `4000 0000 0000 0259`.
  * Stripe immediately processes the charge AND automatically triggers `charge.dispute.created`.
* **6.3 Admin Checks Disputed Orders List**: Admin queries `GET /admin/order?disputed=true`.
* **6.4 Admin Inspects Order Dispute Details**: Admin audits `disputeReason`, `disputeStatus`, and `disputeAmount`.
* **6.5 Customer View Hides Dispute Details**: Verifies customer endpoint strictly hides internal dispute and chargeback data (privacy guard).

---

## Section G: Troubleshooting Common Issues

| Error / Symptom | Root Cause | Exact Fix |
| :--- | :--- | :--- |
| **`400 WEBHOOK_SIGNATURE_INVALID`** | `STRIPE_WEBHOOK_SECRET` in `.env` does not match the secret printed by `stripe listen`. | Copy the `whsec_...` secret from the CLI terminal into `.env` and restart the API server. |
| **"This link is incomplete" (Stripe)** | PowerShell/terminal line-wrapping truncated the long 460+ character checkout URL when clicked or copied. | Open `http://localhost:5000/pay` (short redirect link) or let the setup command auto-open your browser. |
| **`404 Cannot GET /api/v1/payments/success`** | Landing redirect page was not mounted in Express. | Fixed! Beautiful 200 HTML pages are now mounted on `/api/v1/payments/success`, `/payments/success`, `/api/v1/payments/cancel`, and `/payments/cancel`. |
| **Nothing prints in `stripe listen` terminal** | The CLI was executed without `--api-key` or was not authenticated to the same account as `.env`. | Run `npm run stripe:listen` (or add `--api-key <sk_test_key>` to `stripe listen`) so the CLI listens to the exact same Stripe account. |
| **`Session verification mismatch: amountMatches=false`** | Event payload `amount_total` was passed as a string or does not match order amount in cents. | Ensure `amount_total` equals `Math.round(totalAmount * 100)`. Our webhook handler automatically coerces `Number(session.amount_total)`. |
| **`502 PAYMENT_PROVIDER_ERROR`** | Deprecated `payment_method_types: ['card']` parameter passed to Checkout Sessions API. | Omit `payment_method_types` parameter; Stripe manages payment methods dynamically from Dashboard settings. |
| **Vendor does not see placed order** | Order paymentStatus is still `pending` because webhook was not received. | Verify Terminal 2 is running `stripe listen` with `--forward-to localhost:5000/api/v1/webhooks/stripe`. |
| **Stock remains 0 after cancelled order** | Stock restoral transaction failed or product ID mismatch. | Check logs for unhandled error in `OrderItem` rollback loop. Verify database transaction committed cleanly. |
| **Postman synthetic webhook fails signature** | Postman evaluated variable inside HMAC after computing signature on raw unresolved template. | The collection includes a pre-request script using `pm.variables.replaceIn(body)` before signing with `CryptoJS.HmacSHA256`. |

---

## Section H: Test Results Checklist & Evidence

Print or copy this table into your QA submission report:

| Case ID | Test Scenario | Postman Assertions | Stripe CLI Forward (200) | Dashboard Status | DB Verified | Signature / Tester | Date |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **M1** | Real Payment Happy Path | `[ ] PASS` | `[ ] YES` | Succeeded | `[ ] OK` | | |
| **M2** | Declined Card Retry | `[ ] PASS` | `[ ] YES` | Succeeded | `[ ] OK` | | |
| **M3** | 3D Secure Authentication | `[ ] PASS` | `[ ] YES` | Succeeded | `[ ] OK` | | |
| **M4** | Abandoned Session Expiry | `[ ] PASS` | `[ ] YES` | Expired | `[ ] OK` | | |
| **M5** | Cancel Before Paying | `[ ] PASS` | `[ ] N/A` | Incomplete | `[ ] OK` | | |
| **M6** | Cancel After Paying (Refund) | `[ ] PASS` | `[ ] YES` | Refunded | `[ ] OK` | | |
| **M7** | Dashboard Refund Sync | `[ ] PASS` | `[ ] YES` | Refunded | `[ ] OK` | | |
| **M8** | Dispute Lifecycle Flow | `[ ] PASS` | `[ ] YES` | Disputed | `[ ] OK` | | |
| **M9** | Missed Webhook Recovery | `[ ] PASS` | `[ ] N/A` | Succeeded | `[ ] OK` | | |
| **M10** | Late Payment Auto-Refund | `[ ] PASS` | `[ ] YES` | Auto-Refund | `[ ] OK` | | |

### Evidence Submission Artifacts
1. **Automated Newman Report**: `postman/reports/payment-report.html`.
2. **Terminal Screenshot**: Terminal 2 showing forwarded webhook events with HTTP 200 responses.
3. **Stripe Dashboard Screenshot**: Payments list in test mode displaying payments, refunds, and metadata.
4. **PostgreSQL Dump / SQL Output**: Query results confirming order, order items, and payment row states.

---

## Section I: Cleanup & Security Safety

1. **Keep Secrets Out of Version Control**:
   - Never commit `.env` or real API keys to Git.
   - `postman/payment.environment.json` contains only placeholder values (`whsec_placeholder_secret`).
2. **Key Rotation**:
   - If a test secret key (`sk_test_...`) or webhook secret is ever exposed publicly, immediately roll it via **Stripe Dashboard &rarr; Developers &rarr; API Keys &rarr; Roll key**.
3. **Local Port & Service Cleanup**:
   - Close Terminal 2 (`Ctrl+C`) when testing concludes to terminate the Stripe CLI tunnel.

