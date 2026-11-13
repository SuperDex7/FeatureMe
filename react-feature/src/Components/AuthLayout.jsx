import Icon from "./ui/Icon";
import "../Styling/AuthPages.css";

const POINTS = [
  { icon: "music", text: "Share tracks, beats and loops" },
  { icon: "userPlus", text: "Ask artists to feature on your songs" },
  { icon: "message", text: "Message collaborators directly" },
];

// Shared shell for login, signup and password reset: a brand panel beside the
// form on wide screens, just the form on phones. No site header, so the only
// way forward is the form.
function AuthLayout({ title, subtitle, children, footer, wide = false }) {
  return (
    <div className="fm-auth">
      <aside className="fm-auth__brand" aria-hidden="true">
        <a href="/" className="fm-auth__brand-logo" tabIndex={-1}>
          <img src="/SVGs/Logo Lockup White.svg" alt="" />
        </a>
        <div className="fm-auth__pitch">
          <p className="fm-auth__headline">Make music with people who get it.</p>
          <ul className="fm-auth__points">
            {POINTS.map((point) => (
              <li key={point.text}><Icon name={point.icon} size={20} />{point.text}</li>
            ))}
          </ul>
        </div>
        <p className="fm-auth__small">FeatureMe · For musicians</p>
      </aside>

      <main className="fm-auth__main">
        <div className={`fm-auth__panel${wide ? " fm-auth__panel--wide" : ""}`}>
          <a href="/" className="fm-auth__logo">
            <img src="/SVGs/Logo Lockup Gradient.svg" alt="FeatureMe home" />
          </a>
          <div className="fm-auth__head">
            <h1 className="fm-auth__title">{title}</h1>
            {subtitle && <p className="fm-auth__subtitle">{subtitle}</p>}
          </div>
          {children}
          {footer && <div className="fm-auth__footer">{footer}</div>}
        </div>
      </main>
    </div>
  );
}

export function AuthAlert({ tone = "error", children }) {
  return (
    <div className={`fm-auth__alert fm-auth__alert--${tone}`} role={tone === "error" ? "alert" : "status"}>
      <Icon name={tone === "error" ? "info" : "check"} size={18} />
      <span>{children}</span>
    </div>
  );
}

export function PasswordField({ id, label, value, onChange, show, onToggle, autoComplete, invalid, describedBy, autoFocus }) {
  return (
    <div className="fm-field">
      <label className="fm-field__label" htmlFor={id}>{label}</label>
      <div className="fm-auth__password">
        <input
          id={id}
          type={show ? "text" : "password"}
          className={`fm-input${invalid ? " has-error" : ""}`}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          maxLength={50}
          autoFocus={autoFocus}
          required
        />
        <button type="button" className="fm-auth__reveal" onClick={onToggle} aria-label={show ? "Hide password" : "Show password"} aria-pressed={show}>
          <Icon name="eye" size={18} />
        </button>
      </div>
    </div>
  );
}

export default AuthLayout;
