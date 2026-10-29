const Address = require('../../models/address.model');

const addAddress = async (customerId, addressData) => {
  const existingCount = await Address.count({ where: { customerId } });

  let isDefault = addressData.isDefault || false;
  // If this is the customer's very first address, make it default
  if (existingCount === 0) {
    isDefault = true;
  }

  // If setting as default, clear any existing default
  if (isDefault) {
    await Address.update(
      { isDefault: false },
      { where: { customerId, isDefault: true } }
    );
  }

  const address = await Address.create({
    customerId,
    label: addressData.label.trim(),
    addressLine: addressData.addressLine.trim(),
    city: addressData.city.trim(),
    state: addressData.state.trim(),
    pincode: addressData.pincode.trim(),
    isDefault,
  });

  return address;
};

module.exports = {
  addAddress,
};

