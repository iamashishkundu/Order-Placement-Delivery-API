const { Op } = require('sequelize');
const Customer = require('../../../customer/models/customer.model');
const Vendor = require('../../../vendor/models/vendor.model');
const Order = require('../../../customer/models/order.model');
const OrderItem = require('../../../customer/models/orderItem.model');
const Payment = require('../../../customer/models/payment.model');
const { computeDerivedOrderStatus } = require('../../../../../common/services/orderStatus');
const { ITEM_STATUS, DERIVED_ORDER_STATUS } = require('../../../../../common/constants/orderStatus');
const VENDOR_STATUS = require('../../../../../common/constants/vendorStatus');
const CUSTOMER_STATUS = require('../../../../../common/constants/customerStatus');

const getDashboard = async () => {
  // 1. Customer statistics
  const totalCustomers = await Customer.count();
  const activeCustomers = await Customer.count({ where: { status: CUSTOMER_STATUS.ACTIVE } });
  const blockedCustomers = await Customer.count({ where: { status: CUSTOMER_STATUS.BLOCKED } });

  // 2. Vendor statistics by status
  const totalVendors = await Vendor.count();
  const pendingVendors = await Vendor.count({ where: { status: VENDOR_STATUS.PENDING } });
  const approvedVendors = await Vendor.count({ where: { status: VENDOR_STATUS.APPROVED } });
  const rejectedVendors = await Vendor.count({ where: { status: VENDOR_STATUS.REJECTED } });
  const blockedVendors = await Vendor.count({ where: { status: VENDOR_STATUS.BLOCKED } });

  // 3. Orders by derived status
  const allOrders = await Order.findAll({
    include: [
      {
        model: OrderItem,
        as: 'items',
        attributes: ['status'],
      },
    ],
  });

  const ordersByDerivedStatus = {
    [DERIVED_ORDER_STATUS.PENDING_PAYMENT]: 0,
    [DERIVED_ORDER_STATUS.PLACED]: 0,
    [DERIVED_ORDER_STATUS.IN_PROGRESS]: 0,
    [DERIVED_ORDER_STATUS.DELIVERED]: 0,
    [DERIVED_ORDER_STATUS.CANCELLED]: 0,
  };

  allOrders.forEach((order) => {
    const derivedStatus = computeDerivedOrderStatus(order.items);
    if (ordersByDerivedStatus[derivedStatus] !== undefined) {
      ordersByDerivedStatus[derivedStatus] += 1;
    }
  });

  // 4. COD revenue from delivered items
  const deliveredItems = await OrderItem.findAll({
    where: { status: ITEM_STATUS.DELIVERED },
    attributes: ['vendorId', 'priceAtPurchase', 'quantity'],
    include: [
      {
        model: Vendor,
        as: 'vendor',
        attributes: ['id', 'shopName', 'ownerName'],
      },
    ],
  });

  let totalCodRevenue = 0;
  const vendorRevenueMap = {};

  deliveredItems.forEach((item) => {
    const revenue = parseFloat(item.priceAtPurchase) * item.quantity;
    totalCodRevenue += revenue;

    const vId = item.vendorId;
    if (!vendorRevenueMap[vId]) {
      vendorRevenueMap[vId] = {
        vendorId: vId,
        shopName: item.vendor ? item.vendor.shopName : 'Unknown',
        ownerName: item.vendor ? item.vendor.ownerName : 'Unknown',
        deliveredRevenue: 0,
        deliveredItemCount: 0,
      };
    }
    vendorRevenueMap[vId].deliveredRevenue += revenue;
    vendorRevenueMap[vId].deliveredItemCount += item.quantity;
  });

  // 5. Top vendors by delivered revenue
  const topVendors = Object.values(vendorRevenueMap)
    .sort((a, b) => b.deliveredRevenue - a.deliveredRevenue)
    .slice(0, 5)
    .map((v) => ({
      ...v,
      deliveredRevenue: parseFloat(v.deliveredRevenue.toFixed(2)),
    }));

  // 6. Online revenue from paid orders
  const paidOnlineOrders = await Order.findAll({
    where: {
      paymentMethod: 'ONLINE',
      paymentStatus: 'paid',
    },
    attributes: ['totalAmount'],
  });

  const totalOnlineRevenue = paidOnlineOrders.reduce(
    (sum, o) => sum + parseFloat(o.totalAmount || 0),
    0
  );

  // 7. Dispute statistics
  const openDisputesWhere = {
    disputeId: { [Op.ne]: null },
    disputeClosedAt: null,
  };

  const openDisputesCount = await Payment.count({ where: openDisputesWhere });
  const openDisputesAmount = await Payment.sum('disputeAmount', { where: openDisputesWhere });
  const disputedAmount = parseFloat((openDisputesAmount || 0).toFixed(2));

  return {
    customers: {
      total: totalCustomers,
      active: activeCustomers,
      blocked: blockedCustomers,
    },
    vendorsByStatus: {
      total: totalVendors,
      pending: pendingVendors,
      approved: approvedVendors,
      rejected: rejectedVendors,
      blocked: blockedVendors,
    },
    ordersByDerivedStatus: {
      total: allOrders.length,
      ...ordersByDerivedStatus,
    },
    codRevenue: {
      totalDeliveredRevenue: parseFloat(totalCodRevenue.toFixed(2)),
      deliveredItemsCount: deliveredItems.reduce((acc, i) => acc + i.quantity, 0),
    },
    onlineRevenue: {
      totalPaidRevenue: parseFloat(totalOnlineRevenue.toFixed(2)),
      paidOrdersCount: paidOnlineOrders.length,
    },
    topVendors,
    openDisputes: openDisputesCount,
    disputedAmount,
    disputes: {
      openDisputes: openDisputesCount,
      disputedAmount,
    },
  };
};

module.exports = {
  getDashboard,
};
