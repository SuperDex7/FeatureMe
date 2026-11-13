package Feat.FeatureMe.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.bson.Document;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.mongodb.core.BulkOperations;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

@DisplayName("DataReconciliation")
class DataReconciliationTest {

    private final MongoTemplate mongo = mock(MongoTemplate.class);
    private final BulkOperations bulk = mock(BulkOperations.class);
    private final DataReconciliation repair = new DataReconciliation(mongo);

    private void aggregateReturns(String collection, List<Document> rows) {
        when(mongo.aggregate(any(Aggregation.class), eq(collection), eq(Document.class)))
            .thenReturn(new AggregationResults<>(rows, new Document()));
    }

    @Test
    @DisplayName("post counts are set from the likes, comments and downloads collections; correct ones are left alone")
    void fixesPostCounts() {
        ObjectId drifted = new ObjectId();
        ObjectId correct = new ObjectId();
        aggregateReturns("post_likes", List.of(new Document("_id", drifted.toHexString()).append("n", 5), new Document("_id", correct.toHexString()).append("n", 2)));
        aggregateReturns("post_comments", List.of());
        aggregateReturns("post_downloads", List.of());
        when(mongo.find(any(Query.class), eq(Document.class), eq("posts"))).thenReturn(List.of(
            new Document("_id", drifted).append("totalLikes", 9).append("totalComments", 0).append("totalDownloads", 0),
            new Document("_id", correct).append("totalLikes", 2).append("totalComments", 0).append("totalDownloads", 0)));
        when(mongo.bulkOps(any(BulkOperations.BulkMode.class), eq("posts"))).thenReturn(bulk);

        assertThat(repair.reconcilePostCounts()).isEqualTo(1);

        ArgumentCaptor<Update> update = ArgumentCaptor.forClass(Update.class);
        verify(bulk, times(1)).updateOne(any(Query.class), update.capture());
        assertThat(update.getValue().getUpdateObject().toJson()).contains("\"totalLikes\": 5");
        verify(bulk).execute();
    }

    @Test
    @DisplayName("follower counts come from active follows, liked lists from likes, and the comments copy is removed")
    void fixesUsers() {
        aggregateReturns("user_relations", List.of(new Document("_id", "alice").append("n", 3)));
        aggregateReturns("post_likes", List.of(new Document("_id", "alice").append("postIds", List.of("p1", "p2", "p1"))));
        when(mongo.find(any(Query.class), eq(Document.class), eq("user"))).thenReturn(List.of(
            new Document("_id", new ObjectId()).append("userName", "alice").append("followersCount", 0).append("followingCount", 3)
                .append("likedPosts", List.of("p9")).append("comments", List.of())));
        when(mongo.bulkOps(any(BulkOperations.BulkMode.class), eq("user"))).thenReturn(bulk);

        assertThat(repair.reconcileUsers()).isEqualTo(1);

        ArgumentCaptor<Update> update = ArgumentCaptor.forClass(Update.class);
        verify(bulk).updateOne(any(Query.class), update.capture());
        String json = update.getValue().getUpdateObject().toJson();
        assertThat(json).contains("\"followersCount\": 3").contains("\"likedPosts\": [\"p1\", \"p2\"]").contains("$unset");
    }

    @Test
    @DisplayName("nothing to fix: no writes")
    void noChanges() {
        aggregateReturns("post_likes", List.of());
        aggregateReturns("post_comments", List.of());
        aggregateReturns("post_downloads", List.of());
        when(mongo.find(any(Query.class), eq(Document.class), eq("posts"))).thenReturn(List.of(
            new Document("_id", new ObjectId()).append("totalLikes", 0).append("totalComments", 0).append("totalDownloads", 0)));
        when(mongo.bulkOps(any(BulkOperations.BulkMode.class), eq("posts"))).thenReturn(bulk);

        assertThat(repair.reconcilePostCounts()).isZero();
        verify(bulk, never()).execute();
    }
}
