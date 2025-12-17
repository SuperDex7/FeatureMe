import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import api from '../services/api';
import iapService from '../services/iapService';

// Apple IAP Product IDs - Hardcoded here for Apple's static analysis
// These must match exactly what's configured in App Store Connect
const APPLE_PRODUCT_ID_MONTHLY = 'com.featureme.app.plus.monthly';
const APPLE_PRODUCT_ID_YEARLY = 'com.featureme.app.plus.yearly';

export default function SubscriptionPage() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [currentPlan, setCurrentPlan] = useState('free');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [iapProducts, setIapProducts] = useState([]);
  const [iapInitialized, setIapInitialized] = useState(false);
  const [plusPrice, setPlusPrice] = useState({ monthly: 5.00, yearly: 50.00 });
  const [iapDiagnostics, setIapDiagnostics] = useState(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  useEffect(() => {
    // Initialize IAP service (iOS only)
    const initializeIAP = async (retryCount = 0) => {
      if (Platform.OS === 'ios') {
        // Product IDs are hardcoded above for Apple's static analysis
        // Reference them to ensure they're included in the binary (not tree-shaken)
        const _productIds = [APPLE_PRODUCT_ID_MONTHLY, APPLE_PRODUCT_ID_YEARLY];
        // These string literals will be visible in the compiled binary
        try {
          const result = await iapService.initialize();
          if (result.success && result.products && result.products.length > 0) {
            setIapProducts(result.products);
            setIapInitialized(true);
            setMessage(''); // Clear any previous messages
            setIapDiagnostics(null); // Clear diagnostics on success
            setShowDiagnostics(false);
            
            // Update prices from IAP products if available
            result.products.forEach(product => {
              const price = parseFloat(product.localizedPrice?.replace(/[^0-9.]/g, '') || 0);
              if (product.productId.includes('monthly') && price > 0) {
                setPlusPrice(prev => ({ ...prev, monthly: price }));
              } else if (product.productId.includes('yearly') && price > 0) {
                setPlusPrice(prev => ({ ...prev, yearly: price }));
              }
            });
          } else {
            // Retry initialization up to 2 times with delay
            if (retryCount < 2) {
              console.log(`IAP initialization retry ${retryCount + 1}/2`);
              setTimeout(() => {
                initializeIAP(retryCount + 1);
              }, 2000);
            } else {
              console.log('IAP products not available after retries');
              // Store diagnostics for later display
              const diagnostics = iapService.getDiagnostics();
              setIapDiagnostics({
                error: 'Products not available',
                requestedIds: [APPLE_PRODUCT_ID_MONTHLY, APPLE_PRODUCT_ID_YEARLY],
                productsFound: diagnostics.productsCount,
                isInitialized: diagnostics.isInitialized,
                diagnostic: 'Products may not be approved or associated with this app version'
              });
              // Don't show error - just log it. IAP will be retried when user clicks upgrade
            }
          }
        } catch (error) {
          // Retry initialization up to 2 times with delay
          if (retryCount < 2) {
            console.log(`IAP initialization error, retry ${retryCount + 1}/2:`, error.message);
            setTimeout(() => {
              initializeIAP(retryCount + 1);
            }, 2000);
          } else {
            console.log('IAP initialization failed after retries:', error.message);
            // Store diagnostics for later display
            const diagnostics = iapService.getDiagnostics();
            setIapDiagnostics({
              error: 'Initialization failed',
              errorCode: error.code,
              errorMessage: error.message,
              requestedIds: [APPLE_PRODUCT_ID_MONTHLY, APPLE_PRODUCT_ID_YEARLY],
              isInitialized: diagnostics.isInitialized,
              diagnostic: error.message || 'Unknown error'
            });
            // Don't show error - IAP will be retried when user clicks upgrade
          }
        }
      }
    };

    initializeIAP();

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

    // Cleanup IAP listeners on unmount
    return () => {
      if (Platform.OS === 'ios') {
        iapService.cleanup();
      }
    };
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
      get price() { return plusPrice; },
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
      buttonText: currentPlan === 'plus' ? 'Current Plan' : 'Upgrade',
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

  const handleUpgrade = async () => {
    // On iOS, use in-app purchases only
    if (Platform.OS === 'ios') {
      if (!iapInitialized) {
        // Try to initialize IAP first with retries
        setMessage('Initializing in-app purchases...');
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
          try {
            // Reset IAP service state before retry
            if (retryCount > 0) {
              iapService.cleanup();
              await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between retries
            }
            
            const result = await iapService.initialize();
            if (result.success && result.products && result.products.length > 0) {
              setIapProducts(result.products);
              setIapInitialized(true);
              setMessage('');
              setIapDiagnostics(null); // Clear diagnostics on success
              setShowDiagnostics(false);
              
              // Update prices from IAP products if available
              result.products.forEach(product => {
                const price = parseFloat(product.localizedPrice?.replace(/[^0-9.]/g, '') || 0);
                if (product.productId.includes('monthly') && price > 0) {
                  setPlusPrice(prev => ({ ...prev, monthly: price }));
                } else if (product.productId.includes('yearly') && price > 0) {
                  setPlusPrice(prev => ({ ...prev, yearly: price }));
                }
              });
              
              // Now try the purchase
              await handleIAPPurchase();
              return;
            } else {
              retryCount++;
              if (retryCount < maxRetries) {
                setMessage(`Initializing in-app purchases... (attempt ${retryCount + 1}/${maxRetries})`);
                continue;
              } else {
                // Products not found - provide helpful diagnostic message
                const diagnosticMsg = result.diagnostic || 'Products may not be available yet.';
                const diagnostics = iapService.getDiagnostics();
                setIapDiagnostics({
                  error: 'Products not found',
                  diagnostic: diagnosticMsg,
                  requestedIds: [APPLE_PRODUCT_ID_MONTHLY, APPLE_PRODUCT_ID_YEARLY],
                  productsFound: diagnostics.productsCount,
                  isInitialized: diagnostics.isInitialized
                });
                console.error('[IAP] Products not found after retries. Diagnostic:', diagnosticMsg);
                console.error('[IAP] Requested product IDs:', APPLE_PRODUCT_ID_MONTHLY, APPLE_PRODUCT_ID_YEARLY);
                setMessage('⚠️ Subscription products are not available.\n\nCommon causes:\n• Products are "In Review" (must be "Approved" or "Ready to Submit")\n• You are not signed in with a sandbox Apple ID\n• Products not approved in App Store Connect\n\nTap for diagnostic details');
                setShowDiagnostics(true);
                return;
              }
            }
          } catch (error) {
            retryCount++;
            if (retryCount < maxRetries) {
              setMessage(`Initializing in-app purchases... (attempt ${retryCount + 1}/${maxRetries})`);
              continue;
            } else {
              console.error('[IAP] Initialization failed after retries:', error);
              console.error('[IAP] Error code:', error.code);
              console.error('[IAP] Error message:', error.message);
              const errorMsg = error.message || 'Unknown error';
              const diagnostics = iapService.getDiagnostics();
              setIapDiagnostics({
                error: 'Connection failed',
                errorCode: error.code,
                errorMessage: errorMsg,
                requestedIds: [APPLE_PRODUCT_ID_MONTHLY, APPLE_PRODUCT_ID_YEARLY],
                isInitialized: diagnostics.isInitialized
              });
              setMessage(`⚠️ Unable to connect to App Store.\n\nError: ${errorMsg}\n\nPlease check your connection and ensure you are signed in to your Apple ID.\n\nTap for diagnostic details`);
              setShowDiagnostics(true);
              return;
            }
          }
        }
      } else {
        // Check if products are available before attempting purchase
        const productId = iapService.getProductId(billingCycle);
        const product = iapService.getProduct(productId);
        
        if (product) {
          await handleIAPPurchase();
        } else {
          // Products not available - try to reinitialize
          setMessage('Refreshing subscription options...');
          iapService.cleanup();
          setIapInitialized(false);
          // Retry initialization
          await handleUpgrade();
        }
      }
    } else {
      // On Android, use web subscriptions
      await handleWebSubscription();
    }
  };

  const handleWebSubscription = async () => {
    try {
      setMessage('');
      const endpoint = billingCycle === 'yearly' 
        ? '/payment/create-checkout-session-yearly'
        : '/payment/create-checkout-session';
      
      const response = await api.post(endpoint);
      const checkoutUrl = response.data.url;
      
      if (checkoutUrl) {
        await WebBrowser.openBrowserAsync(checkoutUrl, {
          showTitle: true,
          toolbarColor: '#1e222d',
        });
      } else {
        setMessage('❌ Unable to create checkout session. Please try again.');
      }
    } catch (error) {
      console.error('Web subscription error:', error);
      setMessage('❌ Unable to start subscription. Please check your connection and try again.');
    }
  };

  const handleIAPPurchase = async () => {
    if (purchasing) return;

    setPurchasing(true);
    setMessage('');

    try {
      // Get product ID for selected billing cycle
      const productId = iapService.getProductId(billingCycle);
      
      if (!productId) {
        throw new Error('Product not available for selected billing cycle');
      }

      // Check if product is available
      const product = iapService.getProduct(productId);
      if (!product) {
        throw new Error('Product not found. Please try again later.');
      }

      // Show confirmation
      const confirmPurchase = await new Promise((resolve) => {
        Alert.alert(
          'Subscribe to FeatureMe Plus',
          `Subscribe to ${product.localizedTitle || 'FeatureMe Plus'} for ${product.localizedPrice || `$${plans.plus.price[billingCycle]}`}?`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => resolve(false)
            },
            {
              text: 'Subscribe',
              onPress: () => resolve(true)
            }
          ]
        );
      });

      if (!confirmPurchase) {
        setPurchasing(false);
        return;
      }

      // Initiate purchase
      const result = await iapService.purchaseSubscription(productId, billingCycle);

      if (result.success) {
        setMessage('🎉 Subscription successful! Welcome to FeatureMe Plus!');
        setCurrentPlan('plus');
        
        // Refresh user data to get updated role
        await checkUserRole();
      } else if (result.cancelled) {
        setMessage('Purchase cancelled by user');
      } else {
        const errorMsg = result.error || 'Purchase failed. Please try again.';
        console.error('Purchase failed:', errorMsg);
        setMessage(`❌ Purchase Failed:\n${errorMsg}\n\nPlease check the console for more details.`);
      }
    } catch (error) {
      console.error('Purchase error:', error);
      const errorDetails = error.message || error.toString() || 'Unknown error occurred';
      setMessage(`❌ Purchase Error:\n${errorDetails}\n\nCheck the console for full error details.`);
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestorePurchases = async () => {
    if (Platform.OS !== 'ios') {
      setMessage('⚠️ Restore purchases is only available on iOS.');
      return;
    }
    
    if (!iapInitialized) {
      setMessage('⚠️ IAP not initialized. Attempting to initialize...');
      try {
        const result = await iapService.initialize();
        if (result.success) {
          setIapProducts(result.products);
          setIapInitialized(true);
        } else {
          setMessage(`❌ Failed to initialize IAP: ${result.error || 'Unknown error'}`);
          return;
        }
      } catch (error) {
        setMessage(`❌ IAP initialization error: ${error.message || 'Unknown error'}`);
        return;
      }
    }

    setPurchasing(true);
    setMessage('');

    try {
      const result = await iapService.restorePurchases();
      
      if (result.success && result.purchases.length > 0) {
        setMessage('✅ Purchases restored successfully!');
        await checkUserRole();
      } else if (result.success && result.purchases.length === 0) {
        setMessage('No previous purchases found to restore.');
      } else {
        const errorMsg = result.error || 'Unknown error occurred';
        console.error('Restore purchases failed:', errorMsg);
        setMessage(`❌ Failed to restore purchases:\n${errorMsg}\n\nCheck the console for more details.`);
      }
    } catch (error) {
      console.error('Restore purchases error:', error);
      const errorDetails = error.message || error.toString() || 'Unknown error occurred';
      setMessage(`❌ Restore Purchases Error:\n${errorDetails}\n\nCheck the console for full error details.`);
    } finally {
      setPurchasing(false);
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
              }
            }
          }
        ]
      );
    } else if (planType === 'plus' && currentPlan === 'free') {
      // Use IAP on iOS, web redirect on Android
      handleUpgrade();
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
          <TouchableOpacity 
            style={styles.messageContainer}
            onPress={() => showDiagnostics && setShowDiagnostics(!showDiagnostics)}
            activeOpacity={showDiagnostics ? 0.7 : 1}
          >
            <Text style={styles.messageText}>{message}</Text>
            {showDiagnostics && iapDiagnostics && (
              <View style={styles.diagnosticsContainer}>
                <Text style={styles.diagnosticsTitle}>Diagnostic Information:</Text>
                <Text style={styles.diagnosticsText}>
                  Status: {iapDiagnostics.isInitialized ? 'Initialized' : 'Not Initialized'}
                </Text>
                {iapDiagnostics.productsFound !== undefined && (
                  <Text style={styles.diagnosticsText}>
                    Products Found: {iapDiagnostics.productsFound} / 2
                  </Text>
                )}
                <Text style={styles.diagnosticsText}>
                  Requested IDs: {iapDiagnostics.requestedIds?.join(', ')}
                </Text>
                {iapDiagnostics.errorCode && (
                  <Text style={styles.diagnosticsText}>
                    Error Code: {iapDiagnostics.errorCode}
                  </Text>
                )}
                {iapDiagnostics.diagnostic && (
                  <Text style={styles.diagnosticsText}>
                    Details: {iapDiagnostics.diagnostic}
                  </Text>
                )}
                <Text style={styles.diagnosticsHint}>
                  Tap to collapse
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ) : null}

        {/* Website Information */}
        {currentPlan === 'free' && (
          <View style={styles.upgradeNotice}>
            <Text style={styles.upgradeNoticeIcon}>ℹ️</Text>
            <Text style={styles.upgradeNoticeTitle}>More Information</Text>
            <Text style={styles.upgradeNoticeText}>
              For more details about FeatureMe Plus features and plans, visit our website
            </Text>
            <TouchableOpacity
              style={styles.upgradeNoticeButton}
              onPress={handleUpgrade}
            >
              <Text style={styles.upgradeNoticeButtonText}>Visit featureme.co</Text>
              <Text style={styles.externalLinkIcon}>↗</Text>
            </TouchableOpacity>
          </View>
        )}

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
                      disabled={isButtonDisabled(planType) || purchasing}
                    >
                      {purchasing && planType === 'plus' ? (
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
                    disabled={isButtonDisabled(planType) || purchasing}
                  >
                    {purchasing && planType === 'plus' ? (
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
              {Platform.OS === 'ios' 
                ? 'Manage your subscription through your Apple ID settings or restore previous purchases.'
                : 'Access your billing information, update payment methods, and manage your subscription'}
            </Text>
            {Platform.OS === 'ios' ? (
              <TouchableOpacity
                style={styles.portalButton}
                onPress={handleRestorePurchases}
                disabled={purchasing}
              >
                <Text style={styles.portalIcon}>🔄</Text>
                <Text style={styles.portalButtonText}>Restore Purchases</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.portalButton}
                onPress={openCustomerPortal}
              >
                <Text style={styles.portalIcon}>⚙️</Text>
                <Text style={styles.portalButtonText}>Open Customer Portal</Text>
                <Text style={styles.externalLinkIcon}>↗</Text>
              </TouchableOpacity>
            )}
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
              <Text style={styles.faqQuestion}>Where can I learn more about subscriptions?</Text>
              <Text style={styles.faqAnswer}>For more information about FeatureMe Plus features and subscription options, please visit our website at featureme.co</Text>
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

        {/* Required Subscription Information (Apple Guidelines 3.1.2) */}
        <View style={styles.legalSection}>
          <Text style={styles.legalTitle}>Subscription Information</Text>
          
          {/* Subscription Title */}
          <View style={styles.legalItem}>
            <Text style={styles.legalLabel}>Subscription Name:</Text>
            <Text style={styles.legalValue}>FeatureMe Plus</Text>
          </View>

          {/* Subscription Length */}
          <View style={styles.legalItem}>
            <Text style={styles.legalLabel}>Subscription Length:</Text>
            <Text style={styles.legalValue}>
              {billingCycle === 'monthly' ? '1 Month (Auto-renewable)' : '1 Year (Auto-renewable)'}
            </Text>
          </View>

          {/* Subscription Price */}
          <View style={styles.legalItem}>
            <Text style={styles.legalLabel}>Price:</Text>
            <Text style={styles.legalValue}>
              ${plans.plus.price[billingCycle]}{billingCycle === 'monthly' ? '/month' : '/year'}
              {billingCycle === 'yearly' && (
                <Text style={styles.legalSubtext}> (${(plans.plus.price.yearly / 12).toFixed(2)}/month)</Text>
              )}
            </Text>
          </View>

          {/* Legal Links */}
          <View style={styles.legalLinks}>
            <TouchableOpacity
              style={styles.legalLink}
              onPress={() => WebBrowser.openBrowserAsync('https://featureme.co/privacy-policy')}
            >
              <Text style={styles.legalLinkText}>Privacy Policy</Text>
              <Text style={styles.externalLinkIcon}>↗</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.legalLink}
              onPress={() => WebBrowser.openBrowserAsync('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/')}
            >
              <Text style={styles.legalLinkText}>Terms of Use (EULA)</Text>
              <Text style={styles.externalLinkIcon}>↗</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.legalNote}>
            Subscriptions automatically renew unless cancelled at least 24 hours before the end of the current period. 
            Manage your subscription in your Apple ID account settings.
          </Text>
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
  diagnosticsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  diagnosticsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4f8cff',
    marginBottom: 8,
  },
  diagnosticsText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  diagnosticsHint: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 8,
    fontStyle: 'italic',
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
  upgradeNotice: {
    backgroundColor: 'rgba(79, 140, 255, 0.15)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(79, 140, 255, 0.3)',
    alignItems: 'center',
  },
  upgradeNoticeIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  upgradeNoticeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  upgradeNoticeText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  upgradeNoticeButton: {
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
  upgradeNoticeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4f8cff',
  },
  legalSection: {
    backgroundColor: 'rgba(30, 34, 45, 0.95)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(127, 83, 172, 0.2)',
  },
  legalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  legalItem: {
    marginBottom: 16,
  },
  legalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  legalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  legalSubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 12,
  },
  legalLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(79, 140, 255, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4f8cff',
    gap: 6,
  },
  legalLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4f8cff',
  },
  legalNote: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 8,
  },
});
