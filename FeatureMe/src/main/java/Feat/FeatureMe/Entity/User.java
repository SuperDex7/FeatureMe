package Feat.FeatureMe.Entity;

import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "user")
public class User {

    @Id
    private String id;

    @Indexed(unique = true)
    private String userName;

    private String password;

    @Indexed(unique = true)
    private String email;

    private String bio;
    private String about;
    private String profilePic;
    private String banner;
    private String demo;
    private List<String> friends;
    private List<String> followers;
    private int posts;
    private List<String> following;

    public User() {}

    public User(String id,
                String userName,
                String password,
                String email,
                String bio,
                String about,
                String profilePic,
                String banner,
                String demo,
                List<String> friends,
                List<String> followers,
                int posts,
                List<String> following) {
        this.id = id;
        this.userName = userName;
        this.password = password;
        this.email = email;
        this.bio = bio;
        this.about = about;
        this.profilePic = profilePic;
        this.banner = banner;
        this.demo = demo;
        this.friends = friends;
        this.followers = followers;
        this.posts = posts;
        this.following = following;
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

    public String getDemo() {
        return demo;
    }

    public void setDemo(String demo) {
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

    public int getPosts() {
        return posts;
    }

    public void setPosts(int posts) {
        this.posts = posts;
    }

    public List<String> getFollowing() {
        return following;
    }

    public void setFollowing(List<String> following) {
        this.following = following;
    }
}
