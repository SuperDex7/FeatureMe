package Feat.FeatureMe.Controller;

import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import Feat.FeatureMe.Entity.User;
import Feat.FeatureMe.Service.UserService;
import org.springframework.web.bind.annotation.PostMapping;


@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserService userService;
    @PostMapping("path")
    public String postMethodName(@RequestBody String entity) {
        //TODO: process POST request
        
        return entity;
    }
    
    public UserController(UserService userService) {
        this.userService = userService;

    }
    public void addUser(@RequestBody User user) {
        userService.addUser(user);
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
