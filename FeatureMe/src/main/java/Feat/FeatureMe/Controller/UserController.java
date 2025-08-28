package Feat.FeatureMe.Controller;

import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import Feat.FeatureMe.Dto.LoginDTO;
import Feat.FeatureMe.Dto.UserDTO;
import Feat.FeatureMe.Entity.User;
import Feat.FeatureMe.Service.JwtService;
import Feat.FeatureMe.Service.S3Service;
import Feat.FeatureMe.Service.UserService;

import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
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
    private final S3Service s3Service;
    private final UserService userService;
    private final JwtService jwtService;
    
    public UserController(UserService userService, S3Service s3Service, JwtService jwtService) {
        this.userService = userService;
        this.s3Service = s3Service;
        this.jwtService = jwtService;
    }

     @PostMapping(path = "/auth/create", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public User createUser(@RequestPart User user,
    @RequestPart("pp") MultipartFile pp,
    @RequestPart("banner") MultipartFile banner ) throws IOException {
        String ppName = pp.getOriginalFilename();
        String bannerName = banner.getOriginalFilename();
        File ppTemp = File.createTempFile("pptemp", null);
        File bannerTemp = File.createTempFile("bannerTemp", null);
        pp.transferTo(ppTemp);
        banner.transferTo(bannerTemp);

        String ppPath = ppTemp.getAbsolutePath();
        String bannerPath = bannerTemp.getAbsolutePath();
        String s3Url = s3Service.uploadFile(ppName, ppPath);
        String s3Url2 = s3Service.uploadFile(bannerName, bannerPath);
        user.setBanner(s3Url2);
        user.setProfilePic(s3Url);
        return userService.createUser(user);
    }
    @PatchMapping("/update/{id}")
    public User updateUser(@PathVariable String id, @RequestBody User user) {
        return userService.updateUser(id, user);

    }
    @GetMapping("/get")
    public List<UserDTO> getAllUsers() {
        return userService.getAllUsers();
    }
    @GetMapping("/get/list/{userName}")
    public List<User> getUserByName(@PathVariable String userName) {
       return userService.getUserByName(userName);

    }

    @GetMapping("/get/{userName}")
    public UserDTO getUserByUserName(@PathVariable String userName) {
        return userService.getAUser(userName);
    }
    @GetMapping("/get/id/{id}")
        public UserDTO getUserById(@PathVariable String id){
            return userService.getUserById(id);
        }
    
    @DeleteMapping("/delete/{id}")
    public void deleteUser(@PathVariable String id) {
        userService.deleteUser(id);

    }
    @PostMapping("/auth/login")
    public ResponseEntity<?> login(@RequestBody LoginDTO login) {
        try {
            String usernameOrEmail = login.username(); // This can be either username or email
            String password = login.password();
            
            // Authenticate against database (works with username OR email)
            User user = userService.authenticateUser(usernameOrEmail, password);
            
            // Generate JWT token using email (for consistency)
            String token = jwtService.generateToken(user.getEmail());
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Login successful");
            response.put("username", user.getUserName());
            response.put("email", user.getEmail());
            response.put("token", token);
            response.put("tokenType", "Bearer");
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        }
        
    }
    
}
