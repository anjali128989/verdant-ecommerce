const Razorpay = require("razorpay");

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!keyId || !keySecret) {
  throw new Error(
    "Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET in backend environment"
  );
}

if (!keyId.startsWith("rzp_test_")) {
  throw new Error(
    "Expected a Razorpay TEST key. Do not use live keys during development."
  );
}

const razorpay = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});

module.exports = razorpay;