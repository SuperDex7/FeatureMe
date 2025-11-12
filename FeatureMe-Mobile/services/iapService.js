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

class IAPService {
  constructor() {
    this.products = [];
    this.purchaseUpdateSubscription = null;
    this.purchaseErrorSubscription = null;
    this.isInitialized = false;
  }

  /**
   * Initialize IAP service and load products
   */
  async initialize() {
    try {
      if (this.isInitialized) {
        return { success: true, products: this.products };
      }

      // Note: IAP requires native code, so it won't work in Expo Go
      // Users need to use a development build (EAS Build) or production build

      // Connect to store
      await RNIap.initConnection();
      
      // Get product IDs based on platform
      const productIds = Platform.OS === 'ios' 
        ? Object.values(PRODUCT_IDS.ios)
        : Object.values(PRODUCT_IDS.android);

      // Load available products
      const products = await RNIap.getProducts(productIds);
      this.products = products;
      this.isInitialized = true;

      if (products.length === 0) {
        console.warn('No IAP products found. Make sure products are configured in App Store Connect.');
        // Don't fail initialization if products aren't found - they might not be approved yet
        // This allows the app to still work, just without IAP functionality
      }

      return { success: true, products };
    } catch (error) {
      console.error('IAP initialization error:', error);
      
      // Clean up connection if it was partially established
      try {
        if (this.isInitialized) {
          RNIap.endConnection();
          this.isInitialized = false;
        }
      } catch (cleanupError) {
        console.error('Error cleaning up IAP connection:', cleanupError);
      }
      
      // Provide more specific error messages
      let errorMessage = error.message || 'IAP initialization failed';
      
      if (error.code === 'E_SERVICE_ERROR' || error.message?.includes('E_SERVICE_ERROR') || error.message?.includes('Service unavailable')) {
        errorMessage = 'App Store service unavailable. Please check your connection and try again.';
      } else if (error.code === 'E_NETWORK_ERROR' || error.message?.includes('E_NETWORK_ERROR')) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error.code === 'E_ITEM_UNAVAILABLE' || error.message?.includes('not available') || error.message?.includes('unavailable')) {
        errorMessage = 'In-app purchases are not available on this device or products are not configured.';
      } else if (error.code === 'E_USER_ERROR' || error.message?.includes('user')) {
        errorMessage = 'Unable to connect to App Store. Please sign in to your Apple ID and try again.';
      }
      
      return { success: false, error: errorMessage };
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
   * Purchase a subscription
   * Returns a promise that resolves when purchase is completed and validated
   */
  async purchaseSubscription(productId, billingCycle) {
    return new Promise(async (resolve, reject) => {
      try {
        if (!this.isInitialized) {
          await this.initialize();
        }

        const product = this.getProduct(productId);
        if (!product) {
          reject(new Error(`Product ${productId} not found`));
          return;
        }

        // Set up one-time purchase listener
        const purchaseUpdateSubscription = RNIap.purchaseUpdatedListener(
          async (purchase) => {
            try {
              // Remove listener immediately
              purchaseUpdateSubscription.remove();
              
              const receipt = purchase.transactionReceipt || purchase.purchaseToken;
              
              // Validate receipt with backend
              const validationResult = await this.validateReceipt(receipt, purchase);
              
              if (validationResult.success) {
                // Acknowledge purchase to complete transaction
                if (purchase.transactionReceipt) {
                  // iOS
                  await RNIap.finishTransactionIOS(purchase.transactionId);
                } else if (purchase.purchaseToken) {
                  // Android
                  await RNIap.finishTransaction({ purchase }, false);
                }
                
                resolve({ success: true, purchase });
              } else {
                // Don't finish transaction if validation failed
                reject(new Error(validationResult.error || 'Receipt validation failed'));
              }
            } catch (error) {
              purchaseUpdateSubscription.remove();
              reject(error);
            }
          }
        );

        // Set up error listener
        const purchaseErrorSubscription = RNIap.purchaseErrorListener(
          (error) => {
            purchaseUpdateSubscription.remove();
            purchaseErrorSubscription.remove();
            
            if (error.code === 'E_USER_CANCELLED') {
              resolve({ success: false, error: 'Purchase cancelled', cancelled: true });
            } else if (error.code === 'E_NETWORK_ERROR') {
              reject(new Error('Network error. Please check your connection.'));
            } else if (error.code === 'E_SERVICE_ERROR') {
              reject(new Error('Service error. Please try again later.'));
            } else {
              reject(new Error(error.message || 'Purchase failed'));
            }
          }
        );

        // Request purchase (this will trigger the listeners)
        await RNIap.requestSubscription(productId, false);
        
        // Note: The actual result will come through the purchaseUpdatedListener
      } catch (error) {
        console.error('Purchase initiation error:', error);
        reject(error);
      }
    });
  }

  /**
   * Restore previous purchases
   */
  async restorePurchases() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Get available purchases
      const purchases = await RNIap.getAvailablePurchases();
      
      // Validate each purchase with backend
      const validatedPurchases = [];
      for (const purchase of purchases) {
        const receipt = purchase.transactionReceipt || purchase.purchaseToken;
        const validationResult = await this.validateReceipt(receipt, purchase);
        
        if (validationResult.success) {
          validatedPurchases.push(purchase);
        }
      }

      return { success: true, purchases: validatedPurchases };
    } catch (error) {
      console.error('Restore purchases error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate receipt with backend
   */
  async validateReceipt(receipt, purchase) {
    try {
      if (!receipt) {
        return { success: false, error: 'Receipt is missing' };
      }

      const response = await api.post('/payment/validate-receipt', {
        receipt: receipt,
        productId: purchase.productId,
        transactionId: purchase.transactionId,
        platform: Platform.OS,
        purchaseToken: purchase.purchaseToken, // Android
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
   * Clean up listeners and close connection
   */
  cleanup() {
    if (this.isInitialized) {
      RNIap.endConnection();
      this.isInitialized = false;
    }
  }
}

// Export singleton instance
export default new IAPService();

