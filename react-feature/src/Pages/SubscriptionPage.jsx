import React, { useState } from 'react';
import Header from '../Components/Header';
import '../Styling/Subscription.css';

const SubscriptionPage = () => {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [currentPlan, setCurrentPlan] = useState('free'); // This would come from user data

  const plans = {
    free: {
      name: 'Free',
      price: { monthly: 0, yearly: 0 },
      description: 'Perfect for getting started',
      features: [
        '5 posts per month',
        'Basic profile features',
        'Community access'
       
      ],
      limitations: [
        'No advanced analytics',
        'No GIF uploads for profile/banner',
        'Basic discovery features',
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
        'Enhanced profile customization',
        'Collaboration tools',
        'Advanced discovery boost',
        '90mb file upload limit | MP3 and Wave File Uploads'
      ],
      comingSoon: [
        'TBD',
       
      ],
      buttonText: currentPlan === 'plus' ? 'Current Plan' : 'Upgrade Now',
      popular: true,
      color: 'linear-gradient(135deg, #4f8cff 0%, #a084e8 100%)'
    }
  };

  const handlePlanSelection = (planType) => {
    if (planType === currentPlan) return;
    
    // In a real app, this would handle the subscription logic
    console.log(`Selecting ${planType} plan with ${billingCycle} billing`);
    
    // Simulate plan change
    setCurrentPlan(planType);
  };

  const getSavingsText = () => {
    if (billingCycle === 'yearly') {
      const monthlyTotal = plans.plus.price.monthly * 12;
      const savings = monthlyTotal - plans.plus.price.yearly;
      return `Save $${savings.toFixed(2)} per year`;
    }
    return '';
  };

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
                  onClick={() => handlePlanSelection(planType)}
                  disabled={currentPlan === planType}
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
              <p>Yes! You can upgrade or downgrade your plan at any time. Upgrades take effect immediately.</p>
            </div>
            <div className="faq-item">
              <h3>What happens to my posts if I downgrade?</h3>
              <p>Your existing posts remain visible, but you'll be limited to 5 new posts per month on the Free plan.</p>
            </div>
            <div className="faq-item">
              <h3>What payment methods do you accept?</h3>
              <p>We accept all major credit cards, PayPal, and bank transfers for yearly plans.</p>
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
    </div>
  );
};

export default SubscriptionPage;
