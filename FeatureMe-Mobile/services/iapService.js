import {
  initConnection,
  endConnection,
  fetchProducts,
  requestPurchase,
  finishTransaction,
  getAvailablePurchases,
  purchaseUpdatedListener,
  purchaseErrorListener,
} from 'expo-iap';
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
    this.purchaseErrorSubscription = null;
    // The purchase the sheet is open for: { productId, resolve, reject }
    this.pendingPurchase = null;
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
          await endConnection();
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
      // expo-iap uses StoreKit 2: every purchase carries Apple's signed
      // transaction (purchaseToken), which the server verifies itself
      const connectionPromise = initConnection();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout after 10s')), 10000)
      );
      
      await Promise.race([connectionPromise, timeoutPromise]);
      console.log('[IAP] ✓ Connected to App Store');

      // Load available products with timeout
      console.log('[IAP] Fetching products from App Store...');
      const productsPromise = fetchProducts({ skus: productIds, type: 'subs' })
        // The screen reads the older field names
        .then((items) => (items || []).map((item) => ({
          ...item,
          productId: item.id,
          localizedTitle: item.displayName || item.title,
          localizedPrice: item.displayPrice,
        })));
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
          await endConnection();
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
    if (this.pendingPurchase) {
      throw new Error('A purchase is already in progress');
    }

    // The outcome arrives through the purchase listeners (see listenForTransactions)
    return new Promise((resolve, reject) => {
      this.pendingPurchase = { productId, resolve, reject };
      requestPurchase({ request: { apple: { sku: productId } }, type: 'subs' })
        .catch((error) => this.settlePurchaseError(error));
    });
  }

  settlePurchaseError(error) {
    const pending = this.pendingPurchase;
    if (!pending) return;
    this.pendingPurchase = null;
    switch (error?.code) {
      case 'user-cancelled':
        pending.resolve({ success: false, error: 'Purchase cancelled', cancelled: true });
        break;
      case 'pending':
      case 'deferred-payment':
        pending.resolve({ success: false, error: 'Purchase is pending approval', pending: true });
        break;
      case 'network-error':
        pending.reject(new Error('Network error. Please check your connection.'));
        break;
      case 'service-error':
        pending.reject(new Error('Service error. Please try again later.'));
        break;
      default:
        pending.reject(new Error(error?.message || 'Purchase failed'));
    }
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
        await finishTransaction({ purchase, isConsumable: false });
      } catch (error) {
        console.warn('[IAP] finishTransaction failed:', error?.message);
      }
    }
    return validationResult;
  }

  /**
   * Every purchase arrives here: the one the purchase sheet is open for, and
   * ones that complete outside it (Ask to Buy approval, a purchase
   * interrupted by the app closing, renewals while the app runs).
   */
  listenForTransactions() {
    if (this.purchaseUpdateSubscription) return;
    this.purchaseUpdateSubscription = purchaseUpdatedListener(async (purchase) => {
      const pending = this.pendingPurchase?.productId === purchase.productId ? this.pendingPurchase : null;
      if (pending) this.pendingPurchase = null;

      if (purchase.purchaseState === 'pending') {
        pending?.resolve({ success: false, error: 'Purchase is pending approval', pending: true });
        return;
      }
      try {
        const result = await this.deliver(purchase);
        if (!pending) return;
        if (result.success) pending.resolve({ success: true, purchase });
        else pending.reject(new Error(result.error || 'Purchase could not be verified'));
      } catch (error) {
        if (pending) pending.reject(error);
        else console.warn('[IAP] Background purchase not delivered:', error?.message);
      }
    });
    this.purchaseErrorSubscription = purchaseErrorListener((error) => this.settlePurchaseError(error));
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

      const purchases = await getAvailablePurchases();

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
      const signedTransaction = purchase?.purchaseToken;
      if (!signedTransaction) {
        return { success: false, error: 'Purchase is missing its App Store signature' };
      }

      const response = await api.post('/payment/validate-receipt', {
        platform: Platform.OS,
        signedTransaction,
        productId: purchase.productId,
        transactionId: purchase.id,
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
    this.purchaseErrorSubscription?.remove();
    this.purchaseErrorSubscription = null;
    if (this.pendingPurchase) {
      this.pendingPurchase.resolve({ success: false, error: 'Purchase cancelled', cancelled: true });
      this.pendingPurchase = null;
    }
    if (this.isInitialized) {
      endConnection();
      this.isInitialized = false;
    }
  }
}

// Export singleton instance
export default new IAPService();

