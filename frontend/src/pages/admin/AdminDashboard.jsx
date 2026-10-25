import { Link } from "react-router-dom";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  return (
    <main className="admin-dashboard">
      <header className="admin-dashboard-header">
        <div>
          <p className="admin-eyebrow">VERDANT / ADMINISTRATION</p>
          <h1>Admin Dashboard</h1>
          <p className="admin-subtitle">
            Manage your store from one place.
          </p>
        </div>

        <Link to="/" className="admin-store-link">
          View Store ↗
        </Link>
      </header>

      <section className="admin-welcome">
        <div>
          <span className="admin-welcome-label">
            STORE MANAGEMENT
          </span>
          <h2>Welcome to Verdant</h2>
          <p>
            Manage customer orders and monitor your store activity.
          </p>
        </div>
        <span className="admin-leaf" aria-hidden="true">✳</span>
      </section>

      <section className="admin-section">
        <h2>Manage your store</h2>

        <div className="admin-management-grid">
          <Link to="/admin/orders" className="admin-management-card">
            <span className="admin-card-icon">📦</span>
            <h3>Orders</h3>
            <p>View orders and manage their progress.</p>
            <span className="admin-card-action">Manage orders →</span>
          </Link>

          <Link to="/shop" className="admin-management-card">
            <span className="admin-card-icon">🛍️</span>
            <h3>Storefront</h3>
            <p>Preview your customer shopping experience.</p>
            <span className="admin-card-action">View storefront →</span>
          </Link>
        </div>
      </section>
    </main>
  );
}