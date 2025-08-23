package Feat.FeatureMe.Service;


import java.util.List;
import java.util.Optional;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;


import Feat.FeatureMe.Dto.UserDTO;
import Feat.FeatureMe.Entity.User;
import Feat.FeatureMe.Repository.UserRepository;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
    public User createUser(User user) {
        if(userRepository.existsByUserName(user.getUserName())){
            throw new IllegalArgumentException("User already exists with this username");
        }
        if(userRepository.existsByEmail(user.getEmail())){
            throw new IllegalArgumentException("User already exists with this email");
        }
        return userRepository.insert(user);
    }
    public User updateUser(String id, User updatedUser) {
        User user = userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));

        user = new User(
            user.getId(),
            updatedUser.getUserName() != null && !updatedUser.getUserName().isBlank() ? updatedUser.getUserName() : user.getUserName(),
            updatedUser.getPassword() != null && !updatedUser.getPassword().isBlank() ? updatedUser.getPassword() : user.getPassword(),
            updatedUser.getEmail() != null && !updatedUser.getEmail().isBlank() ? updatedUser.getEmail() : user.getEmail(),
            updatedUser.getRole() != null && !updatedUser.getRole().isBlank() ? updatedUser.getRole() : user.getRole(),
            updatedUser.getBio() != null && !updatedUser.getBio().isBlank() ? updatedUser.getBio() : user.getBio(),
            updatedUser.getAbout() != null && !updatedUser.getAbout().isBlank() ? updatedUser.getAbout() : user.getAbout(),
            updatedUser.getProfilePic() != null && !updatedUser.getProfilePic().isBlank() ? updatedUser.getProfilePic() : user.getProfilePic(),
            updatedUser.getBanner() != null && !updatedUser.getBanner().isBlank() ? updatedUser.getBanner() : user.getBanner(),
            updatedUser.getLocation() != null && !updatedUser.getLocation().isBlank() ? updatedUser.getLocation() : user.getLocation(),
            updatedUser.getSocialMedia() != null && !updatedUser.getSocialMedia().isEmpty() ? updatedUser.getSocialMedia() : user.getSocialMedia(),
            updatedUser.getBadges() != null && !updatedUser.getBadges().isEmpty() ? updatedUser.getBadges() : user.getBadges(),
            updatedUser.getDemo() != null && !updatedUser.getDemo().isEmpty() ? updatedUser.getDemo() : user.getDemo(),
            updatedUser.getFriends() != null ? updatedUser.getFriends() : user.getFriends(),
            updatedUser.getFollowers() != null ? updatedUser.getFollowers() : user.getFollowers(),
            updatedUser.getFollowing() != null ? updatedUser.getFollowing() : user.getFollowing(),
            updatedUser.getPosts() != null && !updatedUser.getPosts().isEmpty() ? updatedUser.getPosts() : user.getPosts(),
            updatedUser.getCreatedAt() != null ? updatedUser.getCreatedAt() : user.getCreatedAt()
        );
        return userRepository.save(user);
    }
    public List<UserDTO> getAllUsers() {
        return userRepository.findAll()
        .stream()
        .map(u -> new UserDTO(
            u.getId(),
            u.getUserName(),
            u.getProfilePic(),
            u.getBanner(),
            u.getBio(),
            u.getAbout(),
            null,
            u.getLocation(),
            u.getSocialMedia(),
            u.getBadges(),
            u.getFriends(),
            u.getFollowers(),
            u.getFollowing(),
            u.getPosts()
        ))
        .toList();
    }
    
    public UserDTO getUserById(String id) {
        User user = userRepository.findById(id)
        .orElseThrow(() -> new IllegalArgumentException("User not found"));
return new UserDTO(
 user.getId(),
 user.getUserName(),
 user.getProfilePic(),
 user.getBanner(),
 user.getBio(),
 user.getAbout(),
 null,
 user.getLocation(),
 user.getSocialMedia(),
 user.getBadges(),
 user.getFriends(),
 user.getFollowers(),
 user.getFollowing(),
 user.getPosts()
);

    }
    public List<User> getUserByName(String userName) {
       
        return userRepository.findByUserNameStartingWithIgnoreCase(userName);
    }
    public void deleteUser(String id) {
        userRepository.deleteById(id);
    }
    
    public User authenticateUser(String usernameOrEmail, String password) {
        User user = findByUsernameOrEmail(usernameOrEmail)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        // For now, simple password comparison (you should hash passwords later)
        if (password.equals(user.getPassword())) {
            return user;
        } else {
            throw new IllegalArgumentException("Invalid password");
        }
    }
    
    public Optional<User> findByUsernameOrEmail(String usernameOrEmail) {
        // Try to find by username first
        Optional<User> userByUsername = userRepository.findByUserName(usernameOrEmail);
        if (userByUsername.isPresent()) {
            return userByUsername;
        }
        
        // If not found by username, try by email
        return userRepository.findByEmail(usernameOrEmail);
    }
    
    public UserDetails loadUserByUsername(String usernameOrEmail) throws UsernameNotFoundException {
        User user = findByUsernameOrEmail(usernameOrEmail)
            .orElseThrow(() -> new UsernameNotFoundException("User not found with: " + usernameOrEmail));
        
        return org.springframework.security.core.userdetails.User
            .withUsername(user.getEmail()) // Use email as the principal
            .password(user.getPassword())
            .authorities(user.getRole() != null ? user.getRole() : "USER")
            .build();
    }
    public UserDTO getAUser(String userName) {
        User user = userRepository.findByUserName(userName)
        .orElseThrow(() -> new IllegalArgumentException("User not found"));
return new UserDTO(
 user.getId(),
 user.getUserName(),
 user.getProfilePic(),
 user.getBanner(),
 user.getBio(),
 user.getAbout(),
 null,
 user.getLocation(),
 user.getSocialMedia(),
 user.getBadges(),
 user.getFriends(),
 user.getFollowers(),
 user.getFollowing(),
 user.getPosts()
);

    }
}
