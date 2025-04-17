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
        return userRepository.insert(user);
    }
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
    public List<User> getUserByName(String userName) {
        // Check if the user exists before attempting to retrieve it
        if (!userRepository.existsByUserName(userName)) {
            throw new IllegalArgumentException("User with username " + userName + " does not exist.");
        }
        // Retrieve the user by its username
        return userRepository.findByUserNameStartingWithIgnoreCase(userName);
    }
    public void deleteUser(String id) {
        userRepository.deleteById(id);
    }
}
