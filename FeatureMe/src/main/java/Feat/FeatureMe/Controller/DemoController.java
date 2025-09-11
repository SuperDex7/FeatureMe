package Feat.FeatureMe.Controller;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import Feat.FeatureMe.Entity.Demos;
import Feat.FeatureMe.Entity.User;
import Feat.FeatureMe.Service.DemoService;
import Feat.FeatureMe.Service.S3Service;
import Feat.FeatureMe.Service.UserService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;



@CrossOrigin("*")
@RestController
@RequestMapping("/api/demos")
public class DemoController {
    private final S3Service s3Service;
    private final UserService userService;
    private final DemoService demoService;
    
    public DemoController(S3Service s3Service, UserService userService, DemoService demoService) {
        
        this.s3Service = s3Service;
        this.userService = userService;
        this.demoService = demoService;
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
        
         // Upload file to S3 bucket
         String keyName = file.getOriginalFilename();
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
