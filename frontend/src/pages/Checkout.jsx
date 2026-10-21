
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";

import { createOrder } from "../api/orderApi";
import { clearCart } from "../redux/cartSlice";

const initialAddress = {
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
};

export default function Checkout() {
  const [address, setAddress] = useState(initialAddress);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const cart = useSelector((state) => state.cart);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const items = cart.items || [];
  const subtotal = Number(cart.subtotal || 0);

  function handleChange(event) {
    const { name, value } = event.target;

    setAddress((current) => ({
      ...current,
      [name]: value,
    }));

    setErrors((current) => ({
      ...current,
      [name]: "",
      form: "",
    }));
  }

  function validate() {
    const nextErrors = {};

    const requiredFields = {
      fullName: "Enter your full name.",
      phone: "Enter your phone number.",
      addressLine1: "Enter your street address.",
      city: "Enter your city.",
      state: "Enter your state.",
      postalCode: "Enter your postal code.",
    };

    Object.entries(requiredFields).forEach(([field, message]) => {
      if (!address[field].trim()) {
        nextErrors[field] = message;
      }
    });

    if (
      address.phone.trim() &&
      !/^[0-9+\-\s()]{10,18}$/.test(address.phone.trim())
    ) {
      nextErrors.phone = "Enter a valid phone number.";
    }

    if (
      address.postalCode.trim() &&
      !/^[a-zA-Z0-9\s-]{4,10}$/.test(address.postalCode.trim())
    ) {
      nextErrors.postalCode = "Enter a valid postal code.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handlePlaceOrder(event) {
    event.preventDefault();

    if (!validate()) return;

    if (items.length === 0) {
      toast.error("Your cart is empty.");
      navigate("/shop");
      return;
    }

    setSubmitting(true);

    try {
      const result = await createOrder({
        shippingAddress: {
          ...address,
          fullName: address.fullName.trim(),
          phone: address.phone.trim(),
          addressLine1: address.addressLine1.trim(),
          addressLine2: address.addressLine2.trim(),
          city: address.city.trim(),
          state: address.state.trim(),
          postalCode: address.postalCode.trim(),
          country: address.country.trim() || "India",
        },
        paymentMethod: "cod",
      });

      if (!result?.success || !result?.order?._id) {
        throw new Error(result?.message || "Unable to place your order.");
      }

      dispatch(clearCart());
      toast.success("Your order has been placed!");
      navigate(`/order-success/${result.order._id}`, {
        replace: true,
        state: { order: result.order },
      });
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Unable to place your order. Please try again.";

      setErrors((current) => ({ ...current, form: message }));
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <section className="checkout-empty">
        <span className="checkout-empty-icon" aria-hidden="true">♡</span>
        <h1>Your bag is waiting for something lovely.</h1>
        <p>Add an item to your bag before proceeding to checkout.</p>
        <Link to="/shop" className="checkout-primary-button">
          Explore the shop
        </Link>
      </section>
    );
  }

  return (
    <section className="checkout-page">
      <div className="checkout-heading">
        <p className="checkout-eyebrow">ALMOST HOME</p>
        <h1>Checkout</h1>
        <p>Just a few details before your thoughtful finds arrive.</p>
        <div className="checkout-steps" aria-label="Checkout progress">
          <span className="checkout-step-done">01 Bag</span>
          <span className="checkout-step-active">02 Delivery</span>
          <span>03 Confirmation</span>
        </div>
      </div>

      <form className="checkout-layout" onSubmit={handlePlaceOrder} noValidate>
        <div className="checkout-main">
          {errors.form && (
            <div className="checkout-error" role="alert">
              {errors.form}
            </div>
          )}

          <section className="checkout-panel">
            <div className="checkout-panel-heading">
              <span className="checkout-number">01</span>
              <div>
                <h2>Delivery details</h2>
                <p>Where should we send your order?</p>
              </div>
            </div>

            <div className="checkout-fields">
              <div className="checkout-field checkout-field-full">
                <label htmlFor="fullName">Full name *</label>
                <input
                  id="fullName"
                  name="fullName"
                  autoComplete="name"
                  value={address.fullName}
                  onChange={handleChange}
                  placeholder="Recipient's full name"
                  disabled={submitting}
                  aria-invalid={Boolean(errors.fullName)}
                />
                {errors.fullName && <small>{errors.fullName}</small>}
              </div>

              <div className="checkout-field checkout-field-full">
                <label htmlFor="phone">Phone number *</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  value={address.phone}
                  onChange={handleChange}
                  placeholder="Your contact number"
                  disabled={submitting}
                  aria-invalid={Boolean(errors.phone)}
                />
                {errors.phone && <small>{errors.phone}</small>}
              </div>

              <div className="checkout-field checkout-field-full">
                <label htmlFor="addressLine1">Address line 1 *</label>
                <input
                  id="addressLine1"
                  name="addressLine1"
                  autoComplete="address-line1"
                  value={address.addressLine1}
                  onChange={handleChange}
                  placeholder="House number, street, area"
                  disabled={submitting}
                  aria-invalid={Boolean(errors.addressLine1)}
                />
                {errors.addressLine1 && <small>{errors.addressLine1}</small>}
              </div>

              <div className="checkout-field checkout-field-full">
                <label htmlFor="addressLine2">Address line 2 (optional)</label>
                <input
                  id="addressLine2"
                  name="addressLine2"
                  autoComplete="address-line2"
                  value={address.addressLine2}
                  onChange={handleChange}
                  placeholder="Apartment, landmark, etc."
                  disabled={submitting}
                />
              </div>

              <div className="checkout-field">
                <label htmlFor="city">City *</label>
                <input
                  id="city"
                  name="city"
                  autoComplete="address-level2"
                  value={address.city}
                  onChange={handleChange}
                  disabled={submitting}
                  aria-invalid={Boolean(errors.city)}
                />
                {errors.city && <small>{errors.city}</small>}
              </div>

              <div className="checkout-field">
                <label htmlFor="state">State *</label>
                <input
                  id="state"
                  name="state"
                  autoComplete="address-level1"
                  value={address.state}
                  onChange={handleChange}
                  disabled={submitting}
                  aria-invalid={Boolean(errors.state)}
                />
                {errors.state && <small>{errors.state}</small>}
              </div>

              <div className="checkout-field">
                <label htmlFor="postalCode">Postal code *</label>
                <input
                  id="postalCode"
                  name="postalCode"
                  autoComplete="postal-code"
                  value={address.postalCode}
                  onChange={handleChange}
                  disabled={submitting}
                  aria-invalid={Boolean(errors.postalCode)}
                />
                {errors.postalCode && <small>{errors.postalCode}</small>}
              </div>

              <div className="checkout-field">
                <label htmlFor="country">Country</label>
                <input
                  id="country"
                  name="country"
                  autoComplete="country-name"
                  value={address.country}
                  onChange={handleChange}
                  disabled={submitting}
                />
              </div>
            </div>
          </section>

          <section className="checkout-panel">
            <div className="checkout-panel-heading">
              <span className="checkout-number">02</span>
              <div>
                <h2>Payment method</h2>
                <p>Choose how you would like to pay.</p>
              </div>
            </div>

            <label className="checkout-payment-option checkout-payment-selected">
              <input
                type="radio"
                name="paymentMethod"
                value="cod"
                defaultChecked
              />
              <span className="checkout-payment-copy">
                <strong>Cash on Delivery</strong>
                <small>Pay when your order arrives.</small>
              </span>
              <span className="checkout-payment-tag">Available</span>
            </label>

            <div className="checkout-payment-option checkout-payment-disabled">
              <span className="checkout-radio-placeholder" />
              <span className="checkout-payment-copy">
                <strong>Razorpay</strong>
                <small>Online payment integration will be enabled after verification testing.</small>
              </span>
              <span className="checkout-payment-tag">Coming soon</span>
            </div>
          </section>
        </div>

        <aside className="checkout-summary">
          <h2>Your order</h2>
          <p className="checkout-summary-caption">
            {items.length} {items.length === 1 ? "product" : "products"} in your bag
          </p>

          <div className="checkout-order-items">
            {items.map((item) => {
              const product = item.product || {};
              const quantity = Number(item.quantity || 0);
              const unitPrice = Number(
                item.unitPrice ?? product.discountPrice ?? product.price ?? 0
              );

              return (
                <div className="checkout-order-item" key={item._id || product._id}>
                  <div className="checkout-item-image">
                    {product.image ? (
                      <img src={product.image} alt={product.name || "Product"} />
                    ) : (
                      <span aria-hidden="true">v.</span>
                    )}
                    <span className="checkout-item-quantity">{quantity}</span>
                  </div>

                  <div className="checkout-item-info">
                    <strong>{product.name || "Product"}</strong>
                    <span>Qty: {quantity}</span>
                  </div>

                  <span className="checkout-item-price">
                    ₹{(unitPrice * quantity).toLocaleString("en-IN")}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="checkout-summary-line">
            <span>Subtotal</span>
            <span>₹{subtotal.toLocaleString("en-IN")}</span>
          </div>

          <div className="checkout-summary-line">
            <span>Shipping</span>
            <span>Calculated by server</span>
          </div>

          <p className="checkout-summary-note">
            Final totals and order status are confirmed by the server after you place your order.
          </p>

          <button
            type="submit"
            className="checkout-primary-button checkout-place-order"
            disabled={submitting}
          >
            {submitting ? "Placing order..." : "Place Cash on Delivery order"}
          </button>

          <Link to="/cart" className="checkout-back-link">
            ← Return to bag
          </Link>

          <p className="checkout-secure-note">
            Your order is submitted securely through your signed-in account.
          </p>
        </aside>
      </form>
    </section>
  );
}
