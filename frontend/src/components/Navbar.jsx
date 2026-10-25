
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { logoutUser } from "../api/authApi";
import { clearUser } from "../redux/authSlice";
import { clearCart } from "../redux/cartSlice";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector((state) => state.auth.user);
  const authLoading = useSelector((state) => state.auth.loading);
  const itemCount = useSelector((state) => state.cart.itemCount);

  const isAdmin = user?.role === "admin";

  const closeMenu = () => setMenuOpen(false);

  const linkClass = ({ isActive }) =>
    `site-nav-link${isActive ? " site-nav-link-active" : ""}`;

  async function handleLogout() {
    try {
      await logoutUser();
      dispatch(clearUser());
      dispatch(clearCart());
      closeMenu();
      navigate("/");
      toast.success("You have signed out successfully.");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Unable to sign out. Please try again."
      );
    }
  }

  return (
    <header className="site-navbar">
      <div className="site-navbar-inner">
        <NavLink
          to="/"
          end
          className="site-brand"
          aria-label="Verdant home"
          onClick={closeMenu}
        >
          <span className="site-brand-mark" aria-hidden="true">
            v.
          </span>

          <span className="site-brand-text">
            <span className="site-brand-name">verdant</span>
            <span className="site-brand-tagline">
              A calmer kind of living
            </span>
          </span>
        </NavLink>

        {/* Desktop navigation */}
        <nav className="site-desktop-nav" aria-label="Main navigation">
          <NavLink to="/" end className={linkClass}>
            Home
          </NavLink>

          <NavLink to="/shop" className={linkClass}>
            Shop
          </NavLink>

          {!authLoading && user && !isAdmin && (
            <NavLink to="/my-orders" className={linkClass}>
              My Orders
            </NavLink>
          )}

          {!authLoading && isAdmin && (
            <>
              <NavLink to="/admin" end className={linkClass}>
                Admin Dashboard
              </NavLink>

              <NavLink to="/admin/products" className={linkClass}>
                Manage Products
              </NavLink>

              <NavLink to="/admin/orders" className={linkClass}>
                Manage Orders
              </NavLink>
            </>
          )}

          {!isAdmin && (
            <NavLink to="/cart" className={linkClass}>
              Cart
            </NavLink>
          )}
        </nav>

        <div className="site-nav-actions">
          {!authLoading &&
            (user ? (
              <>
                <span className="site-user-greeting">
                  Hello, {user.name?.split(" ")[0] || "there"}
                </span>

                <button
                  type="button"
                  className="site-signout-button"
                  onClick={handleLogout}
                >
                  Sign out
                </button>
              </>
            ) : (
              <NavLink
                to="/login"
                className="site-login-link"
                onClick={closeMenu}
              >
                Sign in
              </NavLink>
            ))}

          {!isAdmin && (
            <NavLink
              to="/cart"
              className={({ isActive }) =>
                `site-cart-link${isActive ? " site-cart-link-active" : ""}`
              }
              onClick={closeMenu}
              aria-label={`Shopping bag, ${itemCount} items`}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                className="site-bag-icon"
              >
                <path
                  d="M5 8h14l1 12H4L5 8Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />

                <path
                  d="M9 9V6a3 3 0 0 1 6 0v3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>

              <span className="site-cart-label">Bag</span>

              {itemCount > 0 && (
                <span className="site-cart-count">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </NavLink>
          )}

          <button
            type="button"
            className="site-mobile-toggle"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={
              menuOpen ? "Close navigation menu" : "Open navigation menu"
            }
            aria-expanded={menuOpen}
            aria-controls="site-mobile-menu"
          >
            {menuOpen ? (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m6 6 12 12M18 6 6 18" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Responsive mobile navigation */}
      <nav
        id="site-mobile-menu"
        className={`site-mobile-menu${
          menuOpen ? " site-mobile-menu-open" : ""
        }`}
        aria-label="Mobile navigation"
        aria-hidden={!menuOpen}
        inert={!menuOpen}
      >
        <NavLink to="/" end className={linkClass} onClick={closeMenu}>
          Home
        </NavLink>

        <NavLink to="/shop" className={linkClass} onClick={closeMenu}>
          Shop all
        </NavLink>

        {!authLoading && user && !isAdmin && (
          <NavLink
            to="/my-orders"
            className={linkClass}
            onClick={closeMenu}
          >
            My Orders
          </NavLink>
        )}

        {!authLoading && isAdmin && (
          <>
            <NavLink
              to="/admin"
              end
              className={linkClass}
              onClick={closeMenu}
            >
              Admin Dashboard
            </NavLink>

            <NavLink
              to="/admin/products"
              className={linkClass}
              onClick={closeMenu}
            >
              Manage Products
            </NavLink>

            <NavLink
              to="/admin/orders"
              className={linkClass}
              onClick={closeMenu}
            >
              Manage Orders
            </NavLink>
          </>
        )}

        {!isAdmin && (
          <NavLink to="/cart" className={linkClass} onClick={closeMenu}>
            Shopping bag ({itemCount})
          </NavLink>
        )}

        {!authLoading &&
          (user ? (
            <button
              type="button"
              className="site-mobile-account-action"
              onClick={handleLogout}
            >
              Sign out
            </button>
          ) : (
            <div className="site-mobile-auth-links">
              <NavLink
                to="/login"
                className={linkClass}
                onClick={closeMenu}
              >
                Sign in
              </NavLink>

              <NavLink
                to="/register"
                className={linkClass}
                onClick={closeMenu}
              >
                Create an account
              </NavLink>
            </div>
          ))}
      </nav>
    </header>
  );
}
