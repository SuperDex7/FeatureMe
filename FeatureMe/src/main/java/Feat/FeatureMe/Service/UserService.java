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
    public User updateUser(User user) {
        if(userRepository.existsByUserName(user.userName())){
            throw new IllegalArgumentException("User already exists with this username");
        }
        if(userRepository.existsByEmail(user.email())){
            throw new IllegalArgumentException("User already exists with this email");
        }
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
