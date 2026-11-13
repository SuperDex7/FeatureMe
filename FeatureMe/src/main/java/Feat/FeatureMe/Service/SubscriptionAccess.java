package Feat.FeatureMe.Service;

import java.util.List;

import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;

import Feat.FeatureMe.Entity.User;

/**
 * Who gets Plus. Stripe (web) and the App Store (iOS) each keep their own
 * status on the account, and Plus is only taken away when neither has an
 * active subscription, so one store ending doesn't cancel what someone pays
 * for through the other.
 *
 * Only USER and USERPLUS are ever changed: subscription events never touch
 * other roles (e.g. BANNED stays banned). Plus given by hand is left alone
 * unless that account's own subscription ends.
 *
 * All changes are single-field updates inside MongoDB, never whole-user saves.
 */
@Component
public class SubscriptionAccess {

    public enum Store {
        /** Status values as Stripe reports them (plus cancel_at_period_end) */
        STRIPE("subscriptionStatus", List.of("active", "trialing", "cancel_at_period_end")),
        /** Set by AppleSubscriptionService */
        APPLE("appleSubscriptionStatus", List.of("active", "cancel_at_period_end", "grace_period"));

        final String statusField;
        /** Statuses that mean "still paid up" */
        final List<String> plusStatuses;

        Store(String statusField, List<String> plusStatuses) {
            this.statusField = statusField;
            this.plusStatuses = plusStatuses;
        }

        Store other() {
            return this == STRIPE ? APPLE : STRIPE;
        }
    }

    /** What the event means for Plus */
    public enum Access { GRANT, REMOVE, KEEP }

    static final List<String> SUBSCRIBER_ROLES = List.of("USER", "USERPLUS");

    private final MongoTemplate mongoTemplate;

    public SubscriptionAccess(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    /**
     * Records one store's status on the matching account (plus any extra
     * fields), then gives or takes away Plus.
     *
     * @param account which account, including any guard conditions (only
     *                applied if it still matches when the update runs)
     * @return false when no account matched
     */
    public boolean apply(Criteria account, Store store, String status, Access access, Update extra) {
        Update update = extra != null ? extra : new Update();
        update.set(store.statusField, status);
        User updated = mongoTemplate.findAndModify(new Query(account), update,
            FindAndModifyOptions.options().returnNew(true), User.class);
        if (updated == null) return false;

        Criteria self = Criteria.where("_id").is(updated.getId());
        if (access == Access.GRANT) {
            mongoTemplate.updateFirst(new Query(new Criteria().andOperator(self,
                Criteria.where("role").in(SUBSCRIBER_ROLES))), new Update().set("role", "USERPLUS"), User.class);
        } else if (access == Access.REMOVE) {
            Store other = store.other();
            // $nin also matches accounts that never had the other store
            mongoTemplate.updateFirst(new Query(new Criteria().andOperator(self,
                Criteria.where("role").is("USERPLUS"),
                Criteria.where(other.statusField).nin(other.plusStatuses))), new Update().set("role", "USER"), User.class);
        }
        return true;
    }
}
