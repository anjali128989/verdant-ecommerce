
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { loginUser } from "../api/authApi";
import { getCart } from "../api/cartApi";
import { setUser } from "../redux/authSlice";
import { setCart } from "../redux/cartSlice";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = location.state?.from?.pathname || "/shop";
  const registrationMessage = location.state?.message;

  function validate() {
    const nextErrors = {};

    if (!form.email.trim()) {
      nextErrors.email = "Please enter your email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!form.password) {
      nextErrors.password = "Please enter your password.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!validate()) return;

    setLoading(true);

    try {
      const data = await loginUser({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      if (!data?.user) {
        throw new Error(data?.message || "The server did not return a user.");
      }

      dispatch(setUser(data.user));

      try {
        const cart = await getCart();
        dispatch(setCart(cart));
      } catch (cartError) {
        console.error(
          "Unable to load cart after login:",
          cartError.response?.data?.message || cartError.message
        );
      }

      toast.success(data.message || "Welcome back!");
      navigate(redirectTo, { replace: true });
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Unable to sign in. Please try again.";

      setErrors((current) => ({ ...current, form: message }));
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-decoration" aria-hidden="true">
        <span className="auth-decoration-circle auth-decoration-circle-one" />
        <span className="auth-decoration-circle auth-decoration-circle-two" />
        <span className="auth-decoration-leaf">✳</span>
      </div>

      <div className="auth-card">
        <Link to="/" className="auth-brand">
          verdant<span>.</span>
        </Link>

        <p className="auth-eyebrow">WELCOME BACK</p>
        <h1 className="auth-title">A little more beauty, every day.</h1>
        <p className="auth-description">
          Sign in to revisit your favourites and continue creating a home you love.
        </p>

        {registrationMessage && (
          <div className="auth-success-message" role="status">
            {registrationMessage}
          </div>
        )}

        {errors.form && (
          <div className="auth-error-message" role="alert">
            {errors.form}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label htmlFor="login-email">Email address</label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "login-email-error" : undefined}
              disabled={loading}
            />
            {errors.email && (
              <p className="auth-field-error" id="login-email-error">
                {errors.email}
              </p>
            )}
          </div>

          <div className="auth-field">
            <label htmlFor="login-password">Password</label>
            <div className="auth-password-wrapper">
              <input
                id="login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={
                  errors.password ? "login-password-error" : undefined
                }
                disabled={loading}
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={loading}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.password && (
              <p className="auth-field-error" id="login-password-error">
                {errors.password}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="auth-submit-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="auth-spinner" aria-hidden="true" />
                Signing you in...
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <p className="auth-switch">
          New to Verdant? <Link to="/register">Create an account</Link>
        </p>

        <p className="auth-footnote">
          Thoughtful pieces for a more considered home.
        </p>
      </div>
    </section>
  );
}
