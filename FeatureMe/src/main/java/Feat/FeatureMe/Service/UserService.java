package Feat.FeatureMe.Service;


import java.util.List;


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
            updatedUser.getBio() != null && !updatedUser.getBio().isBlank() ? updatedUser.getBio() : user.getBio(),
            updatedUser.getAbout() != null && !updatedUser.getAbout().isBlank() ? updatedUser.getAbout() : user.getAbout(),
            updatedUser.getProfilePic() != null && !updatedUser.getProfilePic().isBlank() ? updatedUser.getProfilePic() : user.getProfilePic(),
            updatedUser.getBanner() != null && !updatedUser.getBanner().isBlank() ? updatedUser.getBanner() : user.getBanner(),
            updatedUser.getDemo() != null && !updatedUser.getDemo().isEmpty() ? updatedUser.getDemo() : user.getDemo(),
            updatedUser.getFriends() != null ? updatedUser.getFriends() : user.getFriends(),
            updatedUser.getFollowers() != null ? updatedUser.getFollowers() : user.getFollowers(),
            updatedUser.getPosts() != null && !updatedUser.getPosts().isEmpty() ? updatedUser.getPosts() : user.getPosts(),
            updatedUser.getFollowing() != null ? updatedUser.getFollowing() : user.getFollowing()
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
            u.getFriends(),
            u.getFollowers(),
            u.getPosts(),
            u.getFollowing()
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
 user.getFriends(),
 user.getFollowers(),
 user.getPosts(),
 user.getFollowing()
);

    }
    public List<User> getUserByName(String userName) {
       
        return userRepository.findByUserNameStartingWithIgnoreCase(userName);
    }
    public void deleteUser(String id) {
        userRepository.deleteById(id);
    }
}
