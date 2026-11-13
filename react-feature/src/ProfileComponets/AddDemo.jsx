import { useState } from "react";
import Icon from "../Components/ui/Icon";
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
            
            await DemoService.createDemo(demoData, file);
            
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
    <form onSubmit={handleDemoSubmit} className="fm-demo-form">
        <p className="fm-field__hint">Share a short demo so other artists can hear your sound.</p>

        <div className="fm-field">
            <label htmlFor="demo-title" className="fm-field__label">Song title</label>
            <input
                type="text"
                id="demo-title"
                name="title"
                className="fm-input"
                placeholder="Enter your song title"
                value={demoForm.title}
                onChange={handleChange}
                maxLength={20}
                required
                data-autofocus
            />
            <span className={`fm-field__hint fm-demo-form__count${demoForm.title.length >= 20 ? ' is-limit' : ''}`}>
                {demoForm.title.length}/20
            </span>
        </div>

        <div className="fm-field">
            <label htmlFor="demo-features" className="fm-field__label">Featured artists (optional)</label>
            <input
                type="text"
                id="demo-features"
                name="features"
                className="fm-input"
                placeholder="e.g. John Doe, Jane Smith"
                value={demoForm.features}
                onChange={handleChange}
                maxLength={35}
                aria-describedby="demo-features-hint"
            />
            <span id="demo-features-hint" className="fm-field__hint">
                Separate names with commas. They don&apos;t need FeatureMe accounts. {demoForm.features.length}/35
            </span>
        </div>

        <div className="fm-field">
            <span className="fm-field__label" id="demo-file-label">Audio file</span>
            <label htmlFor="demo-file" className={`fm-demo-form__file${file ? ' has-file' : ''}`}>
                <input
                    type="file"
                    id="demo-file"
                    name="file"
                    accept={userRole === 'USERPLUS' ? '.mp3,.wav' : '.mp3'}
                    onChange={handleFileChange}
                    required
                    className="fm-visually-hidden"
                    aria-labelledby="demo-file-label"
                    aria-describedby="demo-file-status"
                />
                <Icon name={file ? 'music' : 'download'} size={22} className={file ? '' : 'fm-demo-form__upload-icon'} />
                <span className="fm-demo-form__file-text">
                    <span className="fm-demo-form__file-name">{file ? file.name : 'Choose an audio file'}</span>
                    <span className="fm-field__hint">
                        {file
                            ? `${(file.size / (1024 * 1024)).toFixed(2)} MB · click to change`
                            : userRole === 'USERPLUS'
                                ? `MP3 or WAV, up to ${FILE_SIZE_LIMITS.USERPLUS} MB`
                                : `MP3 only, up to ${FILE_SIZE_LIMITS.USER} MB`}
                    </span>
                </span>
            </label>
            <span id="demo-file-status" role={fileError ? 'alert' : undefined} className={fileError ? 'fm-field__error' : 'fm-field__hint'}>
                {fileError || (file ? 'Ready to upload.' : '')}
            </span>
        </div>

        <div className="fm-demo-form__actions">
            {setAddDemo && (
                <button type="button" className="fm-btn fm-btn--secondary" onClick={() => setAddDemo(false)} disabled={isSubmitting}>
                    Cancel
                </button>
            )}
            <button type="submit" className="fm-btn fm-btn--primary" disabled={isSubmitting}>
                {isSubmitting ? 'Uploading...' : 'Upload demo'}
            </button>
        </div>
    </form>
)
}
export default AddDemo