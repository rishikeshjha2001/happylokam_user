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
import { Sparkles, Heart, ShieldCheck, Crown } from 'lucide-react-native';
import RoomDatabase from '../services/roomDatabase';

const { width, height } = Dimensions.get('window');

export default function PremiumSplashScreen() {
  const pulseAnim = useRef(new Animated.Value(0.95)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const logoRotateAnim = useRef(new Animated.Value(0)).current;
  const ringAnim1 = useRef(new Animated.Value(0)).current;
  const ringAnim2 = useRef(new Animated.Value(0)).current;
  const taglineAnim = useRef(new Animated.Value(20)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Looping pulse for background ambience
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.95,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 2. Expanding glowing concentric aura rings
    Animated.loop(
      Animated.parallel([
        Animated.timing(ringAnim1, {
          toValue: 1,
          duration: 2600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(900),
          Animated.timing(ringAnim2, {
            toValue: 1,
            duration: 2600,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    // 3. Main logo reveal sequence -> Check auth then navigate
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 45,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotateAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
        Animated.timing(taglineAnim, {
          toValue: 0,
          duration: 700,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
      ]),
      Animated.delay(800), // Hold for user enjoyment
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 350,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.08,
          duration: 350,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      router.replace('/(tabs)');
    });
  }, []);

  const ringScale1 = ringAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 2.4],
  });
  const ringOpacity1 = ringAnim1.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.5, 0.25, 0],
  });

  const ringScale2 = ringAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 2.4],
  });
  const ringOpacity2 = ringAnim2.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.5, 0.25, 0],
  });

  const spin = logoRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-15deg', '0deg'],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />

      {/* Pulsing Aura Rings */}
      <Animated.View
        style={[
          styles.glowRing,
          {
            transform: [{ scale: ringScale1 }],
            opacity: ringOpacity1,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.glowRing,
          {
            transform: [{ scale: ringScale2 }],
            opacity: ringOpacity2,
          },
        ]}
      />

      {/* Main Brand Content */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }, { scale: pulseAnim }],
          },
        ]}
      >
        {/* Holographic Circular Logo Emblem with Blue Background */}
        <Animated.View
          style={[
            styles.emblemContainer,
            {
              transform: [{ rotate: spin }],
            },
          ]}
        >
          <View style={styles.emblemRing} />
          <View style={styles.emblemCore}>
            <Text style={styles.emblemLetter}>H</Text>
            <View style={styles.emblemSparkle}>
              <Sparkles size={16} color="#ffffff" />
            </View>
          </View>
        </Animated.View>

        {/* Celebration OS Pill */}
        <View style={styles.badgePill}>
          <Sparkles size={13} color="#bfdbfe" />
          <Text style={styles.badgeText}>CELEBRATION OS</Text>
        </View>

        {/* Brand Name in Pure White Foreground */}
        <Text style={styles.brandTitle}>happylokam</Text>

        {/* Tagline */}
        <Animated.View style={{ transform: [{ translateY: taglineAnim }], alignItems: 'center' }}>
          <Text style={styles.tagline}>We'll create your memory</Text>
          <Text style={styles.subTagline}>Weddings • Banquets • Catering • Events</Text>
        </Animated.View>

        {/* Glowing Progress Loader */}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
        </View>
      </Animated.View>

      {/* Bottom celebration footer */}
      <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Made with</Text>
          <Heart size={14} color="#60a5fa" fill="#60a5fa" style={{ marginHorizontal: 4 }} />
          <Text style={styles.footerText}>in India • Premium Event Network</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e3a8a', // Deep royal blue background
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(96, 165, 250, 0.18)',
    borderWidth: 2,
    borderColor: 'rgba(191, 219, 254, 0.35)',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emblemContainer: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emblemRing: {
    position: 'absolute',
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: 'rgba(37, 99, 235, 0.35)',
    borderWidth: 1.5,
    borderColor: 'rgba(147, 197, 253, 0.5)',
  },
  emblemCore: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#2563eb', // Royal blue background for the logo
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#93c5fd',
    shadowColor: '#1d4ed8',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 14,
  },
  emblemLetter: {
    fontSize: 50,
    fontWeight: '900',
    color: '#ffffff', // Foreground in white
    letterSpacing: -1,
  },
  emblemSparkle: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  brandTitle: {
    fontSize: 42,
    fontWeight: '900',
    color: '#ffffff', // Pure white foreground
    letterSpacing: -1,
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
  },
  tagline: {
    fontSize: 16,
    color: '#bfdbfe',
    fontWeight: '600',
    marginTop: 8,
    letterSpacing: 0.4,
  },
  subTagline: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
    fontWeight: '500',
    marginTop: 4,
    letterSpacing: 0.2,
  },
  progressTrack: {
    width: 140,
    height: 3.5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    marginTop: 28,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    fontWeight: '600',
  },
});
