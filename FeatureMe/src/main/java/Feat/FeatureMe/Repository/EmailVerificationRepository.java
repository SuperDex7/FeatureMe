package Feat.FeatureMe.Repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import Feat.FeatureMe.Entity.EmailVerification;

@Repository
public interface EmailVerificationRepository extends MongoRepository<EmailVerification, String> {

    Optional<EmailVerification> findByEmail(String email);

    void deleteByEmail(String email);
}
