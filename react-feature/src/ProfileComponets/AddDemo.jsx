import React, { useState, useEffect } from "react";
import DemoService from "../services/DemoService";

function AddDemo({ setAddDemo, onDemoAdded, userRole }){
    const [demoForm, setDemoForm] = useState({
        title: '',
        features: '',
      })
      const [file, setFile]= useState()
      const [isSubmitting, setIsSubmitting] = useState(false)
      const [fileError, setFileError] = useState('')
      
      // File size limits (in MB)
      const FILE_SIZE_LIMITS = {
        USER: 15, // 15MB for regular users
        USERPLUS: 90 // 90MB for UserPlus users
      }
      
      // Allowed file types based on user role
      const getAllowedFileTypes = () => {
        if (userRole === 'USERPLUS') {
          return ['audio/mpeg', 'audio/wav', 'audio/wave', 'audio/x-wav']
        } else {
          return ['audio/mpeg'] // Only MP3 for regular users
        }
      }
      
      const getAllowedExtensions = () => {
        if (userRole === 'USERPLUS') {
          return ['.mp3', '.wav']
        } else {
          return ['.mp3']
        }
      }
      
      // Validate file before setting it
      const validateFile = (selectedFile) => {
        setFileError('')
        
        if (!selectedFile) {
          setFileError('Please select a file')
          return false
        }
        
        // Check file type
        const allowedTypes = getAllowedFileTypes()
        const allowedExtensions = getAllowedExtensions()
        
        const fileExtension = selectedFile.name.toLowerCase().substring(selectedFile.name.lastIndexOf('.'))
        const isValidType = allowedTypes.includes(selectedFile.type) || allowedExtensions.includes(fileExtension)
        
        if (!isValidType) {
          const extensions = allowedExtensions.join(', ')
          setFileError(`Invalid file type. Only ${extensions} files are allowed for ${userRole === 'USERPLUS' ? 'UserPlus' : 'regular'} users.`)
          return false
        }
        
        // Check file size
        const maxSizeMB = FILE_SIZE_LIMITS[userRole] || FILE_SIZE_LIMITS.USER
        const maxSizeBytes = maxSizeMB * 1024 * 1024
        
        if (selectedFile.size > maxSizeBytes) {
          setFileError(`File size too large. Maximum allowed size is ${maxSizeMB}MB for ${userRole === 'USERPLUS' ? 'UserPlus' : 'regular'} users.`)
          return false
        }
        
        return true
      }
      
      const handleFileChange = (e) => {
        const selectedFile = e.target.files[0]
        if (validateFile(selectedFile)) {
          setFile(selectedFile)
        } else {
          setFile(null)
          // Reset the file input
          e.target.value = ''
        }
      }

    const handleDemoSubmit = async (e) => {
        e.preventDefault();
        
        if (!file) {
            setFileError("Please select a file to upload.");
            return;
        }
        
        if (!demoForm.title.trim()) {
            alert("Please enter a title.");
            return;
        }
        
        // Final validation before submission
        if (!validateFile(file)) {
            return;
        }
        
        setIsSubmitting(true);
        
        try {
            const demoData = {
                title: demoForm.title.trim(),
                features: demoForm.features
            };
            
            const response = await DemoService.createDemo(demoData, file);
            
            alert("Demo uploaded successfully!");
            
            // Reset form
            setDemoForm({ title: '', features: '' });
            setFile(null);
            
            // Notify parent component to refresh demos list
            if (onDemoAdded) {
                onDemoAdded();
            }
            
            // Close the form if setAddDemo is provided
            if (setAddDemo) {
                setAddDemo(false);
            }
            
        } catch (err) {
            console.error("Error creating demo:", err);
            alert("Failed to upload demo. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }
    
    const handleChange = (e) => {
        setDemoForm({...demoForm, [e.target.name]: e.target.value})
    }
return (
    <div className="add-demo-form">
        <h4>Add New Demo</h4>
        <form onSubmit={handleDemoSubmit}>
            <div className="demo-form-group">
                <label htmlFor="title">Song Title:</label>
                <input 
                    type="text" 
                    id="title"
                    placeholder="Enter song title" 
                    name="title" 
                    value={demoForm.title}
                    onChange={handleChange}
                    maxLength={20}
                    required
                />
                <small className={
                    demoForm.title.length >= 20 ? 'character-limit' : 
                    demoForm.title.length >= 15 ? 'character-warning' : ''
                }>
                    {demoForm.title.length}/20 characters
                </small>
            </div>
            
            <div className="demo-form-group">
                <label htmlFor="features">Featured Artists:</label>
                <input 
                    type="text" 
                    id="features"
                    placeholder="e.g., John Doe, Jane Smith, TheRebel999" 
                    name="features" 
                    value={demoForm.features}
                    onChange={handleChange}
                    maxLength={35}
                />
                <small className={
                    demoForm.features.length >= 35 ? 'character-limit' : 
                    demoForm.features.length >= 30 ? 'character-warning' : ''
                }>
                    {demoForm.features.length}/20 characters - Enter artist names separated by commas (they don't need accounts on FeatureMe)
                </small>
            </div>
            
            <div className="demo-form-group">
                <label htmlFor="file">Audio File:</label>
                <input 
                    type="file" 
                    id="file"
                    name="file" 
                    accept={userRole === 'USERPLUS' ? '.mp3,.wav' : '.mp3'}
                    onChange={handleFileChange}
                    required
                />
                <small>
                    {userRole === 'USERPLUS' 
                        ? `Supported formats: MP3, WAV (Max ${FILE_SIZE_LIMITS.USERPLUS}MB)` 
                        : `Supported formats: MP3 only (Max ${FILE_SIZE_LIMITS.USER}MB)`
                    }
                </small>
                {fileError && (
                    <div className="demo-file-error">
                        ❌ {fileError}
                    </div>
                )}
                {file && !fileError && (
                    <div className="demo-file-success">
                        ✅ {file.name} ({(file.size / (1024 * 1024)).toFixed(2)}MB)
                    </div>
                )}
            </div>
            
            <div className="demo-form-actions">
                <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="demo-submit-btn"
                >
                    {isSubmitting ? "Uploading..." : "Upload Demo"}
                </button>
                
                {setAddDemo && (
                    <button 
                        type="button"
                        className="demo-cancel-btn"
                        onClick={() => setAddDemo(false)}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                )}
            </div>
        </form>
    </div>
)
}
export default AddDemo