
import { Tabs, router } from "expo-router";
import { StyleSheet, View, Text, TouchableOpacity, Animated } from "react-native";
import { Home, Search, CalendarHeart, User, Sparkles } from "lucide-react-native";
import { useEffect, useRef } from "react";

export default function TabLayout() {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ])
    ).start();
  }, []);

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#e11d48", // Rose 600
          tabBarInactiveTintColor: "#94a3b8", // Slate 400
          tabBarStyle: {
            backgroundColor: "#0d1117",
            borderTopWidth: 1,
            borderTopColor: "#1a202e",
            elevation: 12,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.35,
            shadowRadius: 10,
            height: undefined,
            minHeight: 60,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "600",
            marginTop: 4,
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => <Home size={24} color={color} strokeWidth={2.5} />,
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: "Explore",
            tabBarIcon: ({ color }) => <Search size={24} color={color} strokeWidth={2.5} />,
          }}
        />
        <Tabs.Screen
          name="bookings"
          options={{
            title: "Tickets",
            tabBarIcon: ({ color }) => <CalendarHeart size={24} color={color} strokeWidth={2.5} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color }) => <User size={24} color={color} strokeWidth={2.5} />,
          }}
        />
      </Tabs>

      {/* FLOATING AI ASSISTANT - Temporarily hidden per user request */}
      {/* 
      <Animated.View style={[styles.floatingButtonContainer, { transform: [{ scale: pulseAnim }] }]}>
        <TouchableOpacity 
          style={styles.floatingButton}
          activeOpacity={0.8}
          onPress={() => router.push("/ai")}
        >
          <Sparkles color="#ffffff" size={24} />
        </TouchableOpacity>
      </Animated.View> 
      */}
    </>
  );
}

const styles = StyleSheet.create({
  floatingButtonContainer: {
    position: "absolute",
    bottom: 85, // Above the tab bar
    right: 20,
    zIndex: 999,
  },
  floatingButton: {
    backgroundColor: "#e11d48",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#e11d48",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  }
});

