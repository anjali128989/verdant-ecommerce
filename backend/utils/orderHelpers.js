
const FREE_SHIPPING_THRESHOLD = 1999;
const STANDARD_SHIPPING_FEE = 99;
const TAX_RATE = 0;

const calculateOrderTotals = (subtotal) => {
  const shippingFee =
    subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;

  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  const total = Math.round((subtotal + shippingFee + tax) * 100) / 100;

  return {
    subtotal,
    shippingFee,
    tax,
    total,
  };
};

module.exports = {
  FREE_SHIPPING_THRESHOLD,
  STANDARD_SHIPPING_FEE,
  TAX_RATE,
  calculateOrderTotals,
};
