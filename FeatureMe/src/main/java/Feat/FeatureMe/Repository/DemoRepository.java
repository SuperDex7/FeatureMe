package Feat.FeatureMe.Repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import Feat.FeatureMe.Entity.Demos;
@Repository
public interface DemoRepository extends MongoRepository<Demos, String> {

    
} 