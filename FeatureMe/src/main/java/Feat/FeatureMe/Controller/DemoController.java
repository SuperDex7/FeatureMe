package Feat.FeatureMe.Controller;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.concurrent.CompletableFuture;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import Feat.FeatureMe.Entity.Demos;
import Feat.FeatureMe.Entity.User;
import Feat.FeatureMe.Service.DemoService;
import Feat.FeatureMe.Service.S3Service;
import Feat.FeatureMe.Service.UserService;
import Feat.FeatureMe.Service.FileUploadService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;



@RestController
@RequestMapping("/api/demos")
public class DemoController {
    private final S3Service s3Service;
    private final UserService userService;
    private final DemoService demoService;
    private final FileUploadService fileUploadService;
    
    public DemoController(S3Service s3Service, UserService userService, DemoService demoService, FileUploadService fileUploadService) {
        
        this.s3Service = s3Service;
        this.userService = userService;
        this.demoService = demoService;
        this.fileUploadService = fileUploadService;
    }

    @PostMapping("/create")
    public Demos createDemo (@RequestPart("file") MultipartFile file, @RequestPart("demo") Demos demo ) throws IOException {
        // Get the authenticated user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }
        
        String email = authentication.getName();
        User user = userService.findByUsernameOrEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
         // Validate file with role-based size limits and file types
         fileUploadService.validateFileForUserByCategory(file, user, "audio");
         
         // Upload file to S3 bucket with unique filename and folder organization
         String keyName = fileUploadService.generateUniqueFilenameWithFolder(file, "audio/demos");
         File tempFile = File.createTempFile("temp", null);
         file.transferTo(tempFile);
         String filePath = tempFile.getAbsolutePath();
         
         // Upload the file and get its S3 URL
         String s3Url = s3Service.uploadFile(keyName, filePath);
         
         // Set the S3 URL (e.g., to the "music" field) in the Posts entity
         demo.setSongUrl(s3Url);
         demo.setCreatorId(user.getId());
         
         // Create the post and return the DTO
         return demoService.createPost(user.getId(), demo);
        // return demoService.getDemoById(createdDemo.getId());
    }
    
    // Create a demo with async file upload to prevent thread pool exhaustion
    @PostMapping("/create-async")
    public CompletableFuture<Demos> createDemoAsync(@RequestPart("file") MultipartFile file, @RequestPart("demo") Demos demo) throws IOException {
        // Get the authenticated user (capture for async propagation)
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }
        
        String email = authentication.getName();
        User user = userService.findByUsernameOrEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Validate file with role-based size limits and file types
        fileUploadService.validateFileForUserByCategory(file, user, "audio");
        
        // Generate unique filename
        String keyName = fileUploadService.generateUniqueFilenameWithFolder(file, "audio/demos");
        
        // Convert file to byte array for async upload
        byte[] fileContent = file.getBytes();
        
        // Upload file asynchronously and create demo when upload completes
        return s3Service.uploadFileAsync(keyName, fileContent)
            .thenApply(s3Url -> {
                // Restore authentication in async thread
                SecurityContextHolder.getContext().setAuthentication(authentication);
                try {
                    // Set the S3 URL in the Demo entity
                    demo.setSongUrl(s3Url);
                    demo.setCreatorId(user.getId());
                    
                    // Create the demo and return it
                    return demoService.createPost(user.getId(), demo);
                } catch (Exception e) {
                    throw new RuntimeException("Failed to create demo after upload: " + e.getMessage(), e);
                } finally {
                    // Avoid leaking auth to other tasks on this thread
                    SecurityContextHolder.clearContext();
                }
            })
            .exceptionally(throwable -> {
                throw new RuntimeException("Failed to create demo: " + throwable.getMessage(), throwable);
            });
    }

    @GetMapping("/get/user/{id}")
    public List<Demos> getAllDemos(@PathVariable String id) {
        // Get the authenticated user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }
        
        String email = authentication.getName();
       userService.findByUsernameOrEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
            

        return demoService.getAllDemos(id);
    }
    @GetMapping("/get/id/{id}")
    public Demos getDemoById(@PathVariable String id) {
        return demoService.getDemoById(id);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<String> deleteDemo(@PathVariable String id){
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }
        
        String email = authentication.getName();
        User user = userService.findByUsernameOrEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));

        demoService.deleteDemo(user.getId(),id);
        return ResponseEntity.ok("Post Deleted Successfully");
    }
    
}
