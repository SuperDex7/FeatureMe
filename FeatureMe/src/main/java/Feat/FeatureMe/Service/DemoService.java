package Feat.FeatureMe.Service;


import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import Feat.FeatureMe.Entity.Demos;
import Feat.FeatureMe.Entity.User;
import Feat.FeatureMe.Repository.DemoRepository;
import Feat.FeatureMe.Repository.UserRepository;



@Service
public class DemoService {
    
    private final UserRepository userRepository;
    private final DemoRepository demoRepository;
    public DemoService(UserRepository userRepository, DemoRepository demoRepository){
        this.userRepository = userRepository;
        this.demoRepository = demoRepository;
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
        //List<String> demoList = user.getDemo();
        //demoList.remove(id)
        user.getDemo().remove(demoId);
        userRepository.save(user);
        demoRepository.deleteById(demoId);


    }

    public Demos getDemoById(String id) {
        return demoRepository.findById(id).get();
    }
   
    
    
    
   
    
}
