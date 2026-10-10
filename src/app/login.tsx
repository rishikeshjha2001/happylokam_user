import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import {
  Sparkles,
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  User,
} from 'lucide-react-native';
import RoomDatabase from '../services/roomDatabase';
import CelebrationDialog, { DialogType } from '../components/CelebrationDialog';
import CelebrationParticles from '../components/CelebrationParticles';
import { API_BASE_URL } from '../constants/api';

export default function LoginScreen() {
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Custom Celebration Dialog State
  const [dialogConfig, setDialogConfig] = useState<{
    visible: boolean;
    type: DialogType;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
  }>({
    visible: false,
    type: 'confirm',
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim() || (authMode === 'signup' && !name.trim())) {
      setDialogConfig({
        visible: true,
        type: 'danger',
        title: 'Missing Details',
        message: 'Please fill in all required fields.',
        confirmText: 'OK',
        onConfirm: () => setDialogConfig((prev) => ({ ...prev, visible: false })),
      });
      return;
    }

    setLoading(true);
    try {
      const endpoint =
        authMode === 'login'
          ? `${API_BASE_URL}/auth/login`
          : `${API_BASE_URL}/auth/register`;

      const payload =
        authMode === 'login'
          ? { email: email.trim(), password: password.trim() }
          : { name: name.trim(), email: email.trim(), password: password.trim() };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok && data.token) {
        // Persist session to local Room Database with phone if present
        await RoomDatabase.saveUserSession({
          id: data.user?.id || 'u_' + Date.now(),
          name: data.user?.name || name.trim() || 'Celebration Lover',
          email: email.trim(),
          phone: data.user?.phone || undefined,
          role: data.user?.role || 'USER',
          token: data.token,
          lastLogin: Date.now(),
        });

        setDialogConfig({
          visible: true,
          type: 'success',
          title: authMode === 'login' ? 'Welcome Back!' : 'Welcome!',
          message: 'Signed in successfully.',
          confirmText: 'Continue',
          onConfirm: () => {
            setDialogConfig((prev) => ({ ...prev, visible: false }));
            router.replace('/(tabs)');
          },
        });
      } else {
        setDialogConfig({
          visible: true,
          type: 'danger',
          title: 'Sign In Failed',
          message: data.message || 'Incorrect credentials.',
          confirmText: 'Try Again',
          onConfirm: () => setDialogConfig((prev) => ({ ...prev, visible: false })),
        });
      }
    } catch {
      setDialogConfig({
        visible: true,
        type: 'danger',
        title: 'Connection Issue',
        message: 'Could not connect to server.',
        confirmText: 'OK',
        onConfirm: () => setDialogConfig((prev) => ({ ...prev, visible: false })),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#090b10" />

      {/* Top Header */}
      <View style={styles.topHeader}>
        <CelebrationParticles count={14} />
        <View style={styles.glowCircle} />

        <View style={styles.brandBadge}>
          <Sparkles size={12} color="#f43f5e" />
          <Text style={styles.brandBadgeText}>CELEBRATION OS</Text>
        </View>

        <Text style={styles.brandTitle}>happylokam</Text>
        <Text style={styles.brandSubtitle}>
          {authMode === 'login'
            ? 'Sign in to access your passes and bookings'
            : 'Create an account to reserve celebration passes'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Animated.View
          style={[
            styles.card,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Fluid Tab Switcher */}
          <View style={styles.tabSwitcher}>
            <TouchableOpacity
              style={[styles.tabBtn, authMode === 'login' && styles.tabBtnActive]}
              onPress={() => setAuthMode('login')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, authMode === 'login' && styles.tabTextActive]}>
                Sign In
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tabBtn}
              onPress={() => router.replace('/signup')}
              activeOpacity={0.8}
            >
              <Text style={styles.tabText}>
                Create Account
              </Text>
            </TouchableOpacity>
          </View>

          {/* Full Name for Sign Up */}
          {authMode === 'signup' && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <View style={styles.inputContainer}>
                <User size={18} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Rishi Kumar"
                  placeholderTextColor="#64748b"
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>
          )}

          {/* Email Address */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.inputContainer}>
              <Mail size={18} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="user@example.com"
                placeholderTextColor="#64748b"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputContainer}>
              <Lock size={18} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="••••••••"
                placeholderTextColor="#64748b"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                {showPassword ? <EyeOff size={18} color="#94a3b8" /> : <Eye size={18} color="#94a3b8" />}
              </TouchableOpacity>
            </View>
          </View>

          {/* Primary Submit Button */}
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading} activeOpacity={0.88}>
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <View style={styles.btnContent}>
                <Text style={styles.submitButtonText}>
                  {authMode === 'login' ? 'Sign In & Explore' : 'Create Account'}
                </Text>
                <ArrowRight size={18} color="#ffffff" />
              </View>
            )}
          </TouchableOpacity>

          {/* Guest Link */}
          <TouchableOpacity
            style={styles.guestLink}
            onPress={() => router.replace('/(tabs)')}
            activeOpacity={0.7}
          >
            <Text style={styles.guestLinkText}>Continue Exploring as Guest</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* Custom Designed Celebration Dialog */}
      <CelebrationDialog
        visible={dialogConfig.visible}
        type={dialogConfig.type}
        title={dialogConfig.title}
        message={dialogConfig.message}
        confirmText={dialogConfig.confirmText}
        cancelText={dialogConfig.cancelText}
        onConfirm={dialogConfig.onConfirm}
        onCancel={() => setDialogConfig((prev) => ({ ...prev, visible: false }))}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090b10' },
  topHeader: {
    paddingTop: 50,
    paddingBottom: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  glowCircle: {
    position: 'absolute',
    top: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(225, 29, 72, 0.15)',
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(225, 29, 72, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.3)',
  },
  brandBadgeText: { color: '#f43f5e', fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  brandTitle: { fontSize: 36, fontWeight: '900', color: '#ffffff', letterSpacing: -1 },
  brandSubtitle: { fontSize: 13, color: '#94a3b8', marginTop: 4, fontWeight: '500', textAlign: 'center' },

  scrollContent: { flexGrow: 1, backgroundColor: '#090b10' },
  card: { padding: 24, paddingTop: 10 },

  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#121622',
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1c2333',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  tabBtnActive: {
    backgroundColor: '#e11d48',
  },
  tabText: { fontSize: 13, fontWeight: '700', color: '#94a3b8' },
  tabTextActive: { color: '#ffffff', fontWeight: '800' },

  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: '#cbd5e1', marginBottom: 6 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121622',
    borderWidth: 1,
    borderColor: '#1c2333',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: { marginRight: 10 },
  textInput: { flex: 1, fontSize: 15, color: '#ffffff' },
  eyeBtn: { padding: 4 },

  submitButton: {
    backgroundColor: '#e11d48',
    borderRadius: 16,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#e11d48',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  btnContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  submitButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '800' },

  guestLink: { marginTop: 22, alignItems: 'center' },
  guestLinkText: { color: '#94a3b8', fontSize: 13, fontWeight: '600', textDecorationLine: 'underline' },
});
