import React from "react";
import { View, Image, Text, StyleSheet, Pressable, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Header() {
    const insets = useSafeAreaInsets();
    
    const styles = StyleSheet.create({
        header: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(15, 15, 35, 0.95)',
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(255, 255, 255, 0.1)',
            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 4,
            },
            shadowOpacity: 0.3,
            shadowRadius: 32,
            elevation: 8,
        },
        headerContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 130,
            paddingHorizontal: 20,
            paddingTop: insets.top,
        },
        logoContainer: {
            flexShrink: 0,
        },
        logo: {
            height: 60,
            width: 170,
            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 4,
        },
        actionsContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            flexShrink: 0,
        },
        loginButton: {
            color: 'rgba(255, 255, 255, 0.8)',
            fontWeight: '600',
            fontSize: 12,
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.2)',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            overflow: 'hidden',
        },
        loginButtonText: {
            color: 'rgba(255, 255, 255, 0.8)',
            fontWeight: '600',
            fontSize: 14,
            textAlign: 'center',
        },
        signupButton: {
            color: 'white',
            fontWeight: '600',
            fontSize: 12,
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 12,
            backgroundColor: '#667eea',
            shadowColor: '#667eea',
            shadowOffset: {
                width: 0,
                height: 4,
            },
            shadowOpacity: 0.3,
            shadowRadius: 14,
            elevation: 6,
            overflow: 'hidden',
        },
        signupButtonText: {
            color: 'white',
            fontWeight: '600',
            fontSize: 15,
            textAlign: 'center',
        },
    });

    return (
        <View style={styles.header}>
            <View style={styles.headerContainer}>
                {/* Logo Section */}
                <View style={styles.logoContainer}>
                    <TouchableOpacity onPress={() => router.push('/')}>
                        <Image 
                            source={require('../../assets/images/PNGs/Logo-Lockup-Gradient.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </TouchableOpacity>
                </View>

                {/* Auth Actions */}
                <View style={styles.actionsContainer}>
                    <Pressable 
                        style={styles.loginButton}
                        onPress={() => router.push('/login')}
                    >
                        <Text style={styles.loginButtonText}>Log In</Text>
                    </Pressable>
                    
                    <Pressable 
                        style={styles.signupButton}
                        onPress={() => router.push('/signup')}
                    >
                        <Text style={styles.signupButtonText}>Get Started</Text>
                    </Pressable>
                </View>
            </View>
        </View>
    );
}