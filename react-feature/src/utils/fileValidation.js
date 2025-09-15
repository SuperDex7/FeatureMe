/**
 * File validation utilities for chat file uploads based on user role
 */

// File size limits in MB
export const FILE_SIZE_LIMITS = {
  USER: 15, // 15MB for regular users
  USERPLUS: 90 // 90MB for USERPLUS users
};

// Allowed file types by user role
export const ALLOWED_FILE_TYPES = {
  USER: {
    images: ['.jpg', '.jpeg', '.png'],
    audio: ['.mp3']
  },
  USERPLUS: {
    images: ['.jpg', '.jpeg', '.png', '.gif'],
    audio: ['.mp3', '.wav']
  }
};

/**
 * Validates a file based on user role
 * @param {File} file - The file to validate
 * @param {string} userRole - The user's role ('USER' or 'USERPLUS')
 * @returns {Object} - { isValid: boolean, error: string|null }
 */
export const validateChatFile = (file, userRole) => {
  if (!file) {
    return { isValid: false, error: 'No file selected' };
  }

  // Check if user role is valid
  if (!userRole || !['USER', 'USERPLUS'].includes(userRole)) {
    return { isValid: false, error: 'Invalid user role' };
  }

  // Get file extension
  const fileName = file.name;
  const fileExtension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
  
  // Get allowed types for user role
  const allowedTypes = ALLOWED_FILE_TYPES[userRole];
  const allAllowedExtensions = [...allowedTypes.images, ...allowedTypes.audio];
  
  // Check file type
  if (!allAllowedExtensions.includes(fileExtension)) {
    const allowedTypesStr = allAllowedExtensions.join(', ');
    return { 
      isValid: false, 
      error: `File type not allowed for ${userRole} users. Allowed types: ${allowedTypesStr}` 
    };
  }

  // Check file size
  const maxSizeMB = FILE_SIZE_LIMITS[userRole];
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  if (file.size > maxSizeBytes) {
    return { 
      isValid: false, 
      error: `File size exceeds ${maxSizeMB}MB limit for ${userRole} users` 
    };
  }

  return { isValid: true, error: null };
};

/**
 * Validates a chat photo file based on user role
 * @param {File} file - The file to validate
 * @param {string} userRole - The user's role ('USER' or 'USERPLUS')
 * @returns {Object} - { isValid: boolean, error: string|null }
 */
export const validateChatPhoto = (file, userRole) => {
  if (!file) {
    return { isValid: false, error: 'No file selected' };
  }

  // Check if user role is valid
  if (!userRole || !['USER', 'USERPLUS'].includes(userRole)) {
    return { isValid: false, error: 'Invalid user role' };
  }

  // Get file extension
  const fileName = file.name;
  const fileExtension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
  
  // Get allowed image types for user role
  const allowedImageTypes = ALLOWED_FILE_TYPES[userRole].images;
  
  // Check file type (only images allowed for chat photos)
  if (!allowedImageTypes.includes(fileExtension)) {
    const allowedTypesStr = allowedImageTypes.join(', ');
    return { 
      isValid: false, 
      error: `Image type not allowed for ${userRole} users. Allowed types: ${allowedTypesStr}` 
    };
  }

  // Check file size
  const maxSizeMB = FILE_SIZE_LIMITS[userRole];
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  if (file.size > maxSizeBytes) {
    return { 
      isValid: false, 
      error: `Image size exceeds ${maxSizeMB}MB limit for ${userRole} users` 
    };
  }

  return { isValid: true, error: null };
};

/**
 * Formats file size in human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Gets user-friendly file type restrictions message
 * @param {string} userRole - The user's role
 * @returns {string} - User-friendly message about file restrictions
 */
export const getFileRestrictionsMessage = (userRole) => {
  if (!userRole || !['USER', 'USERPLUS'].includes(userRole)) {
    return 'File upload not available';
  }

  const allowedTypes = ALLOWED_FILE_TYPES[userRole];
  const maxSize = FILE_SIZE_LIMITS[userRole];
  
  const imageTypes = allowedTypes.images.join(', ');
  const audioTypes = allowedTypes.audio.join(', ');
  
  return `As a ${userRole} user, you can upload:
• Images: ${imageTypes} (max ${maxSize}MB)
• Audio: ${audioTypes} (max ${maxSize}MB)`;
};
