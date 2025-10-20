import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function ProfileScreen() {
  const { username } = useLocalSearchParams();
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.subtitle}>User: {username || 'Unknown'}</Text>
      <Text style={styles.description}>Profile page coming soon...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#007AFF',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
});
