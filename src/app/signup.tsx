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
  User,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  Phone,
  Tag,
} from 'lucide-react-native';
import RoomDatabase from '../services/roomDatabase';
import CelebrationDialog, { DialogType } from '../components/CelebrationDialog';
import CelebrationParticles from '../components/CelebrationParticles';
import { API_BASE_URL } from '../constants/api';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('Male');
  const [referralCode, setReferralCode] = useState('');
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
    type: 'success',
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

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !phone.trim()) {
      setDialogConfig({
        visible: true,
        type: 'danger',
        title: 'Missing Details',
        message: 'Please fill name, email, phone, and password.',
        confirmText: 'OK',
        onConfirm: () => setDialogConfig((prev) => ({ ...prev, visible: false })),
      });
      return;
    }

    if (password.length < 6) {
      setDialogConfig({
        visible: true,
        type: 'info',
        title: 'Password Short',
        message: 'Password must be at least 6 characters.',
        confirmText: 'OK',
        onConfirm: () => setDialogConfig((prev) => ({ ...prev, visible: false })),
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password: password.trim(),
          phone: phone.trim() || undefined,
          gender: gender,
          referralCode: referralCode.trim() || undefined,
        }),
      });

      const data = await response.json();
      if (response.ok && data.token) {
        await RoomDatabase.saveUserSession({
          id: data.user?.id || 'u_' + Date.now(),
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || data.user?.phone || undefined,
          role: data.user?.role || 'USER',
          token: data.token,
          lastLogin: Date.now(),
        });

        setDialogConfig({
          visible: true,
          type: 'success',
          title: 'Account Created! 🎉',
          message: 'Welcome to happylokam!',
          confirmText: 'Start Exploring',
          onConfirm: () => {
            setDialogConfig((prev) => ({ ...prev, visible: false }));
            router.replace('/(tabs)');
          },
        });
      } else {
        setDialogConfig({
          visible: true,
          type: 'danger',
          title: 'Sign Up Failed',
          message: data.error || data.message || 'Unable to register.',
          confirmText: 'Try Again',
          onConfirm: () => setDialogConfig((prev) => ({ ...prev, visible: false })),
        });
      }
    } catch {
      setDialogConfig({
        visible: true,
        type: 'danger',
        title: 'Network Issue',
        message: 'Could not connect to celebration server.',
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

      {/* Ambient Celebration Particles */}
      <CelebrationParticles count={14} />

      {/* Top Header */}
      <View style={styles.topHeader}>
        <View style={styles.glowCircle} />
        <View style={styles.brandBadge}>
          <Sparkles size={12} color="#f43f5e" />
          <Text style={styles.brandBadgeText}>CELEBRATION OS</Text>
        </View>
        <Text style={styles.brandTitle}>happylokam</Text>
        <Text style={styles.brandSubtitle}>Create your premium account to reserve passes</Text>
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
          {/* Mode Switcher Tabs */}
          <View style={styles.modeSwitcherContainer}>
            <TouchableOpacity
              style={styles.modeTab}
              onPress={() => router.replace('/login')}
              activeOpacity={0.8}
            >
              <Text style={styles.modeTabTextInactive}>Sign In</Text>
            </TouchableOpacity>
            <View style={[styles.modeTab, styles.modeTabActive]}>
              <Text style={styles.modeTabTextActive}>Create Account</Text>
            </View>
          </View>

          {/* Full Name */}
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

          {/* Phone Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <View style={styles.inputContainer}>
              <Phone size={18} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="+91 99999 99999"
                placeholderTextColor="#64748b"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>
          </View>
          
          {/* Gender */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Gender</Text>
            <View style={styles.genderContainer}>
              {['Male', 'Female', 'Other'].map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.genderPill, gender === g && styles.genderPillActive]}
                  onPress={() => setGender(g)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>{g}</Text>
                </TouchableOpacity>
              ))}
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

          {/* Referral Code (Optional) */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Referral Code (Optional)</Text>
            <View style={styles.inputContainer}>
              <Tag size={18} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="e.g. HAPPY123"
                placeholderTextColor="#64748b"
                autoCapitalize="characters"
                value={referralCode}
                onChangeText={setReferralCode}
              />
            </View>
          </View>

          {/* Sign Up Button */}
          <TouchableOpacity style={styles.signupButton} onPress={handleSignup} disabled={loading} activeOpacity={0.88}>
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <View style={styles.btnContent}>
                <Text style={styles.signupButtonText}>Create Account</Text>
                <ArrowRight size={18} color="#ffffff" />
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.securityNote}>
            <ShieldCheck size={14} color="#10b981" />
            <Text style={styles.securityNoteText}>Secured with 256-bit celebration encryption</Text>
          </View>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already registered? </Text>
            <TouchableOpacity onPress={() => router.replace('/login')}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.guestLink} onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.guestLinkText}>Continue as Guest</Text>
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
    paddingTop: 48,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  glowCircle: {
    position: 'absolute',
    top: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
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
  brandSubtitle: { fontSize: 13, color: '#94a3b8', marginTop: 4, fontWeight: '500' },

  scrollContent: { flexGrow: 1, backgroundColor: '#090b10' },
  card: {
    padding: 24,
    paddingTop: 10,
  },

  modeSwitcherContainer: {
    flexDirection: 'row',
    backgroundColor: '#121622',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1c2333',
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  modeTabActive: {
    backgroundColor: '#e11d48',
  },
  modeTabTextActive: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
  modeTabTextInactive: {
    color: '#94a3b8',
    fontWeight: '700',
    fontSize: 14,
  },

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
  
  genderContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  genderPill: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1c2333',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121622',
  },
  genderPillActive: {
    borderColor: '#e11d48',
    backgroundColor: 'rgba(225, 29, 72, 0.15)',
  },
  genderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
  },
  genderTextActive: {
    color: '#f43f5e',
    fontWeight: '700',
  },

  signupButton: {
    backgroundColor: '#e11d48',
    borderRadius: 16,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#e11d48',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  btnContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  signupButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '800' },

  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
  },
  securityNoteText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },

  loginContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 18 },
  loginText: { color: '#94a3b8', fontSize: 14 },
  loginLink: { color: '#f43f5e', fontSize: 14, fontWeight: '800' },

  guestLink: { marginTop: 16, alignItems: 'center' },
  guestLinkText: { color: '#64748b', fontSize: 13, fontWeight: '600' },
});
