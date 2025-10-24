import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  Image,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Header from '../components/ui/Header';
import { login } from '../services/authService';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error message when user starts typing
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        // Navigate to homepage after successful login
        router.replace('/homepage');
      } else {
        setErrorMessage(result.error || 'Invalid email/username or password. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const styles = StyleSheet.create({
    
    container: {
      flex: 1,
      minHeight: '100%',
    },
    loginContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 100,
    },
    loginFormCard: {
      backgroundColor: 'rgba(30, 34, 45, 0.95)',
      borderRadius: 30,
      padding: 30,
      width: '100%',
      maxWidth: 400,
      borderWidth: 1,
      borderColor: 'rgba(127, 83, 172, 0.2)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 32,
      elevation: 8,
    },
    loginHeader: {
      alignItems: 'center',
      marginBottom: 30,
    },
    loginTitle: {
      fontSize: 28,
      fontWeight: '900',
      color: '#fff',
      marginBottom: 8,
      textAlign: 'center',
    },
    loginSubtitle: {
      fontSize: 16,
      color: '#9ca3af',
      textAlign: 'center',
      lineHeight: 24,
    },
    formGroup: {
      marginBottom: 20,
    },
    formLabel: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 8,
    },
    inputContainer: {
      position: 'relative',
      flexDirection: 'row',
      alignItems: 'center',
    },
    loginInput: {
      flex: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      borderWidth: 1,
      borderColor: 'rgba(127, 83, 172, 0.2)',
      borderRadius: 15,
      paddingVertical: 15,
      paddingHorizontal: 15,
      paddingRight: 80,
      color: '#fff',
      fontSize: 16,
    },
    inputIcon: {
      position: 'absolute',
      right: 15,
      fontSize: 18,
      color: '#9ca3af',
    },
    passwordToggle: {
      position: 'absolute',
      right: 45,
      padding: 5,
    },
    passwordToggleText: {
      fontSize: 18,
      color: '#9ca3af',
    },
    formOptions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    rememberMe: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    checkbox: {
      width: 18,
      height: 18,
      borderWidth: 2,
      borderColor: 'rgba(127, 83, 172, 0.4)',
      borderRadius: 6,
      marginRight: 8,
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxChecked: {
      backgroundColor: '#7f53ac',
      borderColor: '#7f53ac',
    },
    checkboxText: {
      color: '#9ca3af',
      fontSize: 14,
      fontWeight: '500',
    },
    forgotPassword: {
      color: '#7f53ac',
      fontSize: 14,
      fontWeight: '600',
    },
    errorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      borderWidth: 1,
      borderColor: 'rgba(239, 68, 68, 0.3)',
      borderRadius: 15,
      padding: 15,
      marginBottom: 15,
    },
    errorIcon: {
      fontSize: 18,
      color: '#ef4444',
      marginRight: 10,
    },
    errorText: {
      color: '#ef4444',
      fontSize: 14,
      fontWeight: '500',
      flex: 1,
    },
    loginButton: {
      backgroundColor: '#7f53ac',
      borderRadius: 20,
      paddingVertical: 15,
      alignItems: 'center',
      marginTop: 10,
      shadowColor: '#7f53ac',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 32,
      elevation: 6,
    },
    loginButtonDisabled: {
      opacity: 0.6,
    },
    loginButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    spinner: {
      width: 20,
      height: 20,
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.3)',
      borderTopColor: '#fff',
      borderRadius: 10,
    },
    signupLink: {
      alignItems: 'center',
      marginTop: 20,
    },
    signupText: {
      color: '#9ca3af',
      fontSize: 14,
      textAlign: 'center',
    },
    signupLinkText: {
      color: '#7f53ac',
      fontWeight: '700',
    },
  });

  return (
      <LinearGradient
        colors={['#0a0b0f', '#1a1d29', '#232946']}
        style={styles.container}
      >
        <Header />
        
        <View style={styles.loginContainer}>
          <View style={styles.loginFormCard}>
            <View style={styles.loginHeader}>
              <Text style={styles.loginTitle}>Welcome Back</Text>
              <Text style={styles.loginSubtitle}>Sign in to continue your music journey</Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Email or Username</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.loginInput}
                  value={formData.email}
                  onChangeText={(value) => handleInputChange('email', value)}
                  placeholder="Enter your email or username"
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                <Text style={styles.inputIcon}>📧</Text>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Password</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.loginInput}
                  value={formData.password}
                  onChangeText={(value) => handleInputChange('password', value)}
                  placeholder="Enter your password"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={!showPassword}
                />
                <Text style={styles.inputIcon}>🔒</Text>
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.passwordToggleText}>
                    {showPassword ? "🙈" : "👁️"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formOptions}>
              <TouchableOpacity
                style={styles.rememberMe}
                onPress={() => setRememberMe(!rememberMe)}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe && <Text style={{ color: '#fff', fontSize: 12 }}>✓</Text>}
                </View>
                <Text style={styles.checkboxText}>Remember me</Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => router.push('/forgot-password')}>
                <Text style={styles.forgotPassword}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <View style={styles.spinner} />
                  <Text style={styles.loginButtonText}>Signing in...</Text>
                </View>
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.signupLink}>
              <Text style={styles.signupText}>
                Don't have an account?{' '}
                <Text 
                  style={styles.signupLinkText}
                  onPress={() => router.push('/signup')}
                >
                  Sign up
                </Text>
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>
  );
}
