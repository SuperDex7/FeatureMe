import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import api from '../services/api';

export default function SubscriptionPage() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [currentPlan, setCurrentPlan] = useState('free');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    // Handle redirect messages from checkout
    if (params.success) {
      setMessage('🎉 Subscription successful! Welcome to FeatureMe Plus!');
      setCurrentPlan('plus');
    } else if (params.canceled) {
      setMessage('❌ Subscription canceled. You can try again anytime!');
    }

    // Check user role
    const checkUserRole = async () => {
      try {
        const response = await api.get('/user/me');
        const userRole = response.data?.role;
        
        if (userRole === 'USERPLUS') {
          setCurrentPlan('plus');
          if (!params.success) {
            setMessage('✅ You are subscribed to FeatureMe Plus!');
          }
        } else {
          setCurrentPlan('free');
        }
      } catch (err) {
        console.error('Error checking user role:', err);
        setCurrentPlan('free');
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, [params]);

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
        'Won\'t Appear In Spotlight Section',
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
        'Display Social Links On Profile',
        'Spotlight Page Appearences',
        'Up To 6 Profile Demos',
        '90mb file upload limit | MP3 and Wave File Uploads'
      ],
      comingSoon: [
        'Spotlight Page Upgrades',
        'TBD'
      ],
      buttonText: currentPlan === 'plus' ? 'Current Plan' : 'Upgrade Now',
      popular: true,
      gradientColors: ['#4f8cff', '#a084e8']
    }
  };

  function isButtonDisabled(planType) {
    if (planType === 'free') {
      return currentPlan === 'free';
    } else if (planType === 'plus') {
      return currentPlan === 'plus';
    }
    return false;
  }

  const handleCheckout = async () => {
    setProcessing(true);
    try {
      // Determine which endpoint to call based on billing cycle
      const endpoint = billingCycle === 'yearly' 
        ? '/payment/create-checkout-session-yearly'
        : '/payment/create-checkout-session';
      
      // Call your backend to create checkout session
      const response = await api.post(endpoint);
      const checkoutUrl = response.data.url;
      
      if (!checkoutUrl) {
        throw new Error('Checkout URL not provided by server');
      }
      
      // Open Stripe checkout URL in browser
      const result = await WebBrowser.openBrowserAsync(checkoutUrl, {
        showTitle: true,
        toolbarColor: '#1e222d',
        enableBarCollapsing: false,
      });

      // Handle browser result
      if (result.type === 'cancel') {
        setMessage('❌ Checkout canceled. You can try again anytime!');
      } else if (result.type === 'dismiss') {
        // User may have completed or canceled - check status after delay
        setTimeout(() => {
          checkUserRole();
        }, 2000);
      } else {
        // User completed checkout - refresh subscription status
        setTimeout(() => {
          checkUserRole();
        }, 2000);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      Alert.alert(
        'Error',
        err.response?.data?.message || err.message || 'Failed to start checkout process'
      );
    } finally {
      setProcessing(false);
    }
  };

  const checkUserRole = async () => {
    try {
      const response = await api.get('/user/me');
      const userRole = response.data?.role;
      
      if (userRole === 'USERPLUS') {
        setCurrentPlan('plus');
        setMessage('✅ You are subscribed to FeatureMe Plus!');
      } else {
        setCurrentPlan('free');
      }
    } catch (err) {
      console.error('Error checking user role:', err);
    }
  };

  const handlePlanAction = async (planType) => {
    if (planType === 'free' && currentPlan === 'plus') {
      // Show confirmation alert for downgrade
      Alert.alert(
        'Downgrade to Free Plan',
        'Are you sure you want to downgrade to the Free plan?\n\n' +
        '⚠️ You will keep your FeatureMe Plus features until the end of your current billing cycle.\n' +
        'After that, you\'ll be moved to the Free plan.\n\n' +
        'Do you want to continue with the downgrade?',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Downgrade',
            style: 'destructive',
            onPress: async () => {
              setProcessing(true);
              try {
                const response = await api.get('/payment/cancel-subscription');
                
                if (response.data.success) {
                  setMessage('✅ ' + response.data.message);
                  // Don't immediately change state - let webhook handle it
                } else {
                  setMessage('❌ Downgrade failed: ' + response.data.message);
                }
              } catch (err) {
                console.error('Downgrade error:', err);
                setMessage('❌ Downgrade error: ' + (err.response?.data?.message || err.message));
              } finally {
                setProcessing(false);
              }
            }
          }
        ]
      );
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

  const openCustomerPortal = () => {
    WebBrowser.openBrowserAsync(
      'https://billing.stripe.com/p/login/3cIaEY72cf217ov7bFg7e00',
      {
        showTitle: true,
        toolbarColor: '#1e222d',
      }
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Subscription</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4f8cff" />
          <Text style={styles.loadingText}>Loading subscription status...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscription</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.hero}>
          <Text style={styles.title}>Choose Your Plan</Text>
          <Text style={styles.subtitle}>
            Unlock your full potential as a creator with the right plan for you
          </Text>
          
          {/* Billing Toggle */}
          <View style={styles.billingToggle}>
            <Text style={[styles.billingLabel, billingCycle === 'monthly' && styles.billingLabelActive]}>
              Monthly
            </Text>
            <TouchableOpacity
              style={[styles.toggleSwitch, billingCycle === 'yearly' && styles.toggleSwitchActive]}
              onPress={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
            >
              <View style={[styles.toggleSlider, billingCycle === 'yearly' && styles.toggleSliderYearly]} />
            </TouchableOpacity>
            <View style={styles.billingRight}>
              <Text style={[styles.billingLabel, billingCycle === 'yearly' && styles.billingLabelActive]}>
                Yearly
              </Text>
              {billingCycle === 'yearly' && (
                <View style={styles.savingsBadge}>
                  <Text style={styles.savingsBadgeText}>Save 17%</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Success/Error Messages */}
        {message ? (
          <View style={styles.messageContainer}>
            <Text style={styles.messageText}>{message}</Text>
          </View>
        ) : null}

        {/* Pricing Cards */}
        <View style={styles.pricingCards}>
          {Object.entries(plans).sort(([a], [b]) => {
            // Show plus plan first, then free
            if (a === 'plus') return -1;
            if (b === 'plus') return 1;
            return 0;
          }).map(([planType, plan]) => (
            <View
              key={planType}
              style={[
                styles.pricingCard,
                plan.popular && styles.pricingCardPopular,
                currentPlan === planType && styles.pricingCardCurrent
              ]}
            >
              {plan.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>Most Popular</Text>
                </View>
              )}
              
              <View style={styles.cardHeader}>
                <Text style={styles.planName}>{plan.name}</Text>
                <View style={styles.priceSection}>
                  <Text style={styles.currency}>$</Text>
                  <Text style={styles.price}>{plan.price[billingCycle]}</Text>
                  <Text style={styles.period}>
                    {plan.price[billingCycle] === 0 ? 'Forever' : `/${billingCycle === 'monthly' ? 'mo' : 'yr'}`}
                  </Text>
                </View>
                {billingCycle === 'yearly' && planType === 'plus' && (
                  <Text style={styles.savingsText}>{getSavingsText()}</Text>
                )}
                <Text style={styles.planDescription}>{plan.description}</Text>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.featuresSection}>
                  <Text style={styles.sectionTitle}>What's included:</Text>
                  {plan.features.map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                      <Text style={styles.checkIcon}>✓</Text>
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>

                {plan.comingSoon && (
                  <View style={styles.comingSoonSection}>
                    <Text style={styles.sectionTitle}>Coming Soon:</Text>
                    {plan.comingSoon.map((feature, index) => (
                      <View key={index} style={styles.featureItem}>
                        <Text style={styles.soonIcon}>🚀</Text>
                        <Text style={styles.featureText}>{feature}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {plan.limitations && (
                  <View style={styles.limitationsSection}>
                    <Text style={styles.sectionTitle}>Limitations:</Text>
                    {plan.limitations.map((limitation, index) => (
                      <View key={index} style={styles.featureItem}>
                        <Text style={styles.limitIcon}>⚠️</Text>
                        <Text style={styles.featureText}>{limitation}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.cardFooter}>
                {plan.popular && planType === 'plus' ? (
                  <LinearGradient
                    colors={plan.gradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.planButtonGradient, isButtonDisabled(planType) && styles.planButtonDisabled]}
                  >
                    <TouchableOpacity
                      style={styles.planButton}
                      onPress={() => handlePlanAction(planType)}
                      disabled={isButtonDisabled(planType) || processing}
                    >
                      {processing && planType === 'plus' ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.planButtonText}>{plan.buttonText}</Text>
                      )}
                    </TouchableOpacity>
                  </LinearGradient>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.planButton,
                      styles.planButtonRegular,
                      isButtonDisabled(planType) && styles.planButtonDisabled
                    ]}
                    onPress={() => handlePlanAction(planType)}
                    disabled={isButtonDisabled(planType) || processing}
                  >
                    {processing && planType === 'plus' ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.planButtonText}>{plan.buttonText}</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Customer Portal Section */}
        {currentPlan === 'plus' && (
          <View style={styles.customerPortalSection}>
            <Text style={styles.portalTitle}>Manage Your Subscription</Text>
            <Text style={styles.portalDescription}>
              Access your billing information, update payment methods, and manage your subscription
            </Text>
            <TouchableOpacity
              style={styles.portalButton}
              onPress={openCustomerPortal}
            >
              <Text style={styles.portalIcon}>⚙️</Text>
              <Text style={styles.portalButtonText}>Open Customer Portal</Text>
              <Text style={styles.externalLinkIcon}>↗</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* FAQ Section */}
        <View style={styles.faqSection}>
          <Text style={styles.faqTitle}>Frequently Asked Questions</Text>
          <View style={styles.faqGrid}>
            <View style={styles.faqItem}>
              <Text style={styles.faqQuestion}>Can I change my plan anytime?</Text>
              <Text style={styles.faqAnswer}>Yes! You can upgrade or downgrade your plan at any time. Changes are processed automatically.</Text>
            </View>
            <View style={styles.faqItem}>
              <Text style={styles.faqQuestion}>What happens when I cancel?</Text>
              <Text style={styles.faqAnswer}>Your subscription will remain active until the end of your billing period, then automatically downgrade to free.</Text>
            </View>
            <View style={styles.faqItem}>
              <Text style={styles.faqQuestion}>What payment methods do you accept?</Text>
              <Text style={styles.faqAnswer}>We accept all major credit cards through our secure Stripe payment system.</Text>
            </View>
          </View>
        </View>

        {/* Trust Indicators */}
        <View style={styles.trustSection}>
          <View style={styles.trustItem}>
            <Text style={styles.trustIcon}>🔒</Text>
            <Text style={styles.trustTitle}>Secure Payments</Text>
            <Text style={styles.trustDescription}>SSL encrypted and PCI compliant</Text>
          </View>
          <View style={styles.trustItem}>
            <Text style={styles.trustIcon}>⚡</Text>
            <Text style={styles.trustTitle}>Instant Access</Text>
            <Text style={styles.trustDescription}>Upgrade takes effect immediately</Text>
          </View>
          <View style={styles.trustItem}>
            <Text style={styles.trustIcon}>🎯</Text>
            <Text style={styles.trustTitle}>No Hidden Fees</Text>
            <Text style={styles.trustDescription}>What you see is what you pay</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181a20',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 200,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  backIcon: {
    fontSize: 24,
    color: 'white',
    fontWeight: '300',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#4f8cff',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(243, 243, 243, 0.8)',
    marginBottom: 32,
    textAlign: 'center',
    maxWidth: 350,
    lineHeight: 22,
  },
  billingToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  billingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(243, 243, 243, 0.6)',
  },
  billingLabelActive: {
    color: '#4f8cff',
  },
  billingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleSwitch: {
    width: 60,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 3,
    justifyContent: 'center',
  },
  toggleSlider: {
    width: 24,
    height: 24,
    backgroundColor: '#4f8cff',
    borderRadius: 12,
    transform: [{ translateX: 0 }],
  },
  toggleSliderYearly: {
    transform: [{ translateX: 30 }],
  },
  savingsBadge: {
    backgroundColor: '#00ff88',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  savingsBadgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '700',
  },
  messageContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 12,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  messageText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
  pricingCards: {
    gap: 20,
    marginBottom: 40,
  },
  pricingCard: {
    backgroundColor: 'rgba(30, 34, 45, 0.95)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(127, 83, 172, 0.2)',
    position: 'relative',
  },
  pricingCardPopular: {
    borderColor: '#4f8cff',
    borderWidth: 2,
  },
  pricingCardCurrent: {
    borderColor: '#00ff88',
    borderWidth: 2,
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    backgroundColor: '#4f8cff',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  planName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  currency: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
  },
  price: {
    fontSize: 48,
    fontWeight: '900',
    color: '#fff',
  },
  period: {
    fontSize: 20,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 4,
  },
  savingsText: {
    fontSize: 14,
    color: '#00ff88',
    fontWeight: '600',
    marginTop: 4,
  },
  planDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginTop: 8,
  },
  cardBody: {
    marginBottom: 24,
  },
  featuresSection: {
    marginBottom: 20,
  },
  comingSoonSection: {
    marginBottom: 20,
  },
  limitationsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  checkIcon: {
    fontSize: 16,
    color: '#00ff88',
    marginRight: 10,
    fontWeight: '700',
  },
  soonIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  limitIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
  cardFooter: {
    marginTop: 8,
  },
  planButtonGradient: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  planButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  planButtonRegular: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  planButtonDisabled: {
    opacity: 0.5,
  },
  planButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  customerPortalSection: {
    backgroundColor: 'rgba(30, 34, 45, 0.95)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(127, 83, 172, 0.2)',
  },
  portalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  portalDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  portalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(79, 140, 255, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4f8cff',
    gap: 8,
  },
  portalIcon: {
    fontSize: 16,
  },
  portalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4f8cff',
  },
  externalLinkIcon: {
    fontSize: 16,
    color: '#4f8cff',
  },
  faqSection: {
    marginBottom: 40,
  },
  faqTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 24,
    textAlign: 'center',
  },
  faqGrid: {
    gap: 16,
  },
  faqItem: {
    backgroundColor: 'rgba(30, 34, 45, 0.95)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(127, 83, 172, 0.2)',
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 20,
  },
  trustSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 20,
  },
  trustItem: {
    alignItems: 'center',
    flex: 1,
    minWidth: 100,
  },
  trustIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  trustTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
    textAlign: 'center',
  },
  trustDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
});
