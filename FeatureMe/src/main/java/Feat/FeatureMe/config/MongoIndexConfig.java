package Feat.FeatureMe.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.config.EnableMongoAuditing;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.index.IndexOperations;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;

/**
 * MongoDB Index Configuration
 * 
 * This class creates all necessary database indexes for optimal performance.
 * Indexes are created automatically when the application starts.
 * 
 * Critical indexes added:
 * - Compound indexes for complex queries
 * - Text search indexes for full-text search
 * - Sparse indexes for optional fields
 * - No TTL indexes on user content: posts' views, likes, comments, downloads,
 *   messages and demos are kept (see dropDataExpiryIndexes)
 */
@Configuration
@EnableMongoAuditing // Enable @CreatedDate and @LastModifiedDate annotations
@Order(1) // Run early in startup
public class MongoIndexConfig implements CommandLineRunner {

    @Autowired
    private MongoTemplate mongoTemplate;

    @Override
    public void run(String... args) throws Exception {
        createIndexes();
    }

    private void createIndexes() {
        System.out.println("Creating MongoDB indexes for optimal performance...");
        
        // Posts Collection Indexes
        createPostsIndexes();
        
        // User Collection Indexes
        createUserIndexes();
        
        // Post Comments Collection Indexes
        createPostCommentIndexes();
        
        // Post Likes Collection Indexes
        createPostLikeIndexes();
        
        // Post Views Collection Indexes
        createPostViewIndexes();
        
        // Post Downloads Collection Indexes
        createPostDownloadIndexes();
        
        // User Relations Collection Indexes
        createUserRelationIndexes();
        
        // Chat Collections Indexes
        createChatIndexes();
        
        // Demo Collection Indexes
        createDemoIndexes();

        // Signup email verification records
        createEmailVerificationIndexes();

        // Older versions of this class auto-deleted user data; remove those indexes
        dropDataExpiryIndexes();
        
        System.out.println("MongoDB indexes created successfully!");
    }

    private void createPostsIndexes() {
        IndexOperations indexOps = mongoTemplate.indexOps("posts");
        
        try {
            // Critical compound indexes for common queries
            indexOps.ensureIndex(new Index().on("status", org.springframework.data.domain.Sort.Direction.ASC)
                                            .on("time", org.springframework.data.domain.Sort.Direction.DESC)
                                            .named("status_time_idx"));
            
            indexOps.ensureIndex(new Index().on("status", org.springframework.data.domain.Sort.Direction.ASC)
                                            .on("totalLikes", org.springframework.data.domain.Sort.Direction.DESC)
                                            .on("time", org.springframework.data.domain.Sort.Direction.DESC)
                                            .named("status_likes_time_idx"));
            
            // Genre-based queries
            indexOps.ensureIndex(new Index().on("genre", org.springframework.data.domain.Sort.Direction.ASC)
                                            .on("status", org.springframework.data.domain.Sort.Direction.ASC)
                                            .on("time", org.springframework.data.domain.Sort.Direction.DESC)
                                            .named("genre_status_time_idx"));
            
            // Price-based queries
            indexOps.ensureIndex(new Index().on("price", org.springframework.data.domain.Sort.Direction.ASC)
                                            .on("status", org.springframework.data.domain.Sort.Direction.ASC)
                                            .named("price_status_idx"));
            
            // Free download queries
            indexOps.ensureIndex(new Index().on("freeDownload", org.springframework.data.domain.Sort.Direction.ASC)
                                            .on("status", org.springframework.data.domain.Sort.Direction.ASC)
                                            .on("time", org.springframework.data.domain.Sort.Direction.DESC)
                                            .named("free_status_time_idx"));
            
            // Features array queries
            indexOps.ensureIndex(new Index().on("features", org.springframework.data.domain.Sort.Direction.ASC)
                                            .named("features_idx"));
            
            // Pending features array queries
            indexOps.ensureIndex(new Index().on("pendingFeatures", org.springframework.data.domain.Sort.Direction.ASC)
                                            .named("pending_features_idx"));
            
            // Text search indexes for title and description
            indexOps.ensureIndex(new Index().on("title", org.springframework.data.domain.Sort.Direction.ASC)
                                            .named("title_text_idx"));
            
            indexOps.ensureIndex(new Index().on("description", org.springframework.data.domain.Sort.Direction.ASC)
                                            .named("description_text_idx"));
            
            // Compound text search index
            indexOps.ensureIndex(new Index().on("title", org.springframework.data.domain.Sort.Direction.ASC)
                                            .on("description", org.springframework.data.domain.Sort.Direction.ASC)
                                            .on("status", org.springframework.data.domain.Sort.Direction.ASC)
                                            .named("title_desc_status_idx"));
            
            // Author-based queries (for user posts)
            indexOps.ensureIndex(new Index().on("author.$id", org.springframework.data.domain.Sort.Direction.ASC)
                                            .on("status", org.springframework.data.domain.Sort.Direction.ASC)
                                            .on("time", org.springframework.data.domain.Sort.Direction.DESC)
                                            .named("author_status_time_idx"));
            
            // Performance metrics indexes
            indexOps.ensureIndex(new Index().on("totalViews", org.springframework.data.domain.Sort.Direction.DESC)
                                            .on("time", org.springframework.data.domain.Sort.Direction.DESC)
                                            .named("views_time_idx"));
            
            indexOps.ensureIndex(new Index().on("totalLikes", org.springframework.data.domain.Sort.Direction.DESC)
                                            .on("time", org.springframework.data.domain.Sort.Direction.DESC)
                                            .named("likes_time_idx"));
            
            indexOps.ensureIndex(new Index().on("totalComments", org.springframework.data.domain.Sort.Direction.DESC)
                                            .on("time", org.springframework.data.domain.Sort.Direction.DESC)
                                            .named("comments_time_idx"));
            
            indexOps.ensureIndex(new Index().on("totalDownloads", org.springframework.data.domain.Sort.Direction.DESC)
                                            .on("time", org.springframework.data.domain.Sort.Direction.DESC)
                                            .named("downloads_time_idx"));
        } catch (Exception e) {
            System.err.println("Error creating posts indexes: " + e.getMessage());
        }
    }

    private void createUserIndexes() {
        IndexOperations indexOps = mongoTemplate.indexOps("user");
        
        try {
            // Role-based queries
            indexOps.ensureIndex(new Index().on("role", org.springframework.data.domain.Sort.Direction.ASC)
                                            .on("createdAt", org.springframework.data.domain.Sort.Direction.DESC)
                                            .named("role_created_idx"));
            
            // Location-based queries
            indexOps.ensureIndex(new Index().on("location", org.springframework.data.domain.Sort.Direction.ASC)
                                            .named("location_idx"));
            
            // Subscription status queries
            indexOps.ensureIndex(new Index().on("subscriptionStatus", org.springframework.data.domain.Sort.Direction.ASC)
                                            .named("subscription_status_idx"));
            
            // Array field indexes for social features (followers/following removed; use relations collection)
            
            // friends index removed
            
            indexOps.ensureIndex(new Index().on("featuredOn", org.springframework.data.domain.Sort.Direction.ASC)
                                            .named("featured_on_idx"));
            
            indexOps.ensureIndex(new Index().on("likedPosts", org.springframework.data.domain.Sort.Direction.ASC)
                                            .named("liked_posts_idx"));
            
            indexOps.ensureIndex(new Index().on("posts", org.springframework.data.domain.Sort.Direction.ASC)
                                            .named("user_posts_idx"));
            
            indexOps.ensureIndex(new Index().on("chats", org.springframework.data.domain.Sort.Direction.ASC)
                                            .named("user_chats_idx"));
            
            // Badge queries
            indexOps.ensureIndex(new Index().on("badges", org.springframework.data.domain.Sort.Direction.ASC)
                                            .named("badges_idx"));
            
            // Demo queries
            indexOps.ensureIndex(new Index().on("demo", org.springframework.data.domain.Sort.Direction.ASC)
                                            .named("demo_idx"));
            
            // Social media queries
            indexOps.ensureIndex(new Index().on("socialMedia", org.springframework.data.domain.Sort.Direction.ASC)
                                            .named("social_media_idx"));
            
            // Bio text search
            indexOps.ensureIndex(new Index().on("bio", org.springframework.data.domain.Sort.Direction.ASC)
                                            .named("bio_text_idx"));
            
            // About text search
            indexOps.ensureIndex(new Index().on("about", org.springframework.data.domain.Sort.Direction.ASC)
                                            .named("about_text_idx"));
            
            // Compound indexes for user search
            indexOps.ensureIndex(new Index().on("userName", org.springframework.data.domain.Sort.Direction.ASC)
                                            .on("role", org.springframework.data.domain.Sort.Direction.ASC)
                                            .named("username_role_idx"));
            
            indexOps.ensureIndex(new Index().on("bio", org.springframework.data.domain.Sort.Direction.ASC)
                                            .on("role", org.springframework.data.domain.Sort.Direction.ASC)
                                            .named("bio_role_idx"));
            
            // Performance indexes
            indexOps.ensureIndex(new Index().on("createdAt", org.springframework.data.domain.Sort.Direction.DESC)
                                            .named("created_at_idx"));
        } catch (Exception e) {
            System.err.println("Error creating user indexes: " + e.getMessage());
        }
    }

    private void createPostCommentIndexes() {
        IndexOperations indexOps = mongoTemplate.indexOps("post_comments");
        
        try {
            // Compound index for post comments with time sorting
            indexOps.ensureIndex(new Index().on("postId", org.springframework.data.domain.Sort.Direction.ASC)
                                            .on("time", org.springframework.data.domain.Sort.Direction.DESC)
                                            .named("post_time_idx"));
            
            // User comments index
            indexOps.ensureIndex(new Index().on("userName", org.springframework.data.domain.Sort.Direction.ASC)
                                            .on("time", org.springframework.data.domain.Sort.Direction.DESC)
                                            .named("user_time_idx"));
            
            // Compound index for user-post uniqueness (if needed)
            indexOps.ensureIndex(new Index().on("postId", org.springframework.data.domain.Sort.Direction.ASC)
                                            .on("userName", org.springframework.data.domain.Sort.Direction.ASC)
                                            .named("post_user_idx"));
            
        } catch (Exception e) {
            System.err.println("Error creating post comment indexes: " + e.getMessage());
        }
    }

    private void createPostLikeIndexes() {
        IndexOperations indexOps = mongoTemplate.indexOps("post_likes");
        
        try {
            // Compound index for post likes with time sorting
            indexOps.ensureIndex(new Index().on("postId", org.springframework.data.domain.Sort.Direction.ASC)
                                            .on("likedAt", org.springframework.data.domain.Sort.Direction.DESC)
                                            .named("post_liked_time_idx"));
            
            // User likes index
            indexOps.ensureIndex(new Index().on("userName", org.springframework.data.domain.Sort.Direction.ASC)
                                            .on("likedAt", org.springframework.data.domain.Sort.Direction.DESC)
                                            .named("user_liked_time_idx"));
            
        } catch (Exception e) {
            System.err.println("Error creating post like indexes: " + e.getMessage());
        }
    }

    private void createPostViewIndexes() {
        IndexOperations indexOps = mongoTemplate.indexOps("post_views");
        
        try {
            // Compound index for post views with time sorting
            indexOps.ensureIndex(new Index().on("postId", org.springframework.data.domain.Sort.Direction.ASC)
                                            .on("lastView", org.springframework.data.domain.Sort.Direction.DESC)
                                            .named("post_last_view_idx"));
            
            // User views index
            indexOps.ensureIndex(new Index().on("userName", org.springframework.data.domain.Sort.Direction.ASC)
                                            .on("lastView", org.springframework.data.domain.Sort.Direction.DESC)
                                            .named("user_last_view_idx"));
            
            // Compound index for user-post uniqueness
            indexOps.ensureIndex(new Index().on("postId", org.springframework.data.domain.Sort.Direction.ASC)
                                            .on("userName", org.springframework.data.domain.Sort.Direction.ASC)
                                            .unique()
                                            .named("post_user_unique_idx"));
            
            // View count sorting
            indexOps.ensureIndex(new Index().on("postId", org.springframework.data.domain.Sort.Direction.ASC)
                                            .on("viewCount", org.springframework.data.domain.Sort.Direction.DESC)
                                            .named("post_view_count_idx"));
            
        } catch (Exception e) {
            System.err.println("Error creating post view indexes: " + e.getMessage());
        }
    }

    private void createPostDownloadIndexes() {
        IndexOperations indexOps = mongoTemplate.indexOps("post_downloads");
        
        try {
            // Compound index for post downloads with time sorting
            indexOps.ensureIndex(new Index().on("postId", org.springframework.data.domain.Sort.Direction.ASC)
                                            .on("downloadedAt", org.springframework.data.domain.Sort.Direction.DESC)
                                            .named("post_download_time_idx"));
            
            // User downloads index
            indexOps.ensureIndex(new Index().on("userName", org.springframework.data.domain.Sort.Direction.ASC)
                                            .on("downloadedAt", org.springframework.data.domain.Sort.Direction.DESC)
                                            .named("user_download_time_idx"));
            
        } catch (Exception e) {
            System.err.println("Error creating post download indexes: " + e.getMessage());
        }
    }

    private void createUserRelationIndexes() {
        IndexOperations indexOps = mongoTemplate.indexOps("user_relations");
        
        try {
            // Additional indexes beyond the ones defined in the entity
            
            // Status-based queries
            indexOps.ensureIndex(new Index().on("status", org.springframework.data.domain.Sort.Direction.ASC)
                                            .on("createdAt", org.springframework.data.domain.Sort.Direction.DESC)
                                            .named("status_created_idx"));
            
            // Relation type queries
            indexOps.ensureIndex(new Index().on("relationType", org.springframework.data.domain.Sort.Direction.ASC)
                                            .on("status", org.springframework.data.domain.Sort.Direction.ASC)
                                            .named("type_status_idx"));
            
            // Compound index for follower queries with status
            indexOps.ensureIndex(new Index().on("followerUserName", org.springframework.data.domain.Sort.Direction.ASC)
                                            .on("status", org.springframework.data.domain.Sort.Direction.ASC)
                                            .on("createdAt", org.springframework.data.domain.Sort.Direction.DESC)
                                            .named("follower_status_created_idx"));
            
            // Compound index for following queries with status
            indexOps.ensureIndex(new Index().on("followingUserName", org.springframework.data.domain.Sort.Direction.ASC)
                                            .on("status", org.springframework.data.domain.Sort.Direction.ASC)
                                            .on("createdAt", org.springframework.data.domain.Sort.Direction.DESC)
                                            .named("following_status_created_idx"));
            
            // Updated time index for recent changes
            indexOps.ensureIndex(new Index().on("updatedAt", org.springframework.data.domain.Sort.Direction.DESC)
                                            .named("updated_at_idx"));
        } catch (Exception e) {
            System.err.println("Error creating user relation indexes: " + e.getMessage());
        }
    }

    private void createChatIndexes() {
        try {
            IndexOperations chatIndexOps = mongoTemplate.indexOps("chats");
            
            // Chat participants index
            chatIndexOps.ensureIndex(new Index().on("participants", org.springframework.data.domain.Sort.Direction.ASC)
                                                .named("participants_idx"));
            
            // Chat creation time
            chatIndexOps.ensureIndex(new Index().on("createdAt", org.springframework.data.domain.Sort.Direction.DESC)
                                                .named("chat_created_idx"));
            
            // Last message time for sorting
            chatIndexOps.ensureIndex(new Index().on("lastMessageAt", org.springframework.data.domain.Sort.Direction.DESC)
                                                .named("last_message_idx"));
            
            // Chat messages collection indexes
            IndexOperations messageIndexOps = mongoTemplate.indexOps("chat_messages");
            
            // Chat ID with time sorting
            messageIndexOps.ensureIndex(new Index().on("chatId", org.springframework.data.domain.Sort.Direction.ASC)
                                                   .on("sentAt", org.springframework.data.domain.Sort.Direction.DESC)
                                                   .named("chat_time_idx"));
            
            // Sender index
            messageIndexOps.ensureIndex(new Index().on("senderUserName", org.springframework.data.domain.Sort.Direction.ASC)
                                                   .on("sentAt", org.springframework.data.domain.Sort.Direction.DESC)
                                                   .named("sender_time_idx"));
            
        } catch (Exception e) {
            System.err.println("Error creating chat indexes: " + e.getMessage());
        }
    }

    private void createDemoIndexes() {
        IndexOperations indexOps = mongoTemplate.indexOps("demos");
        
        try {
            // Author-based queries
            indexOps.ensureIndex(new Index().on("authorUserName", org.springframework.data.domain.Sort.Direction.ASC)
                                            .on("createdAt", org.springframework.data.domain.Sort.Direction.DESC)
                                            .named("demo_author_created_idx"));
            
            // Genre-based queries
            indexOps.ensureIndex(new Index().on("genre", org.springframework.data.domain.Sort.Direction.ASC)
                                            .on("createdAt", org.springframework.data.domain.Sort.Direction.DESC)
                                            .named("demo_genre_created_idx"));
            
            // Title search
            indexOps.ensureIndex(new Index().on("title", org.springframework.data.domain.Sort.Direction.ASC)
                                            .named("demo_title_idx"));
            
            // Creation time
            indexOps.ensureIndex(new Index().on("createdAt", org.springframework.data.domain.Sort.Direction.DESC)
                                            .named("demo_created_idx"));
            
        } catch (Exception e) {
            System.err.println("Error creating demo indexes: " + e.getMessage());
        }
    }

    /**
     * Signup codes: one record per email, removed automatically once deleteAt
     * passes (these are short-lived by design, unlike user content).
     */
    private void createEmailVerificationIndexes() {
        IndexOperations indexOps = mongoTemplate.indexOps("email_verifications");
        try {
            indexOps.ensureIndex(new Index().on("email", org.springframework.data.domain.Sort.Direction.ASC)
                                            .unique()
                                            .named("email_verification_email_idx"));
            indexOps.ensureIndex(new Index().on("deleteAt", org.springframework.data.domain.Sort.Direction.ASC)
                                            .expire(0)
                                            .named("email_verification_expiry_idx"));
        } catch (Exception e) {
            System.err.println("Error creating email verification indexes: " + e.getMessage());
        }
    }

    /**
     * Earlier versions created TTL indexes that made MongoDB delete listener
     * records after 6 months, comments after a year and likes after 2 years
     * (plus inactive ones on downloads, messages and demos). Removing them from
     * this class doesn't remove them from the database, so drop them here.
     */
    private void dropDataExpiryIndexes() {
        String[][] legacy = {
            { "post_views", "view_ttl_idx" },
            { "post_comments", "comment_ttl_idx" },
            { "post_likes", "like_ttl_idx" },
            { "post_downloads", "download_ttl_idx" },
            { "chat_messages", "message_ttl_idx" },
            { "demos", "demo_ttl_idx" },
        };
        for (String[] entry : legacy) {
            try {
                IndexOperations indexOps = mongoTemplate.indexOps(entry[0]);
                boolean exists = indexOps.getIndexInfo().stream().anyMatch(info -> entry[1].equals(info.getName()));
                if (exists) {
                    indexOps.dropIndex(entry[1]);
                    System.out.println("Dropped data-expiry index " + entry[1] + " on " + entry[0]);
                }
            } catch (Exception e) {
                System.err.println("Error dropping index " + entry[1] + ": " + e.getMessage());
            }
        }
    }
}
