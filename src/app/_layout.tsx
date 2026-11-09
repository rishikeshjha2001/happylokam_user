
import { Stack } from "expo-router";
import { View, Text, StyleSheet, Animated, Dimensions, Easing } from "react-native";
import { useEffect, useState, useRef } from "react";
import * as SplashScreen from "expo-splash-screen";
import OtaSync from "../services/otaSync";
import RoomDatabase from "../services/roomDatabase";

SplashScreen.preventAutoHideAsync();

const { width, height } = Dimensions.get("window");

export default function RootLayout() {
  const [isAppReady, setIsAppReady] = useState(false);
  
  // Animation Values
  const circleScale = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(50)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const screenTranslateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    async function prepare() {
      try {
        // Removes legacy test bookings, wallet activity and cached feeds from
        // prior app versions while preserving the signed-in user account.
        await RoomDatabase.migrateOperationalCache('2026-11-03-clean-reset-v2');
        // Start automatic silent cloud sync (Instagram style background updates)
        OtaSync.startAutoSync();
        // Download compatible OTA code in the background. It becomes active on
        // the next launch rather than disrupting someone mid-booking.
        void OtaSync.checkForCodeUpdate();
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        console.warn(e);
      } finally {
        SplashScreen.hideAsync();
        startCinematicSplash();
      }
    }
    prepare();
  }, []);

  const startCinematicSplash = () => {
    Animated.sequence([
      // 1. Glowing circle pop
      Animated.spring(circleScale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      // 2. Text slide up and fade in
      Animated.parallel([
        Animated.spring(textTranslateY, {
          toValue: 0,
          friction: 8,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        })
      ]),
      // 3. Tagline fade in
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      // 4. Hold for user to read
      Animated.delay(1200),
      // 5. Circle explodes to cover screen while screen slides up
      Animated.parallel([
        Animated.timing(circleScale, {
          toValue: 30,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(screenTranslateY, {
          toValue: -height,
          duration: 600,
          delay: 150,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        })
      ])
    ]).start(() => {
      setIsAppReady(true);
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <Stack
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="item-detail" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="personal-info" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="favorites" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="notifications" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="settings" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="wallet" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="addresses" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="help-support" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="privacy-security" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="booking-detail" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="coupons" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="event-planner" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="city-experiences" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="ticket-wallet" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="vendor-spotlight" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="ai" options={{ presentation: "transparentModal", animation: "fade" }} />
      </Stack>

      {!isAppReady && (
        <Animated.View style={[
          StyleSheet.absoluteFill,
          { 
            backgroundColor: "#e11d48", // Official Rose-600 Background
            justifyContent: "center", 
            alignItems: "center",
            transform: [{ translateY: screenTranslateY }],
            zIndex: 9999
          }
        ]}>
          
          {/* Subtle Glowing Circle Background */}
          <Animated.View style={{
            position: "absolute",
            width: 180,
            height: 180,
            borderRadius: 90,
            backgroundColor: "rgba(255, 255, 255, 0.12)",
            transform: [{ scale: circleScale }],
          }} />

          {/* Masked Text Reveal - Pure White happylokam */}
          <View style={{ overflow: "hidden", padding: 10 }}>
            <Animated.Text style={{ 
              fontSize: 50, 
              fontWeight: "900", 
              color: "#ffffff", // Pure White text happylokam
              letterSpacing: -1,
              transform: [{ translateY: textTranslateY }],
              opacity: textOpacity
            }}>
              happylokam
            </Animated.Text>
          </View>

          {/* Tagline - Black color as requested */}
          <Animated.Text style={{ 
            fontSize: 12, 
            color: "#000000", // Black color
            textAlign: "center", 
            marginTop: 8, 
            fontWeight: "900",
            letterSpacing: 2.5,
            textTransform: "uppercase",
            opacity: taglineOpacity,
            backgroundColor: "#ffffff",
            paddingHorizontal: 14,
            paddingVertical: 5,
            borderRadius: 8,
            overflow: "hidden",
          }}>
            Extraordinary Celebrations
          </Animated.Text>
          
        </Animated.View>
      )}
    </View>
  );
}
