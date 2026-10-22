import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Dimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import {
  User,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Gift,
  MapPin,
  Navigation,
  Sparkles,
  Compass,
  Edit3,
} from 'lucide-react-native';
import RoomDatabase from '../services/roomDatabase';
import { API_URL } from '../services/api';
import CelebrationDialog from '../components/CelebrationDialog';

const { width } = Dimensions.get('window');

export default function AuthScreen() {
  const params = useLocalSearchParams();
  const initialMode = params.mode === 'signup' ? 'signup' : 'login';

  const [authMode, setAuthMode] = useState<'login' | 'signup'>(initialMode);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState('Male');
  const [location, setLocation] = useState('');
  const [locationMode, setLocationMode] = useState<'gps' | 'manual'>('gps');
  const [detectingGps, setDetectingGps] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Dialog State
  const [dialogConfig, setDialogConfig] = useState<{
    visible: boolean;
    type: 'success' | 'danger' | 'warning' | 'info';
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
  }>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const orbScale1 = useRef(new Animated.Value(1)).current;
  const orbScale2 = useRef(new Animated.Value(1)).current;
  const toggleSlider = useRef(new Animated.Value(initialMode === 'login' ? 0 : 1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }),
    ]).start();

    // Ambient floating orbs
    Animated.loop(
      Animated.sequence([
        Animated.timing(orbScale1, { toValue: 1.15, duration: 4000, useNativeDriver: true }),
        Animated.timing(orbScale1, { toValue: 1, duration: 4000, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(orbScale2, { toValue: 1.2, duration: 5000, useNativeDriver: true }),
        Animated.timing(orbScale2, { toValue: 1, duration: 5000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const switchMode = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    Animated.spring(toggleSlider, {
      toValue: mode === 'login' ? 0 : 1,
      friction: 7,
      tension: 50,
      useNativeDriver: false,
    }).start();
  };

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setDialogConfig({
        visible: true,
        type: 'warning',
        title: 'Missing Details',
        message: 'Please enter both your email address and password to continue.',
        confirmText: 'Got It',
        onConfirm: () => setDialogConfig((prev) => ({ ...prev, visible: false })),
      });
      return;
    }

    if (authMode === 'signup' && !name.trim()) {
      setDialogConfig({
        visible: true,
        type: 'warning',
        title: 'Full Name Required',
        message: 'Please enter your full name so we can personalize your celebration tickets.',
        confirmText: 'OK',
        onConfirm: () => setDialogConfig((prev) => ({ ...prev, visible: false })),
      });
      return;
    }

    if (authMode === 'signup' && !phone.trim()) {
      setDialogConfig({
        visible: true,
        type: 'warning',
        title: 'Phone Number Required',
        message: 'Please enter your phone number to receive digital booking pass notifications.',
        confirmText: 'OK',
        onConfirm: () => setDialogConfig((prev) => ({ ...prev, visible: false })),
      });
      return;
    }

    setLoading(true);
    try {
      const endpoint = `${API_URL}/auth/${authMode === 'login' ? 'login' : 'register'}`;
      const payload =
        authMode === 'login'
          ? { email: email.trim(), password: password.trim() }
          : {
              name: name.trim(),
              email: email.trim(),
              password: password.trim(),
              phone: phone.trim() || undefined,
              gender,
              location,
            };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok && data.token) {
        await RoomDatabase.saveLocation(location);
        await RoomDatabase.saveUserSession({
          id: data.user?.id || 'u_' + Date.now(),
          name: data.user?.name || name.trim() || 'Celebration Lover',
          email: email.trim(),
          phone: data.user?.phone || phone.trim() || undefined,
          gender: data.user?.gender || gender,
          location: data.user?.location || location,
          role: data.user?.role || 'USER',
          token: data.token,
          walletBalance: typeof data.user?.walletBalance === 'number' ? data.user.walletBalance : 0,
          lastLogin: Date.now(),
        });

        setDialogConfig({
          visible: true,
          type: 'success',
          title: authMode === 'login' ? 'Welcome Back! 🎉' : 'Account Created! 🎁',
          message:
            authMode === 'login'
              ? 'Signed in successfully. Explore celebrations & passes!'
              : 'Your celebration account has been created successfully!',
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
          title: authMode === 'login' ? 'Sign In Failed' : 'Sign Up Failed',
          message: data.message || data.error || 'Incorrect credentials. Please try again.',
          confirmText: 'Try Again',
          onConfirm: () => setDialogConfig((prev) => ({ ...prev, visible: false })),
        });
      }
    } catch {
      // In offline or demo scenario, save local guest session
      await RoomDatabase.saveLocation(location || 'Pan-India');
      await RoomDatabase.saveUserSession({
        id: 'u_' + Date.now(),
        name: name.trim() || 'Guest User',
        email: email.trim() || 'guest@happylokam.com',
        phone: phone.trim() || undefined,
        gender,
        location: location || 'Pan-India',
        role: 'USER',
        token: 'token_guest_' + Date.now(),
        walletBalance: 0,
        lastLogin: Date.now(),
      });
      router.replace('/(tabs)');
    } finally {
      setLoading(false);
    }
  };

  const handleLiveGps = async () => {
    setDetectingGps(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setDialogConfig({
          visible: true,
          type: 'warning',
          title: 'Permission Denied',
          message: 'Location permission was denied. You can enter your city or state manually.',
          confirmText: 'Enter Manually',
          onConfirm: () => {
            setDialogConfig((prev) => ({ ...prev, visible: false }));
            setLocationMode('manual');
          },
        });
        setDetectingGps(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      if (loc && loc.coords) {
        const reverse = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });

        if (reverse && reverse.length > 0) {
          const item = reverse[0];
          const parts = [item.city || item.district || item.subregion || item.name, item.region || item.country].filter(Boolean);
          const formatted = parts.join(', ');
          setLocation(formatted || `${loc.coords.latitude.toFixed(2)}, ${loc.coords.longitude.toFixed(2)}`);
        } else {
          setLocation(`${loc.coords.latitude.toFixed(3)}, ${loc.coords.longitude.toFixed(3)}`);
        }
      }
    } catch (e: any) {
      console.warn('GPS location error:', e);
      setDialogConfig({
        visible: true,
        type: 'info',
        title: 'GPS Unavailable',
        message: 'Could not fetch current GPS coordinates. Please type your city manually.',
        confirmText: 'OK',
        onConfirm: () => {
          setDialogConfig((prev) => ({ ...prev, visible: false }));
          setLocationMode('manual');
        },
      });
    } finally {
      setDetectingGps(false);
    }
  };

  const handleGpsDetect = handleLiveGps;

  const sliderLeft = toggleSlider.interpolate({
    inputRange: [0, 1],
    outputRange: [6, (Math.min(width - 48, 380) - 12) / 2],
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      {/* Ambient Radial Glowing Orbs matching snippet */}
      <Animated.View
        style={[
          styles.glowOrbTopRight,
          { transform: [{ scale: orbScale1 }] },
        ]}
      />
      <Animated.View
        style={[
          styles.glowOrbBottomLeft,
          { transform: [{ scale: orbScale2 }] },
        ]}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.mainBox,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Brand Header */}
          <View style={styles.header}>
            <Text style={styles.brandTitle}>happylokam</Text>
            <Text style={styles.brandSubtitle}>Your premium celebration companion</Text>

            {/* Verified Pass Booking Badge */}
            <View style={styles.bonusBadge}>
              <Sparkles size={14} color="#e11d48" />
              <Text style={styles.bonusBadgeText}>Instant Digital Pass Booking</Text>
            </View>
          </View>

          {/* Toggle Switch (Log In / Sign Up) */}
          <View style={styles.toggleContainer}>
            <Animated.View
              style={[
                styles.togglePillIndicator,
                { left: sliderLeft },
              ]}
            />
            <TouchableOpacity
              style={styles.toggleBtn}
              onPress={() => switchMode('login')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.toggleBtnText,
                  authMode === 'login' && styles.toggleBtnTextActive,
                ]}
              >
                Log In
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toggleBtn}
              onPress={() => switchMode('signup')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.toggleBtnText,
                  authMode === 'signup' && styles.toggleBtnTextActive,
                ]}
              >
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Inputs */}
          <View style={styles.form}>
            {authMode === 'signup' && (
              <>
                <View style={styles.inputBox}>
                  <User size={20} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    placeholderTextColor="#94a3b8"
                    value={name}
                    onChangeText={setName}
                  />
                </View>

                <View style={styles.inputBox}>
                  <Phone size={20} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Mobile Number"
                    placeholderTextColor="#94a3b8"
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                  />
                </View>

                {/* Gender Selection */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748b', marginBottom: 8, textTransform: 'uppercase' }}>
                    Select Gender
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {['Male', 'Female', 'Other'].map((g) => (
                      <TouchableOpacity
                        key={g}
                        onPress={() => setGender(g)}
                        style={{
                          flex: 1,
                          paddingVertical: 10,
                          borderRadius: 10,
                          backgroundColor: gender === g ? '#e11d48' : '#f1f5f9',
                          borderWidth: 1,
                          borderColor: gender === g ? '#e11d48' : '#e2e8f0',
                          alignItems: 'center',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: '700',
                            color: gender === g ? '#ffffff' : '#334155',
                          }}
                        >
                          {g}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Location Selection (Live GPS vs Manual) */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>
                    Your Location (Required for Celebration Passes)
                  </Text>

                  {/* 2 Options Toggle */}
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                    <TouchableOpacity
                      onPress={() => {
                        setLocationMode('gps');
                        handleLiveGps();
                      }}
                      style={{
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        paddingVertical: 10,
                        paddingHorizontal: 12,
                        borderRadius: 12,
                        backgroundColor: locationMode === 'gps' ? '#ffe4e6' : '#f8fafc',
                        borderWidth: 1.5,
                        borderColor: locationMode === 'gps' ? '#e11d48' : '#e2e8f0',
                      }}
                      activeOpacity={0.8}
                    >
                      <Navigation size={15} color={locationMode === 'gps' ? '#e11d48' : '#64748b'} />
                      <Text style={{ fontSize: 12, fontWeight: '800', color: locationMode === 'gps' ? '#e11d48' : '#64748b' }}>
                        {detectingGps ? 'Detecting GPS...' : 'Live GPS'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setLocationMode('manual')}
                      style={{
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        paddingVertical: 10,
                        paddingHorizontal: 12,
                        borderRadius: 12,
                        backgroundColor: locationMode === 'manual' ? '#ffe4e6' : '#f8fafc',
                        borderWidth: 1.5,
                        borderColor: locationMode === 'manual' ? '#e11d48' : '#e2e8f0',
                      }}
                      activeOpacity={0.8}
                    >
                      <Edit3 size={15} color={locationMode === 'manual' ? '#e11d48' : '#64748b'} />
                      <Text style={{ fontSize: 12, fontWeight: '800', color: locationMode === 'manual' ? '#e11d48' : '#64748b' }}>
                        Enter Manually
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Input or Live Status Box */}
                  <View style={styles.inputBox}>
                    <MapPin size={20} color="#e11d48" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder={locationMode === 'gps' ? 'Tap Live GPS above to detect' : 'Enter your City, State or Area'}
                      placeholderTextColor="#94a3b8"
                      value={location}
                      onChangeText={setLocation}
                    />
                    {detectingGps && (
                      <ActivityIndicator size="small" color="#e11d48" style={{ marginRight: 8 }} />
                    )}
                  </View>

                  {location ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, paddingHorizontal: 4 }}>
                      <Text style={{ fontSize: 11, fontWeight: '600', color: '#059669' }}>
                        ✓ Selected: {location}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </>
            )}

            <View style={styles.inputBox}>
              <Mail size={20} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor="#94a3b8"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputBox}>
              <Lock size={20} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
                activeOpacity={0.7}
              >
                {showPassword ? (
                  <EyeOff size={20} color="#94a3b8" />
                ) : (
                  <Eye size={20} color="#94a3b8" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Primary Action Button */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.9}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <View style={styles.btnContent}>
                <Text style={styles.submitBtnText}>
                  {authMode === 'login' ? 'Log In to Account' : 'Create Account'}
                </Text>
                <ArrowRight size={20} color="#ffffff" />
              </View>
            )}
          </TouchableOpacity>

          {/* Or Continue With */}


          {/* Guest Link */}
          <TouchableOpacity
            style={styles.guestLink}
            onPress={() => router.replace('/(tabs)')}
            activeOpacity={0.75}
          >
            <Text style={styles.guestLinkText}>Continue Exploring as Guest</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* Celebration Dialog */}
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
  container: {
    flex: 1,
    backgroundColor: '#f8fafc', // Slate-50
  },
  glowOrbTopRight: {
    position: 'absolute',
    top: -120,
    right: -120,
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: 'rgba(254, 205, 211, 0.4)', // Rose-200/40
  },
  glowOrbBottomLeft: {
    position: 'absolute',
    bottom: -120,
    left: -120,
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: 'rgba(224, 231, 255, 0.4)', // Indigo-100/40
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  mainBox: {
    width: '100%',
    maxWidth: 380,
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  brandTitle: {
    fontSize: 40,
    fontWeight: '900',
    color: '#e11d48', // Rose-600
    letterSpacing: -1.2,
    marginBottom: 4,
  },
  brandSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b', // Slate-500
    marginBottom: 16,
  },
  bonusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ffe4e6', // Rose-100
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  bonusBadgeText: {
    color: '#e11d48',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Toggle Track
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: 6,
    borderRadius: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    position: 'relative',
  },
  togglePillIndicator: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    width: (Math.min(width - 48, 380) - 24) / 2,
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    zIndex: 10,
  },
  toggleBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
  },
  toggleBtnTextActive: {
    color: '#e11d48',
    fontWeight: '900',
  },

  // Form Fields
  form: {
    gap: 14,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 56,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '600',
  },
  eyeBtn: {
    padding: 6,
  },

  // Submit Button
  submitBtn: {
    backgroundColor: '#e11d48', // Rose-600
    borderRadius: 20,
    height: 58,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#e11d48',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 6,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.2,
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 28,
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 1.5,
  },

  // Social
  socialRow: {
    flexDirection: 'row',
    gap: 14,
  },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  googleIcon: {
    fontSize: 17,
    fontWeight: '900',
    color: '#3b82f6',
  },
  appleIcon: {
    fontSize: 18,
    color: '#0f172a',
  },
  socialBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#334155',
  },

  // Guest Link
  guestLink: {
    marginTop: 28,
    alignItems: 'center',
    paddingVertical: 8,
  },
  guestLinkText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
