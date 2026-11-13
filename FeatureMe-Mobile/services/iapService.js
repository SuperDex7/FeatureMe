import * as RNIap from 'react-native-iap';
import { Platform } from 'react-native';
import api from './api';

// Product IDs - These need to match what you configure in App Store Connect
// Format: com.featureme.app.plus.monthly, com.featureme.app.plus.yearly
const PRODUCT_IDS = {
  ios: {
    monthly: 'com.featureme.app.plus.monthly',
    yearly: 'com.featureme.app.plus.yearly',
  },
  android: {
    monthly: 'com.featureme.app.plus.monthly',
    yearly: 'com.featureme.app.plus.yearly',
  },
};

// Explicit export for Apple's static analysis - product IDs must be visible as string literals
// This ensures Apple can detect the IAP products in the binary during review
export const IOS_PRODUCT_IDS = [
  'com.featureme.app.plus.monthly',
  'com.featureme.app.plus.yearly',
];

class IAPService {
  constructor() {
    this.products = [];
    this.purchaseUpdateSubscription = null;
    this.purchaseInProgress = false;
    this.isInitialized = false;
  }

  /**
   * Initialize IAP service and load products
   */
  async initialize() {
    try {
      // Always reset state before initializing to ensure clean connection
      if (this.isInitialized) {
        try {
          await RNIap.endConnection();
        } catch (e) {
          // Ignore cleanup errors
        }
        this.isInitialized = false;
        this.products = [];
      }

      // Note: IAP requires native code, so it won't work in Expo Go
      // Users need to use a development build (EAS Build) or production build

      console.log('[IAP] Starting initialization...');
      console.log('[IAP] Platform:', Platform.OS);
      
      // Get product IDs based on platform
      const productIds = Platform.OS === 'ios' 
        ? Object.values(PRODUCT_IDS.ios)
        : Object.values(PRODUCT_IDS.android);
      
      console.log('[IAP] Requesting products:', productIds);

      // Connect to store with timeout
      console.log('[IAP] Connecting to App Store...');
      // StoreKit 2: every purchase comes with Apple's signed transaction,
      // which the server verifies itself (no deprecated receipt check)
      if (Platform.OS === 'ios') {
        RNIap.setup({ storekitMode: 'STOREKIT2_MODE' });
      }
      const connectionPromise = RNIap.initConnection();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout after 10s')), 10000)
      );
      
      await Promise.race([connectionPromise, timeoutPromise]);
      console.log('[IAP] ✓ Connected to App Store');

      // Load available products with timeout
      console.log('[IAP] Fetching products from App Store...');
      const productsPromise = RNIap.getSubscriptions({ skus: productIds })
        // StoreKit 2 calls the name "title"; the screen reads localizedTitle
        .then((items) => items.map((item) => ({ ...item, localizedTitle: item.localizedTitle || item.title })));
      const productsTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Products fetch timeout after 10s')), 10000)
      );
      
      const products = await Promise.race([productsPromise, productsTimeoutPromise]);
      
      console.log('[IAP] ✓ Received products:', products.length);
      if (products.length > 0) {
        products.forEach(p => {
          console.log(`[IAP]   - ${p.productId}: ${p.localizedTitle} (${p.localizedPrice})`);
        });
      } else {
        console.warn('[IAP] ⚠️ No products returned. Possible causes:');
        console.warn('[IAP]   1. Product IDs don\'t match App Store Connect:', productIds);
        console.warn('[IAP]   2. Products not approved/available for this app version');
        console.warn('[IAP]   3. Products not associated with the app version in App Store Connect');
        console.warn('[IAP]   4. Sandbox account not signed in (TestFlight)');
        console.warn('[IAP]   5. Products still in review');
      }
      
      this.products = products;
      this.isInitialized = true;
      this.listenForTransactions();

      if (products.length === 0) {
        console.warn('[IAP] ⚠️ No IAP products found. Make sure:');
        console.warn('[IAP]   - Product IDs match exactly: com.featureme.app.plus.monthly, com.featureme.app.plus.yearly');
        console.warn('[IAP]   - Products are approved in App Store Connect');
        console.warn('[IAP]   - Products are associated with the app version');
        console.warn('[IAP]   - You are signed in with a sandbox Apple ID (TestFlight)');
        // Return success but with empty products - let the UI handle this
      } else {
        console.log('[IAP] ✓ Initialization successful');
      }

      return { success: true, products };
    } catch (error) {
      console.error('[IAP] ✗ Initialization failed');
      console.error('[IAP] Error code:', error.code);
      console.error('[IAP] Error message:', error.message);
      console.error('[IAP] Full error:', JSON.stringify(error, null, 2));
      
      // Clean up connection if it was partially established
      try {
        if (this.isInitialized) {
          await RNIap.endConnection();
          this.isInitialized = false;
        }
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      
      // Reset state
      this.products = [];
      this.isInitialized = false;
      
      // Provide more specific error messages with diagnostic info
      let errorMessage = error.message || 'IAP initialization failed';
      let diagnosticInfo = '';
      
      if (error.code === 'E_SERVICE_ERROR' || error.message?.includes('E_SERVICE_ERROR') || error.message?.includes('Service unavailable')) {
        errorMessage = 'App Store service unavailable. Please check your connection and try again.';
        diagnosticInfo = 'Service error - App Store servers may be down or unreachable.';
      } else if (error.code === 'E_NETWORK_ERROR' || error.message?.includes('E_NETWORK_ERROR') || error.message?.includes('timeout')) {
        errorMessage = 'Network error. Please check your connection and try again.';
        diagnosticInfo = 'Network/timeout error - Check internet connection.';
      } else if (error.code === 'E_ITEM_UNAVAILABLE' || error.message?.includes('not available') || error.message?.includes('unavailable')) {
        errorMessage = 'In-app purchases are not available. Please ensure products are configured in App Store Connect.';
        diagnosticInfo = 'Products unavailable - Check: 1) Product IDs match, 2) Products approved, 3) Associated with app version, 4) Sandbox account signed in.';
      } else if (error.code === 'E_USER_ERROR' || error.message?.includes('user')) {
        errorMessage = 'Unable to connect to App Store. Please sign in to your Apple ID and try again.';
        diagnosticInfo = 'User error - Sign in to Apple ID (sandbox account for TestFlight).';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Connection timeout. Please check your connection and try again.';
        diagnosticInfo = 'Timeout - App Store servers took too long to respond.';
      }
      
      console.error('[IAP] Diagnostic:', diagnosticInfo);
      
      return { success: false, error: errorMessage, diagnostic: diagnosticInfo };
    }
  }


  /**
   * Get available subscription products
   */
  getProducts() {
    return this.products;
  }

  /**
   * Get product by ID
   */
  getProduct(productId) {
    return this.products.find(p => p.productId === productId);
  }

  /**
   * Purchase a subscription.
   * Resolves { success: true } once the server has verified the purchase and
   * given Plus; { success: false, cancelled: true } if the user backs out.
   */
  async purchaseSubscription(productId) {
    if (!this.isInitialized) {
      await this.initialize();
    }
    if (!this.getProduct(productId)) {
      throw new Error(`Product ${productId} not found`);
    }

    let purchase;
    this.purchaseInProgress = true;
    try {
      // StoreKit 2 returns the finished purchase directly
      purchase = await RNIap.requestSubscription({ sku: productId });
    } catch (error) {
      if (error.code === 'E_USER_CANCELLED') {
        return { success: false, error: 'Purchase cancelled', cancelled: true };
      }
      if (error.code === 'E_NETWORK_ERROR') throw new Error('Network error. Please check your connection.');
      if (error.code === 'E_SERVICE_ERROR') throw new Error('Service error. Please try again later.');
      throw new Error(error.message || 'Purchase failed');
    } finally {
      this.purchaseInProgress = false;
    }
    if (!purchase) {
      // Pending (e.g. Ask to Buy): it arrives later through the transaction listener
      return { success: false, error: 'Purchase is pending approval', pending: true };
    }

    const result = await this.deliver(purchase);
    if (!result.success) {
      throw new Error(result.error || 'Purchase could not be verified');
    }
    return { success: true, purchase };
  }

  /**
   * Send a purchase to the server and, once it has given Plus, tell the App
   * Store it's delivered. Unverified purchases stay unfinished so StoreKit
   * offers them again next time.
   */
  async deliver(purchase) {
    const validationResult = await this.validateReceipt(purchase);
    if (validationResult.success) {
      try {
        await RNIap.finishTransaction({ purchase, isConsumable: false });
      } catch (error) {
        console.warn('[IAP] finishTransaction failed:', error?.message);
      }
    }
    return validationResult;
  }

  /**
   * Purchases that complete outside the purchase sheet (Ask to Buy approval,
   * a purchase interrupted by the app closing, renewals while the app runs).
   */
  listenForTransactions() {
    if (this.purchaseUpdateSubscription) return;
    this.purchaseUpdateSubscription = RNIap.purchaseUpdatedListener(async (purchase) => {
      // The purchase sheet handles its own result
      if (this.purchaseInProgress) return;
      try {
        await this.deliver(purchase);
      } catch (error) {
        console.warn('[IAP] Background purchase not delivered:', error?.message);
      }
    });
  }

  /**
   * Restore previous purchases: the current App Store entitlements, each with
   * Apple's signed transaction
   */
  async restorePurchases() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const purchases = await RNIap.getAvailablePurchases();

      const validatedPurchases = [];
      let lastError = null;
      for (const purchase of purchases) {
        const validationResult = await this.deliver(purchase);
        if (validationResult.success) {
          validatedPurchases.push(purchase);
        } else {
          lastError = validationResult.error;
        }
      }

      if (purchases.length > 0 && validatedPurchases.length === 0 && lastError) {
        return { success: false, error: lastError, purchases: [] };
      }
      return { success: true, purchases: validatedPurchases };
    } catch (error) {
      console.error('Restore purchases error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Ask the server to verify a purchase and give Plus
   */
  async validateReceipt(purchase) {
    try {
      // StoreKit 2: Apple's signed transaction (JWS), verified by the server
      const signedTransaction = purchase?.verificationResultIOS;
      if (!signedTransaction) {
        return { success: false, error: 'Purchase is missing its App Store signature' };
      }

      const response = await api.post('/payment/validate-receipt', {
        platform: Platform.OS,
        signedTransaction,
        productId: purchase.productId,
        transactionId: purchase.transactionId,
      });

      if (response.data && response.data.success) {
        return { success: true, data: response.data };
      } else {
        return { 
          success: false, 
          error: response.data?.message || response.data?.error || 'Receipt validation failed' 
        };
      }
    } catch (error) {
      console.error('Receipt validation error:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Receipt validation failed';
      
      if (error.response) {
        // Server responded with error
        errorMessage = error.response.data?.message || 
                      error.response.data?.error || 
                      `Server error: ${error.response.status}`;
      } else if (error.request) {
        // Request was made but no response
        errorMessage = 'Network error. Please check your connection.';
      } else {
        // Other error
        errorMessage = error.message || 'Validation failed';
      }
      
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get product ID for billing cycle
   */
  getProductId(billingCycle) {
    const platform = Platform.OS === 'ios' ? 'ios' : 'android';
    return PRODUCT_IDS[platform][billingCycle];
  }

  /**
   * Get diagnostic information about IAP state
   */
  getDiagnostics() {
    return {
      isInitialized: this.isInitialized,
      productsCount: this.products.length,
      productIds: Platform.OS === 'ios' ? Object.values(PRODUCT_IDS.ios) : Object.values(PRODUCT_IDS.android),
      products: this.products.map(p => ({
        productId: p.productId,
        title: p.localizedTitle,
        price: p.localizedPrice,
        available: true
      })),
      platform: Platform.OS
    };
  }

  /**
   * Clean up listeners and close connection
   */
  cleanup() {
    this.purchaseUpdateSubscription?.remove();
    this.purchaseUpdateSubscription = null;
    if (this.isInitialized) {
      RNIap.endConnection();
      this.isInitialized = false;
    }
  }
}

// Export singleton instance
export default new IAPService();

