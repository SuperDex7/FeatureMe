import { useEffect, useState } from "react";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import Dialog from "../Components/ui/Dialog";
import Icon from "../Components/ui/Icon";
import PlusBadge from "../Components/ui/PlusBadge";
import api from "../services/AuthService";
import "../Styling/SubscriptionPage.css";

// Stripe publishable key (public by design). Only loaded if the server
// doesn't hand back a checkout URL.
const STRIPE_KEY = "pk_live_51S5y09LFlQ9r3bfIljUeY5CMdPOtEbcM3q7UBPMb2ZBvs7hkK80XwYPcg4BJ3kkIzwl3dHGGSzskWtONywgXzNy6006TRFEfri";
const BILLING_PORTAL = "https://billing.stripe.com/p/login/3cIaEY72cf217ov7bFg7e00";

const PRICES = { monthly: 5, yearly: 50 };
const YEARLY_SAVING = PRICES.monthly * 12 - PRICES.yearly;

// One row per feature: what Free gets, what Plus gets
const COMPARISON = [
  { label: "Audio uploads", free: "MP3, up to 15 MB", plus: "MP3 and WAV, up to 90 MB" },
  { label: "Profile demos", free: "Up to 3", plus: "Up to 6" },
  { label: "Views analytics", free: false, plus: "Who's listening, liking and downloading" },
  { label: "Plus Spotlight on Trending", free: false, plus: true },
  { label: "GIF profile picture and banner", free: false, plus: true },
  { label: "Social links on your profile", free: false, plus: true },
  { label: "Plus logo next to your name", free: false, plus: true },
];

const FAQ = [
  { q: "Can I cancel any time?", a: "Yes. You keep Plus until the end of the period you've paid for, then your account moves to Free. Your posts and demos stay up." },
  { q: "What happens to my WAV uploads if I cancel?", a: "Tracks you've already posted stay as they are. New uploads follow the Free limits." },
  { q: "How do I pay?", a: "Checkout is handled by Stripe, which takes all major cards. FeatureMe never sees your card details." },
  { q: "I subscribed in the iPhone app. Where do I manage it?", a: "Subscriptions bought in the app are managed in your Apple ID settings, not here." },
];

function Cell({ value }) {
  if (value === true) return <><Icon name="check" size={18} strokeWidth={2.4} className="fm-plans__yes" /><span className="fm-visually-hidden">Included</span></>;
  if (value === false) return <><span className="fm-plans__no" aria-hidden="true">—</span><span className="fm-visually-hidden">Not included</span></>;
  return <span>{value}</span>;
}

function SubscriptionPage() {
  const params = new URLSearchParams(window.location.search);
  const [plan, setPlan] = useState(null); // 'free' | 'plus'
  const [status, setStatus] = useState("loading");
  const [billing, setBilling] = useState("yearly");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(
    params.get("success") ? { tone: "success", text: "Welcome to FeatureMe Plus! It can take a minute for everything to switch on." }
      : params.get("canceled") ? { tone: "info", text: "Checkout was canceled. You haven't been charged." }
        : null,
  );
  const [cancelOpen, setCancelOpen] = useState(false);

  useEffect(() => {
    api.get("/user/me")
      .then(({ data }) => {
        setPlan(data?.role === "USERPLUS" || params.get("success") ? "plus" : "free");
        setStatus("ready");
      })
      .catch((err) => {
        console.error("Error checking plan:", err);
        setStatus("error");
      });
    // Read once on arrival
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkout = async () => {
    setBusy(true);
    setNotice(null);
    try {
      const endpoint = billing === "yearly" ? "/payment/create-checkout-session-yearly" : "/payment/create-checkout-session";
      const { data } = await api.post(endpoint);
      if (data?.url) {
        window.location.assign(data.url);
        return;
      }
      const { loadStripe } = await import("@stripe/stripe-js");
      const stripe = await loadStripe(STRIPE_KEY);
      const { error } = await stripe.redirectToCheckout({ sessionId: data.id });
      if (error) throw error;
    } catch (err) {
      console.error("Checkout error:", err);
      setNotice({ tone: "error", text: err.response?.data?.message || "Couldn't open checkout. Try again in a moment." });
      setBusy(false);
    }
  };

  const cancelPlus = async () => {
    setBusy(true);
    try {
      const { data } = await api.get("/payment/cancel-subscription");
      setNotice(data?.success
        ? { tone: "success", text: data.message || "Your subscription will end at the close of this billing period." }
        : { tone: "error", text: data?.message || "Couldn't cancel. Try the billing portal instead." });
    } catch (err) {
      console.error("Cancel error:", err);
      setNotice({ tone: "error", text: err.response?.data?.message || "Couldn't cancel. Try the billing portal instead." });
    } finally {
      setBusy(false);
      setCancelOpen(false);
    }
  };

  const isPlus = plan === "plus";
  const price = PRICES[billing];

  return (
    <div className="fm-page">
      <Header />

      <main className="fm-page__main">
        <div className="fm-plans">
          <section className="fm-plans__hero" aria-labelledby="fm-plans-title">
            <PlusBadge size={56} className="fm-plans__logo" />
            <h1 id="fm-plans-title" className="fm-plans__title">FeatureMe Plus</h1>
            <p className="fm-plans__subtitle">Bigger uploads, real analytics and a spot on Trending, for the price of a coffee.</p>
          </section>

          {notice && (
            <div className={`fm-plans__notice fm-plans__notice--${notice.tone}`} role={notice.tone === "error" ? "alert" : "status"}>
              <Icon name={notice.tone === "error" ? "info" : "check"} size={18} />
              <span>{notice.text}</span>
              <button type="button" className="fm-icon-btn" onClick={() => setNotice(null)} aria-label="Dismiss"><Icon name="close" size={16} /></button>
            </div>
          )}

          {status === "loading" && (
            <div className="fm-state" role="status"><div className="fm-spinner" /><p>Checking your plan…</p></div>
          )}
          {status === "error" && (
            <div className="fm-state" role="alert">
              <h3>Couldn&apos;t load your plan</h3>
              <p>Check your connection and try again.</p>
              <button type="button" className="fm-btn fm-btn--secondary" onClick={() => window.location.reload()}>Retry</button>
            </div>
          )}

          {status === "ready" && isPlus && (
            <section className="fm-card fm-plans__member" aria-labelledby="fm-plans-member">
              <div>
                <h2 id="fm-plans-member" className="fm-plans__card-title">You&apos;re on Plus <PlusBadge size={22} /></h2>
                <p className="fm-plans__muted">Update your card, see invoices or switch between monthly and yearly in the billing portal.</p>
              </div>
              <div className="fm-plans__member-actions">
                <a href={BILLING_PORTAL} target="_blank" rel="noopener noreferrer" className="fm-btn fm-btn--primary">
                  Manage billing
                  <Icon name="link" size={16} />
                </a>
                <button type="button" className="fm-btn fm-btn--secondary" onClick={() => setCancelOpen(true)} disabled={busy}>Cancel Plus</button>
              </div>
            </section>
          )}

          {status === "ready" && !isPlus && (
            <section className="fm-plans__pick" aria-label="Choose billing">
              <div className="fm-segmented fm-plans__billing" role="radiogroup" aria-label="Billing period">
                <button type="button" role="radio" aria-checked={billing === "monthly"} className={`fm-segment${billing === "monthly" ? " is-active" : ""}`} onClick={() => setBilling("monthly")}>
                  Monthly
                </button>
                <button type="button" role="radio" aria-checked={billing === "yearly"} className={`fm-segment${billing === "yearly" ? " is-active" : ""}`} onClick={() => setBilling("yearly")}>
                  Yearly <span className="fm-plans__save">Save ${YEARLY_SAVING}</span>
                </button>
              </div>

              <div className="fm-plans__cards">
                <article className="fm-card fm-plans__plan" aria-labelledby="fm-plan-free">
                  <h2 id="fm-plan-free" className="fm-plans__plan-name">Free</h2>
                  <p className="fm-plans__price"><strong>$0</strong></p>
                  <p className="fm-plans__muted">Everything you need to share music and find collaborators.</p>
                  <span className="fm-btn fm-btn--secondary fm-plans__current" aria-disabled="true">Your current plan</span>
                </article>

                <article className="fm-card fm-plans__plan fm-plans__plan--plus" aria-labelledby="fm-plan-plus">
                  <h2 id="fm-plan-plus" className="fm-plans__plan-name">Plus <PlusBadge size={22} /></h2>
                  <p className="fm-plans__price">
                    <strong>${price}</strong>
                    <span>/{billing === "yearly" ? "year" : "month"}</span>
                  </p>
                  <p className="fm-plans__muted">
                    {billing === "yearly" ? `That's about $${(PRICES.yearly / 12).toFixed(2)} a month, billed once a year.` : "Billed monthly. Cancel any time."}
                  </p>
                  <button type="button" className="fm-btn fm-btn--primary fm-plans__cta" onClick={checkout} disabled={busy}>
                    {busy ? "Opening checkout…" : `Get Plus ${billing === "yearly" ? "yearly" : "monthly"}`}
                  </button>
                </article>
              </div>
            </section>
          )}

          {status === "ready" && (
            <section className="fm-card fm-plans__compare" aria-labelledby="fm-plans-compare">
              <h2 id="fm-plans-compare" className="fm-plans__card-title">What you get</h2>
              <table className="fm-plans__table">
                <thead>
                  <tr>
                    <th scope="col"><span className="fm-visually-hidden">Feature</span></th>
                    <th scope="col">Free</th>
                    <th scope="col" className="fm-plans__plus-col">Plus</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row) => (
                    <tr key={row.label}>
                      <th scope="row">{row.label}</th>
                      <td><Cell value={row.free} /></td>
                      <td className="fm-plans__plus-col"><Cell value={row.plus} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          <section className="fm-plans__faq" aria-labelledby="fm-plans-faq">
            <h2 id="fm-plans-faq" className="fm-plans__card-title">Questions</h2>
            {FAQ.map((item) => (
              <details key={item.q} className="fm-plans__question">
                <summary>{item.q}<Icon name="chevronDown" size={18} /></summary>
                <p>{item.a}</p>
              </details>
            ))}
            <p className="fm-plans__muted fm-plans__secure"><Icon name="info" size={16} />Payments are processed securely by Stripe.</p>
          </section>
        </div>
      </main>

      <Footer />

      <Dialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        closeDisabled={busy}
        title="Cancel Plus?"
        size="sm"
        footer={(
          <>
            <button type="button" className="fm-btn fm-btn--secondary" onClick={() => setCancelOpen(false)} disabled={busy}>Keep Plus</button>
            <button type="button" className="fm-btn fm-btn--danger" onClick={cancelPlus} disabled={busy}>{busy ? "Canceling…" : "Cancel Plus"}</button>
          </>
        )}
      >
        <p className="fm-plans__dialog-text">
          You&apos;ll keep Plus until the end of this billing period. After that you&apos;ll move to Free: uploads go back to MP3 up to 15 MB, analytics turn off and you&apos;ll leave the Plus Spotlight.
        </p>
      </Dialog>
    </div>
  );
}

export default SubscriptionPage;
