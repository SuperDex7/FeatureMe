package Feat.FeatureMe.Service;


import org.springframework.stereotype.Service;

import Feat.FeatureMe.Entity.User;
import Feat.FeatureMe.Repository.UserRepository;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
    public void addUser(User user) {
        userRepository.insert(user);
    }
    public void updateUser() {

    }
    public void getAllUsers() {

    }
    public void getUserByName() {

    }
    public void deleteUser() {

    }
}
