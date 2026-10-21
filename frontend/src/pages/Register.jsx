import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { toast } from "react-hot-toast";
import { registerUser } from "../api/authApi";
import { setUser } from "../redux/authSlice";
import { setCart } from "../redux/cartSlice";
import { getCart } from "../api/cartApi";

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);

    try {
      const data = await registerUser({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      if (!data.user) {
        throw new Error(
          "Registration succeeded without a user response. Please sign in."
        );
      }

      dispatch(setUser(data.user));

      try {
        dispatch(setCart(await getCart()));
      } catch {
        // Keep registration successful if the cart request fails.
      }

      toast.success(data.message || "Account created successfully.");
      navigate("/shop");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Unable to create your account."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <p className="auth-eyebrow">JOIN VERDANT</p>
        <h1>Create an account</h1>
        <p className="auth-description">
          Create your account to start shopping.
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="name">Full name</label>
          <input
            id="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            maxLength={100}
            required
          />

          <label htmlFor="register-email">Email address</label>
          <input
            id="register-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />

          <label htmlFor="register-password">Password</label>
          <input
            id="register-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="auth-footer">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </section>
  );
}