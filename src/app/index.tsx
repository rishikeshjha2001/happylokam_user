import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  Easing,
} from 'react-native';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

export default function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const translateYAnim = useRef(new Animated.Value(30)).current;
  const orbScaleAnim = useRef(new Animated.Value(1)).current;
  const lineAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(translateYAnim, {
        toValue: 0,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Line expand
    Animated.timing(lineAnim, {
      toValue: 1,
      duration: 800,
      delay: 500,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();

    // 3. Ambient orb breathing loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(orbScaleAnim, {
          toValue: 1.25,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(orbScaleAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 4. Subtle logo float loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -5,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 5. Navigate to Main Tabs on completion
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start(() => {
        router.replace('/(tabs)');
      });
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const lineWidth = lineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width * 0.55],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Advanced Ambient Pulsing Circles */}
      <Animated.View
        style={[
          styles.ambientOuterRing,
          {
            transform: [{ scale: orbScaleAnim }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.ambientOrb,
          {
            transform: [{ scale: orbScaleAnim }],
          },
        ]}
      />

      <Animated.View
        style={[
          styles.contentWrapper,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }, { translateY: translateYAnim }],
          },
        ]}
      >
        <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
          <Text style={styles.brandTitle}>happylokam</Text>
        </Animated.View>

        {/* Dynamic Celebration Accent Line */}
        <Animated.View style={[styles.gradientLineContainer, { width: lineWidth }]}>
          <View style={styles.gradientLine} />
        </Animated.View>

        <View style={styles.taglineBadge}>
          <Text style={styles.tagline}>EXTRAORDINARY CELEBRATIONS</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff', // Clean Pure White Background
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  ambientOuterRing: {
    position: 'absolute',
    width: 440,
    height: 440,
    borderRadius: 220,
    backgroundColor: 'rgba(225, 29, 72, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.08)',
  },
  ambientOrb: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(225, 29, 72, 0.08)', // Soft celebration rose aura
    borderWidth: 1.5,
    borderColor: 'rgba(225, 29, 72, 0.16)',
  },
  contentWrapper: {
    alignItems: 'center',
    zIndex: 10,
  },
  brandTitle: {
    fontSize: 54,
    fontWeight: '900',
    color: '#000000', // Bold Pure Black Typography
    letterSpacing: -1.5,
  },
  gradientLineContainer: {
    height: 3.5,
    marginTop: 14,
    borderRadius: 2,
    overflow: 'hidden',
    alignItems: 'center',
  },
  gradientLine: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e11d48', // Celebration Rose Accent
  },
  taglineBadge: {
    marginTop: 14,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  tagline: {
    color: '#0f172a', // Luxury Black Typography
    fontWeight: '900',
    letterSpacing: 2.5,
    fontSize: 11,
    textTransform: 'uppercase',
  },
});
