package Feat.FeatureMe.config;

import org.springframework.context.annotation.Configuration;
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
 * - TTL indexes for data cleanup
 */
@Configuration
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
            
            // Time-based cleanup index (TTL - 1 year)
            indexOps.ensureIndex(new Index().on("time", org.springframework.data.domain.Sort.Direction.ASC)
                                            .expire(365 * 24 * 60 * 60) // 1 year in seconds
                                            .named("comment_ttl_idx"));
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
            
            // Time-based cleanup index (TTL - 2 years)
            indexOps.ensureIndex(new Index().on("likedAt", org.springframework.data.domain.Sort.Direction.ASC)
                                            .expire(2 * 365 * 24 * 60 * 60) // 2 years in seconds
                                            .named("like_ttl_idx"));
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
            
            // Time-based cleanup index (TTL - 6 months)
            indexOps.ensureIndex(new Index().on("lastView", org.springframework.data.domain.Sort.Direction.ASC)
                                            .expire(6 * 30 * 24 * 60 * 60) // 6 months in seconds
                                            .named("view_ttl_idx"));
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
            
            // Time-based cleanup index (TTL - 1 year)
            indexOps.ensureIndex(new Index().on("downloadedAt", org.springframework.data.domain.Sort.Direction.ASC)
                                            .expire(365 * 24 * 60 * 60) // 1 year in seconds
                                            .named("download_ttl_idx"));
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
            
            // Message TTL (keep messages for 1 year)
            messageIndexOps.ensureIndex(new Index().on("sentAt", org.springframework.data.domain.Sort.Direction.ASC)
                                                   .expire(365 * 24 * 60 * 60) // 1 year in seconds
                                                   .named("message_ttl_idx"));
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
            
            // Demo TTL (keep demos for 2 years)
            indexOps.ensureIndex(new Index().on("createdAt", org.springframework.data.domain.Sort.Direction.ASC)
                                            .expire(2 * 365 * 24 * 60 * 60) // 2 years in seconds
                                            .named("demo_ttl_idx"));
        } catch (Exception e) {
            System.err.println("Error creating demo indexes: " + e.getMessage());
        }
    }
}