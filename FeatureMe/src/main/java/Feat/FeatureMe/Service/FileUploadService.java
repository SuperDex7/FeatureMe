package Feat.FeatureMe.Service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.util.UUID;
import Feat.FeatureMe.Entity.User;

@Service
public class FileUploadService {
    
    /**
     * Generates a unique filename while preserving the original file extension
     * @param file The uploaded file
     * @return A unique filename with the original extension
     */
    public String generateUniqueFilename(MultipartFile file) {
        String originalFilename = file.getOriginalFilename();
        String fileExtension = "";
        
        if (originalFilename != null && originalFilename.contains(".")) {
            fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        
        return UUID.randomUUID().toString() + fileExtension;
    }
    
    /**
     * Generates a unique filename with folder organization
     * @param file The uploaded file
     * @param folder The S3 folder (e.g., "images", "audio", "documents")
     * @return A unique filename with folder path
     */
    public String generateUniqueFilenameWithFolder(MultipartFile file, String folder) {
        String originalFilename = file.getOriginalFilename();
        String fileExtension = "";
        
        if (originalFilename != null && originalFilename.contains(".")) {
            fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        
        return folder + "/" + UUID.randomUUID().toString() + fileExtension;
    }
    
    /**
     * Generates a unique filename with a custom prefix
     * @param file The uploaded file
     * @param prefix The prefix to add before the UUID
     * @return A unique filename with prefix and original extension
     */
    public String generateUniqueFilename(MultipartFile file, String prefix) {
        String originalFilename = file.getOriginalFilename();
        String fileExtension = "";
        
        if (originalFilename != null && originalFilename.contains(".")) {
            fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        
        return prefix + "_" + UUID.randomUUID().toString() + fileExtension;
    }
    
    /**
     * Validates file size and type for security
     * @param file The uploaded file
     * @param maxSizeInMB Maximum file size in MB
     * @param allowedTypes Array of allowed MIME types (null for no restriction)
     * @throws IllegalArgumentException if validation fails
     */
    public void validateFile(MultipartFile file, int maxSizeInMB, String[] allowedTypes) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }
        
        long maxSize = maxSizeInMB * 1024L * 1024L; // Convert MB to bytes
        if (file.getSize() > maxSize) {
            throw new IllegalArgumentException("File size exceeds " + maxSizeInMB + "MB limit");
        }
        
        if (allowedTypes != null) {
            String contentType = file.getContentType();
            boolean isValidType = false;
            
            for (String allowedType : allowedTypes) {
                if (contentType != null && contentType.startsWith(allowedType)) {
                    isValidType = true;
                    break;
                }
            }
            
            if (!isValidType) {
                throw new IllegalArgumentException("File type not allowed. Allowed types: " + String.join(", ", allowedTypes));
            }
        }
    }
    
    /**
     * Validates file based on user role with appropriate size limits and file types
     * @param file The uploaded file
     * @param user The user uploading the file
     * @param allowedTypes Array of allowed MIME types (null for no restriction)
     * @throws IllegalArgumentException if validation fails
     */
    public void validateFileForUser(MultipartFile file, User user, String[] allowedTypes) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }
        
        // Determine max file size based on user role
        int maxSizeInMB;
        if ("USERPLUS".equals(user.getRole())) {
            maxSizeInMB = 90; // USERPLUS gets 90MB
        } else {
            maxSizeInMB = 15; // Regular USER gets 15MB
        }
        
        long maxSize = maxSizeInMB * 1024L * 1024L; // Convert MB to bytes
        if (file.getSize() > maxSize) {
            throw new IllegalArgumentException("File size exceeds " + maxSizeInMB + "MB limit for " + user.getRole() + " users");
        }
        
        if (allowedTypes != null) {
            String contentType = file.getContentType();
            boolean isValidType = false;
            
            for (String allowedType : allowedTypes) {
                if (contentType != null && contentType.startsWith(allowedType)) {
                    isValidType = true;
                    break;
                }
            }
            
            if (!isValidType) {
                throw new IllegalArgumentException("File type not allowed. Allowed types: " + String.join(", ", allowedTypes));
            }
        }
    }
    
    /**
     * Validates file based on user role with role-specific file type restrictions
     * @param file The uploaded file
     * @param user The user uploading the file
     * @param fileCategory The category of file (e.g., "image", "audio", "general")
     * @throws IllegalArgumentException if validation fails
     */
    public void validateFileForUserByCategory(MultipartFile file, User user, String fileCategory) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }
        
        // Determine max file size based on user role
        int maxSizeInMB;
        if ("USERPLUS".equals(user.getRole())) {
            maxSizeInMB = 90; // USERPLUS gets 90MB
        } else {
            maxSizeInMB = 15; // Regular USER gets 15MB
        }
        
        long maxSize = maxSizeInMB * 1024L * 1024L; // Convert MB to bytes
        if (file.getSize() > maxSize) {
            throw new IllegalArgumentException("File size exceeds " + maxSizeInMB + "MB limit for " + user.getRole() + " users");
        }
        
        // Get allowed file types based on user role and file category
        String[] allowedTypes = getAllowedFileTypesForUser(user, fileCategory);
        if (allowedTypes != null && allowedTypes.length > 0) {
            String contentType = file.getContentType();
            String originalFilename = file.getOriginalFilename();
            boolean isValidType = false;
            
            // Check MIME type
            for (String allowedType : allowedTypes) {
                if (contentType != null && contentType.startsWith(allowedType)) {
                    isValidType = true;
                    break;
                }
            }
            
            // Also check file extension as backup
            if (!isValidType && originalFilename != null) {
                String fileExtension = originalFilename.toLowerCase();
                if (fileExtension.contains(".")) {
                    fileExtension = fileExtension.substring(fileExtension.lastIndexOf("."));
                    
                    String[] allowedExtensions = getAllowedExtensionsForUser(user, fileCategory);
                    for (String allowedExt : allowedExtensions) {
                        if (fileExtension.equals(allowedExt.toLowerCase())) {
                            isValidType = true;
                            break;
                        }
                    }
                }
            }
            
            if (!isValidType) {
                String allowedTypesStr = String.join(", ", getAllowedExtensionsForUser(user, fileCategory));
                throw new IllegalArgumentException("File type not allowed for " + user.getRole() + " users. Allowed types: " + allowedTypesStr);
            }
        }
    }
    
    /**
     * Gets allowed file types based on user role and file category
     * @param user The user
     * @param fileCategory The category of file
     * @return Array of allowed MIME types
     */
    private String[] getAllowedFileTypesForUser(User user, String fileCategory) {
        if ("image".equals(fileCategory)) {
            if ("USERPLUS".equals(user.getRole())) {
                return new String[]{"image/png", "image/jpeg", "image/gif"};
            } else {
                return new String[]{"image/png", "image/jpeg"};
            }
        } else if ("audio".equals(fileCategory)) {
            if ("USERPLUS".equals(user.getRole())) {
                return new String[]{"audio/mpeg", "audio/wav"};
            } else {
                return new String[]{"audio/mpeg"};
            }
        }
        return null; // No restrictions
    }
    
    /**
     * Gets allowed file extensions based on user role and file category
     * @param user The user
     * @param fileCategory The category of file
     * @return Array of allowed file extensions
     */
    private String[] getAllowedExtensionsForUser(User user, String fileCategory) {
        if ("image".equals(fileCategory)) {
            if ("USERPLUS".equals(user.getRole())) {
                return new String[]{".png", ".jpg", ".jpeg", ".gif"};
            } else {
                return new String[]{".png", ".jpg", ".jpeg"};
            }
        } else if ("audio".equals(fileCategory)) {
            if ("USERPLUS".equals(user.getRole())) {
                return new String[]{".mp3", ".wav"};
            } else {
                return new String[]{".mp3"};
            }
        }
        return null; // No restrictions
    }
    
    /**
     * Gets the maximum file size in MB for a user based on their role
     * @param user The user
     * @return Maximum file size in MB
     */
    public int getMaxFileSizeForUser(User user) {
        if ("USERPLUS".equals(user.getRole())) {
            return 90; // USERPLUS gets 90MB
        } else {
            return 15; // Regular USER gets 15MB
        }
    }
}
