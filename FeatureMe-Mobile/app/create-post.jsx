import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
  Modal,
  Switch
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import api from '../services/api';
import { getCurrentUser } from '../services/api';

const GENRES = [
  'Song', 'Beat', 'Loop', 'Sample', 'Acapella', 'Instrument', 'Open', 'Free', 'Paid',
  'Hip Hop', 'Underground', 'Trap', 'Drill', 'Pop', 'Punk', 'Rock', 'Jazz', 'R&B',
  'Electronic', 'Classical', 'Reggae', 'Metal', 'Country', 'Indie', 'Folk', 'Blues', 'Afrobeat'
];

export default function CreatePostScreen() {
  const insets = useSafeAreaInsets();
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [currentStep, setCurrentStep] = useState(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genres, setGenres] = useState([]);
  const [features, setFeatures] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [freeDownload, setFreeDownload] = useState(false);
  const [errors, setErrors] = useState({});
  
  // User search state
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [searchedUsers, setSearchedUsers] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  
  // Genre popup
  const [genrePopupOpen, setGenrePopupOpen] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  // Debounced user search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (userSearchTerm.trim()) {
        searchUsers(userSearchTerm.trim());
      } else {
        setSearchedUsers([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [userSearchTerm]);

  const fetchUserData = async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Error fetching user data:', error);
      router.replace('/login');
    }
  };

  const searchUsers = async (searchTerm) => {
    setSearchingUsers(true);
    try {
      const response = await api.get(`/user/get/search/${searchTerm}?page=0&size=20`);
      const users = response.data.content || [];
      const filteredUsers = users.filter(user => 
        user.userName !== currentUser?.userName && 
        !selectedUsers.some(selectedUser => selectedUser.userName === user.userName)
      );
      setSearchedUsers(filteredUsers);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchedUsers([]);
    } finally {
      setSearchingUsers(false);
    }
  };

  const toggleUserSelection = (user) => {
    setSelectedUsers(prev => 
      prev.some(selectedUser => selectedUser.userName === user.userName) 
        ? prev.filter(selectedUser => selectedUser.userName !== user.userName)
        : [...prev, user]
    );
  };

  const handleFilePicker = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedFile(result.assets[0]);
        if (errors.file) {
          setErrors(prev => ({ ...prev, file: '' }));
        }
      }
    } catch (error) {
      console.error('Error picking file:', error);
      Alert.alert('Error', 'Failed to select file');
    }
  };

  const toggleGenre = (genre) => {
    const newGenres = genres.includes(genre)
      ? genres.filter(g => g !== genre)
      : [...genres, genre];
    setGenres(newGenres);
    
    if (newGenres.length > 0 && errors.genre) {
      setErrors(prev => ({ ...prev, genre: '' }));
    }
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!title.trim()) {
      newErrors.title = 'Song name is required';
    }
    if (genres.length === 0) {
      newErrors.genre = 'At least one genre is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors = {};
    if (!selectedFile) {
      newErrors.file = 'Audio file is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 3 && !validateStep3()) return;
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (currentStep !== 4) return;
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      
      const postData = {
        title: title.trim(),
        description: description.trim(),
        genre: genres,
        features: selectedUsers.map(user => user.userName),
        music: '',
        freeDownload: freeDownload
      };

      formData.append('post', JSON.stringify(postData));
      
      if (selectedFile) {
        formData.append('file', {
          uri: selectedFile.uri,
          name: selectedFile.name,
          type: selectedFile.mimeType || 'audio/mpeg',
        });
      }

      await api.post('/posts/create', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert('Success', 'Post created successfully!');
      router.back();
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3, 4].map((step) => (
        <View key={step} style={styles.step}>
          <View style={[styles.stepCircle, currentStep >= step && styles.stepCircleActive]}>
            <Text style={[styles.stepNumber, currentStep >= step && styles.stepNumberActive]}>
              {step}
            </Text>
          </View>
          {step <= 3 && <View style={[styles.stepLine, currentStep > step && styles.stepLineActive]} />}
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Song Details</Text>
      <Text style={styles.stepDescription}>Tell us about your song</Text>
      
      <View style={styles.inputSection}>
        <Text style={styles.label}>Song Name *</Text>
        <TextInput
          style={[styles.textInput, errors.title && styles.inputError]}
          placeholder="Format Suggestion: Song Name or Instrument - BPM"
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          value={title}
          onChangeText={(text) => {
            setTitle(text);
            if (errors.title) setErrors(prev => ({ ...prev, title: '' }));
          }}
          maxLength={50}
        />
        <Text style={styles.charCounter}>{title.length}/50 characters</Text>
        {errors.title && <Text style={styles.errorMessage}>{errors.title}</Text>}
      </View>

      <View style={styles.inputSection}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Describe your song, inspiration, or any special notes..."
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          maxLength={80}
        />
        <Text style={styles.charCounter}>{description.length}/80 characters</Text>
      </View>

      <View style={styles.inputSection}>
        <Text style={styles.label}>Genre *</Text>
        <TouchableOpacity
          style={[styles.genreButton, errors.genre && styles.inputError]}
          onPress={() => setGenrePopupOpen(true)}
        >
          <Text style={styles.genreButtonText}>
            {genres.length === 0 
              ? 'Select genres…' 
              : `${genres.length} genre${genres.length > 1 ? 's' : ''} selected`
            }
          </Text>
          <Text style={styles.genreButtonIcon}>🎵</Text>
        </TouchableOpacity>
        {errors.genre && <Text style={styles.errorMessage}>{errors.genre}</Text>}
        {genres.length > 0 && (
          <View style={styles.selectedGenres}>
            {genres.map((genre) => (
              <View key={genre} style={styles.genreTag}>
                <Text style={styles.genreTagText}>{genre}</Text>
                <TouchableOpacity
                  onPress={() => toggleGenre(genre)}
                  style={styles.removeGenreBtn}
                >
                  <Text style={styles.removeGenreText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Features & Collaborators</Text>
      <Text style={styles.stepDescription}>Add any featured artists or collaborators</Text>
      
      <View style={styles.noticeBox}>
        <Text style={styles.noticeIcon}>⚠️</Text>
        <View style={styles.noticeContent}>
          <Text style={styles.noticeTitle}>Feature Approval Required</Text>
          <Text style={styles.noticeText}>
            Featured users must approve before your post goes live. Your post will remain in draft status until all features are approved.
          </Text>
        </View>
      </View>

      <View style={styles.inputSection}>
        <Text style={styles.label}>Search and Select Users</Text>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by username..."
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            value={userSearchTerm}
            onChangeText={setUserSearchTerm}
          />
          {searchingUsers && (
            <ActivityIndicator size="small" color="#667eea" />
          )}
        </View>

        {selectedUsers.length > 0 && (
          <View style={styles.selectedUsersBox}>
            <Text style={styles.selectedUsersLabel}>Selected Users ({selectedUsers.length})</Text>
            <View style={styles.selectedUsersList}>
              {selectedUsers.map((user) => (
                <View key={user.userName} style={styles.selectedUserItem}>
                  <Image 
                    source={{ uri: user.profilePic || 'https://via.placeholder.com/40' }}
                    style={styles.userAvatar}
                  />
                  <Text style={styles.selectedUserName}>{user.userName}</Text>
                  <TouchableOpacity
                    onPress={() => toggleUserSelection(user)}
                    style={styles.removeUserBtn}
                  >
                    <Text style={styles.removeUserText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {userSearchTerm && searchedUsers.length > 0 && (
          <ScrollView style={styles.searchResults} nestedScrollEnabled>
            {searchedUsers.map((user) => (
              <TouchableOpacity
                key={user.userName}
                style={[
                  styles.userItem,
                  selectedUsers.some(u => u.userName === user.userName) && styles.userItemSelected
                ]}
                onPress={() => toggleUserSelection(user)}
              >
                <Image 
                  source={{ uri: user.profilePic || 'https://via.placeholder.com/32' }}
                  style={styles.userAvatarSmall}
                />
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{user.userName}</Text>
                  {user.bio && <Text style={styles.userBio}>{user.bio}</Text>}
                </View>
                {selectedUsers.some(u => u.userName === user.userName) && (
                  <Text style={styles.checkMark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {userSearchTerm && !searchingUsers && searchedUsers.length === 0 && (
          <Text style={styles.noResults}>No users found for "{userSearchTerm}"</Text>
        )}

        {!userSearchTerm && (
          <Text style={styles.searchHint}>💡 Start typing a username to search for collaborators</Text>
        )}
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Upload Audio File & Download Settings</Text>
      <Text style={styles.stepDescription}>Upload your audio file and configure download settings</Text>
      
      <View style={styles.uploadSection}>
        <TouchableOpacity
          style={[styles.fileUploadArea, errors.file && styles.inputError]}
          onPress={handleFilePicker}
        >
          <Text style={styles.uploadIcon}>🎵</Text>
          <View style={styles.uploadText}>
            {selectedFile ? (
              <>
                <Text style={styles.uploadTitle}>File Selected:</Text>
                <Text style={styles.uploadSubtitle}>{selectedFile.name}</Text>
                <Text style={styles.uploadSize}>
                  ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.uploadTitle}>Tap to upload</Text>
                <Text style={styles.uploadSubtitle}>MP3, WAV supported</Text>
              </>
            )}
          </View>
        </TouchableOpacity>
        {errors.file && <Text style={styles.errorMessage}>{errors.file}</Text>}
      </View>

      <View style={styles.inputSection}>
        <View style={styles.toggleContainer}>
          <Text style={styles.label}>Enable Download</Text>
          <Switch
            value={freeDownload}
            onValueChange={setFreeDownload}
            trackColor={{ false: '#3a3d4a', true: '#667eea' }}
            thumbColor="#fff"
          />
        </View>
        <Text style={styles.toggleDescription}>
          Allow users to download your track
        </Text>
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Preview Your Post</Text>
      <Text style={styles.stepDescription}>Review your post before publishing</Text>
      
      <View style={styles.previewCard}>
        <View style={styles.previewHeader}>
          <View style={styles.previewProfile}>
            <View style={styles.previewAvatar}>
              <Text style={styles.previewAvatarText}>👤</Text>
            </View>
            <View style={styles.previewUserInfo}>
              <Text style={styles.previewUsername}>{currentUser?.userName || 'User'}</Text>
              <Text style={styles.previewTime}>Just now</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.previewContent}>
          <Text style={styles.previewTitle}>{title || "Song Title"}</Text>
          <Text style={styles.previewDescription}>{description || "No description provided"}</Text>
          
          {selectedUsers.length > 0 && (
            <View style={styles.previewFeatures}>
              <Text style={styles.previewFeatLabel}>Feat: </Text>
              <Text style={styles.previewFeatList}>
                {selectedUsers.map(user => user.userName).join(", ")}
              </Text>
            </View>
          )}
          
          {genres.length > 0 && (
            <View style={styles.previewGenres}>
              {genres.map((genre) => (
                <View key={genre} style={styles.previewGenreTag}>
                  <Text style={styles.previewGenreText}>{genre}</Text>
                </View>
              ))}
            </View>
          )}
          
          {selectedFile && (
            <View style={styles.previewAudio}>
              <View style={styles.audioPlayerPreview}>
                <Text style={styles.audioIcon}>🎵</Text>
                <Text style={styles.audioName}>{selectedFile.name}</Text>
                <Text style={styles.audioDuration}>--:--</Text>
              </View>
              {freeDownload && (
                <View style={styles.downloadBadge}>
                  <Text style={styles.downloadBadgeText}>🆓 Free Download</Text>
                </View>
              )}
            </View>
          )}
        </View>
        
        <View style={styles.previewStats}>
          <Text style={styles.previewStat}>❤️ 0</Text>
          <Text style={styles.previewStat}>💬 0</Text>
        </View>
      </View>
    </View>
  );

  const renderGenrePopup = () => (
    <Modal
      visible={genrePopupOpen}
      transparent
      animationType="fade"
      onRequestClose={() => setGenrePopupOpen(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setGenrePopupOpen(false)}
      >
        <View style={styles.genrePopup}>
          <View style={styles.genrePopupHeader}>
            <Text style={styles.genrePopupTitle}>Select Genres</Text>
            <TouchableOpacity
              onPress={() => setGenrePopupOpen(false)}
              style={styles.genrePopupClose}
            >
              <Text style={styles.genrePopupCloseText}>×</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.genrePopupContent} nestedScrollEnabled>
            <View style={styles.genreCategory}>
              <Text style={styles.genreCategoryTitle}>Category</Text>
              <View style={styles.genreOptions}>
                {GENRES.slice(0, 9).map((genre) => (
                  <TouchableOpacity
                    key={genre}
                    style={[
                      styles.genreOption,
                      genres.includes(genre) && styles.genreOptionSelected
                    ]}
                    onPress={() => toggleGenre(genre)}
                  >
                    <Text style={[
                      styles.genreOptionText,
                      genres.includes(genre) && styles.genreOptionTextSelected
                    ]}>
                      {genre}
                    </Text>
                    {genres.includes(genre) && <Text style={styles.checkMark}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.genreCategory}>
              <Text style={styles.genreCategoryTitle}>Music Genres</Text>
              <View style={styles.genreOptions}>
                {GENRES.slice(9).map((genre) => (
                  <TouchableOpacity
                    key={genre}
                    style={[
                      styles.genreOption,
                      genres.includes(genre) && styles.genreOptionSelected
                    ]}
                    onPress={() => toggleGenre(genre)}
                  >
                    <Text style={[
                      styles.genreOptionText,
                      genres.includes(genre) && styles.genreOptionTextSelected
                    ]}>
                      {genre}
                    </Text>
                    {genres.includes(genre) && <Text style={styles.checkMark}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
          
          <TouchableOpacity
            style={styles.genrePopupDone}
            onPress={() => setGenrePopupOpen(false)}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.genrePopupDoneGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.genrePopupDoneText}>
                Done ({genres.length} selected)
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Post</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {renderStepIndicator()}
          
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          
          <View style={styles.navigation}>
            {currentStep > 1 && (
              <TouchableOpacity style={styles.navButton} onPress={prevStep}>
                <Text style={styles.navButtonText}>← Previous</Text>
              </TouchableOpacity>
            )}
            
            {currentStep < 4 ? (
              <TouchableOpacity
                style={[
                  styles.navButtonNext,
                  ((currentStep === 1 && (!title.trim() || genres.length === 0)) || 
                   (currentStep === 3 && !selectedFile)) && styles.navButtonDisabled
                ]}
                onPress={nextStep}
                disabled={(currentStep === 1 && (!title.trim() || genres.length === 0)) || 
                          (currentStep === 3 && !selectedFile)}
              >
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.navButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.navButtonTextNext}>Next →</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.submitButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isSubmitting ? (
                    <>
                      <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
                      <Text style={styles.submitButtonText}>Publishing...</Text>
                    </>
                  ) : (
                    <Text style={styles.submitButtonText}>Publish Post</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
      
      {renderGenrePopup()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  backIcon: {
    fontSize: 24,
    color: 'white',
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  card: {
    margin: 16,
    padding: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(36, 40, 54, 0.72)',
    borderWidth: 1.5,
    borderColor: 'rgba(79, 140, 255, 0.13)',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(79, 140, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(79, 140, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#bfc9d1',
  },
  stepNumberActive: {
    color: 'white',
  },
  stepLine: {
    height: 2,
    flex: 1,
    backgroundColor: 'rgba(79, 140, 255, 0.2)',
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: '#667eea',
  },
  stepContent: {
    minHeight: 400,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#667eea',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    color: '#bfc9d1',
    marginBottom: 24,
  },
  inputSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'rgba(30, 34, 45, 0.6)',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: 'white',
    borderWidth: 1.5,
    borderColor: 'rgba(79, 140, 255, 0.2)',
  },
  textArea: {
    backgroundColor: 'rgba(30, 34, 45, 0.6)',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: 'white',
    borderWidth: 1.5,
    borderColor: 'rgba(79, 140, 255, 0.2)',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCounter: {
    fontSize: 12,
    color: '#bfc9d1',
    textAlign: 'right',
    marginTop: 4,
  },
  inputError: {
    borderColor: '#ff6b6b',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  errorMessage: {
    color: '#ff6b6b',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  genreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(30, 34, 45, 0.6)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(79, 140, 255, 0.2)',
  },
  genreButtonText: {
    fontSize: 16,
    color: 'white',
    flex: 1,
  },
  genreButtonIcon: {
    fontSize: 20,
    color: '#667eea',
  },
  selectedGenres: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  genreTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#667eea',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  genreTagText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  removeGenreBtn: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeGenreText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 14,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 193, 7, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.3)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  noticeIcon: {
    fontSize: 20,
  },
  noticeContent: {
    flex: 1,
  },
  noticeTitle: {
    color: '#ffc107',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  noticeText: {
    color: '#e8eaed',
    fontSize: 12,
    lineHeight: 18,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(42, 45, 58, 0.6)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2a2d3a',
    paddingRight: 12,
  },
  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 14,
    color: 'white',
  },
  selectedUsersBox: {
    marginTop: 12,
  },
  selectedUsersLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#667eea',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  selectedUsersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(79, 140, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(79, 140, 255, 0.3)',
    borderRadius: 20,
    padding: 8,
    gap: 8,
  },
  userAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  selectedUserName: {
    fontSize: 14,
    color: 'white',
  },
  removeUserBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeUserText: {
    color: '#ff6b6b',
    fontSize: 16,
    fontWeight: '700',
  },
  searchResults: {
    maxHeight: 150,
    backgroundColor: 'rgba(42, 45, 58, 0.3)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2d3a',
    marginTop: 12,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(42, 45, 58, 0.5)',
    gap: 12,
  },
  userItemSelected: {
    backgroundColor: 'rgba(79, 140, 255, 0.2)',
    borderLeftWidth: 3,
    borderLeftColor: '#667eea',
  },
  userAvatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  userBio: {
    fontSize: 12,
    color: '#bfc9d1',
    marginTop: 2,
  },
  checkMark: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noResults: {
    padding: 20,
    textAlign: 'center',
    color: '#bfc9d1',
    fontSize: 14,
    marginTop: 12,
  },
  searchHint: {
    padding: 20,
    textAlign: 'center',
    color: '#bfc9d1',
    fontSize: 14,
    fontStyle: 'italic',
    backgroundColor: 'rgba(42, 45, 58, 0.2)',
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(79, 140, 255, 0.3)',
    marginTop: 12,
  },
  uploadSection: {
    marginBottom: 20,
  },
  fileUploadArea: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(79, 140, 255, 0.3)',
    borderRadius: 12,
    backgroundColor: 'rgba(30, 34, 45, 0.4)',
  },
  uploadIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  uploadText: {
    alignItems: 'center',
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  uploadSubtitle: {
    fontSize: 14,
    color: '#bfc9d1',
  },
  uploadSize: {
    fontSize: 12,
    color: '#bfc9d1',
    marginTop: 4,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  toggleDescription: {
    fontSize: 14,
    color: '#bfc9d1',
  },
  previewCard: {
    backgroundColor: 'rgba(30, 34, 45, 0.6)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(79, 140, 255, 0.2)',
    overflow: 'hidden',
  },
  previewHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(79, 140, 255, 0.1)',
    backgroundColor: 'rgba(30, 34, 45, 0.8)',
  },
  previewProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  previewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewAvatarText: {
    fontSize: 20,
  },
  previewUserInfo: {
    flex: 1,
  },
  previewUsername: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
  },
  previewTime: {
    fontSize: 12,
    color: '#bfc9d1',
  },
  previewContent: {
    padding: 16,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
  },
  previewDescription: {
    fontSize: 14,
    color: '#bfc9d1',
    marginBottom: 12,
    lineHeight: 20,
  },
  previewFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 4,
  },
  previewFeatLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#667eea',
  },
  previewFeatList: {
    fontSize: 14,
    color: 'white',
  },
  previewGenres: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  previewGenreTag: {
    backgroundColor: 'rgba(79, 140, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  previewGenreText: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '600',
  },
  previewAudio: {
    marginBottom: 12,
  },
  audioPlayerPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(30, 34, 45, 0.4)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(79, 140, 255, 0.1)',
    gap: 12,
  },
  audioIcon: {
    fontSize: 20,
    color: '#667eea',
  },
  audioName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  audioDuration: {
    fontSize: 12,
    color: '#bfc9d1',
  },
  downloadBadge: {
    alignSelf: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },
  downloadBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  previewStats: {
    flexDirection: 'row',
    gap: 16,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(79, 140, 255, 0.1)',
    backgroundColor: 'rgba(30, 34, 45, 0.4)',
  },
  previewStat: {
    fontSize: 14,
    color: '#bfc9d1',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(79, 140, 255, 0.1)',
    gap: 12,
  },
  navButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: 'rgba(30, 34, 45, 0.6)',
    borderWidth: 1.5,
    borderColor: 'rgba(79, 140, 255, 0.2)',
  },
  navButtonText: {
    color: '#bfc9d1',
    fontSize: 14,
    fontWeight: '700',
  },
  navButtonNext: {
    borderRadius: 8,
    overflow: 'hidden',
    flex: 1,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  navButtonTextNext: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  submitButton: {
    borderRadius: 8,
    overflow: 'hidden',
    flex: 1,
  },
  submitButtonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  genrePopup: {
    width: '100%',
    maxWidth: 700,
    backgroundColor: 'rgba(30, 34, 45, 0.95)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(79, 140, 255, 0.2)',
    maxHeight: '90%',
  },
  genrePopupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(79, 140, 255, 0.1)',
  },
  genrePopupTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#667eea',
  },
  genrePopupClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genrePopupCloseText: {
    fontSize: 24,
    color: '#bfc9d1',
    fontWeight: '300',
  },
  genrePopupContent: {
    padding: 20,
    maxHeight: 400,
  },
  genreCategory: {
    marginBottom: 24,
  },
  genreCategoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#667eea',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  genreOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  genreOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(30, 34, 45, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(79, 140, 255, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  genreOptionSelected: {
    backgroundColor: 'rgba(79, 140, 255, 0.2)',
    borderColor: 'rgba(79, 140, 255, 0.3)',
  },
  genreOptionText: {
    fontSize: 14,
    color: '#f3f3f7',
    fontWeight: '500',
  },
  genreOptionTextSelected: {
    color: '#667eea',
    fontWeight: '600',
  },
  genrePopupDone: {
    borderRadius: 8,
    overflow: 'hidden',
    margin: 20,
    marginTop: 0,
  },
  genrePopupDoneGradient: {
    padding: 16,
    alignItems: 'center',
  },
  genrePopupDoneText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});
