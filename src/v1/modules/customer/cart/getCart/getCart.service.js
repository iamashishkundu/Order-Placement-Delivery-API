const CartItem = require('../../models/cartItem.model');
const Product = require('../../../vendor/models/product.model');
const Vendor = require('../../../vendor/models/vendor.model');

const getCart = async (customerId) => {
  const items = await CartItem.findAll({
    where: { customerId },
    include: [
      {
        model: Product,
        as: 'product',
        include: [
          {
            model: Vendor,
            as: 'vendor',
            attributes: ['id', 'shopName', 'ownerName', 'city', 'state'],
          },
        ],
      },
    ],
    order: [['createdAt', 'ASC']],
  });

  let totalAmount = 0;
  const processedItems = items.map((item) => {
    const itemJson = item.toJSON();
    const price = itemJson.product ? parseFloat(itemJson.product.price) : 0;
    const subtotal = parseFloat((price * item.quantity).toFixed(2));
    totalAmount += subtotal;

    return {
      ...itemJson,
      unitPrice: price,
      subtotal,
    };
  });

  return {
    items: processedItems,
    itemCount: processedItems.reduce((acc, i) => acc + i.quantity, 0),
    totalAmount: parseFloat(totalAmount.toFixed(2)),
  };
};

module.exports = {
  getCart,
};

