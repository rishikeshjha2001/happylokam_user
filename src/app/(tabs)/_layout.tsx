import React, { useRef, useEffect } from 'react';
import { Tabs } from 'expo-router';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, LayoutGrid, Compass, Ticket, User } from 'lucide-react-native';

const { width } = Dimensions.get('window');

// Global navigation bridge for swipe-between-tabs
const tabNavigatorBridge = { current: null as any };

const TAB_CONFIG: { [key: string]: { label: string; icon: any } } = {
  index: { label: 'Home', icon: Home },
  explore: { label: 'Explore', icon: LayoutGrid },
  loksafari: { label: 'LokSafari', icon: Compass },
  bookings: { label: 'Bookings', icon: Ticket },
  profile: { label: 'Profile', icon: User },
};

function CustomAnimatedTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const numTabs = state.routes.length;
  const tabWidth = width / numTabs;

  // Sync navigation bridge for horizontal swipe handler
  useEffect(() => {
    tabNavigatorBridge.current = { state, navigation };
  }, [state, navigation]);

  // Horizontal sliding indicator animation
  const indicatorAnim = useRef(new Animated.Value(state.index * tabWidth)).current;

  // Scale bounce animations for each tab button
  const scaleAnims = useRef(state.routes.map(() => new Animated.Value(1))).current;

  useEffect(() => {
    Animated.spring(indicatorAnim, {
      toValue: state.index * tabWidth,
      damping: 22,
      stiffness: 280,
      mass: 0.8,
      useNativeDriver: true,
    }).start();
  }, [state.index, tabWidth]);

  const handleTabPress = (route: any, index: number, isFocused: boolean) => {
    // Tactile scale pulse animation
    Animated.sequence([
      Animated.timing(scaleAnims[index], {
        toValue: 0.86,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnims[index], {
        toValue: 1,
        friction: 4,
        tension: 300,
        useNativeDriver: true,
      }),
    ]).start();

    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  // Safe padding for 3-button navigation (< o []) and gesture navigation
  // On 3-button navigation, insets.bottom is typically 48dp
  // On gesture navigation, insets.bottom is 16-34dp
  // If insets.bottom is 0, we provide a safe 12dp
  const bottomInset = Math.max(insets.bottom, 12);
  const containerHeight = 58 + bottomInset;

  return (
    <View style={[styles.tabBarContainer, { height: containerHeight, paddingBottom: bottomInset }]}>
      {/* Sliding Active Indicator Line */}
      <Animated.View
        style={[
          styles.activeIndicatorTrack,
          {
            width: tabWidth,
            transform: [{ translateX: indicatorAnim }],
          },
        ]}
      >
        <View style={styles.activeIndicatorPill} />
      </Animated.View>

      {/* Tab Buttons */}
      <View style={styles.tabsRow}>
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;
          const config = TAB_CONFIG[route.name] || { label: route.name, icon: Home };
          const IconComponent = config.icon;

          return (
            <TouchableOpacity
              key={route.key}
              style={styles.tabButton}
              onPress={() => handleTabPress(route, index, isFocused)}
              activeOpacity={0.9}
            >
              <Animated.View
                style={[
                  styles.tabIconWrapper,
                  {
                    transform: [
                      { scale: scaleAnims[index] },
                      { translateY: isFocused ? -3 : 0 },
                    ],
                  },
                ]}
              >
                <IconComponent
                  size={23}
                  color={isFocused ? '#e11d48' : '#94a3b8'}
                  strokeWidth={isFocused ? 2.5 : 2}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    isFocused ? styles.tabLabelActive : styles.tabLabelInactive,
                  ]}
                >
                  {config.label}
                </Text>
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomAnimatedTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore' }} />
      <Tabs.Screen name="loksafari" options={{ title: 'LokSafari' }} />
      <Tabs.Screen name="bookings" options={{ title: 'Bookings' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 12,
    zIndex: 40,
  },
  activeIndicatorTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIndicatorPill: {
    width: 32,
    height: 3.5,
    backgroundColor: '#e11d48',
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  tabsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 6,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  tabIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  tabLabelActive: {
    color: '#e11d48',
    fontWeight: '900',
  },
  tabLabelInactive: {
    color: '#94a3b8',
    fontWeight: '600',
  },
});
