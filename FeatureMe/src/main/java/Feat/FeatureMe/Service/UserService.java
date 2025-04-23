package Feat.FeatureMe.Service;


import java.util.List;

import org.springframework.stereotype.Service;

import Feat.FeatureMe.Entity.User;
import Feat.FeatureMe.Repository.UserRepository;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
    public User createUser(User user) {
        if(userRepository.existsByUserName(user.userName())){
            throw new IllegalArgumentException("User already exists with this username");
        }
        if(userRepository.existsByEmail(user.email())){
            throw new IllegalArgumentException("User already exists with this email");
        }
        return userRepository.insert(user);
    }
    public User updateUser(String id, User updatedUser) {
        User user = userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));

        user = new User(
            user.id(),
            updatedUser.userName() != null && !updatedUser.userName().isBlank() ? updatedUser.userName() : user.userName(),
            updatedUser.password() != null && !updatedUser.password().isBlank() ? updatedUser.password() : user.password(),
            updatedUser.email() != null && !updatedUser.email().isBlank() ? updatedUser.email() : user.email(),
            updatedUser.bio() != null && !updatedUser.bio().isBlank() ? updatedUser.bio() : user.bio(),
            updatedUser.about() != null && !updatedUser.about().isBlank() ? updatedUser.about() : user.about(),
            updatedUser.profilePic() != null && !updatedUser.profilePic().isBlank() ? updatedUser.profilePic() : user.profilePic(),
            updatedUser.banner() != null && !updatedUser.banner().isBlank() ? updatedUser.banner() : user.banner(),
            updatedUser.demo() != null && !updatedUser.demo().isBlank() ? updatedUser.demo() : user.demo(),
            updatedUser.friends() != null ? updatedUser.friends() : user.friends(),
            updatedUser.followers() != null ? updatedUser.followers() : user.followers(),
            updatedUser.posts() >= 0 ? updatedUser.posts() : user.posts(),
            updatedUser.following() != null ? updatedUser.following() : user.following()
        );
        return userRepository.save(user);
    }
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
    public User getUserNameById(String id) {
        
        return userRepository.findById(id).orElse(null);
    }
    public List<User> getUserByName(String userName) {
       
        return userRepository.findByUserNameStartingWithIgnoreCase(userName);
    }
    public void deleteUser(String id) {
        userRepository.deleteById(id);
    }
}
