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


@RestController
@RequestMapping("/api/payment")
public class StripeController {
    
    private final UserService userService;
    
    @Value("${stripe.webhook.secret}")
    private String webhookSecret;

    public StripeController(UserService userService){
        this.userService = userService;
    }

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
            .setSuccessUrl("http://localhost:5173/subscription?success=true")
            .setCancelUrl("http://localhost:5173/subscription?canceled=true")
            .setCustomer(customerId)
            
            .addLineItem(
                SessionCreateParams.LineItem.builder()
                    .setQuantity(1L)
                    .setPriceData(
                        SessionCreateParams.LineItem.PriceData.builder()
                            .setCurrency("usd")
                            .setUnitAmount(500L) // $5.00
                            .setRecurring(
                                SessionCreateParams.LineItem.PriceData.Recurring.builder()
                                    .setInterval(SessionCreateParams.LineItem.PriceData.Recurring.Interval.DAY)
                                    .setIntervalCount(1L)
                                    .build()
                            )
                            .setProductData(
                                SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                    .setName("FeatureMe Plus")
                                    .setDescription("Daily subscription for FeatureMe Plus")
                                    .addImage("https://media.istockphoto.com/id/1076582642/vector/eighth-note-drawn-by-hand-with-rough-brush-music-icon-symbol-logo-sketch-graffiti-grunge.jpg?s=612x612&w=0&k=20&c=XLL1sec-tAcWXdYxWIGjI2hG7ffolmgjsGCkS2CtZtk=")
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
            .setSuccessUrl("http://localhost:5173/subscription?success=true")
            .setCancelUrl("http://localhost:5173/subscription?canceled=true")
            .setCustomer(customerId)
            
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
                                    .addImage("https://media.istockphoto.com/id/1076582642/vector/eighth-note-drawn-by-hand-with-rough-brush-music-icon-symbol-logo-sketch-graffiti-grunge.jpg?s=612x612&w=0&k=20&c=XLL1sec-tAcWXdYxWIGjI2hG7ffolmgjsGCkS2CtZtk=")
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
                                user.setRole("free");
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
                            user.setRole("free");
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

}
