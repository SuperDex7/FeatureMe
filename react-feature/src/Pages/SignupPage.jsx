import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AuthLayout, { AuthAlert, PasswordField } from "../Components/AuthLayout";
import Icon from "../Components/ui/Icon";
import { baseURL } from "../config/api";
import ValidationService from "../services/ValidationService";
import { bannerStyle } from "../utils/banner";

const PASSWORD_MIN = 6;
const RESEND_SECONDS = 30;
const IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];
const IMAGE_MAX = 5 * 1024 * 1024;
const STEP_NAMES = ["Account", "Verify email", "Username", "Profile"];

function checkImage(file) {
  if (!IMAGE_TYPES.includes(file.type)) return "Use a JPG or PNG image.";
  if (file.size > IMAGE_MAX) return "Images can be up to 5 MB.";
  return null;
}

// Live result under the email and username fields
function Availability({ state, okText }) {
  if (state.isValidating) return <p className="fm-auth__check" aria-live="polite">Checking…</p>;
  if (state.available === true) return <p className="fm-auth__check is-ok" aria-live="polite"><Icon name="check" size={14} strokeWidth={2.4} />{okText}</p>;
  if (state.available === false) return <p className="fm-auth__check is-bad" aria-live="polite">{state.error || "Already taken"}</p>;
  return null;
}

function SignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "", userName: "", bio: "", location: "", about: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [emailCheck, setEmailCheck] = useState({ isValidating: false, available: null, error: null });
  const [nameCheck, setNameCheck] = useState({ isValidating: false, available: null, error: null });
  const [verificationToken, setVerificationToken] = useState("");
  const [code, setCode] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const picInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  useEffect(() => () => ValidationService.clearAllValidations(), []);

  // Countdown before "Resend code" is available again
  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const picUrl = useMemo(() => (profilePicFile ? URL.createObjectURL(profilePicFile) : null), [profilePicFile]);
  const bannerUrl = useMemo(() => (bannerFile ? URL.createObjectURL(bannerFile) : null), [bannerFile]);
  useEffect(() => () => { if (picUrl) URL.revokeObjectURL(picUrl); }, [picUrl]);
  useEffect(() => () => { if (bannerUrl) URL.revokeObjectURL(bannerUrl); }, [bannerUrl]);

  const update = (field) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
    if (field === "email") {
      setEmailCheck({ isValidating: true, available: null, error: null });
      ValidationService.checkEmailAvailability(value, (r) => setEmailCheck({ isValidating: false, available: value ? r.available : null, error: r.error }));
    }
    if (field === "userName") {
      setNameCheck({ isValidating: true, available: null, error: null });
      ValidationService.checkUsernameAvailability(value, (r) => setNameCheck({ isValidating: false, available: value ? r.available : null, error: r.error }));
    }
  };

  const passwordShort = form.password.length > 0 && form.password.length < PASSWORD_MIN;
  const passwordMismatch = form.confirmPassword.length > 0 && form.password !== form.confirmPassword;
  const step1Ready = emailCheck.available === true && !emailCheck.isValidating
    && form.password.length >= PASSWORD_MIN && form.password === form.confirmPassword;
  const step3Ready = form.userName.trim() && nameCheck.available === true && !nameCheck.isValidating;

  // The server emails a 6-digit code and keeps it; nothing about the code comes back here
  const sendCode = async () => {
    await axios.post(`${baseURL}/user/auth/email-verification/send`, { email: form.email.trim() });
    setVerificationToken("");
    setResendIn(RESEND_SECONDS);
  };

  const serverError = (err, fallback) => err.response?.data?.error || fallback;

  const submitAccount = async (event) => {
    event.preventDefault();
    if (!step1Ready || busy) return;
    setBusy(true);
    try {
      await sendCode();
      setCode("");
      setInfo("");
      setStep(2);
    } catch (err) {
      console.error("Error sending verification email:", err);
      setError(serverError(err, "We couldn't send the verification email. Check the address and try again."));
    } finally {
      setBusy(false);
    }
  };

  const submitCode = async (event) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const { data } = await axios.post(`${baseURL}/user/auth/email-verification/verify`, { email: form.email.trim(), code: code.trim() });
      setVerificationToken(data.verificationToken);
      setInfo("");
      setStep(3);
    } catch (err) {
      console.error("Error verifying code:", err);
      setError(serverError(err, "That code doesn't match. Check the email and try again."));
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (resendIn > 0 || busy) return;
    setBusy(true);
    setError("");
    try {
      await sendCode();
      setInfo(`New code sent to ${form.email}. Earlier codes no longer work.`);
    } catch (err) {
      console.error("Error resending code:", err);
      setError(serverError(err, "Couldn't resend the code. Try again in a moment."));
    } finally {
      setBusy(false);
    }
  };

  const submitUsername = (event) => {
    event.preventDefault();
    if (step3Ready) setStep(4);
  };

  const pickImage = (setter) => (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const problem = checkImage(file);
    if (problem) { setError(problem); return; }
    setError("");
    setter(file);
  };

  const createAccount = async (event) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const userData = {
      userName: form.userName.trim(),
      password: form.password,
      email: form.email.trim(),
      role: "USER",
      bio: form.bio.trim(),
      about: form.about.trim(),
      profilePic: "/dpp.jpg",
      banner: "/pb.jpg",
      location: form.location.trim(),
      socialMedia: [],
      badges: [],
      demo: [],
      featuredOn: [],
      posts: [],
    };
    const data = new FormData();
    data.append("user", new Blob([JSON.stringify(userData)], { type: "application/json" }));
    if (profilePicFile) data.append("pp", profilePicFile);
    if (bannerFile) data.append("banner", bannerFile);
    data.append("verificationToken", verificationToken);
    try {
      await axios.post(`${baseURL}/user/auth/create`, data, { headers: { "Content-Type": "multipart/form-data" }, timeout: 30000 });
      navigate("/login", { state: { notice: "Your account is ready. Log in to get started." } });
    } catch (err) {
      console.error("Signup error:", err);
      if (err.response?.status === 403) {
        // The email check expired (30 minutes); send a fresh code
        setError("Your email check expired. Ask for a new code to finish signing up.");
        setVerificationToken("");
        setCode("");
        setResendIn(0);
        setStep(2);
        setBusy(false);
        return;
      }
      if (err.response?.status === 409) setError("That email or username was just taken. Go back and pick another.");
      else if (typeof err.response?.data === "string" && err.response.data.length < 200) setError(err.response.data);
      else if (err.code === "ECONNABORTED") setError("That took too long. Check your connection and try again.");
      else setError("Couldn't create your account. Try again.");
      setBusy(false);
    }
  };

  const back = () => { setError(""); setInfo(""); setStep((s) => Math.max(1, s - 1)); };

  const progress = (
    <div className="fm-auth__steps">
      <span className="fm-auth__steps-label">Step {step} of 4 · {STEP_NAMES[step - 1]}</span>
      <div className="fm-auth__steps-bar" aria-hidden="true">
        {STEP_NAMES.map((name, i) => <span key={name} className={i < step ? "is-done" : ""} />)}
      </div>
    </div>
  );

  const footer = <>Already have an account? <a href="/login">Log in</a></>;

  if (step === 1) {
    return (
      <AuthLayout title="Create your account" subtitle="Join the artists sharing and featuring on each other's music." footer={footer}>
        {progress}
        {error && <AuthAlert>{error}</AuthAlert>}
        <form className="fm-auth__form" onSubmit={submitAccount} noValidate>
          <div className="fm-field">
            <label className="fm-field__label" htmlFor="fm-signup-email">Email</label>
            <input
              id="fm-signup-email"
              type="email"
              className={`fm-input${emailCheck.available === false ? " has-error" : ""}`}
              value={form.email}
              onChange={update("email")}
              autoComplete="email"
              maxLength={100}
              autoFocus
              required
            />
            <Availability state={emailCheck} okText="Looks good" />
          </div>

          <PasswordField
            id="fm-signup-password"
            label="Password"
            value={form.password}
            onChange={update("password")}
            show={showPassword}
            onToggle={() => setShowPassword((s) => !s)}
            autoComplete="new-password"
            invalid={passwordShort}
            describedBy="fm-signup-password-hint"
          />
          <p id="fm-signup-password-hint" className={`fm-auth__check${passwordShort ? " is-bad" : form.password.length >= PASSWORD_MIN ? " is-ok" : ""}`}>
            {form.password.length >= PASSWORD_MIN && <Icon name="check" size={14} strokeWidth={2.4} />}
            At least {PASSWORD_MIN} characters
          </p>

          <PasswordField
            id="fm-signup-confirm"
            label="Confirm password"
            value={form.confirmPassword}
            onChange={update("confirmPassword")}
            show={showPassword}
            onToggle={() => setShowPassword((s) => !s)}
            autoComplete="new-password"
            invalid={passwordMismatch}
            describedBy={passwordMismatch ? "fm-signup-confirm-error" : undefined}
          />
          {passwordMismatch && <p id="fm-signup-confirm-error" className="fm-auth__check is-bad">Passwords don&apos;t match</p>}

          <button type="submit" className="fm-btn fm-btn--primary fm-auth__submit" disabled={!step1Ready || busy}>
            {busy ? "Sending code…" : "Continue"}
          </button>
        </form>
      </AuthLayout>
    );
  }

  if (step === 2) {
    return (
      <AuthLayout title="Check your email" subtitle={<>We sent a 6-digit code to <strong>{form.email}</strong>.</>} footer={footer}>
        {progress}
        {error && <AuthAlert>{error}</AuthAlert>}
        {info && !error && <AuthAlert tone="success">{info}</AuthAlert>}
        <form className="fm-auth__form" onSubmit={submitCode}>
          <div className="fm-field">
            <label className="fm-field__label" htmlFor="fm-signup-code">Verification code</label>
            <input
              id="fm-signup-code"
              className={`fm-input fm-auth__code${error ? " has-error" : ""}`}
              value={code}
              onChange={(e) => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              required
            />
            <span className="fm-field__hint">It expires in 15 minutes. Can&apos;t find it? Check your spam folder.</span>
          </div>
          <div className="fm-auth__row">
            <button type="button" className="fm-auth__link" onClick={back}>Change email</button>
            <button type="button" className="fm-auth__link" onClick={resend} disabled={resendIn > 0 || busy}>
              {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
            </button>
          </div>
          <button type="submit" className="fm-btn fm-btn--primary fm-auth__submit" disabled={code.length !== 6 || busy}>
            {busy ? "Checking…" : "Verify"}
          </button>
        </form>
      </AuthLayout>
    );
  }

  if (step === 3) {
    return (
      <AuthLayout title="Pick a username" subtitle="It's how other artists will find and tag you." footer={footer}>
        {progress}
        <form className="fm-auth__form" onSubmit={submitUsername}>
          <div className="fm-field">
            <label className="fm-field__label" htmlFor="fm-signup-username">Username</label>
            <input
              id="fm-signup-username"
              className={`fm-input${nameCheck.available === false ? " has-error" : ""}`}
              value={form.userName}
              onChange={update("userName")}
              maxLength={30}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              autoFocus
              required
            />
            <span className="fm-auth__field-foot">
              <Availability state={nameCheck} okText="Available" />
              <span className="fm-field__hint">{form.userName.length}/30</span>
            </span>
          </div>
          <p className="fm-auth__note">
            <Icon name="info" size={18} />
            <span>You can&apos;t change your username later, so pick one you&apos;ll want to keep.</span>
          </p>
          <div className="fm-auth__actions">
            <button type="button" className="fm-btn fm-btn--secondary" onClick={back}>Back</button>
            <button type="submit" className="fm-btn fm-btn--primary" disabled={!step3Ready}>Continue</button>
          </div>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Set up your profile" subtitle="All optional. You can change these any time." footer={footer} wide>
      {progress}
      <div className="fm-auth__profile-preview" aria-label="Profile preview">
        <div
          className="fm-auth__preview-banner"
          style={bannerUrl ? { backgroundImage: `url("${bannerUrl}")` } : bannerStyle({ userName: form.userName })}
        />
        <div className="fm-auth__preview-body">
          <img src={picUrl || "/dpp.jpg"} alt="" />
          <span className="fm-auth__preview-text">
            <span className="fm-auth__preview-name">{form.userName}</span>
            <span className="fm-auth__preview-meta">{[form.bio.trim(), form.location.trim()].filter(Boolean).join(" · ") || "Your bio and location show here"}</span>
          </span>
        </div>
      </div>

      {error && <AuthAlert>{error}</AuthAlert>}

      <form className="fm-auth__form" onSubmit={createAccount}>
        <div className="fm-auth__uploads">
          <input ref={picInputRef} type="file" accept="image/jpeg,image/png" hidden onChange={pickImage(setProfilePicFile)} />
          <input ref={bannerInputRef} type="file" accept="image/jpeg,image/png" hidden onChange={pickImage(setBannerFile)} />
          <button type="button" className="fm-btn fm-btn--secondary" onClick={() => picInputRef.current?.click()}>
            <Icon name="camera" size={18} />
            {profilePicFile ? "Change photo" : "Add a photo"}
          </button>
          <button type="button" className="fm-btn fm-btn--secondary" onClick={() => bannerInputRef.current?.click()}>
            <Icon name="camera" size={18} />
            {bannerFile ? "Change banner" : "Add a banner"}
          </button>
        </div>
        <span className="fm-field__hint">JPG or PNG, up to 5 MB each.</span>

        <div className="fm-auth__two">
          <div className="fm-field">
            <label className="fm-field__label" htmlFor="fm-signup-bio">Bio</label>
            <input id="fm-signup-bio" className="fm-input" value={form.bio} onChange={update("bio")} maxLength={50} placeholder="Producer, singer, …" />
          </div>
          <div className="fm-field">
            <label className="fm-field__label" htmlFor="fm-signup-location">Location</label>
            <input id="fm-signup-location" className="fm-input" value={form.location} onChange={update("location")} maxLength={20} placeholder="City" />
          </div>
        </div>

        <div className="fm-field">
          <label className="fm-field__label" htmlFor="fm-signup-about">About</label>
          <textarea id="fm-signup-about" className="fm-input" rows={3} value={form.about} onChange={update("about")} maxLength={250} placeholder="What kind of music do you make? Who do you want to work with?" />
          <span className="fm-auth__field-foot"><span /><span className="fm-field__hint">{form.about.length}/250</span></span>
        </div>

        <div className="fm-auth__actions">
          <button type="button" className="fm-btn fm-btn--secondary" onClick={back} disabled={busy}>Back</button>
          <button type="submit" className="fm-btn fm-btn--primary" disabled={busy}>
            {busy ? "Creating account…" : "Create account"}
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}

export default SignupPage;
