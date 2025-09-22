package Feat.FeatureMe.Repository;

import Feat.FeatureMe.Entity.PasswordResetCode;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PasswordResetCodeRepository extends MongoRepository<PasswordResetCode, String> {
    
    Optional<PasswordResetCode> findByCodeAndEmailAndUsedFalse(String code, String email);
    
    List<PasswordResetCode> findByEmailAndUsedFalseOrderByCreatedAtDesc(String email);
    
    void deleteByEmail(String email);
    
    long countByEmailAndCreatedAtAfter(String email, LocalDateTime since);
    
    void deleteByExpiresAtBefore(LocalDateTime expiryTime);
}
