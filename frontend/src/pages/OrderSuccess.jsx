
import { Link, useLocation, useParams } from "react-router-dom";

export default function OrderSuccess() {
  const { orderId } = useParams();
  const location = useLocation();
  const order = location.state?.order;

  return (
    <section className="order-success-page">
      <div className="order-success-card">
        <div className="order-success-icon" aria-hidden="true">✓</div>
        <p className="checkout-eyebrow">THANK YOU</p>
        <h1>Your order is in good hands.</h1>
        <p>
          Your order has been submitted successfully. You can keep the order
          reference below for your records.
        </p>

        <div className="order-success-reference">
          <span>Order reference</span>
          <strong>{orderId}</strong>
        </div>

        <div className="order-success-details">
          <span>Payment method</span>
          <strong>Cash on Delivery</strong>
          <span>Payment status</span>
          <strong>{order?.paymentStatus || "Pending"}</strong>
        </div>

        <Link to="/shop" className="checkout-primary-button">
          Continue shopping
        </Link>
      </div>
    </section>
  );
}
