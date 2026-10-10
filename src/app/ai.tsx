
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { X, Send, Sparkles } from "lucide-react-native";
import { router } from "expo-router";
import { useState, useRef, useEffect } from "react";

export default function AiScreen() {
  const [message, setMessage] = useState("");
  const slideAnim = useRef(new Animated.Value(500)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      friction: 8,
      tension: 60,
      useNativeDriver: true
    }).start();
  }, []);

  const close = () => {
    Animated.timing(slideAnim, {
      toValue: 800,
      duration: 300,
      useNativeDriver: true
    }).start(() => router.back());
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <Animated.View style={[styles.modal, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.header}>
          <View style={styles.aiHeaderInfo}>
            <View style={styles.avatar}>
              <Sparkles size={20} color="#fff" />
            </View>
            <View>
              <Text style={styles.aiName}>Sarah ?</Text>
              <Text style={styles.aiStatus}>AI Event Assistant</Text>
            </View>
          </View>
          <TouchableOpacity onPress={close} style={styles.closeBtn}>
            <X size={24} color="#64748b" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.chatArea} showsVerticalScrollIndicator={false}>
          <View style={styles.messageBubble}>
            <Text style={styles.messageText}>Hi! I am Sarah. Looking for the best Dandiya night or a premium wedding venue in Patna?</Text>
          </View>
        </ScrollView>

        <View style={styles.inputArea}>
          <TextInput 
            style={styles.input}
            placeholder="Ask Sarah..."
            placeholderTextColor="#94a3b8"
            value={message}
            onChangeText={setMessage}
          />
          <TouchableOpacity style={[styles.sendBtn, message.length > 0 && styles.sendBtnActive]}>
            <Send size={20} color="#fff" style={{ marginLeft: 2 }} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modal: { backgroundColor: "#f8fafc", borderTopLeftRadius: 32, borderTopRightRadius: 32, height: "90%", shadowColor: "#000", shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "#f1f5f9", backgroundColor: "#fff", borderTopLeftRadius: 32, borderTopRightRadius: 32 },
  aiHeaderInfo: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#e11d48", justifyContent: "center", alignItems: "center", marginRight: 12 },
  aiName: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  aiStatus: { fontSize: 13, color: "#10b981", fontWeight: "600", marginTop: 2 },
  closeBtn: { width: 40, height: 40, backgroundColor: "#f1f5f9", borderRadius: 20, justifyContent: "center", alignItems: "center" },
  chatArea: { padding: 20, flexGrow: 1 },
  messageBubble: { backgroundColor: "#fff", padding: 16, borderRadius: 20, borderTopLeftRadius: 4, maxWidth: "85%", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  messageText: { color: "#334155", fontSize: 15, lineHeight: 22 },
  inputArea: { flexDirection: "row", alignItems: "center", padding: 15, paddingBottom: 25, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#f1f5f9" },
  input: { flex: 1, backgroundColor: "#f1f5f9", height: 50, borderRadius: 25, paddingHorizontal: 20, fontSize: 15, color: "#0f172a" },
  sendBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#cbd5e1", justifyContent: "center", alignItems: "center", marginLeft: 10 },
  sendBtnActive: { backgroundColor: "#e11d48" }
});

