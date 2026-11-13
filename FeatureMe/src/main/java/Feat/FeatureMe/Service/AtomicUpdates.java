package Feat.FeatureMe.Service;

import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;

import Feat.FeatureMe.Entity.Posts;
import Feat.FeatureMe.Entity.User;

/**
 * Single-field updates done inside MongoDB. Loading a whole user or post,
 * changing a count and saving it back loses updates when two people act at
 * once (both read 10, both write 11). These change only the one field.
 */
@Component
public class AtomicUpdates {

    private final MongoTemplate mongoTemplate;

    public AtomicUpdates(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    private static Query post(String postId) {
        return new Query(Criteria.where("_id").is(postId));
    }

    private static Query user(String userName) {
        return new Query(Criteria.where("userName").is(userName));
    }

    /** Adds delta to a post counter (totalLikes, totalComments, ...), never below zero */
    public void incPost(String postId, String field, int delta) {
        mongoTemplate.updateFirst(post(postId), new Update().inc(field, delta), Posts.class);
        if (delta < 0) floorAtZero(post(postId), field, Posts.class);
    }

    public void setPost(String postId, String field, Object value) {
        mongoTemplate.updateFirst(post(postId), new Update().set(field, value), Posts.class);
    }

    /** Adds delta to a user counter (followersCount, followingCount), never below zero */
    public void incUser(String userName, String field, int delta) {
        mongoTemplate.updateFirst(user(userName), new Update().inc(field, delta), User.class);
        if (delta < 0) floorAtZero(user(userName), field, User.class);
    }

    /** Adds a value to one of a user's lists if it isn't there yet */
    public void addToUserList(String userName, String field, String value) {
        mongoTemplate.updateFirst(user(userName), new Update().addToSet(field, value), User.class);
    }

    public void removeFromUserList(String userName, String field, String value) {
        mongoTemplate.updateFirst(user(userName), new Update().pull(field, value), User.class);
    }

    private void floorAtZero(Query target, String field, Class<?> type) {
        Query negative = Query.of(target).addCriteria(Criteria.where(field).lt(0));
        mongoTemplate.updateFirst(negative, new Update().set(field, 0), type);
    }
}
