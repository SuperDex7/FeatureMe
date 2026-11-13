package Feat.FeatureMe.Controller;

import Feat.FeatureMe.config.AuthUtils;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.stripe.Stripe;
import com.stripe.exception.EventDataObjectDeserializationException;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.EventDataObjectDeserializer;
import com.stripe.model.StripeObject;
import java.util.Optional;
import com.stripe.model.Event;
import com.stripe.model.Invoice;
import com.stripe.net.Webhook;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import com.stripe.model.Customer;
import com.stripe.model.Subscription;
import com.stripe.param.CustomerCreateParams;

import Feat.FeatureMe.Entity.User;
import Feat.FeatureMe.Service.AppleSubscriptionService;
import Feat.FeatureMe.Service.SubscriptionAccess;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Update;
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
    private final AppleSubscriptionService appleSubscriptionService;
    private final SubscriptionAccess subscriptionAccess;
    
    @Value("${stripe.webhook.secret}")
    private String webhookSecret;
    
    @Value("${apple.shared.secret:}")
    private String appleSharedSecret;
    
    private static final String APPLE_SANDBOX_URL = "https://sandbox.itunes.apple.com/verifyReceipt";
    private static final String APPLE_PRODUCTION_URL = "https://buy.itunes.apple.com/verifyReceipt";

    //@Value("${https://featureme.co}")
    //private String frontendUrl;

    public StripeController(UserService userService, AppleSubscriptionService appleSubscriptionService,
            SubscriptionAccess subscriptionAccess){
        this.userService = userService;
        this.appleSubscriptionService = appleSubscriptionService;
        this.subscriptionAccess = subscriptionAccess;
    }
    private String frontendUrl = "https://featureme.co";
    
    @PostMapping("/create-checkout-session")
    public Map<String, Object> createCheckoutSession() throws StripeException {
        // Get the authenticated user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (!AuthUtils.isLoggedIn(authentication)) {
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
            .addAllowedPaymentMethodType(SessionCreateParams.AllowedPaymentMethodType.CARD)
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
        if (!AuthUtils.isLoggedIn(authentication)) {
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
            .addAllowedPaymentMethodType(SessionCreateParams.AllowedPaymentMethodType.CARD)
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
    public ResponseEntity<String> handleWebhook(@RequestBody String payload, @RequestHeader("Stripe-Signature") String sigHeader) {
        Event event;
        try {
            event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
        } catch (SignatureVerificationException e) {
            // Not from Stripe (or the wrong secret): reject it
            System.err.println("❌ Webhook signature check failed: " + e.getMessage());
            return ResponseEntity.badRequest().body("Invalid signature");
        }
        try {
            
            System.out.println("Received webhook event: " + event.getType());

            switch (event.getType()) {
                case "invoice.payment_succeeded" -> {
                    Invoice invoice = (Invoice) eventObject(event);
                    if (invoice != null) {
                        stripeUpdate(invoice.getCustomer(), "active", SubscriptionAccess.Access.GRANT, null, "payment succeeded " + invoice.getId());
                    }
                }
                case "customer.subscription.updated" -> {
                    Subscription subscription = (Subscription) eventObject(event);
                    if (subscription != null) {
                        String status = subscription.getStatus();
                        if ("canceled".equals(status) || "unpaid".equals(status) || "incomplete_expired".equals(status)) {
                            stripeUpdate(subscription.getCustomer(), status, SubscriptionAccess.Access.REMOVE, null, "subscription " + status);
                        } else if (Boolean.TRUE.equals(subscription.getCancelAtPeriodEnd())) {
                            // Still paid until the end of the period
                            stripeUpdate(subscription.getCustomer(), "cancel_at_period_end", SubscriptionAccess.Access.KEEP, null, "set to cancel at period end");
                        } else if ("active".equals(status) || "trialing".equals(status)) {
                            stripeUpdate(subscription.getCustomer(), status, SubscriptionAccess.Access.GRANT, null, "subscription " + status);
                        }
                    }
                }
                case "customer.subscription.deleted" -> {
                    Subscription subscription = (Subscription) eventObject(event);
                    if (subscription != null) {
                        stripeUpdate(subscription.getCustomer(), "canceled", SubscriptionAccess.Access.REMOVE, null, "subscription deleted");
                    }
                }
                case "checkout.session.completed" -> {
                    Session session = (Session) eventObject(event);
                    if (session != null && "subscription".equals(session.getMode()) && session.getSubscription() != null) {
                        stripeUpdate(session.getCustomer(), "active", SubscriptionAccess.Access.GRANT,
                            new Update().set("stripeSubscriptionId", session.getSubscription()), "checkout completed " + session.getId());
                    }
                }
                default -> { }
            }

            return ResponseEntity.ok("Success");
        } catch (Exception e) {
            // A 500 makes Stripe retry the event later instead of dropping it
            System.err.println("❌ Webhook error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error");
        }
    }


    /** Sets the Stripe status (and any extra fields) on the customer's account and gives or takes away Plus */
    private void stripeUpdate(String customerId, String status, SubscriptionAccess.Access access, Update extra, String what) {
        if (customerId == null) return;
        boolean found = subscriptionAccess.apply(Criteria.where("stripeCustomerId").is(customerId),
            SubscriptionAccess.Store.STRIPE, status, access, extra);
        System.out.println(found
            ? "Stripe: " + what + " for customer " + customerId + " -> " + status + " (" + access + ")"
            : "❌ Stripe: no account for customer " + customerId + " (" + what + ")");
    }

    /**
     * The event's object. stripe-java only deserializes events sent in its own
     * API release (see Stripe.API_VERSION); events from a webhook endpoint
     * still on an older version would otherwise come back empty and be
     * silently skipped. The fields read here (customer, status,
     * cancel_at_period_end, mode, subscription) are the same in both, so fall
     * back to deserializing anyway and log the mismatch.
     */
    static StripeObject eventObject(Event event) throws EventDataObjectDeserializationException {
        EventDataObjectDeserializer deserializer = event.getDataObjectDeserializer();
        Optional<StripeObject> object = deserializer.getObject();
        if (object.isPresent()) {
            return object.get();
        }
        System.err.println("⚠️ Stripe event " + event.getId() + " uses API version " + event.getApiVersion()
            + " but stripe-java expects " + Stripe.API_VERSION
            + ". Update the webhook endpoint's API version in the Stripe dashboard.");
        return deserializer.deserializeUnsafe();
    }
    
    
    
    // Endpoint to cancel user subscription
    @GetMapping("/cancel-subscription")
    public Map<String, Object> cancelSubscription() {
        try {
            // Get the authenticated user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (!AuthUtils.isLoggedIn(authentication)) {
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
                return error;
            }
            
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to cancel subscription");
            System.err.println("Payment endpoint error: " + e.getMessage());
            e.printStackTrace();
            error.put("message", "Something went wrong. Please try again or contact support.");
            return error;
        }
    }
    
    // Endpoint to check subscription status
    @GetMapping("/subscription-status")
    public Map<String, Object> getSubscriptionStatus() {
        try {
            // Get the authenticated user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (!AuthUtils.isLoggedIn(authentication)) {
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
            result.put("apple_subscription_status", user.getAppleSubscriptionStatus());
            result.put("stripe_customer_id", user.getStripeCustomerId());
            result.put("stripe_subscription_id", user.getStripeSubscriptionId());
            
            return result;
            
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to get subscription status");
            System.err.println("Payment endpoint error: " + e.getMessage());
            e.printStackTrace();
            error.put("message", "Something went wrong. Please try again or contact support.");
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
            if (!AuthUtils.isLoggedIn(authentication)) {
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
            
            if (receipt == null || receipt.isEmpty()) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("error", "Receipt is required");
                return error;
            }
            
            if ("ios".equals(platform)) {
                return applyAppleReceipt(user, receipt, productId);
            }

            // Android buys Plus through the web (Stripe) checkout; there's no
            // Google Play subscription to check, so never grant Plus here
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", "android".equals(platform)
                ? "In-app purchases aren't available on Android. Subscribe on featureme.co instead."
                : "Invalid platform");
            return error;

        } catch (Exception e) {
            System.err.println("❌ Receipt validation error: " + e.getMessage());
            e.printStackTrace();
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", "Receipt validation failed");
            return error;
        }
    }
    
    /**
     * iOS: check the receipt with Apple, then give Plus while the subscription
     * is current. A refunded purchase, or one without an expiry date, doesn't
     * count, and one App Store subscription can't give Plus to several accounts.
     */
    private Map<String, Object> applyAppleReceipt(User user, String receipt, String productId) {
        Map<String, Object> result = new HashMap<>();
        Map<String, Object> validation = validateAppleReceipt(receipt, productId);
        if (!Boolean.TRUE.equals(validation.get("valid"))) {
            result.put("success", false);
            result.put("error", validation.get("error") != null ? validation.get("error") : "Receipt validation failed");
            return result;
        }
        if (!(validation.get("expiresAt") instanceof Number expiresAt)) {
            result.put("success", false);
            result.put("error", "This purchase isn't a FeatureMe Plus subscription");
            return result;
        }
        boolean refunded = Boolean.TRUE.equals(validation.get("refunded"));
        boolean current = !refunded && expiresAt.longValue() > System.currentTimeMillis();
        String originalTransactionId = (String) validation.get("originalTransactionId");

        AppleSubscriptionService.LinkOutcome outcome =
            appleSubscriptionService.applyPurchase(user.getUserName(), originalTransactionId, current);
        if (outcome == AppleSubscriptionService.LinkOutcome.TAKEN) {
            System.out.println("⚠️ App Store subscription " + originalTransactionId + " is already linked to another account; not applied to " + user.getUserName());
            result.put("success", false);
            result.put("error", "This App Store subscription is already linked to another FeatureMe account.");
            return result;
        }
        if (!current) {
            result.put("success", false);
            result.put("error", refunded ? "This subscription was refunded" : "Subscription has expired");
            result.put("role", "USER");
            return result;
        }
        result.put("success", true);
        result.put("message", "Subscription activated successfully");
        result.put("role", "USERPLUS");
        System.out.println("✅ " + user.getUserName() + " has Plus via the App Store (" + productId + ", " + originalTransactionId + ")");
        return result;
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
                        
                        // Refunded purchases carry a cancellation date
                        if (matchingTransaction.hasNonNull("cancellation_date_ms")) {
                            result.put("refunded", true);
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
            result.put("error", "Error validating receipt");
            return result;
        }
    }
    
    /**
     * App Store Server Notifications v2 (renewals, cancellations, refunds, ...).
     * Only notifications Apple signed for this app are applied; see AppleSubscriptionService.
     * 400 for anything that isn't one, 503/500 so Apple retries when we couldn't process it.
     */
    @PostMapping("/apple-webhook")
    public ResponseEntity<Map<String, Object>> handleAppleWebhook(@RequestBody(required = false) String body) {
        Map<String, Object> response = new HashMap<>();
        try {
            AppleSubscriptionService.Result result =
                appleSubscriptionService.handleNotification(body, System.currentTimeMillis());
            System.out.println("📱 App Store notification " + result.outcome() + ": " + result.message());
            response.put("success", result.outcome() != AppleSubscriptionService.Outcome.REJECTED);
            response.put("message", result.message());
            return result.outcome() == AppleSubscriptionService.Outcome.REJECTED
                ? ResponseEntity.badRequest().body(response)
                : ResponseEntity.ok(response);
        } catch (AppleSubscriptionService.RetryLaterException e) {
            System.err.println("App Store notification not processed, Apple will retry: " + e.getMessage());
            response.put("success", false);
            response.put("error", "Try again later");
            return ResponseEntity.status(503).body(response);
        } catch (Exception e) {
            System.err.println("❌ Apple webhook error: " + e.getMessage());
            e.printStackTrace();
            response.put("success", false);
            response.put("error", "Error processing notification");
            return ResponseEntity.status(500).body(response);
        }
    }
}
