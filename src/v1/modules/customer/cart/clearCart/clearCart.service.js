const CartItem = require('../../models/cartItem.model');

const clearCart = async (customerId) => {
  await CartItem.destroy({
    where: { customerId },
  });

  return { message: 'Cart cleared successfully.' };
};

module.exports = {
  clearCart,
};

