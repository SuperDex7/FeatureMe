package Feat.FeatureMe.Controller;

import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import Feat.FeatureMe.Dto.LoginDTO;
import Feat.FeatureMe.Dto.NotificationsDTO;
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

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;





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
    public ResponseEntity<?> login(@RequestBody LoginDTO login, HttpServletResponse response) {
        try {
            String usernameOrEmail = login.username(); // This can be either username or email
            String password = login.password();
            
            // Authenticate against database (works with username OR email)
            User user = userService.authenticateUser(usernameOrEmail, password);
            
            // Generate JWT token using email (for consistency)
            String token = jwtService.generateToken(user.getEmail());
            
            // Create HttpOnly cookie for the JWT token
            Cookie sessionCookie = new Cookie("sessionToken", token);
            sessionCookie.setHttpOnly(true);
            sessionCookie.setSecure(false); // Set to true in production with HTTPS
            sessionCookie.setPath("/");
            sessionCookie.setMaxAge(24 * 60 * 60); // 24 hours
            response.addCookie(sessionCookie);
            
            Map<String, String> responseBody = new HashMap<>();
            responseBody.put("message", "Login successful");
            responseBody.put("username", user.getUserName());
            responseBody.put("email", user.getEmail());
            
            return ResponseEntity.ok(responseBody);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        }
        
    }

    @GetMapping("/get/notifications/{userName}")
    public List<NotificationsDTO> getMethodName(@PathVariable String userName) {
        return userService.getNoti(userName);
    }
    @PostMapping("/follow/{follower}/{following}")
    public String postMethodName(@PathVariable String follower, @PathVariable String following) {
        
        return userService.follow(follower, following);
        
    }
    
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Not authenticated");
            }
            
            String email = authentication.getName();
            User user = userService.findByUsernameOrEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
            
            UserDTO userDTO = userService.getAUser(user.getUserName());
            return ResponseEntity.ok(userDTO);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error retrieving user info");
        }
    }
    
    @PostMapping("/auth/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        // Create an empty cookie to clear the session token
        Cookie sessionCookie = new Cookie("sessionToken", "");
        sessionCookie.setHttpOnly(true);
        sessionCookie.setSecure(false); // Set to true in production with HTTPS
        sessionCookie.setPath("/");
        sessionCookie.setMaxAge(0); // Expire immediately
        response.addCookie(sessionCookie);
        
        Map<String, String> responseBody = new HashMap<>();
        responseBody.put("message", "Logout successful");
        
        return ResponseEntity.ok(responseBody);
    }
    
    
    
}
