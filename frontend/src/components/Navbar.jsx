import { Link, NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import { logoutUser } from "../api/authApi";
import { clearUser } from "../redux/authSlice";
import { clearCart } from "../redux/cartSlice";

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const itemCount = useSelector((state) => state.cart.itemCount);
  const user = useSelector((state) => state.auth.user);

  async function handleLogout() {
    try {
      await logoutUser();
      dispatch(clearUser());
      dispatch(clearCart());
      toast.success("You have signed out.");
      navigate("/");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Unable to sign out. Please try again."
      );
    }
  }

  return (
    <header className="site-header">
      <div className="navbar">
        <Link to="/" className="brand">
          verdant<span>.</span>
        </Link>

        <nav className="nav-links" aria-label="Main navigation">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/shop">Shop</NavLink>
          <NavLink to="/cart">Bag ({itemCount})</NavLink>

          {user ? (
            <button
              type="button"
              className="nav-account-button"
              onClick={handleLogout}
            >
              Sign out
            </button>
          ) : (
            <NavLink to="/login">Sign in</NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}