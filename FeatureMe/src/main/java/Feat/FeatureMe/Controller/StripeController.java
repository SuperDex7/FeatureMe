package Feat.FeatureMe.Controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.Invoice;
import com.stripe.net.Webhook;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import com.stripe.model.Customer;
import com.stripe.model.Subscription;
import com.stripe.param.CustomerCreateParams;

import Feat.FeatureMe.Entity.User;
import Feat.FeatureMe.Service.UserService;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;


@RestController
@RequestMapping("/api/payment")
public class StripeController {
    
    private final UserService userService;
    
    @Value("${stripe.webhook.secret}")
    private String webhookSecret;
    
    @Value("${apple.shared.secret:}")
    private String appleSharedSecret;
    
    private static final String APPLE_SANDBOX_URL = "https://sandbox.itunes.apple.com/verifyReceipt";
    private static final String APPLE_PRODUCTION_URL = "https://buy.itunes.apple.com/verifyReceipt";

    //@Value("${https://featureme.co}")
    //private String frontendUrl;

    public StripeController(UserService userService){
        this.userService = userService;
    }
    private String frontendUrl = "https://featureme.co";
    
    @PostMapping("/create-checkout-session")
    public Map<String, Object> createCheckoutSession() throws StripeException {
        // Get the authenticated user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }
        
        String email = authentication.getName();
        // Verify user exists and get user object
        User user = userService.findByUsernameOrEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Create or retrieve Stripe customer
        String customerId = user.getStripeCustomerId();
        if (customerId == null) {
            CustomerCreateParams customerParams = CustomerCreateParams.builder()
                .setEmail(email)
                .setName(user.getUserName())
                .build();
            Customer customer = Customer.create(customerParams);
            customerId = customer.getId();
            
            // Save customer ID to user
            user.setStripeCustomerId(customerId);
            userService.saveUser(user);
        }
        
        SessionCreateParams sessionParams = SessionCreateParams.builder()
            .addPaymentMethodType(SessionCreateParams.PaymentMethodType.CARD)
            .setMode(SessionCreateParams.Mode.SUBSCRIPTION)
            .setSuccessUrl(frontendUrl + "/subscription?success=true")
            .setCancelUrl(frontendUrl + "/subscription?canceled=true")
            .setCustomer(customerId)
            .setAllowPromotionCodes(true)
            .addLineItem(
                SessionCreateParams.LineItem.builder()
                    .setQuantity(1L)
                    .setPriceData(
                        SessionCreateParams.LineItem.PriceData.builder()
                            .setCurrency("usd")
                            .setUnitAmount(500L) // $5.00
                            .setRecurring(
                                SessionCreateParams.LineItem.PriceData.Recurring.builder()
                                    .setInterval(SessionCreateParams.LineItem.PriceData.Recurring.Interval.MONTH)
                                    .setIntervalCount(1L)
                                    .build()
                            )
                            .setProductData(
                                SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                    .setName("FeatureMe Plus")
                                    .setDescription("Monthly subscription for FeatureMe Plus")
                                    .addImage("https://featureme.co/SVGs/Logo%20Gradient.svg")
                                    .build()
                            )
                            .build()
                    )
                    .build()
            )
            .build();

        Session session = Session.create(sessionParams);
        Map<String, Object> result = new HashMap<>();
        result.put("id", session.getId());
        result.put("url", session.getUrl());
        return result;
    }
    
    @PostMapping("/create-checkout-session-yearly")
    public Map<String, Object> createCheckoutSessionYearly() throws StripeException {
        // Get the authenticated user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }
        
        String email = authentication.getName();
        // Verify user exists and get user object
        User user = userService.findByUsernameOrEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Create or retrieve Stripe customer
        String customerId = user.getStripeCustomerId();
        if (customerId == null) {
            CustomerCreateParams customerParams = CustomerCreateParams.builder()
                .setEmail(email)
                .setName(user.getUserName())
                .build();
            Customer customer = Customer.create(customerParams);
            customerId = customer.getId();
            
            // Save customer ID to user
            user.setStripeCustomerId(customerId);
            userService.saveUser(user);
        }
        
        SessionCreateParams sessionParams = SessionCreateParams.builder()
            .addPaymentMethodType(SessionCreateParams.PaymentMethodType.CARD)
            .setMode(SessionCreateParams.Mode.SUBSCRIPTION)
            .setSuccessUrl(frontendUrl + "/subscription?success=true")
            .setCancelUrl(frontendUrl + "/subscription?canceled=true")
            .setCustomer(customerId)
            .setAllowPromotionCodes(true)
            .addLineItem(
                SessionCreateParams.LineItem.builder()
                    .setQuantity(1L)
                    .setPriceData(
                        SessionCreateParams.LineItem.PriceData.builder()
                            .setCurrency("usd")
                            .setUnitAmount(5000L) // $50.00
                            .setRecurring(
                                SessionCreateParams.LineItem.PriceData.Recurring.builder()
                                    .setInterval(SessionCreateParams.LineItem.PriceData.Recurring.Interval.YEAR)
                                    .setIntervalCount(1L)
                                    .build()
                            )
                            .setProductData(
                                SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                    .setName("FeatureMe Plus (Yearly)")
                                    .setDescription("Yearly subscription for FeatureMe Plus")
                                    .addImage("https://featureme.co/SVGs/Logo%20Gradient.svg")
                                    .build()
                            )
                            .build()
                    )
                    .build()
            )
            .build();

        Session session = Session.create(sessionParams);
        Map<String, Object> result = new HashMap<>();
        result.put("id", session.getId());
        result.put("url", session.getUrl());
        return result;
    }
    
    /**
     * Webhook handler for Stripe events
     * This automatically handles subscription lifecycle events
     */
    @PostMapping("/webhook")
    public String handleWebhook(@RequestBody String payload, @RequestHeader("Stripe-Signature") String sigHeader) {
        try {
            Event event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
            
            System.out.println("Received webhook event: " + event.getType());
            
            // Handle successful payment events
            if ("invoice.payment_succeeded".equals(event.getType())) {
                Invoice invoice = (Invoice) event.getDataObjectDeserializer().getObject().orElse(null);
                
                if (invoice != null) {
                    String customerId = invoice.getCustomer();
                    
                    if (customerId != null) {
                        User user = userService.findByStripeCustomerId(customerId).orElse(null);
                        
                        if (user != null) {
                            // Update user role to USERPLUS
                            user.setRole("USERPLUS");
                            user.setSubscriptionStatus("active");
                            userService.saveUser(user);
                            
                            System.out.println("✅ User " + user.getEmail() + " upgraded to USERPLUS! Invoice ID: " + invoice.getId());
                        } else {
                            System.out.println("❌ User not found for customer ID: " + customerId);
                        }
                    }
                }
            }
            
            // Handle subscription updated events (including cancellations)
            if ("customer.subscription.updated".equals(event.getType())) {
                Subscription subscription = (Subscription) event.getDataObjectDeserializer().getObject().orElse(null);
                
                if (subscription != null) {
                    String customerId = subscription.getCustomer();
                    
                    if (customerId != null) {
                        User user = userService.findByStripeCustomerId(customerId).orElse(null);
                        
                        if (user != null) {
                            String status = subscription.getStatus();
                            Boolean cancelAtPeriodEnd = subscription.getCancelAtPeriodEnd();
                            
                            if ("canceled".equals(status)) {
                                // Subscription is fully canceled
                                user.setRole("USER");
                                user.setSubscriptionStatus("canceled");
                                System.out.println("❌ User " + user.getEmail() + " subscription canceled! Subscription ID: " + subscription.getId());
                            } else if (Boolean.TRUE.equals(cancelAtPeriodEnd)) {
                                // Subscription is set to cancel at period end
                                user.setSubscriptionStatus("cancel_at_period_end");
                                System.out.println("⚠️ User " + user.getEmail() + " subscription set to cancel at period end! Subscription ID: " + subscription.getId());
                            } else if ("active".equals(status)) {
                                // Subscription is active (might be reactivated)
                                user.setRole("USERPLUS");
                                user.setSubscriptionStatus("active");
                                System.out.println("✅ User " + user.getEmail() + " subscription reactivated! Subscription ID: " + subscription.getId());
                            }
                            
                            userService.saveUser(user);
                        }
                    }
                }
            }
            
            // Handle subscription deleted events
            if ("customer.subscription.deleted".equals(event.getType())) {
                Subscription subscription = (Subscription) event.getDataObjectDeserializer().getObject().orElse(null);
                
                if (subscription != null) {
                    String customerId = subscription.getCustomer();
                    
                    if (customerId != null) {
                        User user = userService.findByStripeCustomerId(customerId).orElse(null);
                        
                        if (user != null) {
                            // Downgrade user to free plan
                            user.setRole("USER");
                            user.setSubscriptionStatus("canceled");
                            userService.saveUser(user);
                            
                            System.out.println("❌ User " + user.getEmail() + " downgraded to free plan! Subscription ID: " + subscription.getId());
                        }
                    }
                }
            }
            
            // Handle checkout session completed events
            if ("checkout.session.completed".equals(event.getType())) {
                Session session = (Session) event.getDataObjectDeserializer().getObject().orElse(null);
                
                if (session != null && session.getMode().equals("subscription")) {
                    String customerId = session.getCustomer();
                    String subscriptionId = session.getSubscription();
                    
                    if (customerId != null && subscriptionId != null) {
                        User user = userService.findByStripeCustomerId(customerId).orElse(null);
                        
                        if (user != null) {
                            // Update user with subscription details
                            user.setRole("USERPLUS");
                            user.setSubscriptionStatus("active");
                            user.setStripeSubscriptionId(subscriptionId);
                            userService.saveUser(user);
                            
                            System.out.println("✅ User " + user.getEmail() + " subscription created! Session ID: " + session.getId());
                        }
                    }
                }
            }
            
            return "Success";
        } catch (Exception e) {
            System.err.println("❌ Webhook error: " + e.getMessage());
            e.printStackTrace();
            return "Error";
        }
    }
    
    
    
    // Endpoint to cancel user subscription
    @GetMapping("/cancel-subscription")
    public Map<String, Object> cancelSubscription() {
        try {
            // Get the authenticated user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                Map<String, Object> error = new HashMap<>();
                error.put("error", "User not authenticated");
                return error;
            }
            
            String email = authentication.getName();
            User user = userService.findByUsernameOrEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
            
            // Check if user has an active subscription
            String subscriptionId = user.getStripeSubscriptionId();
            if (subscriptionId == null || subscriptionId.isEmpty()) {
                Map<String, Object> error = new HashMap<>();
                error.put("error", "No active subscription found");
                error.put("message", "User does not have an active subscription to cancel");
                return error;
            }
            
            // Check if subscription is already set to cancel or already canceled
            String currentStatus = user.getSubscriptionStatus();
            if ("cancel_at_period_end".equals(currentStatus) || "canceled".equals(currentStatus)) {
                Map<String, Object> result = new HashMap<>();
                result.put("success", true);
                result.put("message", "Your subscription is already set to cancel at the end of the billing period.");
                result.put("user", email);
                result.put("role", user.getRole());
                result.put("subscription_status", currentStatus);
                return result;
            }
            
            try {
                // Cancel the subscription in Stripe at the end of the current billing period
                Subscription subscription = Subscription.retrieve(subscriptionId);
                com.stripe.param.SubscriptionUpdateParams params = com.stripe.param.SubscriptionUpdateParams.builder()
                    .setCancelAtPeriodEnd(true)
                    .build();
                subscription.update(params);
                
                Map<String, Object> result = new HashMap<>();
                result.put("success", true);
                result.put("message", "Subscription cancellation initiated. You'll keep your premium features until the end of your billing period.");
                result.put("user", email);
                result.put("role", "USERPLUS");
                result.put("subscription_status", "canceling");
                result.put("stripe_subscription_id", subscriptionId);
                result.put("note", "Webhook will automatically update your status when Stripe processes the cancellation");
                
                System.out.println("User " + email + " subscription cancellation initiated! Subscription ID: " + subscriptionId);
                return result;
                
            } catch (StripeException stripeException) {
                System.err.println("Stripe error during subscription cancellation: " + stripeException.getMessage());
                
                Map<String, Object> error = new HashMap<>();
                error.put("error", "Stripe cancellation failed");
                error.put("message", "There was an issue canceling the subscription with Stripe. Please contact support.");
                error.put("stripe_error", stripeException.getMessage());
                return error;
            }
            
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to cancel subscription");
            error.put("message", e.getMessage());
            return error;
        }
    }
    
    // Endpoint to check subscription status
    @GetMapping("/subscription-status")
    public Map<String, Object> getSubscriptionStatus() {
        try {
            // Get the authenticated user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                Map<String, Object> error = new HashMap<>();
                error.put("error", "User not authenticated");
                return error;
            }
            
            String email = authentication.getName();
            User user = userService.findByUsernameOrEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
            
            Map<String, Object> result = new HashMap<>();
            result.put("user", email);
            result.put("role", user.getRole());
            result.put("subscription_status", user.getSubscriptionStatus());
            result.put("stripe_customer_id", user.getStripeCustomerId());
            result.put("stripe_subscription_id", user.getStripeSubscriptionId());
            
            return result;
            
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to get subscription status");
            error.put("message", e.getMessage());
            return error;
        }
    }
    
    /**
     * Validate Apple/Google Play receipt and upgrade user to USERPLUS
     */
    @PostMapping("/validate-receipt")
    public Map<String, Object> validateReceipt(@RequestBody Map<String, Object> request) {
        try {
            // Get the authenticated user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("error", "User not authenticated");
                return error;
            }
            
            String email = authentication.getName();
            User user = userService.findByUsernameOrEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
            
            String platform = (String) request.get("platform");
            String receipt = (String) request.get("receipt");
            String productId = (String) request.get("productId");
            String transactionId = (String) request.get("transactionId");
            
            if (receipt == null || receipt.isEmpty()) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("error", "Receipt is required");
                return error;
            }
            
            Map<String, Object> validationResult = null;
            
            if ("ios".equals(platform)) {
                // Validate Apple receipt and get subscription details
                validationResult = validateAppleReceipt(receipt, productId);
            } else if ("android".equals(platform)) {
                // For Android, you would validate Google Play receipt
                // For now, we'll accept it if transactionId is provided
                // You should implement Google Play receipt validation
                if (transactionId != null && !transactionId.isEmpty()) {
                    validationResult = new HashMap<>();
                    validationResult.put("valid", true);
                } else {
                    validationResult = new HashMap<>();
                    validationResult.put("valid", false);
                    validationResult.put("error", "Transaction ID is required for Android");
                }
            } else {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("error", "Invalid platform");
                return error;
            }
            
            if (validationResult != null && Boolean.TRUE.equals(validationResult.get("valid"))) {
                // Check if subscription is expired
                boolean isExpired = false;
                if ("ios".equals(platform) && validationResult.get("expiresAt") != null) {
                    Long expiresAt = ((Number) validationResult.get("expiresAt")).longValue();
                    long currentTime = System.currentTimeMillis();
                    if (expiresAt < currentTime) {
                        isExpired = true;
                        System.out.println("⚠️ Subscription expired for user " + email + ". Expired at: " + expiresAt);
                    }
                }
                
                if (isExpired) {
                    // Subscription expired - downgrade user
                    user.setRole("USER");
                    user.setSubscriptionStatus("expired");
                    userService.saveUser(user);
                    
                    Map<String, Object> result = new HashMap<>();
                    result.put("success", false);
                    result.put("error", "Subscription has expired");
                    result.put("role", "USER");
                    System.out.println("❌ User " + email + " subscription expired. Downgraded to USER.");
                    return result;
                } else {
                    // Subscription is active - upgrade user to USERPLUS
                    user.setRole("USERPLUS");
                    user.setSubscriptionStatus("active");
                    
                    // Store Apple IAP original transaction ID (unique subscription identifier)
                    if ("ios".equals(platform)) {
                        String originalTransactionId = (String) validationResult.get("originalTransactionId");
                        if (originalTransactionId != null) {
                            user.setAppleOriginalTransactionId(originalTransactionId);
                        }
                    }
                    
                    userService.saveUser(user);
                    
                    Map<String, Object> result = new HashMap<>();
                    result.put("success", true);
                    result.put("message", "Subscription activated successfully");
                    result.put("role", "USERPLUS");
                    System.out.println("✅ User " + email + " upgraded to USERPLUS via IAP! Product: " + productId);
                    if ("ios".equals(platform) && validationResult.get("originalTransactionId") != null) {
                        System.out.println("   Original Transaction ID: " + validationResult.get("originalTransactionId"));
                    }
                    return result;
                }
            } else {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                String errorMsg = validationResult != null ? 
                    (String) validationResult.get("error") : "Receipt validation failed";
                error.put("error", errorMsg);
                return error;
            }
            
        } catch (Exception e) {
            System.err.println("❌ Receipt validation error: " + e.getMessage());
            e.printStackTrace();
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", "Receipt validation failed: " + e.getMessage());
            return error;
        }
    }
    
    /**
     * Validate Apple receipt with Apple's servers
     * Returns a Map with validation result and subscription details
     */
    private Map<String, Object> validateAppleReceipt(String receipt, String productId) {
        Map<String, Object> result = new HashMap<>();
        try {
            RestTemplate restTemplate = new RestTemplate();
            ObjectMapper objectMapper = new ObjectMapper();
            
            // Prepare request body
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("receipt-data", receipt);
            if (appleSharedSecret != null && !appleSharedSecret.isEmpty()) {
                requestBody.put("password", appleSharedSecret);
            }
            requestBody.put("exclude-old-transactions", true);
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("Content-Type", "application/json");
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            
            // Try production first
            ResponseEntity<String> response = restTemplate.exchange(
                APPLE_PRODUCTION_URL,
                HttpMethod.POST,
                entity,
                String.class
            );
            
            JsonNode responseJson = objectMapper.readTree(response.getBody());
            int status = responseJson.get("status").asInt();
            
            // Status 21007 means receipt is from sandbox, try sandbox URL
            if (status == 21007) {
                response = restTemplate.exchange(
                    APPLE_SANDBOX_URL,
                    HttpMethod.POST,
                    entity,
                    String.class
                );
                responseJson = objectMapper.readTree(response.getBody());
                status = responseJson.get("status").asInt();
            }
            
            // Status 0 means receipt is valid
            if (status == 0) {
                JsonNode receiptNode = responseJson.get("receipt");
                JsonNode latestReceiptInfo = responseJson.get("latest_receipt_info");
                
                // Use latest_receipt_info if available (for subscriptions), otherwise use receipt.in_app
                JsonNode transactionsToCheck = latestReceiptInfo != null && latestReceiptInfo.isArray() 
                    ? latestReceiptInfo 
                    : (receiptNode != null ? receiptNode.get("in_app") : null);
                
                if (transactionsToCheck != null && transactionsToCheck.isArray()) {
                    // Find the most recent transaction for the product
                    JsonNode matchingTransaction = null;
                    long latestPurchaseDate = 0;
                    
                    for (JsonNode transaction : transactionsToCheck) {
                        String receiptProductId = transaction.has("product_id") 
                            ? transaction.get("product_id").asText() 
                            : null;
                        
                        // Check if product ID matches (or if no productId specified, accept any)
                        if (productId == null || (receiptProductId != null && receiptProductId.equals(productId))) {
                            // Get purchase date to find the latest transaction
                            long purchaseDate = transaction.has("purchase_date_ms") 
                                ? transaction.get("purchase_date_ms").asLong() 
                                : 0;
                            
                            if (purchaseDate > latestPurchaseDate) {
                                latestPurchaseDate = purchaseDate;
                                matchingTransaction = transaction;
                            }
                        }
                    }
                    
                    if (matchingTransaction != null) {
                        // Extract subscription details
                        result.put("valid", true);
                        
                        // Original Transaction ID - stays the same across renewals
                        if (matchingTransaction.has("original_transaction_id")) {
                            result.put("originalTransactionId", 
                                matchingTransaction.get("original_transaction_id").asText());
                        }
                        
                        // Current Transaction ID - changes with each renewal
                        if (matchingTransaction.has("transaction_id")) {
                            result.put("transactionId", 
                                matchingTransaction.get("transaction_id").asText());
                        }
                        
                        // Product ID
                        if (matchingTransaction.has("product_id")) {
                            result.put("productId", 
                                matchingTransaction.get("product_id").asText());
                        }
                        
                        // Expiration date (for subscriptions)
                        if (matchingTransaction.has("expires_date_ms")) {
                            result.put("expiresAt", 
                                matchingTransaction.get("expires_date_ms").asLong());
                        } else if (matchingTransaction.has("expires_date")) {
                            // If expires_date is in ISO format, convert it
                            // For now, we'll just note that it exists
                            result.put("hasExpiration", true);
                        }
                        
                        return result;
                    }
                }
                
                // If we get here, receipt is valid but we couldn't find matching product
                result.put("valid", false);
                result.put("error", "Product ID not found in receipt");
                return result;
            } else {
                System.err.println("Apple receipt validation failed with status: " + status);
                result.put("valid", false);
                result.put("error", "Apple receipt validation failed with status: " + status);
                return result;
            }
            
        } catch (Exception e) {
            System.err.println("Error validating Apple receipt: " + e.getMessage());
            e.printStackTrace();
            result.put("valid", false);
            result.put("error", "Error validating receipt: " + e.getMessage());
            return result;
        }
    }

}
