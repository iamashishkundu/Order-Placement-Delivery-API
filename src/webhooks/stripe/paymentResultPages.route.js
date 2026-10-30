const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

/**
 * GET /pay & /api/v1/payments/pay
 * Clean short URL shortcut that redirects immediately to the active Stripe checkout URL.
 * Prevents terminal line-wrapping from corrupting long Stripe URLs.
 */
router.get(['/pay', '/api/v1/payments/pay'], (req, res) => {
  const runtimePath = path.join(__dirname, '..', '..', '..', 'postman', 'payment.runtime.json');
  if (fs.existsSync(runtimePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(runtimePath, 'utf8'));
      const checkoutUrl = data.values?.find(v => v.key === 'checkoutUrl')?.value;
      if (checkoutUrl) {
        return res.redirect(302, checkoutUrl);
      }
    } catch (e) {}
  }
  return res.status(404).send('No active checkout session found. Please run a manual setup command first.');
});

/**
 * Escapes HTML entities to prevent XSS.
 */
function sanitizeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * GET /payments/success & /api/v1/payments/success
 * Returns 200 HTML in non-production mode with clean status indication.
 * Strictly avoids exposing database secrets, API keys, or private customer records.
 */
router.get(
  [
    '/payments/success',
    '/payment/success',
    '/api/v1/payments/success',
    '/api/v1/payment/success',
  ],
  (req, res) => {
  const sessionId = sanitizeHtml(req.query.session_id || '');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Successful - Order Delivery API</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%);
      color: #0f172a;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: #ffffff;
      border-radius: 16px;
      padding: 40px;
      max-width: 540px;
      width: 100%;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03);
      border: 1px solid #e2e8f0;
      text-align: center;
    }
    .icon-wrapper {
      width: 72px;
      height: 72px;
      background: #dcfce7;
      color: #16a34a;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 24px;
    }
    .icon-wrapper svg {
      width: 40px;
      height: 40px;
    }
    h1 {
      font-size: 24px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 8px;
    }
    p.subtitle {
      color: #64748b;
      font-size: 15px;
      line-height: 1.5;
      margin-bottom: 24px;
    }
    .info-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      text-align: left;
      font-size: 13px;
      color: #334155;
      margin-bottom: 24px;
    }
    .info-box strong {
      color: #0f172a;
    }
    .info-box code {
      background: #e2e8f0;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 12px;
      word-break: break-all;
    }
    .next-steps {
      background: #f1f5f9;
      border-left: 4px solid #16a34a;
      padding: 14px 16px;
      text-align: left;
      border-radius: 0 8px 8px 0;
      font-size: 13px;
      color: #334155;
      line-height: 1.6;
    }
    .next-steps code {
      background: #0f172a;
      color: #38bdf8;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon-wrapper">
      <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"></path>
      </svg>
    </div>
    <h1>Payment Successful!</h1>
    <p class="subtitle">Your Stripe Checkout session was completed successfully. Stripe has dispatched the webhook event to confirm fulfillment.</p>
    
    ${sessionId ? `
    <div class="info-box">
      <div><strong>Stripe Session:</strong> <code>${sessionId}</code></div>
    </div>
    ` : ''}

    <div class="next-steps">
      <strong>Next Steps:</strong>
      <ol style="margin-top: 6px; padding-left: 18px;">
        <li>Verify in your Stripe CLI terminal: <code>checkout.session.completed [200]</code>.</li>
        <li>You can close this browser tab and return to your terminal or Postman.</li>
        <li>Run: <code>npm run test:payment:manual:verify -- M1</code> to verify database states.</li>
      </ol>
    </div>
  </div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(html);
});

/**
 * GET /payments/cancel & /api/v1/payments/cancel
 * Returns 200 HTML when a customer clicks cancel on Stripe Checkout.
 */
router.get(
  [
    '/payments/cancel',
    '/payment/cancel',
    '/api/v1/payments/cancel',
    '/api/v1/payment/cancel',
  ],
  (req, res) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Cancelled - Order Delivery API</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: linear-gradient(135deg, #fef2f2 0%, #fff7ed 100%);
      color: #0f172a;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: #ffffff;
      border-radius: 16px;
      padding: 40px;
      max-width: 540px;
      width: 100%;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
      border: 1px solid #e2e8f0;
      text-align: center;
    }
    .icon-wrapper {
      width: 72px;
      height: 72px;
      background: #fee2e2;
      color: #dc2626;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 24px;
    }
    .icon-wrapper svg {
      width: 40px;
      height: 40px;
    }
    h1 {
      font-size: 24px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 8px;
    }
    p.subtitle {
      color: #64748b;
      font-size: 15px;
      line-height: 1.5;
      margin-bottom: 24px;
    }
    .info-box {
      background: #fffbeb;
      border-left: 4px solid #f59e0b;
      padding: 14px 16px;
      text-align: left;
      border-radius: 0 8px 8px 0;
      font-size: 13px;
      color: #92400e;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon-wrapper">
      <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path>
      </svg>
    </div>
    <h1>Payment Cancelled</h1>
    <p class="subtitle">The checkout session was cancelled. No charges were made to your account or card.</p>
    <div class="info-box">
      <strong>Status Note:</strong> Reserved inventory will be automatically restored when the session expires or if cancelled via the customer API. You may close this tab.
    </div>
  </div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(html);
});

module.exports = router;
