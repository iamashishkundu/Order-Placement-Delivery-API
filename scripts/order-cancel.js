require('dotenv').config();
const fs = require('fs');
const path = require('path');

const runtimeEnvPath = path.join(__dirname, '..', 'postman', 'payment.runtime.json');

if (!fs.existsSync(runtimeEnvPath)) {
  console.error('\n❌ No active test session found. Please run setup first.');
  console.error('Example: npm run test:payment:manual:setup -- M6\n');
  process.exit(1);
}

try {
  const envData = JSON.parse(fs.readFileSync(runtimeEnvPath, 'utf8'));
  const orderId = envData.values?.find(v => v.key === 'orderId')?.value;
  const token = envData.values?.find(v => v.key === 'customer1Token')?.value;

  if (!orderId || !token) {
    console.error('\n❌ Could not find orderId or customer1Token in test environment.');
    process.exit(1);
  }

  console.log(`\n⏳ Cancelling Order: ${orderId}...`);
  fetch(`http://localhost:5000/api/v1/customer/order/${orderId}/cancel`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  })
    .then(r => r.json())
    .then(data => {
      if (!data.success) {
        console.error('\n❌ Cancellation failed:', data.error?.message || data.message);
        process.exit(1);
      }
      console.log(`\n======================================================`);
      console.log(`✅ Order Cancelled Successfully!`);
      console.log(`Order ID:       ${data.data?.orderId}`);
      console.log(`Payment Status: ${data.data?.paymentStatus}`);
      console.log(`Refund ID:      ${data.data?.refundId || 'N/A'}`);
      console.log(`Message:        ${data.data?.message}`);
      console.log(`======================================================\n`);
    })
    .catch(err => {
      console.error('\n❌ Error connecting to server:', err.message);
      process.exit(1);
    });
} catch (err) {
  console.error('\n❌ Error reading environment:', err.message);
  process.exit(1);
}

