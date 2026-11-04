import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  BackHandler,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  ShieldCheck,
  Lock,
  FileText,
  Trash2,
  CheckCircle2,
  KeyRound,
  Eye,
  EyeOff,
  X,
  ChevronRight,
  RotateCcw,
} from 'lucide-react-native';
import RoomDatabase from '../services/roomDatabase';
import { changeUserPassword } from '../services/api';

export default function PrivacySecurityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  const handleOpenPasswordModal = async () => {
    const isAuth = await RoomDatabase.isAuthenticated();
    if (!isAuth) {
      Alert.alert('Sign In Required', 'Please sign in to change your account password.', [
        { text: 'Sign In', onPress: () => router.push('/login') },
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordModalVisible(true);
  };

  const handleChangePasswordSubmit = async () => {
    if (!currentPassword.trim()) {
      Alert.alert('Validation Error', 'Please enter your current password.');
      return;
    }
    if (!newPassword.trim() || newPassword.length < 6) {
      Alert.alert('Validation Error', 'New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Validation Error', 'New password and confirmation do not match.');
      return;
    }

    try {
      setChangingPw(true);
      const res = await changeUserPassword(currentPassword.trim(), newPassword.trim());
      if (res?.success) {
        setPasswordModalVisible(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        Alert.alert('Password Updated! 🔒', res.message || 'Your account password has been changed successfully.');
      } else {
        Alert.alert('Change Password Failed', res?.error || 'Current password was incorrect. Please try again.');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Unable to update password. Please check your network connection.');
    } finally {
      setChangingPw(false);
    }
  };

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
    return true;
  };

  useEffect(() => {
    const backSub = BackHandler.addEventListener('hardwareBackPress', handleGoBack);
    return () => backSub.remove();
  }, []);

  const handleResetLocalData = () => {
    Alert.alert(
      'Reset Local Data & Wallet',
      'This will delete cached offline booking passes and reset local wallet balance to match verified server records. Proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Now',
          style: 'destructive',
          onPress: async () => {
            await RoomDatabase.resetWalletAndBookings(0);
            await RoomDatabase.cleanCache();
            Alert.alert('Reset Complete', 'Local RoomDB bookings and wallet records have been reset.');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your happylokam account? This action will forfeit remaining wallet cash and cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: async () => {
            await RoomDatabase.clearUserSession();
            await RoomDatabase.clearBookings();
            Alert.alert('Account Closed', 'Your session and account data have been removed.');
            router.replace('/login');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
        <TouchableOpacity
          onPress={handleGoBack}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy & Security</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 24) + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Security Shield Banner */}
        <View style={styles.banner}>
          <ShieldCheck size={32} color="#059669" />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.bannerTitle}>End-to-End Encrypted Platform</Text>
            <Text style={styles.bannerSub}>
              All transactions are processed securely through PCI-DSS 256-Bit SSL bank-grade encryption. We never store debit/credit card CVV or pin data.
            </Text>
          </View>
        </View>

        {/* Data Protection Points */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Data Protection Guarantees</Text>
          {[
            'Personal info (phone, email, gender) is strictly used for booking digital passes.',
            'GPS coordinates are used solely to recommend vendors in your immediate city.',
            'No advertising tracking or third-party data selling.',
            'Verified QR codes are cryptographically signed on the server for fraud prevention.',
          ].map((point, i) => (
            <View key={i} style={styles.pointRow}>
              <CheckCircle2 size={16} color="#10b981" />
              <Text style={styles.pointText}>{point}</Text>
            </View>
          ))}
        </View>

        {/* Legal & Terms */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Terms & Legal Policies</Text>
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => Alert.alert('Terms of Service', 'happylokam guarantees genuine celebration experiences and verified vendor contracts. View full legal terms at https://happylokam.com/terms')}
            activeOpacity={0.8}
          >
            <FileText size={18} color="#64748b" />
            <Text style={styles.linkText}>Terms of Service</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => Alert.alert('Privacy Policy', 'happylokam is committed to protecting your celebration data and booking privacy. View full privacy policy at https://happylokam.com/privacy')}
            activeOpacity={0.8}
          >
            <Lock size={18} color="#64748b" />
            <Text style={styles.linkText}>Customer Privacy Policy</Text>
          </TouchableOpacity>
        </View>

        {/* Change Password Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Account Security & Authentication</Text>
          <TouchableOpacity
            style={styles.linkRow}
            onPress={handleOpenPasswordModal}
            activeOpacity={0.8}
          >
            <KeyRound size={18} color="#e11d48" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.linkText, { color: '#0f172a', fontWeight: '700' }]}>
                Change Account Password
              </Text>
              <Text style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                Update your login password for secure app access
              </Text>
            </View>
            <ChevronRight size={18} color="#94a3b8" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal
        visible={passwordModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <KeyRound size={20} color="#e11d48" />
                <Text style={styles.modalTitle}>Change Password</Text>
              </View>
              <TouchableOpacity
                onPress={() => setPasswordModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <X size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 14, marginTop: 16 }}>
              <View>
                <Text style={styles.inputLabel}>Current Password</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    secureTextEntry={!showCurrentPw}
                    placeholder="Enter current password"
                    placeholderTextColor="#94a3b8"
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                  />
                  <TouchableOpacity onPress={() => setShowCurrentPw(!showCurrentPw)} style={{ padding: 4 }}>
                    {showCurrentPw ? <EyeOff size={18} color="#64748b" /> : <Eye size={18} color="#64748b" />}
                  </TouchableOpacity>
                </View>
              </View>

              <View>
                <Text style={styles.inputLabel}>New Password</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    secureTextEntry={!showNewPw}
                    placeholder="At least 6 characters"
                    placeholderTextColor="#94a3b8"
                    value={newPassword}
                    onChangeText={setNewPassword}
                  />
                  <TouchableOpacity onPress={() => setShowNewPw(!showNewPw)} style={{ padding: 4 }}>
                    {showNewPw ? <EyeOff size={18} color="#64748b" /> : <Eye size={18} color="#64748b" />}
                  </TouchableOpacity>
                </View>
              </View>

              <View>
                <Text style={styles.inputLabel}>Confirm New Password</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    secureTextEntry={!showNewPw}
                    placeholder="Repeat new password"
                    placeholderTextColor="#94a3b8"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.submitPwBtn, changingPw && { opacity: 0.7 }]}
                onPress={handleChangePasswordSubmit}
                disabled={changingPw}
                activeOpacity={0.8}
              >
                {changingPw ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.submitPwText}>Update Password</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
    gap: 16,
  },
  banner: {
    backgroundColor: '#ecfdf5',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#065f46',
  },
  bannerSub: {
    fontSize: 12,
    color: '#047857',
    marginTop: 4,
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 14,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  pointText: {
    fontSize: 13,
    color: '#334155',
    flex: 1,
    lineHeight: 18,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  linkText: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  textInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0f172a',
  },
  submitPwBtn: {
    backgroundColor: '#e11d48',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitPwText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});
