# Order Placement & Delivery API (Multi-Vendor, Cash on Delivery)

A production-ready Node.js & Express REST API for a multi-vendor marketplace where customers can browse, cart items from multiple vendors, and place Cash on Delivery (COD) orders with atomic stock reservations and sequential vendor item fulfillment.

---

## Tech Stack
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database & ORM**: PostgreSQL with Sequelize
- **Schema Management**: Managed **strictly via Sequelize Migrations** (no `sync()`)
- **Authentication**: JWT (`{ sub: id, role }`) with dynamic database account status re-validation
- **Validation**: Joi (structured schemas for `body`, `query`, and `params`)
- **Password Security**: Bcrypt with salt rounds
- **Testing**: Postman Collection (v2.1) + Local Environment with automated test scripts covering happy paths and failure boundaries.

---

## Architectural Rules & Standards Followed

1. **API Versioning**: All endpoints reside under `src/v1/` and are served at `/api/v1`.
2. **Role Isolation**: Only three role modules exist under `src/v1/modules`: `admin`, `vendor`, and `customer`.
3. **Four-File Action Structure**: Every feature is decomposed into action folders with exactly four files:
   - `<action>.route.js`
   - `<action>.controller.js`
   - `<action>.service.js`
   - `<action>.validation.js`
4. **Model Ownership**: Models live inside each role's `models/` directory (`admin/models`, `vendor/models`, `customer/models`). Other roles import them directly from their owning locations. Dynamic associations are wired via `associate(models)` in `src/config/database.js`.
5. **Dynamic Route Loader**: `src/config/routeLoader.js` automatically scans modules, sorts routers (mounting static paths before parameterized paths to prevent route shadowing), and applies `authenticate` + `authorizeRole(role)` for non-auth features while leaving `auth` routes public.
6. **Thin Controllers & Rich Services**: Controllers only unwrap HTTP requests, invoke business services, and format standardized responses (`successResponse` / `errorResponse`).
7. **Consistent Machine-Readable Error Codes**: Standardized JSON responses for all errors (`VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `VERIFICATION_REQUIRED`, `APPROVAL_PENDING`, `VENDOR_REJECTED`, `VENDOR_BLOCKED`, `PROFILE_INCOMPLETE`, `ACCOUNT_BLOCKED`, `OTP_INVALID`, `OTP_EXPIRED`, `OTP_ATTEMPTS_EXCEEDED`, `OTP_COOLDOWN`, `INSUFFICIENT_STOCK`, `ORDER_NOT_CANCELLABLE`, `INVALID_STATUS_TRANSITION`, `CATEGORY_IN_USE`, `DUPLICATE_RESOURCE`).

---

## Complete Project Structure

```
order-delivery-api/
  src/
    server.js
    app.js
    config/            env.js, database.js, routeLoader.js
    database/          migrations/, seeders/admin.seeder.js
    common/
      constants/       roles.js, orderStatus.js, vendorStatus.js, customerStatus.js, errorCodes.js
      middlewares/     authenticate.js, authorizeRole.js, validate.js, rateLimiter.js, errorHandler.js
      services/        otp.js, sms.js (no-op), email.js (no-op), orderStatus.js
      utils/           ApiError.js, apiResponse.js, asyncHandler.js, jwt.js, password.js
    v1/modules/
      admin/
        models/        admin.model.js, category.model.js
        auth/          login, changePassword
        profile/       getProfile, updateProfile
        vendor-management/   listVendors, getVendor, approveVendor, rejectVendor, blockVendor, unblockVendor
        customer-management/ listCustomers, getCustomer, blockCustomer, unblockCustomer
        category/      createCategory, listCategories, updateCategory, deleteCategory
        product/       listProducts, getProduct, disableProduct, enableProduct
        order/         listOrders, getOrder
        dashboard/     getDashboard
      vendor/
        models/        vendor.model.js, product.model.js, vendorOtp.model.js
        middlewares/   vendorGate.js
        auth/          register, sendPhoneOtp, verifyPhoneOtp, sendEmailOtp, verifyEmailOtp, login
        profile/       getStatus, createProfile, getProfile, updateProfile
        product/       createProduct, listProducts, getProduct, updateProduct, deleteProduct, updateStock, toggleAvailability
        order/         listOrders, getOrder, updateItemStatus
        dashboard/     getDashboard
      customer/
        models/        customer.model.js, address.model.js, cartItem.model.js, order.model.js, orderItem.model.js, customerOtp.model.js
        auth/          sendOtp, verifyOtp
        profile/       getProfile, updateProfile
        address/       addAddress, listAddresses, updateAddress, deleteAddress, setDefaultAddress
        browse/        listVendors, getVendor, listProducts, getProduct, listCategories
        cart/          addItem, updateItem, removeItem, getCart, clearCart
        order/         placeOrder, listOrders, getOrder, cancelOrder
  postman/             order-delivery.collection.json, local.environment.json
  .sequelizerc
  .env.example
  package.json
  README.md
```

---

## API Endpoints Reference

### Admin Endpoints (Base: `/api/v1/admin`)
| Method | Route | Description | Auth / Role |
| :--- | :--- | :--- | :--- |
| `POST` | `/admin/auth/login` | Super admin login | Public |
| `PATCH` | `/admin/auth/change-password` | Change admin password | Admin |
| `GET` | `/admin/profile` | View admin profile | Admin |
| `PATCH` | `/admin/profile` | Update admin profile details | Admin |
| `GET` | `/admin/vendor-management` | List vendors (`?status=&search=&page=&limit=`) | Admin |
| `GET` | `/admin/vendor-management/:vendorId` | Get vendor by UUID | Admin |
| `PATCH` | `/admin/vendor-management/:vendorId/approve` | Approve vendor (`pending` or `rejected` -> `approved`) | Admin |
| `PATCH` | `/admin/vendor-management/:vendorId/reject` | Reject vendor with reason body | Admin |
| `PATCH` | `/admin/vendor-management/:vendorId/block` | Block vendor (`approved` -> `blocked`) | Admin |
| `PATCH` | `/admin/vendor-management/:vendorId/unblock` | Unblock vendor (`blocked` -> `approved`) | Admin |
| `GET` | `/admin/customer-management` | List customers (`?status=&search=&page=&limit=`) | Admin |
| `GET` | `/admin/customer-management/:customerId` | View customer profile + order history | Admin |
| `PATCH` | `/admin/customer-management/:customerId/block` | Block customer account | Admin |
| `PATCH` | `/admin/customer-management/:customerId/unblock` | Unblock customer account | Admin |
| `POST` | `/admin/category` | Create product category | Admin |
| `GET` | `/admin/category` | List categories (`?isActive=&search=&page=&limit=`) | Admin |
| `PATCH` | `/admin/category/:categoryId` | Update category details | Admin |
| `DELETE` | `/admin/category/:categoryId` | Delete category (guards with `409 CATEGORY_IN_USE`) | Admin |
| `GET` | `/admin/product` | List all marketplace products | Admin |
| `GET` | `/admin/product/:productId` | View full product details with vendor/category | Admin |
| `PATCH` | `/admin/product/:productId/disable` | Disable product from customer browse catalog | Admin |
| `PATCH` | `/admin/product/:productId/enable` | Re-enable product in customer browse catalog | Admin |
| `GET` | `/admin/order` | Filter orders across vendors (`?status=&from=&to=`) | Admin |
| `GET` | `/admin/order/:orderId` | View order breakdown with per-vendor item statuses | Admin |
| `GET` | `/admin/dashboard` | Overall marketplace statistics and delivered COD revenue | Admin |

### Vendor Endpoints (Base: `/api/v1/vendor`)
| Method | Route | Description | Auth / Gate Requirement |
| :--- | :--- | :--- | :--- |
| `POST` | `/vendor/auth/register` | Register email, phone, and password | Public |
| `POST` | `/vendor/auth/send-phone-otp` | Request phone OTP | Public |
| `POST` | `/vendor/auth/verify-phone-otp` | Verify phone OTP | Public |
| `POST` | `/vendor/auth/send-email-otp` | Request email OTP | Public |
| `POST` | `/vendor/auth/verify-email-otp` | Verify email OTP | Public |
| `POST` | `/vendor/auth/login` | Login (blocked with `403` if unverified) | Public |
| `GET` | `/vendor/profile/status` | View approval/verification status | Vendor (Authenticated) |
| `POST` | `/vendor/profile` | Complete shop & owner profile | Vendor (`APPROVED`) |
| `GET` | `/vendor/profile` | View vendor profile | Vendor (`APPROVED`) |
| `PATCH` | `/vendor/profile` | Update vendor profile details | Vendor (`APPROVED`) |
| `POST` | `/vendor/product` | Add product to catalog | Vendor (`PROFILE_COMPLETE`) |
| `GET` | `/vendor/product` | List vendor's own products | Vendor (`PROFILE_COMPLETE`) |
| `GET` | `/vendor/product/:productId` | Get product details (restricted to own) | Vendor (`PROFILE_COMPLETE`) |
| `PATCH` | `/vendor/product/:productId` | Edit product details | Vendor (`PROFILE_COMPLETE`) |
| `DELETE` | `/vendor/product/:productId` | Soft delete product (`deletedAt`) | Vendor (`PROFILE_COMPLETE`) |
| `PATCH` | `/vendor/product/:productId/stock` | Update stock quantity | Vendor (`PROFILE_COMPLETE`) |
| `PATCH` | `/vendor/product/:productId/availability` | Toggle product availability | Vendor (`PROFILE_COMPLETE`) |
| `GET` | `/vendor/order` | View orders containing vendor's items | Vendor (`PROFILE_COMPLETE`) |
| `GET` | `/vendor/order/:orderId` | View order with vendor's own items + customer delivery address | Vendor (`PROFILE_COMPLETE`) |
| `PATCH` | `/vendor/order/:orderId/status` | Move all vendor's items 1-step forward (`placed -> preparing -> out_for_delivery -> delivered`) | Vendor (`PROFILE_COMPLETE`) |
| `GET` | `/vendor/dashboard` | Item counts by status & sales total from delivered items | Vendor (`PROFILE_COMPLETE`) |

### Customer Endpoints (Base: `/api/v1/customer`)
| Method | Route | Description | Auth / Role |
| :--- | :--- | :--- | :--- |
| `POST` | `/customer/auth/send-otp` | Request customer login OTP | Public |
| `POST` | `/customer/auth/verify-otp` | Verify OTP (creates account or logs in) | Public |
| `GET` | `/customer/profile` | View customer profile | Customer |
| `PATCH` | `/customer/profile` | Update customer name / email | Customer |
| `POST` | `/customer/address` | Add delivery address | Customer |
| `GET` | `/customer/address` | List delivery addresses | Customer |
| `PATCH` | `/customer/address/:addressId` | Update delivery address | Customer |
| `DELETE` | `/customer/address/:addressId` | Delete delivery address | Customer |
| `PATCH` | `/customer/address/:addressId/default` | Set primary default address | Customer |
| `GET` | `/customer/browse/categories` | Browse active categories | Customer |
| `GET` | `/customer/browse/vendors` | Browse approved vendors with visible items | Customer |
| `GET` | `/customer/browse/vendors/:vendorId` | View vendor with visible products | Customer |
| `GET` | `/customer/browse/products` | Browse catalog (`?search=&minPrice=&maxPrice=&categoryId=&vendorId=`) | Customer |
| `GET` | `/customer/browse/products/:productId` | View product specification | Customer |
| `POST` | `/customer/cart/items` | Add product to cart (validates visible & stock) | Customer |
| `PATCH` | `/customer/cart/items/:productId` | Update item quantity in cart | Customer |
| `DELETE` | `/customer/cart/items/:productId` | Remove item from cart | Customer |
| `GET` | `/customer/cart` | View cart with multi-vendor items & total amount | Customer |
| `DELETE` | `/customer/cart` | Clear entire cart | Customer |
| `POST` | `/customer/order` | Place COD order with atomic row locking (`SELECT FOR UPDATE`) & stock decrement | Customer |
| `GET` | `/customer/order` | List customer orders with derived statuses | Customer |
| `GET` | `/customer/order/:orderId` | View order breakdown grouped by vendor | Customer |
| `PATCH` | `/customer/order/:orderId/cancel` | Cancel order (allowed only while all items are `placed`; restores stock) | Customer |

---

## Setup & Running Locally

### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL instance running locally or in Docker

### 2. Environment Configuration
Copy `.env.example` to `.env` and verify database credentials:
```bash
cp .env.example .env
```

### 3. Run Migrations & Seeders
Execute database migrations and seed the super admin:
```bash
npm run migrate
npm run seed
```

### 4. Start the Application
```bash
npm start
# or for development with auto-reload:
npm run dev
```

---

## Postman Collection Runner Instructions

The project includes an end-to-end automated Postman test suite in `postman/`:
- **Collection**: [`postman/order-delivery.collection.json`](file:///c:/Users/gamer%20kumar/Downloads/Techugo/Techugo/Day-32,33,34/Project/postman/order-delivery.collection.json)
- **Environment**: [`postman/local.environment.json`](file:///c:/Users/gamer%20kumar/Downloads/Techugo/Techugo/Day-32,33,34/Project/postman/local.environment.json)

### Running via Postman:
1. Open Postman.
2. Click **Import** and select both `postman/order-delivery.collection.json` and `postman/local.environment.json`.
3. In the top-right environment selector, select **Order Delivery API - Local**.
4. Open the **Collection Runner** (`Runner` button or right-click collection -> `Run collection`).
5. Run the entire collection in order from `00. Setup` -> `01. Admin` -> `02. Vendor` -> `03. Customer`.
6. Automated test assertions verify HTTP status codes, response schemas, token propagation, ID retention, multi-vendor cart checkout, stock decrements/restorations, and error handling for all edge cases.

---

## Stripe Webhooks: Refund & Dispute Management (Addendum 2)

The application handles Stripe webhooks at `POST /api/v1/webhooks/stripe` (and `/webhooks/stripe`) with cryptographic signature validation (`Stripe-Signature` via `express.raw`), idempotent event deduplication via the `stripe_events` table, and payment/order fulfillment state updates.

### Supported Stripe Webhook Events
- `charge.refunded`:
  - **Full Refund**: Sets `payments.status = 'refunded'`, `payments.refundedAmount = full amount`, and `orders.paymentStatus = 'refunded'`.
    - If **EVERY** item in the order is still `'placed'`: cancels all items (`status = 'cancelled'`) and atomically restores product stock with `SELECT ... FOR UPDATE` row locks.
    - If **ANY** item is `'preparing'` or beyond: items and product stock remain untouched so fulfillment can be accounted for; the order is flagged as refunded in fulfillment.
  - **Partial Refund**: Updates `payments.refundedAmount` with the partial refunded sum; preserves `payments.status = 'paid'` and `orders.paymentStatus = 'paid'`.
  - **Idempotency**: If `payments.status` is already `'refunded'`, returns `200 OK` without redundant actions.
- `charge.dispute.created`:
  - Records `disputeId`, `disputeStatus`, `disputeReason`, `disputeAmount`, `disputeDueBy` (from Unix timestamp), and `disputeOpenedAt` on the `payments` record.
  - Items, stock, and order statuses remain untouched (evidence submission occurs in the Stripe Dashboard).
  - Triggers `notifyAdmin()` which logs a warning alert containing `orderId`, `disputeId`, `disputeDueBy`, amount, and reason.
- `charge.dispute.closed`:
  - Updates `disputeStatus` to the final resolution (e.g. `'won'` or `'lost'`) and sets `disputeClosedAt`.
  - If the dispute is `'lost'`, records the loss through the status update without automatic stock mutation.
- `checkout.session.completed`:
  - Marks `payments.status = 'paid'` and `orders.paymentStatus = 'paid'`.

---

## Testing Stripe Online Payments Locally

For a comprehensive, beginner-friendly manual testing guide with test cards and SQL queries, see [`PAYMENT-TESTING.md`](./PAYMENT-TESTING.md).

### 1. Automated Test Suite (Newman & HTML Report)
Run the automated payment suite (setup, online order creation, synthetic signed webhooks, concurrency checkout race, COD regression, and result page verification):
```bash
npm run test:payment
```
* Generates an interactive visual report at `postman/reports/payment-report.html`.
* Automatically signs synthetic events with HMAC-SHA256 and validates cryptographic verification, idempotency, stock reservations, refunds, and disputes.

### 2. Guided Manual Test Cases (M1 through M10)
Test real browser checkout, cards, and webhooks step-by-step:
```bash
# 1. Run setup for a case (e.g. M1): creates order and prints clickable Checkout URL
npm run test:payment:manual:setup -- M1

# 2. Complete payment or action in browser / Stripe Dashboard

# 3. Verify database and business states
npm run test:payment:manual:verify -- M1
```

### 3. Forward Webhook Events via Stripe CLI
To test live events from Stripe's sandbox servers:
```bash
stripe listen --forward-to localhost:5000/api/v1/webhooks/stripe --events checkout.session.completed,checkout.session.expired,charge.refunded,charge.dispute.created,charge.dispute.closed
```
*(Also accessible at `http://localhost:5000/webhooks/stripe`)*.

Copy the webhook signing secret displayed by the CLI (e.g. `whsec_...`) into your `.env`:
```env
STRIPE_WEBHOOK_SECRET=whsec_your_secret_from_stripe_listen
```
> **Note**: Do NOT configure a webhook destination in the Stripe dashboard for local testing. The Stripe CLI forwards events directly to `localhost`.

---

### Step-by-Step Test Scenarios

#### Scenario 1: Pay with Test Card (`4242 4242 4242 4242`) & Webhook Fulfillment
1. As a customer, place an online order:
   ```http
   POST /api/v1/customer/order
   Authorization: Bearer <customerToken>
   Content-Type: application/json

   {
     "addressId": "<addressUuid>",
     "paymentMethod": "ONLINE"
   }
   ```
2. Response returns HTTP `201 Created` with a hosted `checkoutUrl`. All items are initially created in status `pending_payment`, and vendor orders do **not** show these items yet.
3. Open `checkoutUrl` in your browser and complete the payment using Stripe test card:
   - **Card Number**: `4242 4242 4242 4242`
   - **Expiry**: Any future date (e.g. `12/34`)
   - **CVC**: `123`
4. The CLI forwards `checkout.session.completed` to the local webhook handler.
5. The webhook verifies signature and idempotency, then atomically:
   - Sets `orders.paymentStatus = 'paid'` and `payments.status = 'paid'`.
   - Advances all items from `pending_payment` to `placed`.
6. Vendors now see their respective items in `GET /api/v1/vendor/order` and can begin fulfillment (`placed -> preparing -> out_for_delivery -> delivered`).

---

#### Scenario 2: Cancel a Paid Order (Stripe Refund & Stock Restoration)
1. After completing payment in Scenario 1, while all items are still in `'placed'` status, the customer cancels the order:
   ```http
   PATCH /api/v1/customer/order/<orderId>/cancel
   Authorization: Bearer <customerToken>
   ```
2. The server calls `stripeService.createRefund` with an idempotency key (`refund-<orderId>`).
3. Upon refund confirmation from Stripe:
   - All items transition to `'cancelled'`.
   - Product inventory is automatically restored.
   - `orders.paymentStatus` and `payments.status` become `'refunded'`.
   - The Stripe refund ID is persisted to `payments.refundId`.
4. If any vendor had already advanced an item to `'preparing'`, cancellation is rejected with HTTP `409 ORDER_NOT_CANCELLABLE`.

---

#### Scenario 3: Refund a Test Payment from Stripe Dashboard
1. Create and pay for an order.
2. From the Stripe Dashboard (or CLI `stripe refunds create --payment-intent <pi_xxx>`), initiate a partial or full refund.
3. The CLI forwards `charge.refunded` to the webhook handler:
   - **Partial Refund**: Updates `payments.refundedAmount` only; leaves `paymentStatus = 'paid'`.
   - **Full Refund**: Sets `payments.status = 'refunded'`, `orders.paymentStatus = 'refunded'`, and `refundedAmount = full amount`.
     - *If all items are still `'placed'`*: cancels items and restores inventory to products.
     - *If any vendor has started preparing or beyond*: does **not** touch items or stock; records the refund so admins can see this order is refunded but in fulfillment.
4. Admins can filter these orders via `GET /api/v1/admin/order?paymentStatus=refunded`.

---

#### Scenario 4: Dispute Flow (Stripe Dispute Test Card)
1. Place an online order and pay using Stripe's dispute trigger card (`pm_card_createDispute` or `4000 0000 0000 0110`).
2. Stripe emits `charge.dispute.created`:
   - The webhook logs a warning alert: `[ADMIN ALERT - DISPUTE WARNING] Order ID: ... | Dispute Due By: ...`.
   - Saves `disputeId`, `disputeStatus`, `disputeReason`, `disputeAmount`, `disputeDueBy`, and `disputeOpenedAt`.
   - Does **not** cancel or alter item status automatically.
3. Verify Admin Visibility (customers and vendors never see dispute details):
   - `GET /api/v1/admin/order?disputed=true`: Returns disputed orders.
   - `GET /api/v1/admin/order/:orderId`: Returns full dispute and refund details.
   - `GET /api/v1/admin/dashboard`: `openDisputes` count and `disputedAmount` sum reflect active disputes.
4. Close the dispute in Stripe Dashboard:
   - Stripe emits `charge.dispute.closed`.
   - Webhook updates `disputeStatus` to the final resolution and sets `disputeClosedAt`. `openDisputes` count decrements.

---

#### Scenario 5: Expiration Handling & Fallback Background Cron Job
1. **Webhook Expiration (`checkout.session.expired`)**:
   - If a customer abandons the hosted checkout page, Stripe emits `checkout.session.expired` after the expiration window.
   - Webhook locks the order row, cancels items, restores product stock, and sets `paymentStatus = 'failed'`.
2. **Fallback Cron Job (`src/jobs/expireStalePayments.job.js`)**:
   - Scheduled via `node-cron` running every 5 minutes (`*/5 * * * *`).
   - Automatically detects ONLINE orders with `paymentStatus = 'pending'` older than `CHECKOUT_EXPIRY_MINUTES + 5` minutes.
   - Queries Stripe API to verify session status: if unpaid, atomically cancels items, restores inventory, and sets order and payment statuses to `'failed'`.

---

#### Scenario 6: Webhook Idempotency (Event Replay)
1. Resend any processed Stripe event using the Stripe CLI:
   ```bash
   stripe events resend evt_your_event_id
   ```
2. The server queries the `stripe_events` table:
   - Identifies that `evt_your_event_id` has already been processed.
   - Immediately returns HTTP `200 OK` with `{ received: true, idempotent: true }`.
   - No duplicate state mutations, double refunds, or redundant stock restorations occur.

---

#### Scenario 7: Webhook Security & Invalid Signature Rejection
1. Send a POST request to `/api/v1/webhooks/stripe` without a valid `Stripe-Signature` header.
2. The server strictly rejects the request with HTTP `400 Bad Request`:
   ```json
   {
     "success": false,
     "error": {
       "code": "WEBHOOK_SIGNATURE_INVALID",
       "message": "Webhook signature verification failed: ..."
     }
   }
   ```

