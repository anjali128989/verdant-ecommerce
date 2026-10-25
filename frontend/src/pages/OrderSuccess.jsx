
import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { getMyOrders } from "../api/orderApi";

export default function OrderSuccess() {
  const { orderId } = useParams();
  const location = useLocation();

  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!location.state?.order);

  useEffect(() => {
    let active = true;

    async function loadOrder() {
      try {
        const response = await getMyOrders();
        const orders = response.orders || [];
        const savedOrder = orders.find(
          (item) => String(item._id) === String(orderId)
        );

        if (active && savedOrder) {
          setOrder(savedOrder);
        }
      } catch (error) {
        console.error("Could not load order details:", error);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadOrder();

    return () => {
      active = false;
    };
  }, [orderId]);

  const paymentMethod =
    order?.paymentMethod?.toLowerCase() === "razorpay"
      ? "Razorpay"
      : order?.paymentMethod?.toLowerCase() === "cod"
        ? "Cash on Delivery"
        : "Unavailable";

  const paymentStatus = order?.paymentStatus || "Pending";

  return (
    <section className="order-success-page">
      <div className="order-success-card">
        <div className="order-success-icon" aria-hidden="true">
          ✓
        </div>

        <p className="checkout-eyebrow">THANK YOU</p>
        <h1>Your order is in good hands.</h1>
        <p>
          Your order has been submitted successfully. Keep your order reference
          for future tracking.
        </p>

        <div className="order-success-reference">
          <span>Order reference</span>
          <strong>{orderId}</strong>
        </div>

        <div className="order-success-details">
          <span>Payment method</span>
          <strong>{loading ? "Loading..." : paymentMethod}</strong>

          <span>Payment status</span>
          <strong>{loading ? "Loading..." : paymentStatus}</strong>

          {order?.orderStatus && (
            <>
              <span>Order status</span>
              <strong>{order.orderStatus}</strong>
            </>
          )}
        </div>

        <div className="order-success-actions">
          <Link to="/orders" className="checkout-primary-button">
            View my orders
          </Link>

          <Link to="/shop" className="order-success-secondary">
            Continue shopping
          </Link>
        </div>
      </div>
    </section>
  );
}
