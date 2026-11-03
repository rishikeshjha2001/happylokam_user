import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Check,
  Sparkles,
} from 'lucide-react-native';
import RoomDatabase, { RoomUser } from '../services/roomDatabase';

export default function PersonalInfoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('Male');
  const [location, setLocation] = useState('Patna, Bihar');
  const [userSession, setUserSession] = useState<RoomUser | null>(null);

  useEffect(() => {
    loadProfile();

    const onBackPress = () => {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/profile');
      }
      return true;
    };
    const backSub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backSub.remove();
  }, []);

  const loadProfile = async () => {
    try {
      const session = await RoomDatabase.getUserSession();
      if (session) {
        setUserSession(session);
        setName(session.name || '');
        setEmail(session.email || '');
        setPhone(session.phone || '');
        setGender(session.gender || 'Male');
        setLocation(session.location || 'Patna, Bihar');
      } else {
        const loc = await RoomDatabase.getLocation();
        if (loc) setLocation(loc);
      }
    } catch (e) {
      console.warn('loadProfile error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your name.');
      return;
    }

    setSaving(true);
    try {
      const updated: RoomUser = {
        id: userSession?.id || 'u_' + Date.now(),
        name: name.trim(),
        email: email.trim() || userSession?.email || 'user@happylokam.com',
        phone: phone.trim() || userSession?.phone,
        gender,
        location: location.trim(),
        role: userSession?.role || 'USER',
        token: userSession?.token || 'token_' + Date.now(),
        walletBalance: userSession?.walletBalance || 0,
        lastLogin: Date.now(),
      };

      await RoomDatabase.saveUserSession(updated);
      await RoomDatabase.saveLocation(location.trim());
      Alert.alert('Success 🎉', 'Your personal profile has been updated.');
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not save profile changes.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#e11d48" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
        <TouchableOpacity
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'))}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Personal Information</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 24) + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Full Name</Text>
          <View style={styles.inputRow}>
            <User size={18} color="#94a3b8" />
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your full name"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <Text style={styles.sectionLabel}>Email Address</Text>
          <View style={styles.inputRow}>
            <Mail size={18} color="#94a3b8" />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="name@example.com"
              placeholderTextColor="#94a3b8"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <Text style={styles.sectionLabel}>Mobile Number</Text>
          <View style={styles.inputRow}>
            <Phone size={18} color="#94a3b8" />
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+91 9876543210"
              placeholderTextColor="#94a3b8"
              keyboardType="phone-pad"
            />
          </View>

          <Text style={styles.sectionLabel}>Gender</Text>
          <View style={styles.genderRow}>
            {['Male', 'Female', 'Other'].map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.genderChip, gender === g && styles.genderChipActive]}
                onPress={() => setGender(g)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.genderChipText,
                    gender === g && styles.genderChipTextActive,
                  ]}
                >
                  {g}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionLabel}>Primary City / Location</Text>
          <View style={styles.inputRow}>
            <MapPin size={18} color="#e11d48" />
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Patna, Bihar"
              placeholderTextColor="#94a3b8"
            />
          </View>
        </View>

        {/* Save CTA */}
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.88}
        >
          {saving ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Check size={18} color="#ffffff" strokeWidth={3} />
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    marginTop: 14,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 14,
    height: 48,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#0f172a',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 8,
  },
  genderChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  genderChipActive: {
    backgroundColor: '#e11d48',
    borderColor: '#e11d48',
  },
  genderChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  genderChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: '#e11d48',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    elevation: 3,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
