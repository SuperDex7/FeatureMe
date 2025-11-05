import React, { useState, useEffect, useRef } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet, 
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import Header from "../components/ui/Header";
import api from "../services/api";

export default function SignupPage() {
  const [step, setStep] = useState(1); // 1 = email/password, 2 = verification, 3 = username, 4 = about, 5 = profile pics, 6 = preview
  const [formData, setFormData] = useState({
    userName: "",
    password: "",
    confirmPassword: "",
    email: "",
    role: "USER",
    bio: "",
    about: "",
    profilePic: null,
    banner: null,
    location: "",
    socialMedia: [],
    badges: [],
    demo: [],
    featuredOn: [],
    posts: []
  });
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  
  // Email verification state
  const [verificationCode, setVerificationCode] = useState("");
  const [encryptedCode, setEncryptedCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState("");
  
  // Validation state
  const [passwordError, setPasswordError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usernameValidation, setUsernameValidation] = useState({ 
    isValidating: false, 
    available: null, 
    error: null 
  });
  const [emailValidation, setEmailValidation] = useState({ 
    isValidating: false, 
    available: null, 
    error: null 
  });

  const PASSWORD_MIN = 6;
  const emailTimeoutRef = useRef(null);
  const usernameTimeoutRef = useRef(null);

  // Check if step 1 form is valid
  const isStep1Valid = () => {
    return (
      formData.email &&
      formData.password &&
      formData.confirmPassword &&
      emailValidation.available === true &&
      !emailValidation.isValidating &&
      formData.password === formData.confirmPassword &&
      formData.password.length >= 6
    );
  };

  // Debounced email availability check
  useEffect(() => {
    if (emailTimeoutRef.current) {
      clearTimeout(emailTimeoutRef.current);
    }

    // Don't validate empty emails
    if (!formData.email || formData.email.trim() === '') {
      setEmailValidation({ isValidating: false, available: null, error: null });
      return;
    }

    // Basic email format validation first
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setEmailValidation({ 
        isValidating: false, 
        available: false, 
        error: 'Invalid email format' 
      });
      return;
    }

    // Set validating state
    setEmailValidation({ isValidating: true, available: null, error: null });

    // Debounce API call
    emailTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await api.get(`/user/auth/check-email/${encodeURIComponent(formData.email)}`);
        setEmailValidation({ 
          isValidating: false, 
          available: response.data.available, 
          error: response.data.error || (!response.data.available ? 'Email is already taken' : null)
        });
      } catch (error) {
        console.error('Error checking email availability:', error);
        setEmailValidation({ 
          isValidating: false, 
          available: false, 
          error: 'Error checking email availability' 
        });
      }
    }, 500); // 500ms debounce

    return () => {
      if (emailTimeoutRef.current) {
        clearTimeout(emailTimeoutRef.current);
      }
    };
  }, [formData.email]);

  // Debounced username availability check
  useEffect(() => {
    if (usernameTimeoutRef.current) {
      clearTimeout(usernameTimeoutRef.current);
    }

    // Don't validate empty usernames
    if (!formData.userName || formData.userName.trim() === '') {
      setUsernameValidation({ isValidating: false, available: null, error: null });
      return;
    }

    // Basic username validation first
    if (formData.userName.length < 3) {
      setUsernameValidation({ 
        isValidating: false, 
        available: false, 
        error: 'Username must be at least 3 characters' 
      });
      return;
    }

    // Set validating state
    setUsernameValidation({ isValidating: true, available: null, error: null });

    // Debounce API call
    usernameTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await api.get(`/user/auth/check-username/${encodeURIComponent(formData.userName)}`);
        setUsernameValidation({ 
          isValidating: false, 
          available: response.data.available, 
          error: response.data.error || (!response.data.available ? 'Username is already taken' : null)
        });
      } catch (error) {
        console.error('Error checking username availability:', error);
        setUsernameValidation({ 
          isValidating: false, 
          available: false, 
          error: 'Error checking username availability' 
        });
      }
    }, 500); // 500ms debounce

    return () => {
      if (usernameTimeoutRef.current) {
        clearTimeout(usernameTimeoutRef.current);
      }
    };
  }, [formData.userName]);

  const handleInput = (field, value) => {
    setFormData({ ...formData, [field]: value });
    
    // Clear password error when user starts typing
    if (field === 'password' || field === 'confirmPassword') {
      setPasswordError("");
    }
  };

  const handleNext = async () => {
    if (step === 1) {
      if (!isStep1Valid()) {
        return;
      }
      
      // Wait for email validation to complete
      if (emailValidation.isValidating) {
        Alert.alert("Please Wait", "Checking email availability...");
        return;
      }
      
      // Validate email availability
      if (emailValidation.available === false) {
        Alert.alert("Email Not Available", emailValidation.error || "Please choose a different email address");
        return;
      }
      
      if (formData.password !== formData.confirmPassword) {
        setPasswordError("Passwords do not match");
        return;
      }
      
      if (formData.password.length < 6) {
        setPasswordError("Password must be at least 6 characters long");
        return;
      }
      
      // Send verification email
      try {
        const response = await api.get(`/user/auth/email/${encodeURIComponent(formData.email)}`);
        setEncryptedCode(response.data);
        Alert.alert(
          "Verification Email Sent",
          `We've sent a verification code to ${formData.email}`,
          [{ text: "OK", onPress: () => setStep(2) }]
        );
      } catch (error) {
        console.error("Error sending verification email:", error);
        Alert.alert(
          "Error",
          error.response?.data?.error || "Failed to send verification email. Please try again."
        );
      }
      return;
    }
    
    if (step === 3) {
      if (!formData.userName) {
        Alert.alert("Error", "Please enter a username");
        return;
      }
      
      // Wait for username validation to complete
      if (usernameValidation.isValidating) {
        Alert.alert("Please Wait", "Checking username availability...");
        return;
      }
      
      // Validate username availability
      if (usernameValidation.available === false) {
        Alert.alert("Username Not Available", usernameValidation.error || "Please choose a different username");
        return;
      }
    }
    
    if (step !== 1) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const decryptCode = (encryptedCode) => {
    try {
      // Decode base64 string
      return atob(encryptedCode);
    } catch (error) {
      console.error("Error decrypting code:", error);
      return null;
    }
  };

  const handleVerifyCode = () => {
    if (!verificationCode.trim()) {
      setVerificationError("Please enter the verification code");
      return;
    }

    setIsVerifying(true);
    setVerificationError("");

    // Decrypt the stored encrypted code
    const decryptedCode = decryptCode(encryptedCode);
    
    if (decryptedCode && verificationCode.trim() === decryptedCode) {
      // Code matches, proceed to next step
      setStep(3);
      setIsVerifying(false);
      setVerificationError("");
    } else {
      // Code doesn't match
      setVerificationError("Invalid verification code. Please try again.");
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    try {
      const response = await api.get(`/user/auth/email/${encodeURIComponent(formData.email)}`);
      setEncryptedCode(response.data);
      Alert.alert("Code Resent", "A new verification code has been sent to your email.");
    } catch (error) {
      console.error("Error resending verification email:", error);
      Alert.alert(
        "Error",
        error.response?.data?.error || "Failed to resend verification email. Please try again."
      );
    }
  };

  const pickImage = async (type) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: type === 'profile' ? [1, 1] : [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      
      // Infer MIME type from filename if not provided
      const inferMimeFromName = (name) => {
        if (!name) return 'image/jpeg';
        const lower = name.toLowerCase();
        if (lower.endsWith('.png')) return 'image/png';
        if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
        if (lower.endsWith('.gif')) return 'image/gif';
        return 'image/jpeg'; // Default
      };
      
      const fileName = asset.fileName || `${type}-${Date.now()}.jpg`;
      const fileType = asset.mimeType || inferMimeFromName(fileName);
      
      const fileInfo = {
        uri: asset.uri,
        name: fileName,
        type: fileType,
      };
      
      if (type === 'profile') {
        setFormData({ ...formData, profilePic: asset.uri });
        setProfilePicFile(fileInfo);
      } else {
        setFormData({ ...formData, banner: asset.uri });
        setBannerFile(fileInfo);
      }
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Helper function to infer MIME type from filename
      const inferImageMimeFromName = (name) => {
        if (!name) return 'image/jpeg';
        const lower = name.toLowerCase();
        if (lower.endsWith('.png')) return 'image/png';
        if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
        if (lower.endsWith('.gif')) return 'image/gif';
        return 'image/jpeg'; // Default
      };
      
      // Create user data without confirmPassword
      const { confirmPassword, profilePic, banner, ...userData } = formData;
      
      // Create FormData
      const submitData = new FormData();
      
      // Append user data as JSON string
      submitData.append('user', JSON.stringify(userData));
      
      // Append profile picture if selected
      if (profilePicFile) {
        const resolvedName = profilePicFile.name || `profile-${Date.now()}.jpg`;
        const resolvedType = profilePicFile.type || inferImageMimeFromName(resolvedName);
        
        submitData.append('pp', {
          uri: profilePicFile.uri,
          name: resolvedName,
          type: resolvedType,
        });
      }
      
      // Append banner if selected
      if (bannerFile) {
        const resolvedName = bannerFile.name || `banner-${Date.now()}.jpg`;
        const resolvedType = bannerFile.type || inferImageMimeFromName(resolvedName);
        
        submitData.append('banner', {
          uri: bannerFile.uri,
          name: resolvedName,
          type: resolvedType,
        });
      }
      
      // Make API call - Content-Type will be handled by the interceptor
      const response = await api.post('/user/auth/create', submitData, {
        timeout: 30000, // 30 second timeout for file uploads
      });
      
      Alert.alert(
        "Account Created!",
        "Your account has been created successfully. Redirecting to login...",
        [{ 
          text: "OK", 
          onPress: () => {
            // Navigate to login page
            router.replace('/login');
          }
        }]
      );
    } catch (error) {
      console.error("Signup error:", error);
      
      let errorMessage = "Failed to create account. Please try again.";
      
      if (error.response?.status === 409) {
        errorMessage = "Email or username already exists. Please try different credentials.";
      } else if (error.response?.data) {
        errorMessage = error.response.data.error || error.response.data;
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = "Request timed out. Please check your connection and try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert("Signup Failed", errorMessage);
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      <LinearGradient
        colors={['#7f53ac', '#647dee']}
        style={styles.stepNumberContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={styles.stepNumber}>{step}</Text>
      </LinearGradient>
      <Text style={styles.stepTitle}>
        {step === 1 && "Account Details"}
        {step === 2 && "Verify Email"}
        {step === 3 && "Choose Username"}
        {step === 4 && "About You"}
        {step === 5 && "Profile Pictures"}
        {step === 6 && "Preview Profile"}
      </Text>
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a0b0f', '#1a1d29', '#232946']}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Header />
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.content}
        >
        <View style={styles.formCard}>
        {renderStepIndicator()}
        
        <Text style={styles.title}>Create Your Account</Text>
        <Text style={styles.subtitle}>Let's start with your basic account information</Text>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Email Address *</Text>
          <TextInput
            style={[
              styles.input,
              emailValidation.available === false ? styles.errorInput : 
              emailValidation.available === true ? styles.successInput : null
            ]}
            value={formData.email}
            onChangeText={(value) => handleInput('email', value)}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            maxLength={100}
          />
          {emailValidation.isValidating && (
            <Text style={styles.validationText}>Checking...</Text>
          )}
          {emailValidation.available === true && !emailValidation.isValidating && (
            <Text style={styles.successText}>✅ Available</Text>
          )}
          {emailValidation.available === false && !emailValidation.isValidating && (
            <Text style={styles.errorText}>❌ {emailValidation.error || 'Email is already taken'}</Text>
          )}
          <Text style={styles.charCounter}>{formData.email.length}/100 characters</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Password *</Text>
          <TextInput
            style={[styles.input, passwordError ? styles.errorInput : null]}
            value={formData.password}
            onChangeText={(value) => handleInput('password', value)}
            placeholder="Create a strong password"
            secureTextEntry
            maxLength={50}
          />
          <Text style={[
            styles.charCounter,
            formData.password.length < PASSWORD_MIN ? styles.errorText : null
          ]}>
            {formData.password.length}/50 characters
          </Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Confirm Password *</Text>
          <TextInput
            style={[styles.input, passwordError ? styles.errorInput : null]}
            value={formData.confirmPassword}
            onChangeText={(value) => handleInput('confirmPassword', value)}
            placeholder="Confirm your password"
            secureTextEntry
            maxLength={50}
          />
          {passwordError && <Text style={styles.errorText}>{passwordError}</Text>}
        </View>

        <TouchableOpacity 
          style={[
            styles.nextBtn,
            !isStep1Valid() ? styles.disabledBtn : null
          ]}
          onPress={handleNext}
          disabled={!isStep1Valid()}
        >
          <LinearGradient
            colors={!isStep1Valid() ? ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.1)'] : ['#7f53ac', '#647dee']}
            style={styles.nextBtnGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.btnText}>Next: Choose Username</Text>
          </LinearGradient>
        </TouchableOpacity>
        </View>
        </KeyboardAvoidingView>
      </ScrollView>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a0b0f', '#1a1d29', '#232946']}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Header />
        <View style={styles.content}>
        <View style={styles.formCard}>
        {renderStepIndicator()}
        
        <Text style={styles.title}>Check Your Email</Text>
        <Text style={styles.subtitle}>We've sent a verification code to <Text style={styles.strongText}>{formData.email}</Text></Text>
        
        <View style={styles.verificationInfoBox}>
          <Text style={styles.infoIcon}>📧</Text>
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTextBold}>Didn't receive the email?</Text>
            <Text style={styles.infoText}>Check your spam folder or click "Resend Code" below.</Text>
          </View>
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Verification Code *</Text>
          <TextInput
            style={[styles.input, verificationError ? styles.errorInput : null]}
            value={verificationCode}
            onChangeText={(value) => {
              setVerificationCode(value);
              setVerificationError("");
            }}
            placeholder="Enter the verification code"
            autoCapitalize="none"
            maxLength={20}
          />
          {verificationError && <Text style={styles.errorText}>{verificationError}</Text>}
        </View>

        <TouchableOpacity 
          style={styles.resendBtn}
          onPress={handleResendCode}
          disabled={isVerifying}
        >
          <View style={styles.resendBtnContainer}>
            <Text style={styles.resendBtnText}>{isVerifying ? "Sending..." : "Resend Code"}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.formActions}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.nextBtn,
              isVerifying || !verificationCode.trim() ? styles.disabledBtn : null
            ]}
            onPress={handleVerifyCode}
            disabled={isVerifying || !verificationCode.trim()}
          >
            <LinearGradient
              colors={isVerifying || !verificationCode.trim() ? ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.1)'] : ['#7f53ac', '#647dee']}
              style={styles.nextBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isVerifying ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Verify & Continue</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
        </View>
        </View>
      </ScrollView>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a0b0f', '#1a1d29', '#232946']}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Header />
        <View style={styles.content}>
        <View style={styles.formCard}>
        {renderStepIndicator()}
        
        <Text style={styles.title}>Pick Your Username</Text>
        <Text style={styles.subtitle}>This is how others will see you on the platform</Text>
        
        <View style={styles.warningBox}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <View style={styles.warningTextContainer}>
            <Text style={styles.warningTextBold}>Important:</Text>
            <Text style={styles.warningText}>Your username cannot be changed after account creation. Choose carefully!</Text>
          </View>
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Username *</Text>
          <TextInput
            style={[
              styles.input,
              usernameValidation.available === false ? styles.errorInput : 
              usernameValidation.available === true ? styles.successInput : null
            ]}
            value={formData.userName}
            onChangeText={(value) => handleInput('userName', value)}
            placeholder="Enter your username"
            autoCapitalize="none"
            maxLength={30}
          />
          {usernameValidation.isValidating && (
            <Text style={styles.validationText}>Checking...</Text>
          )}
          {usernameValidation.available === true && !usernameValidation.isValidating && (
            <Text style={styles.successText}>✅ Available</Text>
          )}
          {usernameValidation.available === false && !usernameValidation.isValidating && (
            <Text style={styles.errorText}>❌ {usernameValidation.error || 'Username is already taken'}</Text>
          )}
          <Text style={styles.charCounter}>{formData.userName.length}/30 characters</Text>
        </View>

        <View style={styles.formActions}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
            <LinearGradient
              colors={['#7f53ac', '#647dee']}
              style={styles.nextBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.btnText}>Next: Tell Us About You</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        </View>
        </View>
      </ScrollView>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a0b0f', '#1a1d29', '#232946']}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Header />
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.content}
      >
        <View style={styles.formCard}>
        {renderStepIndicator()}
        
        <Text style={styles.title}>Tell Us About Yourself</Text>
        <Text style={styles.subtitle}>Help others get to know you better (optional)</Text>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={styles.input}
            value={formData.bio}
            onChangeText={(value) => handleInput('bio', value)}
            placeholder="Short description about yourself..."
            maxLength={50}
          />
          <Text style={styles.charCounter}>{formData.bio.length}/50 characters</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            value={formData.location}
            onChangeText={(value) => handleInput('location', value)}
            placeholder="City, State?"
            maxLength={20}
          />
          <Text style={styles.charCounter}>{formData.location.length}/20 characters</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>About</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.about}
            onChangeText={(value) => handleInput('about', value)}
            placeholder="Tell me about yourself..."
            multiline
            numberOfLines={4}
            maxLength={250}
          />
          <Text style={styles.charCounter}>{formData.about.length}/250 characters</Text>
        </View>

        <View style={styles.formActions}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
            <LinearGradient
              colors={['#7f53ac', '#647dee']}
              style={styles.nextBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.btnText}>Next: Profile Pictures</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        </View>
        </KeyboardAvoidingView>
      </ScrollView>
    </View>
  );

  const renderStep5 = () => (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a0b0f', '#1a1d29', '#232946']}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Header />
        <View style={styles.content}>
        <View style={styles.formCard}>
        {renderStepIndicator()}
        
        <Text style={styles.title}>Add Your Photos</Text>
        <Text style={styles.subtitle}>Make your profile stand out (optional)</Text>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Profile Picture</Text>
          <TouchableOpacity 
            style={styles.imagePicker}
            onPress={() => pickImage('profile')}
          >
            {formData.profilePic ? (
              <Image source={{ uri: formData.profilePic }} style={styles.previewImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.placeholderText}>📷</Text>
                <Text style={styles.placeholderLabel}>Tap to add photo</Text>
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.fileInfo}>Accepted formats: JPEG, JPG, PNG (max 5MB)</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Banner Image</Text>
          <TouchableOpacity 
            style={styles.imagePicker}
            onPress={() => pickImage('banner')}
          >
            {formData.banner ? (
              <Image source={{ uri: formData.banner }} style={styles.bannerPreview} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.placeholderText}>🖼️</Text>
                <Text style={styles.placeholderLabel}>Tap to add banner</Text>
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.fileInfo}>Accepted formats: JPEG, JPG, PNG (max 5MB)</Text>
        </View>

        <View style={styles.formActions}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
            <LinearGradient
              colors={['#7f53ac', '#647dee']}
              style={styles.nextBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.btnText}>Preview Profile</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        </View>
        </View>
      </ScrollView>
    </View>
  );

  const renderStep6 = () => (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a0b0f', '#1a1d29', '#232946']}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Header />
        <View style={styles.content}>
        <View style={[styles.formCard, styles.previewCard]}>
        {renderStepIndicator()}
        
        <Text style={styles.title}>Your Profile Preview</Text>
        <Text style={styles.subtitle}>Here's how your profile will look to others</Text>
        
        <View style={styles.profilePreview}>
          <View style={styles.previewBanner}>
            <Image 
              source={formData.banner ? { uri: formData.banner } : require("../assets/images/pb.jpg")} 
              style={styles.previewBannerImage} 
            />
          </View>
          
          <View style={styles.previewAvatar}>
            <Image 
              source={formData.profilePic ? { uri: formData.profilePic } : require("../assets/images/dpp.jpg")} 
              style={styles.previewAvatarImage} 
            />
          </View>
          
          <View style={styles.previewInfo}>
            <Text style={styles.previewUsername}>{formData.userName}</Text>
            {formData.bio && <Text style={styles.previewBio}>{formData.bio}</Text>}
            {formData.location && <Text style={styles.previewLocation}>📍 {formData.location}</Text>}
            
            {formData.about && (
              <View style={styles.previewAbout}>
                <Text style={styles.previewAboutTitle}>About</Text>
                <Text style={styles.previewAboutText}>{formData.about}</Text>
              </View>
            )}
            
            <View style={styles.previewStats}>
              <View style={styles.previewStat}>
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
              <View style={styles.previewStat}>
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
              <View style={styles.previewStat}>
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>Following</Text>
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.signupActions}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <Text style={styles.backBtnText}>Back to Form</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.createAccountBtn, isSubmitting ? styles.disabledBtn : null]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <LinearGradient
              colors={isSubmitting ? ['rgba(156, 163, 175, 0.8)', 'rgba(107, 114, 128, 0.8)'] : ['#4fd1c5', '#38b2ac']}
              style={styles.createAccountBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Create Account</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
        </View>
        </View>
      </ScrollView>
    </View>
  );

  // Render current step
  switch (step) {
    case 1:
      return renderStep1();
    case 2:
      return renderStep2();
    case 3:
      return renderStep3();
    case 4:
      return renderStep4();
    case 5:
      return renderStep5();
    case 6:
      return renderStep6();
    default:
      return renderStep1();
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  content: {
    flex: 1,
    padding: 12,
    marginTop: 60,
    alignItems: 'center',
       marginTop:175
  },
  formCard: {
    backgroundColor: 'rgba(30, 34, 45, 0.95)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(127, 83, 172, 0.2)',
    padding: 16,
    width: '100%',
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  previewCard: {
    maxWidth: 600,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(127, 83, 172, 0.2)',
    borderRadius: 16,
    gap: 8,
  },
  stepNumberContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7f53ac',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: '900',
    color: '#fff',
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 20,
  },
  strongText: {
    fontWeight: '700',
    color: '#fff',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(127, 83, 172, 0.2)',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    color: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  errorInput: {
    borderColor: '#ef4444',
    borderWidth: 1,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  successInput: {
    borderColor: '#10b981',
    borderWidth: 1,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  successText: {
    color: '#10b981',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  validationText: {
    color: '#bdbdbd',
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
  },
  charCounter: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 4,
    textAlign: 'right',
    fontWeight: '500',
  },
  nextBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 12,
    shadowColor: '#7f53ac',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  nextBtnGradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledBtn: {
    opacity: 0.6,
  },
  btnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  backBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(127, 83, 172, 0.2)',
  },
  backBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 16,
  },
  signupActions: {
    marginTop: 20,
    gap: 12,
  },
  createAccountBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#4fd1c5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  createAccountBtnGradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verificationInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(79, 209, 197, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(79, 209, 197, 0.3)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  infoIcon: {
    fontSize: 18,
    flexShrink: 0,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTextBold: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '700',
    marginBottom: 2,
  },
  infoText: {
    fontSize: 12,
    color: '#4fd1c5',
    fontWeight: '500',
    lineHeight: 16,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.3)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  warningIcon: {
    fontSize: 18,
    flexShrink: 0,
  },
  warningTextContainer: {
    flex: 1,
  },
  warningTextBold: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '700',
    marginBottom: 2,
  },
  warningText: {
    fontSize: 12,
    color: '#ffc107',
    fontWeight: '500',
    lineHeight: 16,
  },
  resendBtn: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  resendBtnContainer: {
    backgroundColor: 'rgba(79, 209, 197, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(79, 209, 197, 0.3)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  resendBtnText: {
    color: '#4fd1c5',
    fontSize: 12,
    fontWeight: '600',
  },
  imagePicker: {
    borderWidth: 2,
    borderColor: 'rgba(127, 83, 172, 0.4)',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(127, 83, 172, 0.15)',
  },
  imagePlaceholder: {
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 30,
    marginBottom: 10,
  },
  placeholderLabel: {
    fontSize: 14,
    color: '#9ca3af',
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  bannerPreview: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  fileInfo: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 5,
  },
  profilePreview: {
    backgroundColor: 'rgba(30, 34, 45, 0.8)',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(127, 83, 172, 0.1)',
  },
  previewBanner: {
    height: 120,
    backgroundColor: 'rgba(127, 83, 172, 0.1)',
  },
  previewBannerImage: {
    width: '100%',
    height: '100%',
  },
  previewBannerPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewAvatar: {
    position: 'absolute',
    top: 80,
    left: 20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(30, 34, 45, 0.8)',
    borderWidth: 3,
    borderColor: 'rgba(127, 83, 172, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewAvatarImage: {
    width: 74,
    height: 74,
    borderRadius: 37,
  },
  previewAvatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewInfo: {
    padding: 20,
    paddingTop: 50,
  },
  previewUsername: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 8,
  },
  previewBio: {
    fontSize: 16,
    color: '#bfc9d1',
    marginBottom: 5,
  },
  previewLocation: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 15,
  },
  previewAbout: {
    marginBottom: 15,
  },
  previewAboutTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 5,
  },
  previewAboutText: {
    fontSize: 14,
    color: '#bfc9d1',
    lineHeight: 20,
  },
  previewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(127, 83, 172, 0.1)',
  },
  previewStat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7f53ac',
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
  },
});