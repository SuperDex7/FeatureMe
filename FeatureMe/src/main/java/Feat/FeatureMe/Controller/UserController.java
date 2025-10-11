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
import Feat.FeatureMe.Service.FileUploadService;
import Feat.FeatureMe.Service.PasswordResetService;
import java.io.File;
import java.io.IOException;
import java.util.Base64;
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

import com.resend.*;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.CreateEmailOptions;
import com.resend.services.emails.model.CreateEmailResponse;







@RestController
@RequestMapping("/api/user")
public class UserController {
    private final S3Service s3Service;
    private final UserService userService;
    private final JwtService jwtService;
    private final FileUploadService fileUploadService;
    private final PasswordResetService passwordResetService;
    
    @Value("${resend.api.key}")
    private Resend resend;

    public UserController(UserService userService, S3Service s3Service, JwtService jwtService, FileUploadService fileUploadService, PasswordResetService passwordResetService) {
        this.userService = userService;
        this.s3Service = s3Service;
        this.jwtService = jwtService;
        this.fileUploadService = fileUploadService;
        this.passwordResetService = passwordResetService;
    }

    @GetMapping("/auth/email/{email}")
    public String VerifyEmail(@PathVariable String email) {


        String code = java.util.UUID.randomUUID().toString().replaceAll("-", "").substring(0, 8);
        String encryptedCode = Base64.getEncoder().encodeToString(code.getBytes());


        
        
        
        CreateEmailOptions params = CreateEmailOptions.builder()
		.from("Signup@featureme.co")
		.to(email)
		.subject("Verify your email for FeatureMe")
		.html(
			"<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;'>" +
			  "<div style='text-align:center; margin-bottom: 24px;'>" +
			    "<div style='font-size: 28px; font-weight: 800; color: #2d3748; margin-bottom: 4px;'>FeatureMe</div>" +
			    "<div style='font-size: 14px; color: #718096;'>Create. Connect. Get Discovered.</div>" +
			  "</div>" +
			  "<div style='background: linear-gradient(135deg, #667eea, #764ba2); padding: 2px; border-radius: 14px;'>" +
			    "<div style='background: #ffffff; border-radius: 12px; padding: 24px;'>" +
			      "<h2 style='margin: 0 0 8px 0; color: #2d3748; font-size: 20px;'>Verify Your Email</h2>" +
			      "<p style='margin: 0 0 16px 0; color: #4a5568; line-height: 1.6;'>" +
			        "Thanks for signing up! Use the verification code below to complete your account setup." +
			      "</p>" +
			      "<div style='background-color: #f7fafc; padding: 20px; text-align: center; margin: 20px 0; border-radius: 10px; border: 1px solid #edf2f7;'>" +
			        "<div style='color: #4a5568; font-size: 12px; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px;'>Your verification code</div>" +
			        "<div style='color: #2b6cb0; font-weight: 800; font-size: 32px; letter-spacing: 4px;'>" + code + "</div>" +
			      "</div>" +
			      "<p style='margin: 0 0 8px 0; color: #4a5568;'>This code will expire in <strong>15 minutes</strong>.</p>" +
			      "<p style='margin: 0; color: #718096; font-size: 14px;'>If you didn't request this, you can safely ignore this email.</p>" +
			    "</div>" +
			  "</div>" +
			  "<div style='text-align:center; color:#a0aec0; font-size:12px; margin-top:16px;'>" +
			    "This is an automated message from FeatureMe • Please do not reply" +
			  "</div>" +
			"</div>"
		)
		.build();

       
        try {
            CreateEmailResponse data = resend.emails().send(params);
            System.out.println(data.getId());
        } catch (ResendException e) {
            e.printStackTrace();
        }
        
        return encryptedCode;
    }

    /**
     * Check if username is available
     */
    @GetMapping("/auth/check-username/{username}")
    public ResponseEntity<Map<String, Object>> checkUsernameAvailability(@PathVariable String username) {
        try {
            boolean isAvailable = !userService.existsByUserName(username);
            Map<String, Object> response = new HashMap<>();
            response.put("available", isAvailable);
            response.put("username", username);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("available", false);
            response.put("username", username);
            response.put("error", "Error checking username availability");
            return ResponseEntity.ok(response);
        }
    }

    /**
     * Check if email is available
     */
    @GetMapping("/auth/check-email/{email}")
    public ResponseEntity<Map<String, Object>> checkEmailAvailability(@PathVariable String email) {
        try {
            boolean isAvailable = !userService.existsByEmail(email);
            Map<String, Object> response = new HashMap<>();
            response.put("available", isAvailable);
            response.put("email", email);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("available", false);
            response.put("email", email);
            response.put("error", "Error checking email availability");
            return ResponseEntity.ok(response);
        }
    }
    

     @PostMapping(path = "/auth/create", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public User createUser(@RequestPart User user,
    @RequestPart(value = "pp", required = false) MultipartFile pp,
    @RequestPart(value = "banner", required = false) MultipartFile banner ) throws IOException {
        
        // Handle profile picture - use default if not provided
        if (pp != null && !pp.isEmpty()) {
            // Validate uploaded profile picture
            String contentType = pp.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                throw new IllegalArgumentException("Profile picture must be an image file");
            }
            
            if (pp.getSize() > 5 * 1024 * 1024) {
                throw new IllegalArgumentException("Profile picture size must be less than 5MB");
            }
            
            // Validate files with role-based size limits and file types
            fileUploadService.validateFileForUserByCategory(pp, user, "image");
            
            // Upload custom profile picture
            String ppName = fileUploadService.generateUniqueFilenameWithFolder(pp, "images/profiles");
            File ppTemp = File.createTempFile("pptemp", null);
            pp.transferTo(ppTemp);
            String ppPath = ppTemp.getAbsolutePath();
            String s3Url = s3Service.uploadFile(ppName, ppPath);
            user.setProfilePic(s3Url);
            // Clean up temp file
            ppTemp.delete();
        } else {
            // Use default profile picture
            user.setProfilePic("/dpp.jpg");
        }
        
        // Handle banner - use default if not provided
        if (banner != null && !banner.isEmpty()) {
            // Validate uploaded banner
            String contentType = banner.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                throw new IllegalArgumentException("Banner must be an image file");
            }
            
            if (banner.getSize() > 5 * 1024 * 1024) {
                throw new IllegalArgumentException("Banner size must be less than 5MB");
            }
            
            // Validate files with role-based size limits and file types
            fileUploadService.validateFileForUserByCategory(banner, user, "image");
            
            // Upload custom banner
            String bannerName = fileUploadService.generateUniqueFilenameWithFolder(banner, "images/banners");
            File bannerTemp = File.createTempFile("bannerTemp", null);
            banner.transferTo(bannerTemp);
            String bannerPath = bannerTemp.getAbsolutePath();
            String s3Url2 = s3Service.uploadFile(bannerName, bannerPath);
            user.setBanner(s3Url2);
            
            // Clean up temp file
            bannerTemp.delete();
        } else {
            // Use default banner
            user.setBanner("/pb.jpg");
        }
        
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
            // Validate file with role-based size limits and file types
            fileUploadService.validateFileForUserByCategory(pp, userr, "image");
            
            String ppName = fileUploadService.generateUniqueFilenameWithFolder(pp, "images/profiles");
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
            // Validate file with role-based size limits and file types
            fileUploadService.validateFileForUserByCategory(banner, userr, "image");
            
            String bannerName = fileUploadService.generateUniqueFilenameWithFolder(banner, "images/banners");
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
    public ResponseEntity<?> deleteUser(@PathVariable String id) {
        try {
            userService.deleteUser(id);
            return ResponseEntity.ok().body("User and all associated data deleted successfully");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error deleting user: " + e.getMessage());
        }
    }
    @PostMapping("/auth/login")
    public ResponseEntity<?> login(@RequestBody LoginDTO login, HttpServletResponse response) {
        try {
            String usernameOrEmail = login.username(); // This can be either username or email
            String password = login.password();
            
            // Authenticate against database (works with username OR email)
            User user = userService.authenticateUser(usernameOrEmail, password);
            
            // Generate JWT token with role and email claims for optimization
            String token = jwtService.generateToken(user.getEmail(), user.getRole(), user.getEmail());
            
            // Create HttpOnly cookie for the JWT token
            Cookie sessionCookie = new Cookie("sessionToken", token);
            sessionCookie.setHttpOnly(true);
            sessionCookie.setSecure(true); // Set to true in production with HTTPS
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

    @PostMapping("/notifications/clear")
    public ResponseEntity<?> clearMyNotifications() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Not authenticated");
            }

            String email = authentication.getName();
            User user = userService.findByUsernameOrEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

            userService.clearNotifications(user);
            return ResponseEntity.ok().body("Notifications cleared");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to clear notifications");
        }
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
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error retrieving user info: " + e.getMessage());
        }
    }
    
    /**
     * Change user password
     */
    @PostMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(@RequestBody Map<String, String> request) {
        try {
            // Get the authenticated user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "User not authenticated"));
            }
            
            String email = authentication.getName();
            User currentUser = userService.findByUsernameOrEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
            
            String currentPassword = request.get("currentPassword");
            String newPassword = request.get("newPassword");
            
            if (currentPassword == null || newPassword == null || 
                currentPassword.trim().isEmpty() || newPassword.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Current password and new password are required"));
            }
            
            // Validate new password strength (basic validation)
            if (newPassword.length() < 6) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "New password must be at least 6 characters long"));
            }
            
            boolean success = userService.changePassword(currentUser.getId(), currentPassword, newPassword);
            
            if (success) {
                return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
            } else {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Current password is incorrect"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to change password: " + e.getMessage()));
        }
    }

    @PostMapping("/auth/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        // Create an empty cookie to clear the session token
        Cookie sessionCookie = new Cookie("sessionToken", "");
        sessionCookie.setHttpOnly(true);
        sessionCookie.setSecure(true); // Set to true in production with HTTPS
        sessionCookie.setPath("/");
        sessionCookie.setMaxAge(0); // Expire immediately
        response.addCookie(sessionCookie);
        
        Map<String, String> responseBody = new HashMap<>();
        responseBody.put("message", "Logout successful");
        
        return ResponseEntity.ok(responseBody);
    }
    
    /**
     * Send password reset code to email
     */
    @PostMapping("/auth/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            
            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Email address is required"));
            }
            
            // Generate reset code
            String resetCode = passwordResetService.generateResetCode(email);
            
            // Send email with reset code
            CreateEmailOptions params = CreateEmailOptions.builder()
                .from("PasswordReset@featureme.co")
                .to(email)
                .subject("FeatureMe Password Reset")
                .html("<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>" +
                      "<h2 style='color: #333;'>Password Reset Request</h2>" +
                      "<p>You requested to reset your password for your FeatureMe account.</p>" +
                      "<p>Your password reset code is:</p>" +
                      "<div style='background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;'>" +
                      "<h1 style='color: #007bff; font-size: 32px; letter-spacing: 4px; margin: 0;'>" + resetCode + "</h1>" +
                      "</div>" +
                      "<p><strong>This code will expire in 15 minutes.</strong></p>" +
                      "<p>If you didn't request this password reset, please ignore this email.</p>" +
                      "<p>For security reasons, this code can only be used once.</p>" +
                      "<hr style='margin: 30px 0; border: none; border-top: 1px solid #eee;'>" +
                      "<p style='color: #666; font-size: 14px;'>This is an automated message from FeatureMe. Please do not reply to this email.</p>" +
                      "</div>")
                .build();
            
            try {
                CreateEmailResponse data = resend.emails().send(params);
                System.out.println("Password reset email sent: " + data.getId());
            } catch (ResendException e) {
                e.printStackTrace();
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to send reset email. Please try again."));
            }
            
            return ResponseEntity.ok(Map.of("message", "Password reset code sent to your email"));
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "An error occurred. Please try again."));
        }
    }
    
    /**
     * Verify password reset code
     */
    @PostMapping("/auth/verify-reset-code")
    public ResponseEntity<Map<String, String>> verifyResetCode(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String code = request.get("code");
            
            if (email == null || email.trim().isEmpty() || code == null || code.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Email and code are required"));
            }
            
            boolean isValid = passwordResetService.verifyResetCode(email, code);
            
            if (isValid) {
                return ResponseEntity.ok(Map.of("message", "Code is valid"));
            } else {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid or expired code"));
            }
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "An error occurred. Please try again."));
        }
    }
    
    /**
     * Reset password with code
     */
    @PostMapping("/auth/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String code = request.get("code");
            String newPassword = request.get("newPassword");
            
            if (email == null || email.trim().isEmpty() || 
                code == null || code.trim().isEmpty() || 
                newPassword == null || newPassword.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Email, code, and new password are required"));
            }
            
            // Validate password strength
            if (newPassword.length() < 6) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Password must be at least 6 characters long"));
            }
            
            boolean success = passwordResetService.resetPassword(email, code, newPassword);
            
            if (success) {
                return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
            } else {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid code or password reset failed"));
            }
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "An error occurred. Please try again."));
        }
    }
    
    
    
}
