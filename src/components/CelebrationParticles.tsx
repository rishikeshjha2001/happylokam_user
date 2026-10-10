import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Easing } from 'react-native';

const { width, height } = Dimensions.get('window');

interface Particle {
  id: number;
  x: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
  color: string;
}

const PARTICLE_COLORS = [
  'rgba(255, 255, 255, 0.4)',
  'rgba(254, 205, 211, 0.5)', // rose-200
  'rgba(253, 230, 138, 0.45)', // amber-200
  'rgba(255, 255, 255, 0.6)',
  'rgba(251, 191, 36, 0.35)',
];

const PARTICLES: Particle[] = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  x: Math.random() * (width - 40),
  size: Math.random() * 10 + 6,
  opacity: Math.random() * 0.4 + 0.3,
  duration: Math.random() * 3000 + 4000,
  delay: Math.random() * 2000,
  color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
}));

function FloatingItem({ item }: { item: Particle }) {
  const translateY = useRef(new Animated.Value(height * 0.4)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(item.delay),
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -50,
            duration: item.duration,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(opacityAnim, {
              toValue: item.opacity,
              duration: item.duration * 0.3,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0,
              duration: item.duration * 0.7,
              useNativeDriver: true,
            }),
          ]),
        ]),
        // Reset
        Animated.timing(translateY, {
          toValue: height * 0.4,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: item.x,
          width: item.size,
          height: item.size,
          borderRadius: item.size / 2,
          backgroundColor: item.color,
          opacity: opacityAnim,
          transform: [{ translateY }],
        },
      ]}
    />
  );
}

export default function CelebrationParticles({ count }: { count?: number } = {}) {
  const items = count ? PARTICLES.slice(0, count) : PARTICLES;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {items.map((item) => (
        <FloatingItem key={item.id} item={item} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    bottom: 0,
  },
});
