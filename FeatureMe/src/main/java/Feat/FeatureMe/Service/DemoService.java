package Feat.FeatureMe.Service;


import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import Feat.FeatureMe.Entity.Demos;
import Feat.FeatureMe.Entity.User;
import Feat.FeatureMe.Repository.DemoRepository;
import Feat.FeatureMe.Repository.UserRepository;
import Feat.FeatureMe.Service.S3Service;



@Service
public class DemoService {
    
    private final UserRepository userRepository;
    private final DemoRepository demoRepository;
    private final S3Service s3Service;
    
    public DemoService(UserRepository userRepository, DemoRepository demoRepository, S3Service s3Service){
        this.userRepository = userRepository;
        this.demoRepository = demoRepository;
        this.s3Service = s3Service;
    }

    public Demos createPost(String userId, Demos demo) {
    User author = userRepository.findById(userId).get();

        Demos demos = demoRepository.insert(demo);
        if (author.getDemo() == null) {
            author.setDemo(new ArrayList<>());
        }
        author.getDemo().add(demos.getId());
        userRepository.save(author);

        return demos;
    

    }

    public List<Demos> getAllDemos(String id) {
        User user = userRepository.findById(id).get();

        if (user.getDemo() ==null) {
                    user.setDemo(new ArrayList<>());
                }
        List<String> demos = user.getDemo();
        


        return demoRepository.findAllById(demos);
    }

    public void deleteDemo(String id, String demoId) {
        User user = userRepository.findById(id).get();
        
        // Get the demo before deleting it to access the S3 file URL
        Demos demo = demoRepository.findById(demoId).orElse(null);
        
        // Delete the associated S3 file before deleting the demo
        if (demo != null && demo.getSongUrl() != null && !demo.getSongUrl().isEmpty()) {
            try {
                String s3Key = s3Service.extractKeyFromUrl(demo.getSongUrl());
                
                boolean deleted = s3Service.deleteFile(s3Key);
                if (deleted) {
                    System.out.println("Successfully deleted S3 file: " + s3Key);
                } else {
                    System.err.println("Failed to delete S3 file: " + s3Key);
                }
            } catch (Exception e) {
                System.err.println("Error deleting S3 file for demo " + demoId + ": " + e.getMessage());
            }
        }
        
        // Remove demo from user's demo list
        user.getDemo().remove(demoId);
        userRepository.save(user);
        
        // Delete the demo from database
        demoRepository.deleteById(demoId);
    }

    public Demos getDemoById(String id) {
        return demoRepository.findById(id).get();
    }
   
    
    
    
   
    
}
