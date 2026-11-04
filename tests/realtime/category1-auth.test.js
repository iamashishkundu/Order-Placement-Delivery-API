const assert = require('assert');
const { connectClient, connectAndReady, signToken, models } = require('./test-helpers');
const { blockCustomer } = require('../../src/v1/modules/admin/customer-management/blockCustomer/blockCustomer.service');
const { blockVendor } = require('../../src/v1/modules/admin/vendor-management/blockVendor/blockVendor.service');
const { Customer, Vendor, Admin } = models;

async function runCategory1(url, io) {
  console.log('\n--- Category 1: Connection & Authentication ---');

  // 1. Missing token
  await new Promise((resolve, reject) => {
    const client = connectClient(url);
    client.on('connect_error', (err) => {
      assert.strictEqual(err.data?.code, 'UNAUTHORIZED');
      assert.match(err.message, /missing or malformed/i);
      client.close();
      resolve();
    });
    client.on('connect', () => {
      client.close();
      reject(new Error('Should not connect without token'));
    });
  });
  console.log('  √ 1.1 Rejects connection without token (UNAUTHORIZED)');

  // 2. Invalid JWT token
  await new Promise((resolve, reject) => {
    const client = connectClient(url, 'invalid.jwt.token.here');
    client.on('connect_error', (err) => {
      assert.strictEqual(err.data?.code, 'UNAUTHORIZED');
      assert.match(err.message, /invalid authentication token/i);
      client.close();
      resolve();
    });
    client.on('connect', () => {
      client.close();
      reject(new Error('Should not connect with invalid token'));
    });
  });
  console.log('  √ 1.2 Rejects connection with invalid token (UNAUTHORIZED)');

  // 3. Non-UUID token subject
  await new Promise((resolve, reject) => {
    const badUuidToken = signToken({ sub: 'admin-1', role: 'admin' });
    const client = connectClient(url, badUuidToken);
    client.on('connect_error', (err) => {
      assert.strictEqual(err.data?.code, 'UNAUTHORIZED');
      assert.match(err.message, /malformed token payload/i);
      client.close();
      resolve();
    });
    client.on('connect', () => {
      client.close();
      reject(new Error('Should not connect with non-UUID subject'));
    });
  });
  console.log('  √ 1.3 Rejects non-UUID token payload (UNAUTHORIZED)');

  // Create temporary test users for status checks
  const testPhone = `+1999${Date.now().toString().slice(-7)}`;
  const testEmail = `test_auth_${Date.now()}@test.com`;

  // 4. Blocked customer
  const blockedCust = await Customer.create({
    phone: testPhone,
    status: 'blocked',
  });
  const blockedCustToken = signToken({ sub: blockedCust.id, role: 'customer' });

  await new Promise((resolve, reject) => {
    const client = connectClient(url, blockedCustToken);
    client.on('connect_error', (err) => {
      assert.strictEqual(err.data?.code, 'ACCOUNT_BLOCKED');
      client.close();
      resolve();
    });
    client.on('connect', () => {
      client.close();
      reject(new Error('Should not connect blocked customer'));
    });
  });
  console.log('  √ 1.4 Rejects blocked customer (ACCOUNT_BLOCKED)');

  // 5. Unapproved vendor
  const pendingVendor = await Vendor.create({
    ownerName: 'Pending Vendor',
    email: `pending_${testEmail}`,
    phone: `+1888${Date.now().toString().slice(-7)}`,
    passwordHash: 'hash',
    status: 'pending',
  });
  const pendingVendorToken = signToken({ sub: pendingVendor.id, role: 'vendor' });

  await new Promise((resolve, reject) => {
    const client = connectClient(url, pendingVendorToken);
    client.on('connect_error', (err) => {
      assert.strictEqual(err.data?.code, 'APPROVAL_PENDING');
      client.close();
      resolve();
    });
    client.on('connect', () => {
      client.close();
      reject(new Error('Should not connect unapproved vendor'));
    });
  });
  console.log('  √ 1.5 Rejects unapproved vendor (APPROVAL_PENDING)');

  // 6. Rejected vendor
  const rejectedVendor = await Vendor.create({
    ownerName: 'Rejected Vendor',
    email: `rejected_${testEmail}`,
    phone: `+1777${Date.now().toString().slice(-7)}`,
    passwordHash: 'hash',
    status: 'rejected',
  });
  const rejectedVendorToken = signToken({ sub: rejectedVendor.id, role: 'vendor' });

  await new Promise((resolve, reject) => {
    const client = connectClient(url, rejectedVendorToken);
    client.on('connect_error', (err) => {
      assert.strictEqual(err.data?.code, 'VENDOR_REJECTED');
      client.close();
      resolve();
    });
    client.on('connect', () => {
      client.close();
      reject(new Error('Should not connect rejected vendor'));
    });
  });
  console.log('  √ 1.6 Rejects rejected vendor (VENDOR_REJECTED)');

  // 7. Active Admin connects and joins 'admin' room
  const admin = await Admin.findOne();
  assert(admin, 'Admin must exist in DB');
  const adminToken = signToken({ sub: admin.id, role: 'admin' });
  const adminClient = await connectAndReady(url, adminToken);
  const adminSocket = io.sockets.sockets.get(adminClient.id);
  assert(adminSocket.rooms.has('admin'), 'Admin socket must join admin room');
  adminClient.close();
  console.log('  √ 1.7 Admin connects and joins "admin" room');

  // 8. Active Customer connects and joins personal 'customer:<id>' room
  const activeCust = await Customer.create({
    phone: `+1666${Date.now().toString().slice(-7)}`,
    status: 'active',
  });
  const activeCustToken = signToken({ sub: activeCust.id, role: 'customer' });
  const custClient = await connectAndReady(url, activeCustToken);
  const custSocket = io.sockets.sockets.get(custClient.id);
  assert(custSocket.rooms.has(`customer:${activeCust.id}`), 'Customer must join personal room');
  console.log('  √ 1.8 Customer connects and joins personal "customer:<id>" room');

  // 9. Disconnect on admin blockCustomer
  const custDisconnected = new Promise((resolve) => {
    custClient.on('disconnect', (reason) => {
      assert.strictEqual(reason, 'io server disconnect');
      resolve();
    });
  });
  await blockCustomer(activeCust.id);
  await custDisconnected;
  console.log('  √ 1.9 Admin blockCustomer immediately disconnects active customer socket');

  // 10. Active Vendor connects and joins personal 'vendor:<id>' room, then disconnects on blockVendor
  const approvedVendor = await Vendor.create({
    ownerName: 'Approved Vendor',
    email: `approved_${testEmail}`,
    phone: `+1555${Date.now().toString().slice(-7)}`,
    passwordHash: 'hash',
    status: 'approved',
    profileCompleted: true,
  });
  const approvedVendorToken = signToken({ sub: approvedVendor.id, role: 'vendor' });
  const vendorClient = await connectAndReady(url, approvedVendorToken);
  const vendorSocket = io.sockets.sockets.get(vendorClient.id);
  assert(vendorSocket.rooms.has(`vendor:${approvedVendor.id}`), 'Vendor must join personal room');

  const vendorDisconnected = new Promise((resolve) => {
    vendorClient.on('disconnect', (reason) => {
      assert.strictEqual(reason, 'io server disconnect');
      resolve();
    });
  });
  await blockVendor(approvedVendor.id);
  await vendorDisconnected;
  console.log('  √ 1.10 Vendor connects to personal room and is immediately disconnected on blockVendor');

  // Cleanup test users
  await blockedCust.destroy();
  await activeCust.destroy();
  await pendingVendor.destroy();
  await rejectedVendor.destroy();
  await approvedVendor.destroy();
}

module.exports = { runCategory1 };

