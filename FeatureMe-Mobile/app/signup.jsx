import React, { useState, useEffect } from "react";
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
import Header from "../components/ui/Header";

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

  const handleInput = (field, value) => {
    setFormData({ ...formData, [field]: value });
    
    // Clear password error when user starts typing
    if (field === 'password' || field === 'confirmPassword') {
      setPasswordError("");
    }
    
    // Real-time validation for username
    if (field === 'userName') {
      setUsernameValidation({ isValidating: true, available: null, error: null });
      // Simulate validation - replace with actual API call
      setTimeout(() => {
        setUsernameValidation({ 
          isValidating: false, 
          available: value.length >= 3, 
          error: value.length < 3 ? 'Username must be at least 3 characters' : null
        });
      }, 1000);
    }
    
    // Real-time validation for email
    if (field === 'email') {
      setEmailValidation({ isValidating: true, available: null, error: null });
      // Simulate validation - replace with actual API call
      setTimeout(() => {
        const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        setEmailValidation({ 
          isValidating: false, 
          available: isValidEmail, 
          error: !isValidEmail ? 'Invalid email format' : null
        });
      }, 1000);
    }
  };

  const handleNext = async () => {
    if (step === 1) {
      if (!isStep1Valid()) {
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
      
      // Simulate email verification - replace with actual API call
      Alert.alert(
        "Verification Email Sent",
        `We've sent a verification code to ${formData.email}`,
        [{ text: "OK", onPress: () => setStep(2) }]
      );
      return;
    }
    
    if (step === 3) {
      if (!formData.userName) {
        Alert.alert("Error", "Please enter a username");
        return;
      }
      
      if (usernameValidation.available === false) {
        Alert.alert("Error", "Please choose a different username");
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

  const handleVerifyCode = () => {
    if (!verificationCode.trim()) {
      setVerificationError("Please enter the verification code");
      return;
    }

    setIsVerifying(true);
    // Simulate verification - replace with actual API call
    setTimeout(() => {
      setStep(3);
      setIsVerifying(false);
      setVerificationError("");
    }, 1000);
  };

  const pickImage = async (type) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'profile' ? [1, 1] : [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      if (type === 'profile') {
        setFormData({ ...formData, profilePic: result.assets[0].uri });
      } else {
        setFormData({ ...formData, banner: result.assets[0].uri });
      }
    }
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    
    // Simulate API call - replace with actual implementation
    setTimeout(() => {
      Alert.alert(
        "Account Created!",
        "Your account has been created successfully.",
        [{ text: "OK", onPress: () => {
          // Navigate to login or main app
          setIsSubmitting(false);
        }}]
      );
    }, 2000);
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      <Text style={styles.stepNumber}>{step}</Text>
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
    <LinearGradient
      colors={['#0a0b0f', '#1a1d29', '#232946']}
      style={styles.container}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <Header />
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.content}
        >
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
          <Text style={styles.btnText}>Next: Choose Username</Text>
        </TouchableOpacity>
        </KeyboardAvoidingView>
      </ScrollView>
    </LinearGradient>
  );

  const renderStep2 = () => (
    <LinearGradient
      colors={['#0a0b0f', '#1a1d29', '#232946']}
      style={styles.container}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <Header />
        <View style={styles.content}>
        {renderStepIndicator()}
        
        <Text style={styles.title}>Check Your Email</Text>
        <Text style={styles.subtitle}>We've sent a verification code to {formData.email}</Text>
        
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>📧</Text>
          <Text style={styles.infoText}>Didn't receive the email? Check your spam folder.</Text>
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
            placeholder="Enter the 8-digit code"
            keyboardType="numeric"
            maxLength={8}
          />
          {verificationError && <Text style={styles.errorText}>{verificationError}</Text>}
        </View>

        <TouchableOpacity 
          style={styles.resendBtn}
          onPress={() => Alert.alert("Code Resent", "A new verification code has been sent to your email.")}
        >
          <Text style={styles.resendBtnText}>Resend Code</Text>
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
            {isVerifying ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Verify & Continue</Text>
            )}
          </TouchableOpacity>
        </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );

  const renderStep3 = () => (
    <LinearGradient
      colors={['#0a0b0f', '#1a1d29', '#232946']}
      style={styles.container}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <Header />
        <View style={styles.content}>
        {renderStepIndicator()}
        
        <Text style={styles.title}>Pick Your Username</Text>
        <Text style={styles.subtitle}>This is how others will see you on the platform</Text>
        
        <View style={styles.warningBox}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.warningText}>Important: Your username cannot be changed after account creation. Choose carefully!</Text>
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
            <Text style={styles.btnText}>Next: Tell Us About You</Text>
          </TouchableOpacity>
        </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );

  const renderStep4 = () => (
    <LinearGradient
      colors={['#0a0b0f', '#1a1d29', '#232946']}
      style={styles.container}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <Header />
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.content}
      >
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
            <Text style={styles.btnText}>Next: Profile Pictures</Text>
          </TouchableOpacity>
        </View>
        </KeyboardAvoidingView>
      </ScrollView>
    </LinearGradient>
  );

  const renderStep5 = () => (
    <LinearGradient
      colors={['#0a0b0f', '#1a1d29', '#232946']}
      style={styles.container}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <Header />
        <View style={styles.content}>
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
            <Text style={styles.btnText}>Preview Profile</Text>
          </TouchableOpacity>
        </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );

  const renderStep6 = () => (
    <LinearGradient
      colors={['#0a0b0f', '#1a1d29', '#232946']}
      style={styles.container}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <Header />
        <View style={styles.content}>
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
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Create Account</Text>
            )}
          </TouchableOpacity>
        </View>
        </View>
      </ScrollView>
    </LinearGradient>
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
  content: {
    flex: 1,
    padding: 20,
    marginTop:150
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: 'rgba(127, 83, 172, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(127, 83, 172, 0.3)',
    borderRadius: 8,
  },
  stepNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7f53ac',
    marginRight: 10,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#a084e8',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#bfc9d1',
    marginBottom: 30,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'rgba(30, 34, 45, 0.8)',
    color: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  errorInput: {
    borderColor: '#ff6b6b',
  },
  successInput: {
    borderColor: '#51cf66',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    marginTop: 5,
  },
  successText: {
    color: '#51cf66',
    fontSize: 14,
    marginTop: 5,
  },
  validationText: {
    color: '#ffd43b',
    fontSize: 14,
    marginTop: 5,
  },
  charCounter: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 5,
    textAlign: 'right',
  },
  nextBtn: {
    backgroundColor: '#7f53ac',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#7f53ac',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  disabledBtn: {
    backgroundColor: 'rgba(127, 83, 172, 0.3)',
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backBtn: {
    backgroundColor: 'transparent',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(127, 83, 172, 0.5)',
  },
  backBtnText: {
    color: '#a084e8',
    fontSize: 16,
    fontWeight: '600',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  signupActions: {
    marginTop: 30,
  },
  createAccountBtn: {
    backgroundColor: '#51cf66',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#51cf66',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(127, 83, 172, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(127, 83, 172, 0.3)',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#a084e8',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.3)',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  warningIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#ffd43b',
  },
  resendBtn: {
    backgroundColor: 'transparent',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  resendBtnText: {
    color: '#a084e8',
    fontSize: 14,
    fontWeight: '600',
  },
  imagePicker: {
    borderWidth: 2,
    borderColor: 'rgba(127, 83, 172, 0.3)',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(30, 34, 45, 0.8)',
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
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