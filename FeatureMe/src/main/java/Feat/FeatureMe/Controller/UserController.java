package Feat.FeatureMe.Controller;

import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import Feat.FeatureMe.Dto.LoginDTO;
import Feat.FeatureMe.Dto.NotificationsDTO;
import Feat.FeatureMe.Dto.UserDTO;
import Feat.FeatureMe.Dto.UserPostsDTO;
import Feat.FeatureMe.Dto.UserSearchDTO;
import Feat.FeatureMe.Entity.User;
import Feat.FeatureMe.Service.JwtService;
import Feat.FeatureMe.Service.S3Service;
import Feat.FeatureMe.Service.UserService;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;

import java.io.File;
import java.io.IOException;
import java.util.Base64;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.web.PagedModel;
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
import org.springframework.web.bind.annotation.RequestParam;

import com.nimbusds.jwt.EncryptedJWT;
import com.resend.*;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.CreateEmailOptions;
import com.resend.services.emails.model.CreateEmailResponse;






@CrossOrigin("*")
@RestController
@RequestMapping("/api/user")
public class UserController {
    private final S3Service s3Service;
    private final UserService userService;
    private final JwtService jwtService;
    
    @Value("${resend.api.key}")
    private Resend resend;

    public UserController(UserService userService, S3Service s3Service, JwtService jwtService) {
        this.userService = userService;
        this.s3Service = s3Service;
        this.jwtService = jwtService;
    }

    @GetMapping("/auth/email/{email}")
    public String VerifyEmail(@PathVariable String email) {


        String code = java.util.UUID.randomUUID().toString().replaceAll("-", "").substring(0, 8);
        String encryptedCode = Base64.getEncoder().encodeToString(code.getBytes());



        
 
        CreateEmailOptions params = CreateEmailOptions.builder()
		.from("FeatureMe@resend.dev")
		.to(email)
		.subject("FeatureMe Verification Code")
		.html("<p>Here is Your One Time Code: <strong>"+code+"</strong></p>")
		.build();

       
        try {
            CreateEmailResponse data = resend.emails().send(params);
            System.out.println(data.getId());
        } catch (ResendException e) {
            e.printStackTrace();
        }
        
        return encryptedCode;
    }
    

     @PostMapping(path = "/auth/create", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public User createUser(@RequestPart User user,
    @RequestPart("pp") MultipartFile pp,
    @RequestPart("banner") MultipartFile banner ) throws IOException {
        
        // Validate profile picture
        if (pp == null || pp.isEmpty()) {
            throw new IllegalArgumentException("Profile picture is required");
        }
        
        String contentType = pp.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Profile picture must be an image file");
        }
        
        if (pp.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException("Profile picture size must be less than 5MB");
        }
        
        // Validate banner
        if (banner == null || banner.isEmpty()) {
            throw new IllegalArgumentException("Banner is required");
        }
        
        String bannerContentType = banner.getContentType();
        if (bannerContentType == null || !bannerContentType.startsWith("image/")) {
            throw new IllegalArgumentException("Banner must be an image file");
        }
        
        if (banner.getSize() > 10 * 1024 * 1024) {
            throw new IllegalArgumentException("Banner size must be less than 10MB");
        }
        
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
        
        // Clean up temp files
        ppTemp.delete();
        bannerTemp.delete();
        
        return userService.createUser(user);
    }
    @PatchMapping("/update")
    public void updateUser(@RequestPart("user") User userUpdateData,
    @RequestPart(value = "pp", required = false) MultipartFile pp,
    @RequestPart(value = "banner", required = false) MultipartFile banner ) throws IOException {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }
        
        String email = authentication.getName();
        User userr = userService.findByUsernameOrEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Handle profile picture upload if provided
        if (pp != null && !pp.isEmpty()) {
            // Validate file type
            String contentType = pp.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                throw new IllegalArgumentException("Profile picture must be an image file");
            }
            
            // Validate file size (5MB limit)
            if (pp.getSize() > 5 * 1024 * 1024) {
                throw new IllegalArgumentException("Profile picture size must be less than 5MB");
            }
            
            String ppName = pp.getOriginalFilename();
            File ppTemp = File.createTempFile("pptemp", null);
            pp.transferTo(ppTemp);
            String ppPath = ppTemp.getAbsolutePath();
            String s3Url = s3Service.uploadFile(ppName, ppPath);
            userr.setProfilePic(s3Url);
           
            // Clean up temp file
            ppTemp.delete();
        } else if (userUpdateData.getProfilePic() != null && !userUpdateData.getProfilePic().isEmpty()) {
            // If no file upload but URL provided, use the URL
            userr.setProfilePic(userUpdateData.getProfilePic());
        }
        
        // Handle banner upload if provided
        if (banner != null && !banner.isEmpty()) {
            // Validate file type
            String contentType = banner.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                throw new IllegalArgumentException("Banner must be an image file");
            }
            
            // Validate file size (10MB limit for banners)
            if (banner.getSize() > 10 * 1024 * 1024) {
                throw new IllegalArgumentException("Banner size must be less than 10MB");
            }
            
            String bannerName = banner.getOriginalFilename();
            File bannerTemp = File.createTempFile("bannerTemp", null);
            banner.transferTo(bannerTemp);
            String bannerPath = bannerTemp.getAbsolutePath();
            String s3Url2 = s3Service.uploadFile(bannerName, bannerPath);
            userr.setBanner(s3Url2);
            
            // Clean up temp file
            bannerTemp.delete();
        } else if (userUpdateData.getBanner() != null && !userUpdateData.getBanner().isEmpty()) {
            // If no file upload but URL provided, use the URL
            userr.setBanner(userUpdateData.getBanner());
        }
        userService.saveUser(userr);
        userService.updateUser(userr.getId(), userUpdateData);
    }
    @GetMapping("/get")
    public List<UserDTO> getAllUsers() {
        return userService.getAllUsers();
    }
    @GetMapping("/get/list/{userName}")
    public PagedModel<UserPostsDTO> getUserByName(@PathVariable String userName, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
       return userService.getUserByName(userName, page, size);

    }

    @GetMapping("/get/search/{userName}")
    public PagedModel<UserSearchDTO> getUserByNameEnhanced(@PathVariable String userName, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
       return userService.getUserByNameEnhanced(userName, page, size);
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
