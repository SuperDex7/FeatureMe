import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { router, usePathname } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function BottomNavigation({ activeTab, onTabChange }) {
  const pathname = usePathname();

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: '🏠',
      route: '/homepage',
    },
    {
      id: 'feed',
      label: 'Feed',
      icon: '🎵',
      route: '/feed',
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: '👤',
      route: '/profile',
    },
  ];

  const handleNavigation = (item) => {
    if (onTabChange) {
      // Use tab switching if onTabChange is provided
      onTabChange(item.id);
    } else {
      // Fallback to router navigation for backward compatibility
      router.push(item.route);
    }
  };

  const isActive = (item) => {
    if (activeTab) {
      // Use activeTab if provided
      return activeTab === item.id;
    } else {
      // Fallback to pathname checking for backward compatibility
      return pathname === item.route;
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(0, 0, 0, 0.95)', 'rgba(0, 0, 0, 0.9)']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <View style={styles.navContent}>
          {navItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.navItem,
                isActive(item) && styles.activeNavItem,
              ]}
              onPress={() => handleNavigation(item)}
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>
                <Text style={[
                  styles.icon,
                  isActive(item) && styles.activeIcon,
                ]}>
                  {item.icon}
                </Text>
                {isActive(item) && (
                  <View style={styles.activeIndicator} />
                )}
              </View>
              <Text style={[
                styles.label,
                isActive(item) && styles.activeLabel,
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  gradient: {
    paddingBottom: 34, // Account for safe area
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  navContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  navItem: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 16,
    flex: 1,
    maxWidth: 70,
  },
  activeNavItem: {
    backgroundColor: 'rgba(102, 126, 234, 0.15)',
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  icon: {
    fontSize: 20,
    opacity: 0.7,
  },
  activeIcon: {
    opacity: 1,
    transform: [{ scale: 1.1 }],
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -6,
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#667eea',
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginTop: 2,
  },
  activeLabel: {
    color: '#667eea',
    fontWeight: '600',
  },
});
