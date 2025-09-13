import React, { useState, useEffect } from 'react';
import Header from '../Components/Header';
import Footer from '../Components/Footer';
import '../Styling/Subscription.css';
import { loadStripe } from "@stripe/stripe-js";
import api from "../services/AuthService";

// Initialize Stripe with your publishable key
const stripePromise = loadStripe("pk_test_51S5y0GLO45fsGuqjeHM8dO08ZOBgyHQuRBfygq43IAkyledXi9Z9T3TK4XtVGXTnVuxKzx3rhSbCtQRNQ91X1Pjb00MFiCqvqF");

const SubscriptionPage = () => {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [currentPlan, setCurrentPlan] = useState('free');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simple user role check - webhooks handle subscription status automatically
    const checkUserRole = async () => {
      try {
        const response = await api.get('/user/me');
        const userRole = response.data?.role;
        
        if (userRole === 'USERPLUS') {
          setCurrentPlan('plus');
          setMessage("✅ You are subscribed to FeatureMe Plus!");
        } else {
          setCurrentPlan('free');
        }
      } catch (err) {
        console.error("Error checking user role:", err);
        setCurrentPlan('free');
      } finally {
        setLoading(false);
      }
    };

    // Handle redirect messages from checkout
    const query = new URLSearchParams(window.location.search);
    if (query.get("success")) {
      setMessage("🎉 Subscription successful! Welcome to FeatureMe Plus!");
      setCurrentPlan('plus');
    } else if (query.get("canceled")) {
      setMessage("❌ Subscription canceled. You can try again anytime!");
    }

    checkUserRole();
  }, []);

  const plans = {
    free: {
      name: 'Free',
      price: { monthly: 0, yearly: 0 },
      description: 'Perfect for getting started',
      features: [
        'Basic profile features',
        'Community access'
       
      ],
      limitations: [
        'No advanced analytics',
        'No GIF uploads for profile/banner',
        'Basic discovery features',
        '3 Profile Demo Limit',
        '15mb file upload limit | MP3 only'
      ],
      buttonText: currentPlan === 'free' ? 'Current Plan' : 'Downgrade',
      popular: false,
      color: 'rgba(255, 255, 255, 0.1)'
    },
    plus: {
      name: 'Plus',
      price: { monthly: 5.00, yearly: 50.00 },
      description: 'For serious creators and artists',
      features: [
        'Advanced Views Analytics',
        'Upload GIFs for profile picture & banner',
        'Social Media URL Container',
        'Advanced discovery boost',
        'Up To 6 Profile Demos',
        '90mb file upload limit | MP3 and Wave File Uploads'
      ],
      comingSoon: [
        'TBD',
       
      ],
      buttonText: getPlusButtonText(),
      popular: true,
      color: 'linear-gradient(135deg, #4f8cff 0%, #a084e8 100%)'
    }
  };

  function getPlusButtonText() {
    return currentPlan === 'plus' ? 'Current Plan' : 'Upgrade Now';
  }

  function isButtonDisabled(planType) {
    if (planType === 'free') {
      return currentPlan === 'free';
    } else if (planType === 'plus') {
      return currentPlan === 'plus';
    }
    return false;
  }
  

  const handleCheckout = async () => {
    try {
        // Determine which endpoint to call based on billing cycle
        const endpoint = billingCycle === 'yearly' 
            ? "/payment/create-checkout-session-yearly"
            : "/payment/create-checkout-session";
            
        // Call your backend to create checkout session
        const response = await api.post(endpoint);
        const stripe = await stripePromise;
        
        if (stripe) {
            const { error } = await stripe.redirectToCheckout({
                sessionId: response.data.id
            });
            
            if (error) {
                console.error("Stripe error:", error);
                alert("Error: " + error.message);
            }
        }
    } catch (err) {
        console.error("Checkout error:", err);
        alert("Error: " + (err.response?.data?.message || err.message));
    }
};

const handlePlanAction = async (planType) => {
    if (planType === 'free' && currentPlan === 'plus') {
        // Show confirmation alert for downgrade
        const confirmed = window.confirm(
            "Are you sure you want to downgrade to the Free plan?\n\n" +
            "⚠️ You will keep your FeatureMe Plus features until the end of your current billing cycle.\n" +
            "After that, you'll be moved to the Free plan.\n\n" +
            "Do you want to continue with the downgrade?"
        );
        
        if (!confirmed) {
            return; // User cancelled
        }
        
        // Downgrade to free - webhook will handle the actual status change
        try {
            const response = await api.get("/payment/cancel-subscription");
            
            if (response.data.success) {
                setMessage("✅ " + response.data.message);
                // Don't immediately change state - let webhook handle it
            } else {
                setMessage("❌ Downgrade failed: " + response.data.message);
            }
        } catch (err) {
            console.error("Downgrade error:", err);
            setMessage("❌ Downgrade error: " + (err.response?.data?.message || err.message));
        }
    } else if (planType === 'plus' && currentPlan === 'free') {
        // Upgrade to plus
        handleCheckout();
    }
    // If already on the same plan, do nothing (button is disabled)
};
  
  const getSavingsText = () => {
    if (billingCycle === 'yearly') {
      const monthlyTotal = plans.plus.price.monthly * 12;
      const savings = monthlyTotal - plans.plus.price.yearly;
      return `Save $${savings.toFixed(2)} per year`;
    }
    return '';
  };

  if (loading) {
    return (
      <div className="subscription-page">
        <Header />
        <div className="subscription-container" style={{ textAlign: 'center', padding: '50px' }}>
          <h2>Loading subscription status...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="subscription-page">
      <Header />
      
      <div className="subscription-container">
        
        {/* Hero Section */}
        <div className="subscription-hero">
          <h1 className="subscription-title">Choose Your Plan</h1>
          <p className="subscription-subtitle">
            Unlock your full potential as a creator with the right plan for you
          </p>
          
          {/* Billing Toggle */}
          <div className="billing-toggle">
            <span className={billingCycle === 'monthly' ? 'active' : ''}>Monthly</span>
            <button 
              className="toggle-switch"
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
            >
              <div className={`toggle-slider ${billingCycle === 'yearly' ? 'yearly' : 'monthly'}`}></div>
            </button>
            <span className={billingCycle === 'yearly' ? 'active' : ''}>
              Yearly
              {billingCycle === 'yearly' && <span className="savings-badge">Save 17%</span>}
            </span>
          </div>
        </div>
        {/* Success/Error Messages */}
        {message && (
          <div style={{  
            padding: '15px', 
            borderRadius: '8px',
            border: '1px solid #e0e0e0',
            marginBottom: '50px',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '16px', margin: '0' }}>{message}</p>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="pricing-cards">
          {Object.entries(plans).map(([planType, plan]) => (
            <div 
              key={planType}
              className={`pricing-card ${plan.popular ? 'popular' : ''} ${currentPlan === planType ? 'current' : ''}`}
            >
              {plan.popular && <div className="popular-badge">Most Popular</div>}
              
              <div className="card-header">
                <h3 className="plan-name">{plan.name}</h3>
                <div className="price-section">
                  <span className="currency">$</span>
                  <span className="price">{plan.price[billingCycle]}</span>
                  <span className="period">
                    {plan.price[billingCycle] === 0 ? 'Forever' : `/${billingCycle === 'monthly' ? 'mo' : 'yr'}`}
                  </span>
                </div>
                {billingCycle === 'yearly' && planType === 'plus' && (
                  <div className="savings-text">{getSavingsText()}</div>
                )}
                <p className="plan-description">{plan.description}</p>
              </div>

              <div className="card-body">
                <div className="features-section">
                  <h4>What's included:</h4>
                  <ul className="features-list">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="feature-item">
                        <span className="check-icon">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {plan.comingSoon && (
                  <div className="coming-soon-section">
                    <h4>Coming Soon:</h4>
                    <ul className="coming-soon-list">
                      {plan.comingSoon.map((feature, index) => (
                        <li key={index} className="coming-soon-item">
                          <span className="soon-icon">🚀</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {plan.limitations && (
                  <div className="limitations-section">
                    <h4>Limitations:</h4>
                    <ul className="limitations-list">
                      {plan.limitations.map((limitation, index) => (
                        <li key={index} className="limitation-item">
                          <span className="limit-icon">⚠️</span>
                          {limitation}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="card-footer">
                <button 
                  className={`plan-button ${planType} ${currentPlan === planType ? 'current' : ''}`}
                  onClick={() => handlePlanAction(planType)}
                  disabled={isButtonDisabled(planType)}
                >
                  {plan.buttonText}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="faq-section">
          <h2>Frequently Asked Questions</h2>
          <div className="faq-grid">
            <div className="faq-item">
              <h3>Can I change my plan anytime?</h3>
              <p>Yes! You can upgrade or downgrade your plan at any time. Changes are processed automatically.</p>
            </div>
            <div className="faq-item">
              <h3>What happens when I cancel?</h3>
              <p>Your subscription will remain active until the end of your billing period, then automatically downgrade to free.</p>
            </div>
            <div className="faq-item">
              <h3>What payment methods do you accept?</h3>
              <p>We accept all major credit cards through our secure Stripe payment system.</p>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="trust-section">
          <div className="trust-item">
            <span className="trust-icon">🔒</span>
            <h4>Secure Payments</h4>
            <p>SSL encrypted and PCI compliant</p>
          </div>
          <div className="trust-item">
            <span className="trust-icon">⚡</span>
            <h4>Instant Access</h4>
            <p>Upgrade takes effect immediately</p>
          </div>
          <div className="trust-item">
            <span className="trust-icon">🎯</span>
            <h4>No Hidden Fees</h4>
            <p>What you see is what you pay</p>
          </div>
          {/*
          <div className="trust-item">
            <span className="trust-icon">💬</span>
            <h4>24/7 Support</h4>
            <p>We're here to help anytime</p>
          </div>
          */}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SubscriptionPage;
