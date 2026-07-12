import { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const emptyLogin = { email: "", password: "" };
const emptyRegister = { organizationName: "", name: "", email: "", password: "" };

export default function LoginPage() {
  const { isAuthenticated, loading, login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [loginForm, setLoginForm] = useState(emptyLogin);
  const [registerForm, setRegisterForm] = useState(emptyRegister);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const from = useMemo(() => location.state?.from?.pathname || "/dashboard", [location.state]);

  useEffect(() => {
    setError("");
  }, [mode]);

  if (!loading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogin = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await login(loginForm);
      navigate(from, { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to sign in");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await register(registerForm);
      navigate("/dashboard", { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to create organization");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-panel">
        <div className="auth-brand">
          <div className="brand-mark large">TO</div>
          <div>
            <h1>TransitOps</h1>
            <p>Smart Transport Operations Platform</p>
          </div>
        </div>

        <div className="auth-switch" role="tablist" aria-label="Authentication mode">
          <button
            type="button"
            className={mode === "login" ? "active" : ""}
            onClick={() => setMode("login")}
          >
            Sign In
          </button>
          <button
            type="button"
            className={mode === "register" ? "active" : ""}
            onClick={() => setMode("register")}
          >
            Create Organization
          </button>
        </div>

        {error && <div className="alert error">{error}</div>}

        {mode === "login" ? (
          <form className="form-stack" onSubmit={handleLogin}>
            <label>
              Email
              <input
                type="email"
                value={loginForm.email}
                onChange={(event) => setLoginForm((form) => ({ ...form, email: event.target.value }))}
                autoComplete="email"
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={loginForm.password}
                onChange={(event) => setLoginForm((form) => ({ ...form, password: event.target.value }))}
                autoComplete="current-password"
                minLength={8}
                required
              />
            </label>
            <button className="primary-button" type="submit" disabled={submitting}>
              {submitting ? "Signing in..." : "Sign In"}
            </button>
          </form>
        ) : (
          <form className="form-stack" onSubmit={handleRegister}>
            <label>
              Organization Name
              <input
                value={registerForm.organizationName}
                onChange={(event) => setRegisterForm((form) => ({ ...form, organizationName: event.target.value }))}
                autoComplete="organization"
                required
              />
            </label>
            <label>
              Fleet Manager Name
              <input
                value={registerForm.name}
                onChange={(event) => setRegisterForm((form) => ({ ...form, name: event.target.value }))}
                autoComplete="name"
                required
              />
            </label>
            <label>
              Work Email
              <input
                type="email"
                value={registerForm.email}
                onChange={(event) => setRegisterForm((form) => ({ ...form, email: event.target.value }))}
                autoComplete="email"
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={registerForm.password}
                onChange={(event) => setRegisterForm((form) => ({ ...form, password: event.target.value }))}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>
            <button className="primary-button" type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Create Organization"}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
