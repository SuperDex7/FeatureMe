import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AuthLayout, { AuthAlert, PasswordField } from "../Components/AuthLayout";
import { baseURL } from "../config/api";

const PASSWORD_MIN = 6;
const RESEND_SECONDS = 30;

const serverMessage = (err, fallback) => err.response?.data?.error || fallback;

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 email, 2 code, 3 new password
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const run = async (action) => {
    setBusy(true);
    setError("");
    try {
      await action();
    } finally {
      setBusy(false);
    }
  };

  const sendCode = (event) => {
    event.preventDefault();
    run(async () => {
      try {
        await axios.post(`${baseURL}/user/auth/forgot-password`, { email: email.trim() });
        setInfo("");
        setResendIn(RESEND_SECONDS);
        setStep(2);
      } catch (err) {
        console.error("Error sending reset code:", err);
        setError(serverMessage(err, "Couldn't send a reset code. Try again."));
      }
    });
  };

  const resend = () => {
    if (resendIn > 0 || busy) return;
    run(async () => {
      try {
        await axios.post(`${baseURL}/user/auth/forgot-password`, { email: email.trim() });
        setResendIn(RESEND_SECONDS);
        setInfo("New code sent. Earlier codes no longer work.");
      } catch (err) {
        console.error("Error resending code:", err);
        setError(serverMessage(err, "Couldn't resend the code. Try again."));
      }
    });
  };

  const verifyCode = (event) => {
    event.preventDefault();
    run(async () => {
      try {
        await axios.post(`${baseURL}/user/auth/verify-reset-code`, { email: email.trim(), code: code.trim() });
        setInfo("");
        setStep(3);
      } catch (err) {
        console.error("Error verifying code:", err);
        setError(serverMessage(err, "That code is wrong or has expired."));
      }
    });
  };

  const tooShort = password.length > 0 && password.length < PASSWORD_MIN;
  const mismatch = confirm.length > 0 && password !== confirm;
  const passwordReady = password.length >= PASSWORD_MIN && password === confirm;

  const resetPassword = (event) => {
    event.preventDefault();
    if (!passwordReady) return;
    run(async () => {
      try {
        await axios.post(`${baseURL}/user/auth/reset-password`, { email: email.trim(), code: code.trim(), newPassword: password });
        navigate("/login", { state: { notice: "Password updated. Log in with your new password." } });
      } catch (err) {
        console.error("Error resetting password:", err);
        setError(serverMessage(err, "Couldn't reset your password. Try again."));
      }
    });
  };

  const footer = <>Remembered it? <a href="/login">Log in</a></>;

  if (step === 1) {
    return (
      <AuthLayout title="Reset your password" subtitle="Enter your email and we'll send you a code." footer={footer}>
        {error && <AuthAlert>{error}</AuthAlert>}
        <form className="fm-auth__form" onSubmit={sendCode}>
          <div className="fm-field">
            <label className="fm-field__label" htmlFor="fm-reset-email">Email</label>
            <input id="fm-reset-email" type="email" className="fm-input" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} autoComplete="email" autoFocus required />
          </div>
          <button type="submit" className="fm-btn fm-btn--primary fm-auth__submit" disabled={busy || !email.trim()}>
            {busy ? "Sending…" : "Send code"}
          </button>
        </form>
      </AuthLayout>
    );
  }

  if (step === 2) {
    return (
      <AuthLayout title="Check your email" subtitle={<>Enter the code we sent to <strong>{email}</strong>. It expires in 15 minutes.</>} footer={footer}>
        {error && <AuthAlert>{error}</AuthAlert>}
        {info && !error && <AuthAlert tone="success">{info}</AuthAlert>}
        <form className="fm-auth__form" onSubmit={verifyCode}>
          <div className="fm-field">
            <label className="fm-field__label" htmlFor="fm-reset-code">Reset code</label>
            <input
              id="fm-reset-code"
              className={`fm-input fm-auth__code${error ? " has-error" : ""}`}
              value={code}
              onChange={(e) => { setCode(e.target.value.trim()); setError(""); }}
              maxLength={8}
              autoComplete="one-time-code"
              autoCapitalize="none"
              spellCheck={false}
              autoFocus
              required
            />
            <span className="fm-field__hint">Can&apos;t find it? Check your spam folder.</span>
          </div>
          <div className="fm-auth__row">
            <button type="button" className="fm-auth__link" onClick={() => { setStep(1); setError(""); }}>Change email</button>
            <button type="button" className="fm-auth__link" onClick={resend} disabled={resendIn > 0 || busy}>
              {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
            </button>
          </div>
          <button type="submit" className="fm-btn fm-btn--primary fm-auth__submit" disabled={busy || !code.trim()}>
            {busy ? "Checking…" : "Continue"}
          </button>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Choose a new password" subtitle={`For ${email}`} footer={footer}>
      {error && <AuthAlert>{error}</AuthAlert>}
      <form className="fm-auth__form" onSubmit={resetPassword} noValidate>
        <PasswordField
          id="fm-reset-password"
          label="New password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(""); }}
          show={showPassword}
          onToggle={() => setShowPassword((s) => !s)}
          autoComplete="new-password"
          invalid={tooShort}
          autoFocus
        />
        <p className={`fm-auth__check${tooShort ? " is-bad" : password.length >= PASSWORD_MIN ? " is-ok" : ""}`}>
          At least {PASSWORD_MIN} characters
        </p>
        <PasswordField
          id="fm-reset-confirm"
          label="Confirm new password"
          value={confirm}
          onChange={(e) => { setConfirm(e.target.value); setError(""); }}
          show={showPassword}
          onToggle={() => setShowPassword((s) => !s)}
          autoComplete="new-password"
          invalid={mismatch}
        />
        {mismatch && <p className="fm-auth__check is-bad">Passwords don&apos;t match</p>}
        <button type="submit" className="fm-btn fm-btn--primary fm-auth__submit" disabled={busy || !passwordReady}>
          {busy ? "Saving…" : "Update password"}
        </button>
      </form>
    </AuthLayout>
  );
}

export default ForgotPasswordPage;
