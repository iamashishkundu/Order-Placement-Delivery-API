const Address = require('../../models/address.model');

const listAddresses = async (customerId) => {
  const addresses = await Address.findAll({
    where: { customerId },
    order: [
      ['isDefault', 'DESC'],
      ['createdAt', 'DESC'],
    ],
  });

  return addresses;
};

module.exports = {
  listAddresses,
};

