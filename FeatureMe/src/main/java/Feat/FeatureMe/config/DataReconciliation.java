package Feat.FeatureMe.config;

import static org.springframework.data.mongodb.core.aggregation.Aggregation.group;
import static org.springframework.data.mongodb.core.aggregation.Aggregation.match;
import static org.springframework.data.mongodb.core.aggregation.Aggregation.newAggregation;
import static org.springframework.data.mongodb.core.aggregation.Aggregation.sort;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.bson.Document;
import org.springframework.beans.factory.SmartInitializingSingleton;
import org.springframework.core.annotation.Order;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.BulkOperations;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;

/**
 * Startup repair of counts and lists that drifted from their source data:
 * counters used to be updated by loading and saving whole documents (losing
 * concurrent updates), and profile edits reset follower counts to 0.
 *
 * - posts.totalLikes / totalComments / totalDownloads from post_likes,
 *   post_comments and post_downloads (totalViews is left alone: older view
 *   records were deleted by a TTL index, so the counter is the better number)
 * - user.followersCount / followingCount from active follows in user_relations
 * - user.likedPosts rebuilt from post_likes, oldest like first (as before)
 * - user.comments removed (an unused copy of post_comments)
 *
 * Runs before the web server takes requests; only writes documents whose
 * values actually differ, so running it again is cheap and changes nothing.
 */
@Component
@Order(20)
public class DataReconciliation implements SmartInitializingSingleton {

    private final MongoTemplate mongoTemplate;

    public DataReconciliation(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public void afterSingletonsInstantiated() {
        try {
            int posts = reconcilePostCounts();
            int users = reconcileUsers();
            if (posts + users > 0) {
                System.out.println("Data repair: fixed counts on " + posts + " posts and " + users + " users");
            }
        } catch (Exception e) {
            System.err.println("Data repair failed (will retry next start): " + e.getMessage());
        }
    }

    /** {groupKey -> count} for a collection, optionally filtered */
    Map<String, Integer> countBy(String collection, String field, Criteria filter) {
        List<org.springframework.data.mongodb.core.aggregation.AggregationOperation> ops = new ArrayList<>();
        if (filter != null) ops.add(match(filter));
        ops.add(group(field).count().as("n"));
        Map<String, Integer> counts = new HashMap<>();
        for (Document row : mongoTemplate.aggregate(newAggregation(ops), collection, Document.class)) {
            Object key = row.get("_id");
            if (key != null) counts.put(String.valueOf(key), ((Number) row.get("n")).intValue());
        }
        return counts;
    }

    int reconcilePostCounts() {
        Map<String, Integer> likes = countBy("post_likes", "postId", null);
        Map<String, Integer> comments = countBy("post_comments", "postId", null);
        Map<String, Integer> downloads = countBy("post_downloads", "postId", null);

        Query all = new Query();
        all.fields().include("_id").include("totalLikes").include("totalComments").include("totalDownloads");
        BulkOperations bulk = mongoTemplate.bulkOps(BulkOperations.BulkMode.UNORDERED, "posts");
        int changed = 0;
        for (Document post : mongoTemplate.find(all, Document.class, "posts")) {
            String id = String.valueOf(post.get("_id"));
            Update update = new Update();
            boolean differs = false;
            differs |= setIfDifferent(update, post, "totalLikes", likes.getOrDefault(id, 0));
            differs |= setIfDifferent(update, post, "totalComments", comments.getOrDefault(id, 0));
            differs |= setIfDifferent(update, post, "totalDownloads", downloads.getOrDefault(id, 0));
            if (differs) {
                bulk.updateOne(new Query(Criteria.where("_id").is(post.get("_id"))), update);
                changed++;
            }
        }
        if (changed > 0) bulk.execute();
        return changed;
    }

    int reconcileUsers() {
        Criteria activeFollows = Criteria.where("relationType").is("FOLLOW").and("status").is("ACTIVE");
        Map<String, Integer> followers = countBy("user_relations", "followingUserName", activeFollows);
        Map<String, Integer> following = countBy("user_relations", "followerUserName", activeFollows);

        // Liked post ids per user, oldest like first (new likes are appended)
        Aggregation likedAgg = newAggregation(
            sort(Sort.Direction.ASC, "likedAt"),
            group("userName").push("postId").as("postIds"));
        Map<String, List<String>> liked = new HashMap<>();
        for (Document row : mongoTemplate.aggregate(likedAgg, "post_likes", Document.class)) {
            if (row.get("_id") == null) continue;
            @SuppressWarnings("unchecked")
            List<Object> ids = (List<Object>) row.get("postIds");
            List<String> unique = new ArrayList<>();
            for (Object id : ids) {
                String s = String.valueOf(id);
                if (!unique.contains(s)) unique.add(s);
            }
            liked.put(String.valueOf(row.get("_id")), unique);
        }

        Query all = new Query();
        all.fields().include("_id").include("userName").include("followersCount").include("followingCount")
            .include("likedPosts").include("comments");
        BulkOperations bulk = mongoTemplate.bulkOps(BulkOperations.BulkMode.UNORDERED, "user");
        int changed = 0;
        for (Document user : mongoTemplate.find(all, Document.class, "user")) {
            String name = user.getString("userName");
            if (name == null) continue;
            Update update = new Update();
            boolean differs = false;
            differs |= setIfDifferent(update, user, "followersCount", followers.getOrDefault(name, 0));
            differs |= setIfDifferent(update, user, "followingCount", following.getOrDefault(name, 0));
            List<String> likedIds = liked.getOrDefault(name, List.of());
            if (!Objects.equals(asStrings(user.get("likedPosts")), likedIds)) {
                update.set("likedPosts", likedIds);
                differs = true;
            }
            if (user.containsKey("comments")) {
                update.unset("comments");
                differs = true;
            }
            if (differs) {
                bulk.updateOne(new Query(Criteria.where("_id").is(user.get("_id"))), update);
                changed++;
            }
        }
        if (changed > 0) bulk.execute();
        return changed;
    }

    private static boolean setIfDifferent(Update update, Document doc, String field, int expected) {
        Object current = doc.get(field);
        int value = current instanceof Number n ? n.intValue() : -1;
        if (value != expected) {
            update.set(field, expected);
            return true;
        }
        return false;
    }

    private static List<String> asStrings(Object list) {
        List<String> out = new ArrayList<>();
        if (list instanceof List<?> l) for (Object o : l) out.add(String.valueOf(o));
        return out;
    }
}
