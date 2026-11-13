package Feat.FeatureMe.config;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.bson.Document;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.SmartInitializingSingleton;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;

/**
 * One-time cleanup: chat rooms used to keep a copy of every message inside the
 * chatRooms document as well as in chat_messages. Copies any message that only
 * exists in a room into chat_messages, then removes the embedded lists.
 *
 * Runs once all beans exist, which is before the web server starts taking
 * requests (so nothing can save a chat room in between). Safe to run again:
 * rooms without embedded messages are skipped.
 */
@Component
public class ChatMessageMigration implements SmartInitializingSingleton {

    static final String ROOMS = "chatRooms";
    static final String MESSAGES = "chat_messages";

    private final MongoTemplate mongoTemplate;

    public ChatMessageMigration(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public void afterSingletonsInstantiated() {
        try {
            int[] result = migrate();
            if (result[0] > 0) {
                System.out.println("Chat migration: cleaned " + result[0] + " chat rooms, copied "
                    + result[1] + " messages that only existed inside a room");
            }
        } catch (Exception e) {
            // Leave the embedded lists in place; try again next start
            System.err.println("Chat message migration failed (will retry next start): " + e.getMessage());
        }
    }

    /** @return {rooms cleaned, messages copied} */
    int[] migrate() {
        Query withEmbedded = new Query(Criteria.where("messages").exists(true));
        withEmbedded.fields().include("_id").include("messages");
        List<Document> rooms = mongoTemplate.find(withEmbedded, Document.class, ROOMS);

        int copied = 0;
        for (Document room : rooms) {
            Object roomId = room.get("_id");
            @SuppressWarnings("unchecked")
            List<Document> embedded = (List<Document>) room.get("messages", List.class);
            if (embedded != null && !embedded.isEmpty()) {
                copied += copyMissing(String.valueOf(roomId), embedded);
            }
            // Only after the copies are safely stored
            mongoTemplate.updateFirst(new Query(Criteria.where("_id").is(roomId)), new Update().unset("messages"), ROOMS);
        }
        return new int[] { rooms.size(), copied };
    }

    private int copyMissing(String roomId, List<Document> embedded) {
        Set<Object> ids = new HashSet<>();
        for (Document message : embedded) {
            Object id = messageId(message);
            if (id != null) ids.add(id);
        }
        Set<String> existing = new HashSet<>();
        if (!ids.isEmpty()) {
            Query known = new Query(Criteria.where("_id").in(ids));
            known.fields().include("_id");
            for (Document doc : mongoTemplate.find(known, Document.class, MESSAGES)) {
                existing.add(String.valueOf(doc.get("_id")));
            }
        }

        List<Document> missing = new ArrayList<>();
        for (Document message : embedded) {
            Object id = messageId(message);
            if (id != null && existing.contains(String.valueOf(id))) continue;
            Document copy = new Document(message);
            copy.remove("id");
            if (id != null) copy.put("_id", id); else copy.remove("_id");
            if (copy.get("chatRoomId") == null) copy.put("chatRoomId", roomId);
            missing.add(copy);
        }
        if (!missing.isEmpty()) {
            mongoTemplate.insert(missing, MESSAGES);
        }
        return missing.size();
    }

    private static Object messageId(Document message) {
        Object id = message.get("_id");
        if (id == null) id = message.get("id");
        if (id instanceof String s && ObjectId.isValid(s)) return new ObjectId(s);
        return id;
    }
}
