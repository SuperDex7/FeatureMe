package Feat.FeatureMe.Service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import Feat.FeatureMe.Entity.User;
import Feat.FeatureMe.Service.SubscriptionAccess.Access;
import Feat.FeatureMe.Service.SubscriptionAccess.Store;

@DisplayName("Who gets Plus")
class SubscriptionAccessTest {

    private MongoTemplate mongo;
    private SubscriptionAccess access;

    @BeforeEach
    void setUp() {
        mongo = mock(MongoTemplate.class);
        access = new SubscriptionAccess(mongo);
        User alice = new User();
        alice.setId("u1");
        when(mongo.findAndModify(any(Query.class), any(Update.class), any(FindAndModifyOptions.class), eq(User.class)))
            .thenReturn(alice);
    }

    private String[] roleUpdate() {
        ArgumentCaptor<Query> query = ArgumentCaptor.forClass(Query.class);
        ArgumentCaptor<Update> update = ArgumentCaptor.forClass(Update.class);
        verify(mongo).updateFirst(query.capture(), update.capture(), eq(User.class));
        return new String[] { query.getValue().getQueryObject().toJson(), update.getValue().getUpdateObject().toJson() };
    }

    private String statusUpdate() {
        ArgumentCaptor<Update> update = ArgumentCaptor.forClass(Update.class);
        verify(mongo).findAndModify(any(Query.class), update.capture(), any(FindAndModifyOptions.class), eq(User.class));
        return update.getValue().getUpdateObject().toJson();
    }

    @Test
    @DisplayName("each store writes its own status field")
    void separateStatusFields() {
        access.apply(Criteria.where("stripeCustomerId").is("cus_1"), Store.STRIPE, "active", Access.KEEP, null);
        assertThat(statusUpdate()).contains("\"subscriptionStatus\": \"active\"").doesNotContain("apple");

        mongo = mock(MongoTemplate.class);
        access = new SubscriptionAccess(mongo);
        access.apply(Criteria.where("userName").is("a"), Store.APPLE, "expired", Access.KEEP, null);
        assertThat(statusUpdate()).contains("\"appleSubscriptionStatus\": \"expired\"").doesNotContain("\"subscriptionStatus\"");
    }

    @Test
    @DisplayName("granting Plus never changes a banned (or any non-subscriber) account's role")
    void grantSkipsOtherRoles() {
        access.apply(Criteria.where("stripeCustomerId").is("cus_1"), Store.STRIPE, "active", Access.GRANT, null);

        String[] update = roleUpdate();
        assertThat(update[0]).contains("\"role\": {\"$in\": [\"USER\", \"USERPLUS\"]}").contains("u1");
        assertThat(update[1]).contains("\"role\": \"USERPLUS\"");
    }

    @Test
    @DisplayName("Stripe ending only removes Plus if the App Store has no active subscription")
    void stripeRemoveChecksApple() {
        access.apply(Criteria.where("stripeCustomerId").is("cus_1"), Store.STRIPE, "canceled", Access.REMOVE, null);

        String[] update = roleUpdate();
        assertThat(update[0]).contains("\"role\": \"USERPLUS\"")
            .contains("\"appleSubscriptionStatus\": {\"$nin\": [\"active\", \"cancel_at_period_end\", \"grace_period\"]}");
        assertThat(update[1]).contains("\"role\": \"USER\"");
    }

    @Test
    @DisplayName("the App Store ending only removes Plus if Stripe has no active subscription")
    void appleRemoveChecksStripe() {
        access.apply(Criteria.where("appleOriginalTransactionId").is("1000"), Store.APPLE, "expired", Access.REMOVE, null);

        assertThat(roleUpdate()[0])
            .contains("\"subscriptionStatus\": {\"$nin\": [\"active\", \"trialing\", \"cancel_at_period_end\"]}");
    }

    @Test
    @DisplayName("KEEP leaves the role alone, and an unknown account changes nothing")
    void keepAndMissing() {
        assertThat(access.apply(Criteria.where("userName").is("a"), Store.APPLE, "grace_period", Access.KEEP, null)).isTrue();
        verify(mongo, never()).updateFirst(any(Query.class), any(Update.class), eq(User.class));

        when(mongo.findAndModify(any(Query.class), any(Update.class), any(FindAndModifyOptions.class), eq(User.class)))
            .thenReturn(null);
        assertThat(access.apply(Criteria.where("userName").is("nobody"), Store.STRIPE, "active", Access.GRANT, null)).isFalse();
        verify(mongo, never()).updateFirst(any(Query.class), any(Update.class), eq(User.class));
    }
}
