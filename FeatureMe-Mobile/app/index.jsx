import React from "react";
import Header from "../components/ui/Header";
import { Text, StyleSheet, Image, View, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';


export default function StartPage(){
    return(
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            <LinearGradient
                colors={['#0a0b0f', '#1a1d29', '#232946']}
                style={styles.container}
            >
                <Header/>
                
                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <View style={styles.heroContent}>
                        {/* Logo Section */}
                        <View style={styles.logoSection}>
                            <Image 
                                source={require('../assets/images/PNGs/Logo+Text-Gradient.png')}
                                style={styles.heroLogo}
                                resizeMode="contain"
                            />
                        </View>
                        
                        {/* Badge */}
                        <View style={styles.badge}>
                            <Text style={styles.badgeIcon}>🎵</Text>
                            <Text style={styles.badgeText}>Join the Music Revolution</Text>
                        </View>
                        
                        {/* Title */}
                        <View style={styles.titleSection}>
                            <Text style={styles.titleMain}>FeatureMe</Text>
                            <Text style={styles.titleSub}>The Future of Music Collaboration</Text>
                        </View>
                        
                        {/* Description */}
                        <Text style={styles.description}>
                            The ultimate platform for musicians to connect, collaborate, and showcase their talent. 
                            Join the next generation of music creators.
                        </Text>
                        
                        {/* Action Buttons */}
                        <View style={styles.actionButtons}>
                            <TouchableOpacity 
                                style={styles.primaryButton}
                                onPress={() => router.push('/signup')}
                            >
                                <Text style={styles.primaryButtonText}>Start Creating</Text>
                                <Text style={styles.buttonArrow}>→</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={styles.secondaryButton}
                                onPress={() => router.push('/login')}
                            >
                                <Text style={styles.secondaryButtonText}>Sign In</Text>
                            </TouchableOpacity>
                        </View>
                        
                        {/* Stats */}
                        <View style={styles.statsContainer}>
                            <View style={styles.statItem}>
                                <Text style={styles.statNumber}>∞</Text>
                                <Text style={styles.statLabel}>Possibilities</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statNumber}>24/7</Text>
                                <Text style={styles.statLabel}>Available</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statNumber}>100%</Text>
                                <Text style={styles.statLabel}>Free</Text>
                            </View>
                        </View>
                    </View>
                </View>
                
                {/* Features Preview */}
                <View style={styles.featuresSection}>
                    <Text style={styles.featuresTitle}>Why Choose FeatureMe?</Text>
                    <Text style={styles.featuresSubtitle}>Everything you need to succeed in the music industry</Text>
                    
                    <View style={styles.featuresGrid}>
                        <View style={styles.featureCard}>
                            <View style={styles.featureIcon}>
                                <Text style={styles.featureEmoji}>🎵</Text>
                            </View>
                            <Text style={styles.featureTitle}>Upload & Share</Text>
                            <Text style={styles.featureDescription}>
                                Share your music, beats, and loops with a global community of artists and listeners.
                            </Text>
                        </View>
                        
                        <View style={styles.featureCard}>
                            <View style={styles.featureIcon}>
                                <Text style={styles.featureEmoji}>🤝</Text>
                            </View>
                            <Text style={styles.featureTitle}>Collaborate & Connect</Text>
                            <Text style={styles.featureDescription}>
                                Find the perfect collaborators, join exciting projects, and grow your network.
                            </Text>
                        </View>
                        
                        <View style={styles.featureCard}>
                            <View style={styles.featureIcon}>
                                <Text style={styles.featureEmoji}>🌟</Text>
                            </View>
                            <Text style={styles.featureTitle}>Get Discovered</Text>
                            <Text style={styles.featureDescription}>
                                Showcase your talent to record labels, A&R representatives, and fans.
                            </Text>
                        </View>
                    </View>
                </View>
                
                {/* CTA Section */}
                <View style={styles.ctaSection}>
                    <View style={styles.ctaLogoSection}>
                        <Image 
                            source={require('../assets/images/PNGs/Logo+Text-White.png')}
                            style={styles.ctaLogo}
                            resizeMode="contain"
                        />
                    </View>
                    <Text style={styles.ctaTitle}>Ready to Start Your Music Journey?</Text>
                    <Text style={styles.ctaDescription}>
                        Be among the first to experience the future of music collaboration. 
                        Start creating, connecting, and getting discovered today.
                    </Text>
                    
                    <View style={styles.ctaButtons}>
                        <TouchableOpacity 
                            style={styles.ctaPrimaryButton}
                            onPress={() => router.push('/signup')}
                        >
                            <Text style={styles.ctaPrimaryText}>Get Started Free</Text>
                            <Text style={styles.ctaButtonArrow}>→</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={styles.ctaSecondaryButton}
                            onPress={() => router.push('/login')}
                        >
                            <Text style={styles.ctaSecondaryText}>Already have an account? Sign In</Text>
                        </TouchableOpacity>
                    </View>
                    
                    <View style={styles.guarantee}>
                        <Text style={styles.guaranteeIcon}>✓</Text>
                        <Text style={styles.guaranteeText}>Free forever • No credit card required • Cancel anytime</Text>
                    </View>
                </View>
            </LinearGradient>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    scrollContainer: {
        flex: 1,
    },
    container: {
        flex: 1,
        minHeight: '100%',
    },
    
    // Hero Section
    heroSection: {
        marginTop:80,
        paddingTop: 100,
        paddingHorizontal: 20,
        paddingBottom: 40,
        alignItems: 'center',
    },
    heroContent: {
        alignItems: 'center',
        maxWidth: 400,
    },
    logoSection: {
        marginBottom: 20,
        alignItems: 'center',
    },
    heroLogo: {
        height: 60,
        width: 200,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(127, 83, 172, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(127, 83, 172, 0.3)',
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginBottom: 20,
    },
    badgeIcon: {
        fontSize: 16,
        marginRight: 8,
    },
    badgeText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#a084e8',
    },
    titleSection: {
        alignItems: 'center',
        marginBottom: 20,
    },
    titleMain: {
        fontSize: 36,
        fontWeight: '900',
        color: '#fff',
        marginBottom: 8,
        textAlign: 'center',
    },
    titleSub: {
        fontSize: 18,
        fontWeight: '600',
        color: '#bfc9d1',
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        color: '#9ca3af',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 30,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 30,
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#7f53ac',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 25,
        shadowColor: '#7f53ac',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        marginRight: 8,
    },
    buttonArrow: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    secondaryButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    secondaryButtonText: {
        color: '#bfc9d1',
        fontSize: 16,
        fontWeight: '600',
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 20,
        justifyContent: 'center',
        flexWrap: 'wrap',
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 24,
        fontWeight: '900',
        color: '#7f53ac',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#9ca3af',
        fontWeight: '500',
    },
    
    // Features Section
    featuresSection: {
        paddingHorizontal: 20,
        paddingVertical: 40,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
    },
    featuresTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 8,
    },
    featuresSubtitle: {
        fontSize: 16,
        color: '#9ca3af',
        textAlign: 'center',
        marginBottom: 30,
    },
    featuresGrid: {
        gap: 20,
    },
    featureCard: {
        backgroundColor: 'rgba(30, 34, 45, 0.8)',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(127, 83, 172, 0.1)',
        alignItems: 'center',
    },
    featureIcon: {
        width: 60,
        height: 60,
        borderRadius: 15,
        backgroundColor: '#7f53ac',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 15,
    },
    featureEmoji: {
        fontSize: 24,
    },
    featureTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 10,
        textAlign: 'center',
    },
    featureDescription: {
        fontSize: 14,
        color: '#9ca3af',
        textAlign: 'center',
        lineHeight: 20,
    },
    
    // CTA Section
    ctaSection: {
        paddingHorizontal: 20,
        paddingVertical: 40,
        alignItems: 'center',
    },
    ctaLogoSection: {
        marginBottom: 20,
        alignItems: 'center',
    },
    ctaLogo: {
        height: 60,
        width: 200,
    },
    ctaTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 15,
    },
    ctaDescription: {
        fontSize: 16,
        color: '#9ca3af',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 25,
    },
    ctaButtons: {
        gap: 12,
        marginBottom: 20,
        alignItems: 'center',
    },
    ctaPrimaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#7f53ac',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 25,
        shadowColor: '#7f53ac',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    ctaPrimaryText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        marginRight: 8,
    },
    ctaButtonArrow: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    ctaSecondaryButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
    },
    ctaSecondaryText: {
        color: '#bfc9d1',
        fontSize: 14,
        fontWeight: '600',
    },
    guarantee: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    guaranteeIcon: {
        color: '#1db954',
        fontSize: 16,
        fontWeight: '900',
    },
    guaranteeText: {
        color: '#9ca3af',
        fontSize: 12,
    },
});