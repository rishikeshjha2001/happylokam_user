import React, { useRef } from 'react';
import { View, PanResponder } from 'react-native';
import { useRouter } from 'expo-router';

interface SwipeTabContainerProps {
  currentTab: 'index' | 'explore' | 'loksafari' | 'bookings' | 'profile';
  children: React.ReactNode;
}

const TABS_SEQUENCE: Array<'index' | 'explore' | 'loksafari' | 'bookings' | 'profile'> = [
  'index',
  'explore',
  'loksafari',
  'bookings',
  'profile',
];

export default function SwipeTabContainer({ currentTab, children }: SwipeTabContainerProps) {
  const router = useRouter();
  const currentIndex = TABS_SEQUENCE.indexOf(currentTab);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const { dx, dy, vx } = gestureState;
        // Strictly horizontal swipe gesture filter
        return (
          Math.abs(dx) > 50 &&
          Math.abs(dx) > Math.abs(dy) * 2.2 &&
          Math.abs(vx) > 0.3
        );
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dx } = gestureState;
        if (dx < -60 && currentIndex < TABS_SEQUENCE.length - 1) {
          // Swipe Left -> Move to Next Tab
          const next = TABS_SEQUENCE[currentIndex + 1];
          router.replace(next === 'index' ? '/(tabs)' : `/(tabs)/${next}`);
        } else if (dx > 60 && currentIndex > 0) {
          // Swipe Right -> Move to Previous Tab
          const prev = TABS_SEQUENCE[currentIndex - 1];
          router.replace(prev === 'index' ? '/(tabs)' : `/(tabs)/${prev}`);
        }
      },
      onPanResponderTerminationRequest: () => true,
    })
  ).current;

  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      {children}
    </View>
  );
}
