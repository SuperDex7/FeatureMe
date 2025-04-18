package Feat.FeatureMe.Controller;

import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import Feat.FeatureMe.Entity.User;
import Feat.FeatureMe.Service.UserService;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;


@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserService userService;
    
    public UserController(UserService userService) {
        this.userService = userService;

    }

     @PostMapping("/create")
    public User createUser(@RequestBody User user) {
        return userService.createUser(user);
    }
    @PutMapping("/update/{id}")
    public User updateUser(@PathVariable String id, @RequestBody User user) {
        return userService.createUser(user);

    }
    @GetMapping("/get")
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }
    @GetMapping("/get/{id}")
    public void getUserByName(@PathVariable String id) {
        userService.getUserByName(id);

    }
    @DeleteMapping("/delete/{id}")
    public void deleteUser(@PathVariable String id) {
        userService.deleteUser(id);

    }
}
