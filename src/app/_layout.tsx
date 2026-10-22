
import { Stack } from "expo-router";
import { View, Text, StyleSheet, Animated, Dimensions, Easing } from "react-native";
import { useEffect, useState, useRef } from "react";
import * as SplashScreen from "expo-splash-screen";

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
        // Here you can load fonts, icons, check auth, etc.
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
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="item-detail" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="personal-info" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="favorites" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="notifications" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="settings" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="help-support" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="privacy-security" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="ai" options={{ presentation: "transparentModal", animation: "fade" }} />
      </Stack>

      {!isAppReady && (
        <Animated.View style={[
          StyleSheet.absoluteFill,
          { 
            backgroundColor: "#ffffff", // Slate 900
            justifyContent: "center", 
            alignItems: "center",
            transform: [{ translateY: screenTranslateY }],
            zIndex: 9999
          }
        ]}>
          
          {/* Glowing Circle Background */}
          <Animated.View style={{
            position: "absolute",
            width: 150,
            height: 150,
            borderRadius: 75,
            backgroundColor: "#e11d48", // Rose 600
            opacity: 0.8,
            transform: [{ scale: circleScale }],
            shadowColor: "#e11d48",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 1,
            shadowRadius: 40,
            elevation: 20
          }} />

          {/* Masked Text Reveal */}
          <View style={{ overflow: "hidden", padding: 10 }}>
            <Animated.Text style={{ 
              fontSize: 48, 
              fontWeight: "900", 
              color: "#0f172a", letterSpacing: 2,
              transform: [{ translateY: textTranslateY }],
              opacity: textOpacity
            }}>
              happylokam
            </Animated.Text>
          </View>

          {/* Golden Tagline */}
          <Animated.Text style={{ 
            fontSize: 16, 
            color: "#e11d48", // Amber 400
            textAlign: "center", 
            marginTop: 5, 
            fontStyle: "italic", 
            fontWeight: "600",
            letterSpacing: 1,
            opacity: taglineOpacity
          }}>
            Extraordinary Celebrations
          </Animated.Text>
          
        </Animated.View>
      )}
    </View>
  );
}

