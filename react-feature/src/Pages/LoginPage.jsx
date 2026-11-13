import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import AuthLayout, { AuthAlert, PasswordField } from "../Components/AuthLayout";
import { baseURL } from "../config/api";

function loginErrorMessage(error) {
  if (!error.response) return "Couldn't reach FeatureMe. Check your connection and try again.";
  const data = error.response.data;
  if (typeof data === "string" && data && data.length < 200) return data;
  if (data?.message) return data.message;
  if (data?.error) return data.error;
  if (error.response.status === 401 || error.response.status === 404) return "That email, username or password isn't right.";
  if (error.response.status === 403) return "This account is disabled.";
  return "Something went wrong. Try again.";
}

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Back to the page that sent you here, or home
  const from = location.state?.from?.pathname || "/home";
  const notice = location.state?.notice;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      await axios.post(`${baseURL}/user/auth/login`, { username: identifier.trim(), password }, { withCredentials: true });
      navigate(from, { replace: true });
    } catch (err) {
      console.error("Login error:", err);
      setError(loginErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to keep making music."
      footer={<>New to FeatureMe? <a href="/signup">Create an account</a></>}
    >
      {notice && !error && <AuthAlert tone="success">{notice}</AuthAlert>}
      {error && <AuthAlert>{error}</AuthAlert>}

      <form className="fm-auth__form" onSubmit={handleSubmit}>
        <div className="fm-field">
          <label className="fm-field__label" htmlFor="fm-login-id">Email or username</label>
          <input
            id="fm-login-id"
            className="fm-input"
            value={identifier}
            onChange={(e) => { setIdentifier(e.target.value); setError(""); }}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            autoFocus
            required
          />
        </div>

        <PasswordField
          id="fm-login-password"
          label="Password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(""); }}
          show={showPassword}
          onToggle={() => setShowPassword((s) => !s)}
          autoComplete="current-password"
        />

        <div className="fm-auth__row">
          <span />
          <a href="/forgot-password" className="fm-auth__link">Forgot password?</a>
        </div>

        <button type="submit" className="fm-btn fm-btn--primary fm-auth__submit" disabled={loading || !identifier.trim() || !password}>
          {loading ? "Logging in…" : "Log in"}
        </button>
      </form>
    </AuthLayout>
  );
}

export default LoginPage;
