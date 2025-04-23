package Feat.FeatureMe.Controller;

import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import Feat.FeatureMe.Entity.User;
import Feat.FeatureMe.Service.UserService;

import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;


@CrossOrigin("*")
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
    @PatchMapping("/update/{id}")
    public User updateUser(@PathVariable String id, @RequestBody User user) {
        return userService.updateUser(id, user);

    }
    @GetMapping("/get")
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }
    @GetMapping("/get/user/{userName}")
    public List<User> getUserByName(@PathVariable String userName) {
       return userService.getUserByName(userName);

    }
    @GetMapping("/get/id/{id}")
        public String getUserNameById(@PathVariable String id){
            return userService.getUserNameById(id).userName();
        }
    
    @DeleteMapping("/delete/{id}")
    public void deleteUser(@PathVariable String id) {
        userService.deleteUser(id);

    }
}
