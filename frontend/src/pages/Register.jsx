
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { registerUser } from "../api/authApi";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  function validate() {
    const nextErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = "Please enter your name.";
    } else if (form.name.trim().length < 2) {
      nextErrors.name = "Your name must contain at least 2 characters.";
    }

    if (!form.email.trim()) {
      nextErrors.email = "Please enter your email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!form.password) {
      nextErrors.password = "Please create a password.";
    } else if (form.password.length < 8) {
      nextErrors.password = "Use at least 8 characters.";
    }

    if (!form.confirmPassword) {
      nextErrors.confirmPassword = "Please confirm your password.";
    } else if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = "Your passwords do not match.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({
      ...current,
      [name]: "",
      form: "",
      ...(name === "password" ? { confirmPassword: "" } : {}),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!validate()) return;

    setLoading(true);

    try {
      const data = await registerUser({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      const message =
        data?.message || "Your account has been created successfully.";

      toast.success(message);

      navigate("/login", {
        replace: true,
        state: { message: `${message} Please sign in to continue.` },
      });
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Unable to create your account. Please try again.";

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

      <div className="auth-card auth-card-register">
        <Link to="/" className="auth-brand">
          verdant<span>.</span>
        </Link>

        <p className="auth-eyebrow">MAKE YOURSELF AT HOME</p>
        <h1 className="auth-title">Good things grow here.</h1>
        <p className="auth-description">
          Create an account to keep your home inspiration and shopping journey in one place.
        </p>

        {errors.form && (
          <div className="auth-error-message" role="alert">
            {errors.form}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label htmlFor="register-name">Full name</label>
            <input
              id="register-name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Your name"
              value={form.name}
              onChange={handleChange}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "register-name-error" : undefined}
              disabled={loading}
            />
            {errors.name && (
              <p className="auth-field-error" id="register-name-error">
                {errors.name}
              </p>
            )}
          </div>

          <div className="auth-field">
            <label htmlFor="register-email">Email address</label>
            <input
              id="register-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={
                errors.email ? "register-email-error" : undefined
              }
              disabled={loading}
            />
            {errors.email && (
              <p className="auth-field-error" id="register-email-error">
                {errors.email}
              </p>
            )}
          </div>

          <div className="auth-field">
            <label htmlFor="register-password">Create password</label>
            <div className="auth-password-wrapper">
              <input
                id="register-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={form.password}
                onChange={handleChange}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={
                  errors.password ? "register-password-error" : undefined
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
              <p className="auth-field-error" id="register-password-error">
                {errors.password}
              </p>
            )}
          </div>

          <div className="auth-field">
            <label htmlFor="register-confirm-password">Confirm password</label>
            <input
              id="register-confirm-password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Enter your password again"
              value={form.confirmPassword}
              onChange={handleChange}
              aria-invalid={Boolean(errors.confirmPassword)}
              aria-describedby={
                errors.confirmPassword
                  ? "register-confirm-password-error"
                  : undefined
              }
              disabled={loading}
            />
            {errors.confirmPassword && (
              <p
                className="auth-field-error"
                id="register-confirm-password-error"
              >
                {errors.confirmPassword}
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
                Creating account...
              </>
            ) : (
              "Create account"
            )}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>

        <p className="auth-footnote">
          Thoughtful pieces for a more considered home.
        </p>
      </div>
    </section>
  );
}
