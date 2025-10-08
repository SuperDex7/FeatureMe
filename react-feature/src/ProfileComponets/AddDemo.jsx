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
    <div className="add-demo-form-new">
        <div className="form-header-new">
            <div className="form-icon">🎵</div>
            <h4 className="form-title-new">Upload New Demo</h4>
            <p className="form-subtitle-new">Share your music with the world</p>
        </div>
        
        <form onSubmit={handleDemoSubmit} className="demo-form-new">
            <div className="demo-form-group-new">
                <label htmlFor="title" className="form-label-new">
                    <span className="label-icon">🎼</span>
                    Song Title
                </label>
                <div className="input-wrapper-new">
                    <input 
                        type="text" 
                        id="title"
                        placeholder="Enter your song title" 
                        name="title" 
                        value={demoForm.title}
                        onChange={handleChange}
                        maxLength={20}
                        required
                        className="form-input-new"
                    />
                    <div className="input-border"></div>
                </div>
                <div className={`char-counter-new ${
                    demoForm.title.length >= 20 ? 'char-limit' : 
                    demoForm.title.length >= 15 ? 'char-warning' : ''
                }`}>
                    {demoForm.title.length}/20 characters
                </div>
            </div>
            
            <div className="demo-form-group-new">
                <label htmlFor="features" className="form-label-new">
                    <span className="label-icon">👥</span>
                    Featured Artists
                </label>
                <div className="input-wrapper-new">
                    <input 
                        type="text" 
                        id="features"
                        placeholder="e.g., John Doe, Jane Smith, TheRebel999" 
                        name="features" 
                        value={demoForm.features}
                        onChange={handleChange}
                        maxLength={35}
                        className="form-input-new"
                    />
                    <div className="input-border"></div>
                </div>
                <div className={`char-counter-new ${
                    demoForm.features.length >= 35 ? 'char-limit' : 
                    demoForm.features.length >= 30 ? 'char-warning' : ''
                }`}>
                    {demoForm.features.length}/35 characters
                </div>
                <div className="field-help-new">
                    💡 Enter artist names separated by commas (they don't need FeatureMe accounts)
                </div>
            </div>
            
            <div className="demo-form-group-new">
                <label htmlFor="file" className="form-label-new">
                    <span className="label-icon">🎧</span>
                    Audio File
                </label>
                
                <div className="file-upload-area-new">
                    <input 
                        type="file" 
                        id="file"
                        name="file" 
                        accept={userRole === 'USERPLUS' ? '.mp3,.wav' : '.mp3'}
                        onChange={handleFileChange}
                        required
                        className="file-input-hidden"
                    />
                    <label htmlFor="file" className="file-upload-label-new">
                        {file ? (
                            <div className="file-selected-new">
                                <div className="file-icon-new">🎵</div>
                                <div className="file-info-new">
                                    <div className="file-name-new">{file.name}</div>
                                    <div className="file-size-new">{(file.size / (1024 * 1024)).toFixed(2)} MB</div>
                                </div>
                                <div className="file-change-btn">Change</div>
                            </div>
                        ) : (
                            <div className="file-upload-prompt-new">
                                <div className="upload-icon-new">
                                    <svg viewBox="0 0 24 24" fill="none">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <polyline points="10,9 9,9 8,9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                                <div className="upload-text-new">
                                    <div className="upload-title-new">Choose Audio File</div>
                                    <div className="upload-subtitle-new">
                                        {userRole === 'USERPLUS' 
                                            ? `MP3, WAV (Max ${FILE_SIZE_LIMITS.USERPLUS}MB)` 
                                            : `MP3 only (Max ${FILE_SIZE_LIMITS.USER}MB)`
                                        }
                                    </div>
                                </div>
                            </div>
                        )}
                    </label>
                </div>
                
                {fileError && (
                    <div className="file-error-new">
                        <svg className="error-icon" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                            <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2"/>
                            <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        {fileError}
                    </div>
                )}
                
                {file && !fileError && (
                    <div className="file-success-new">
                        <svg className="success-icon" viewBox="0 0 24 24" fill="none">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <polyline points="22,4 12,14.01 9,11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        File ready for upload
                    </div>
                )}
            </div>
            
            <div className="demo-form-actions-new">
                <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="demo-submit-btn-new"
                >
                    <div className="btn-content">
                        {isSubmitting ? (
                            <>
                                <div className="loading-spinner-new"></div>
                                <span>Uploading...</span>
                            </>
                        ) : (
                            <>
                                <svg className="upload-icon" viewBox="0 0 24 24" fill="none">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <polyline points="17,8 12,3 7,8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                <span>Upload Demo</span>
                            </>
                        )}
                    </div>
                </button>
                
                {setAddDemo && (
                    <button 
                        type="button"
                        className="demo-cancel-btn-new"
                        onClick={() => setAddDemo(false)}
                        disabled={isSubmitting}
                    >
                        <svg className="cancel-icon" viewBox="0 0 24 24" fill="none">
                            <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span>Cancel</span>
                    </button>
                )}
            </div>
        </form>
    </div>
)
}
export default AddDemo