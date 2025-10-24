import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import api from '../services/api';
import { getCurrentUser } from '../services/api';

const GENRES = [
  'Rock', 'Punk', 'Pop', 'Jazz', 'Hip Hop', 'Trap', 'Drill', 
  'Electronic', 'Afrobeat', 'Indie', 'Classical', 'Country', 
  'Blues', 'Underground', 'Sample', 'Acapella', 'R&B'
];

export default function CreatePostScreen() {
  const insets = useSafeAreaInsets();
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('');
  const [features, setFeatures] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Error fetching user data:', error);
      router.replace('/login');
    }
  };

  const handleFilePicker = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedFile(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking file:', error);
      Alert.alert('Error', 'Failed to select file');
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !genre || !selectedFile) {
      Alert.alert('Error', 'Please fill in all required fields and select an audio file');
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: Implement actual API call to create post
      // This would involve uploading the file and creating the post
      Alert.alert('Success', 'Post created successfully!');
      router.back();
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderGenreSelector = () => (
    <View style={styles.genreSection}>
      <Text style={styles.sectionTitle}>Genre</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.genreContainer}
      >
        {GENRES.map((genreOption) => (
          <TouchableOpacity
            key={genreOption}
            style={[
              styles.genreButton,
              genre === genreOption && styles.genreButtonSelected
            ]}
            onPress={() => setGenre(genreOption)}
          >
            <Text style={[
              styles.genreText,
              genre === genreOption && styles.genreTextSelected
            ]}>
              {genreOption}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Post</Text>
        <TouchableOpacity 
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.submitGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.submitText}>
              {isSubmitting ? 'Posting...' : 'Post'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title Input */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>Title *</Text>
          <TextInput
            style={styles.titleInput}
            placeholder="Enter track title..."
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
        </View>

        {/* Description Input */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>Description *</Text>
          <TextInput
            style={styles.descriptionInput}
            placeholder="Describe your track..."
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            value={description}
            onChangeText={setDescription}
            multiline={true}
            numberOfLines={4}
            maxLength={500}
          />
        </View>

        {/* Genre Selector */}
        {renderGenreSelector()}

        {/* Features Input */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>Features</Text>
          <TextInput
            style={styles.featuresInput}
            placeholder="List collaborators, producers, etc..."
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            value={features}
            onChangeText={setFeatures}
            multiline={true}
            numberOfLines={2}
            maxLength={200}
          />
        </View>

        {/* File Upload */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>Audio File *</Text>
          <TouchableOpacity 
            style={styles.fileButton}
            onPress={handleFilePicker}
          >
            <LinearGradient
              colors={['rgba(102, 126, 234, 0.2)', 'rgba(118, 75, 162, 0.2)']}
              style={styles.fileGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.fileIcon}>🎵</Text>
              <Text style={styles.fileText}>
                {selectedFile ? selectedFile.name : 'Select Audio File'}
              </Text>
              <Text style={styles.fileSubtext}>
                {selectedFile ? 'Tap to change' : 'MP3, WAV, M4A supported'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Preview Section */}
        {selectedFile && (
          <View style={styles.previewSection}>
            <Text style={styles.sectionTitle}>Preview</Text>
            <View style={styles.previewCard}>
              <View style={styles.previewHeader}>
                <Image 
                  source={require('../assets/images/dpp.jpg')}
                  style={styles.previewAvatar}
                />
                <View style={styles.previewInfo}>
                  <Text style={styles.previewAuthor}>{currentUser?.userName}</Text>
                  <Text style={styles.previewTime}>now</Text>
                </View>
              </View>
              <Text style={styles.previewTitle}>{title || 'Track Title'}</Text>
              <Text style={styles.previewDescription}>
                {description || 'Track description...'}
              </Text>
              {genre && (
                <View style={styles.previewGenre}>
                  <Text style={styles.previewGenreText}>{genre}</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>
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
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitGradient: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  submitText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
    marginTop: 12,
  },
  inputSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 12,
  },
  titleInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: 'white',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  descriptionInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: 'white',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    textAlignVertical: 'top',
    minHeight: 100,
  },
  featuresInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: 'white',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    textAlignVertical: 'top',
    minHeight: 60,
  },
  genreSection: {
    marginTop: 24,
  },
  genreContainer: {
    paddingRight: 20,
  },
  genreButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: 8,
  },
  genreButtonSelected: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  genreText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  genreTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  fileButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  fileGradient: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(102, 126, 234, 0.3)',
    borderStyle: 'dashed',
  },
  fileIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  fileText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  fileSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  previewSection: {
    marginTop: 32,
    marginBottom: 32,
  },
  previewCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  previewInfo: {
    flex: 1,
  },
  previewAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  previewTime: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  previewDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 20,
    marginBottom: 12,
  },
  previewGenre: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  previewGenreText: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '500',
  },
});
