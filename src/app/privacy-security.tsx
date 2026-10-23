import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  BackHandler,
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
} from 'lucide-react-native';
import RoomDatabase from '../services/roomDatabase';

export default function PrivacySecurityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

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

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your HappyLokam account? This action will forfeit remaining wallet cash and cannot be undone.',
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
              All payments are processed securely through Razorpay 256-Bit SSL encryption. We never store debit/credit card CVV or pin data.
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
            onPress={() => Alert.alert('Terms of Service', 'HappyLokam guarantees genuine celebration experiences and verified vendor contracts. View full legal terms at https://happylokam.com/terms')}
            activeOpacity={0.8}
          >
            <FileText size={18} color="#64748b" />
            <Text style={styles.linkText}>Terms of Service</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => Alert.alert('Privacy Policy', 'HappyLokam is committed to protecting your celebration data and booking privacy. View full privacy policy at https://happylokam.com/privacy')}
            activeOpacity={0.8}
          >
            <Lock size={18} color="#64748b" />
            <Text style={styles.linkText}>Customer Privacy Policy</Text>
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={[styles.card, { borderColor: '#fecdd3' }]}>
          <Text style={[styles.cardHeader, { color: '#be123c' }]}>Account Management</Text>
          <TouchableOpacity
            style={styles.linkRow}
            onPress={handleDeleteAccount}
            activeOpacity={0.8}
          >
            <Trash2 size={18} color="#e11d48" />
            <Text style={[styles.linkText, { color: '#e11d48', fontWeight: '700' }]}>
              Delete Account & Clear All Data
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
});
