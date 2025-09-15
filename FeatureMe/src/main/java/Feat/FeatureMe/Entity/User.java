package Feat.FeatureMe.Entity;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import Feat.FeatureMe.Dto.CommentedOnDTO;
import Feat.FeatureMe.Dto.NotificationsDTO;

@Document(collection = "user")
public class User implements UserDetails{

    @Id
    private String id;

    @Indexed(unique = true)
    private String userName;

    private String password;

    @Indexed(unique = true)
    private String email;
    private String role;
    
    // Stripe-related fields
    private String stripeCustomerId;
    private String stripeSubscriptionId;
    private String subscriptionStatus; // active, canceled, past_due, etc.

    private String bio;
    private String about;
    private String profilePic;
    private String banner;
    private String location;
    private List<String> socialMedia;
    private List<String> badges;
    private List<String> demo;
    private List<String> friends;
    private List<String> followers;
    private List<String> following;
    private List<String> featuredOn;
    private List<String> likedPosts;
    private List<String> posts;
    private List<String> chats;
    private List<NotificationsDTO> notifications;
    private List<CommentedOnDTO> comments;
    @CreatedDate
    private LocalDateTime createdAt;

    public User() { }
   

    public User(String id,
                String userName,
                String password,
                String email,
                String role,
                String bio,
                String about,
                String profilePic,
                String banner,
                String location,
                List<String> socialMedia,
                List<String> badges,
                List<String> demo,
                List<String> friends,
                List<String> followers,
                List<String> following,
                List<String> featuredOn,
                List<String> likedPosts,
                List<String> posts,
                List<String> chats,
                List<NotificationsDTO> notifications,
                List<CommentedOnDTO> comments,
                LocalDateTime createdAt) {
        this.id = id;
        this.userName = userName;
        this.password = password;
        this.email = email;
        this.role = role;
        this.bio = bio;
        this.about = about;
        this.profilePic = profilePic;
        this.banner = banner;
        this.location = location;
        this.socialMedia = socialMedia;
        this.badges = badges;
        this.demo = demo;
        this.friends = friends;
        this.followers = followers;
        this.following = following;
        this.featuredOn = featuredOn;   
        this.likedPosts = likedPosts;
        this.posts = posts;
        this.chats = chats;
        this.notifications = notifications;
        this.comments = comments;
        this.createdAt = LocalDateTime.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }
    
    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }
    @Override
    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getStripeCustomerId() {
        return stripeCustomerId;
    }

    public void setStripeCustomerId(String stripeCustomerId) {
        this.stripeCustomerId = stripeCustomerId;
    }

    public String getStripeSubscriptionId() {
        return stripeSubscriptionId;
    }

    public void setStripeSubscriptionId(String stripeSubscriptionId) {
        this.stripeSubscriptionId = stripeSubscriptionId;
    }

    public String getSubscriptionStatus() {
        return subscriptionStatus;
    }

    public void setSubscriptionStatus(String subscriptionStatus) {
        this.subscriptionStatus = subscriptionStatus;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public String getAbout() {
        return about;
    }

    public void setAbout(String about) {
        this.about = about;
    }

    public String getProfilePic() {
        return profilePic;
    }

    public void setProfilePic(String profilePic) {
        this.profilePic = profilePic;
    }

    public String getBanner() {
        return banner;
    }

    public void setBanner(String banner) {
        this.banner = banner;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public List<String> getSocialMedia() {
        return socialMedia;
    }

    public void setSocialMedia(List<String> socialMedia) {
        this.socialMedia = socialMedia;
    }

    public List<String> getBadges() {
        return badges;
    }

    public void setBadges(List<String> badges) {
        this.badges = badges;
    }

    public List<String> getDemo() {
        return demo;
    }

    public void setDemo(List<String> demo) {
        this.demo = demo;
    }

    public List<String> getFriends() {
        return friends;
    }

    public void setFriends(List<String> friends) {
        this.friends = friends;
    }

    public List<String> getFollowers() {
        return followers;
    }

    public void setFollowers(List<String> followers) {
        this.followers = followers;
    }

    public List<String> getFeaturedOn() {
        return featuredOn;
    }

    public void setFeaturedOn(List<String> featuredOn) {
        this.featuredOn = featuredOn;
    }

    public List<String> getLikedPosts() {
        return likedPosts;
    }

    public void setLikedPosts(List<String> likedPosts) {
        this.likedPosts = likedPosts;
    }

    public List<String> getPosts() {
        return posts;
    }

    public void setPosts(List<String> posts) {
        this.posts = posts;
    }

    public List<String> getFollowing() {
        return following;
    }

    public void setFollowing(List<String> following) {
        this.following = following;
    }

    public User user() {
        return this;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public List<CommentedOnDTO> getComments() {
        return comments;
    }

    public void setComments(List<CommentedOnDTO> comments) {
        this.comments = comments;
    }

    public List<String> getChats() {
        return chats;
    }

    public void setChats(List<String> chats) {
        this.chats = chats;
    }

    public List<NotificationsDTO> getNotifications() {
        return notifications;
    }

    public void setNotifications(List<NotificationsDTO> notifications) {
        this.notifications = notifications;
    }


    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority(role));
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }

    @Override
    public String getUsername() {
        return email;
    }
}
