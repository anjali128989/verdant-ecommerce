import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { toast } from "react-hot-toast";
import { loginUser } from "../api/authApi";
import { getCart } from "../api/cartApi";
import { setCart, clearCart } from "../redux/cartSlice";
import { setUser } from "../redux/authSlice";

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);

    try {
      const data = await loginUser({ email: email.trim(), password });

      if (!data.user) {
        throw new Error("Login response did not include a user.");
      }

      dispatch(setUser(data.user));

      try {
        const cart = await getCart();
        dispatch(setCart(cart));
      } catch {
        // Authentication succeeded; cart can be retried separately.
        dispatch(clearCart());
      }

      toast.success(data.message || "Login successful.");
      navigate("/shop");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Unable to sign in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <p className="auth-eyebrow">WELCOME BACK</p>
        <h1>Sign in</h1>
        <p className="auth-description">
          Sign in to access your account and shopping bag.
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </section>
  );
}