package Feat.FeatureMe.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.bson.Document;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

@DisplayName("ChatMessageMigration")
class ChatMessageMigrationTest {

    private final MongoTemplate mongo = mock(MongoTemplate.class);
    private final ChatMessageMigration migration = new ChatMessageMigration(mongo);

    private static Document message(ObjectId id, String text) {
        Document doc = new Document("message", text).append("sender", "alice").append("type", "CHAT");
        if (id != null) doc.append("_id", id);
        return doc;
    }

    @Test
    @DisplayName("copies only messages missing from chat_messages, then removes the embedded list")
    void copiesMissingThenUnsets() {
        ObjectId saved = new ObjectId();
        ObjectId onlyEmbedded = new ObjectId();
        Document room = new Document("_id", "room-1").append("messages", List.of(
            message(saved, "already in the collection"),
            message(onlyEmbedded, "only inside the room"),
            message(null, "no id at all")));
        when(mongo.find(any(Query.class), eq(Document.class), eq(ChatMessageMigration.ROOMS))).thenReturn(List.of(room));
        when(mongo.find(any(Query.class), eq(Document.class), eq(ChatMessageMigration.MESSAGES)))
            .thenReturn(List.of(new Document("_id", saved)));

        int[] result = migration.migrate();

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<Document>> inserted = ArgumentCaptor.forClass(List.class);
        verify(mongo).insert(inserted.capture(), eq(ChatMessageMigration.MESSAGES));
        assertThat(inserted.getValue()).extracting(d -> d.getString("message"))
            .containsExactly("only inside the room", "no id at all");
        assertThat(inserted.getValue()).allSatisfy(d -> assertThat(d.getString("chatRoomId")).isEqualTo("room-1"));
        assertThat(inserted.getValue().get(0).get("_id")).isEqualTo(onlyEmbedded);

        verify(mongo).updateFirst(any(Query.class),
            argThat((Update u) -> u.getUpdateObject().toJson().contains("$unset")), eq(ChatMessageMigration.ROOMS));
        assertThat(result).containsExactly(1, 2);
    }

    @Test
    @DisplayName("nothing to copy: still removes the duplicate list, inserts nothing")
    void allAlreadySaved() {
        ObjectId saved = new ObjectId();
        Document room = new Document("_id", "room-2").append("messages", List.of(message(saved, "hi")));
        when(mongo.find(any(Query.class), eq(Document.class), eq(ChatMessageMigration.ROOMS))).thenReturn(List.of(room));
        when(mongo.find(any(Query.class), eq(Document.class), eq(ChatMessageMigration.MESSAGES)))
            .thenReturn(List.of(new Document("_id", saved)));

        migration.migrate();

        verify(mongo, never()).insert(anyCollection(), eq(ChatMessageMigration.MESSAGES));
        verify(mongo).updateFirst(any(Query.class), any(Update.class), eq(ChatMessageMigration.ROOMS));
    }

    @Test
    @DisplayName("a failure leaves the embedded lists alone")
    void failureIsSafe() {
        Document room = new Document("_id", "room-3").append("messages", List.of(message(null, "hi")));
        when(mongo.find(any(Query.class), eq(Document.class), eq(ChatMessageMigration.ROOMS))).thenReturn(List.of(room));
        when(mongo.insert(anyCollection(), eq(ChatMessageMigration.MESSAGES))).thenThrow(new RuntimeException("db down"));

        migration.afterSingletonsInstantiated();

        verify(mongo, never()).updateFirst(any(Query.class), any(Update.class), eq(ChatMessageMigration.ROOMS));
    }
}
