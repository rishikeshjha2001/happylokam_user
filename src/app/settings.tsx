import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  BackHandler,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Bell,
  MapPin,
  Moon,
  Trash2,
  ChevronRight,
  ShieldCheck,
  Smartphone,
  RefreshCw,
  Sparkles,
} from 'lucide-react-native';
import RoomDatabase from '../services/roomDatabase';
import OtaSync from '../services/otaSync';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [pushNotifs, setPushNotifs] = useState(true);
  const [promoOffers, setPromoOffers] = useState(true);
  const [gpsTracking, setGpsTracking] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [currentCity, setCurrentCity] = useState('Patna, Bihar');

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

  useEffect(() => {
    RoomDatabase.getLocation().then((loc) => {
      if (loc) setCurrentCity(loc);
    });
  }, []);

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
        <Text style={styles.headerTitle}>App Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 24) + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Section: Notifications */}
        <Text style={styles.sectionHeader}>Notifications</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle}>Booking & Ticket Pass Updates</Text>
              <Text style={styles.rowSub}>Receive instant status & QR check-in passes</Text>
            </View>
            <Switch
              value={pushNotifs}
              onValueChange={setPushNotifs}
              trackColor={{ false: '#e2e8f0', true: '#e11d48' }}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle}>Promotional Deals & Discounts</Text>
              <Text style={styles.rowSub}>New season festival discounts and wedding specials</Text>
            </View>
            <Switch
              value={promoOffers}
              onValueChange={setPromoOffers}
              trackColor={{ false: '#e2e8f0', true: '#e11d48' }}
            />
          </View>
        </View>

        {/* Section: Location & Privacy */}
        <Text style={styles.sectionHeader}>Location Preference</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => router.push('/personal-info')}
            activeOpacity={0.8}
          >
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle}>Active City</Text>
              <Text style={styles.rowSub}>{currentCity}</Text>
            </View>
            <ChevronRight size={18} color="#94a3b8" />
          </TouchableOpacity>
          <View style={styles.divider} />
          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle}>Automatic GPS Filtering</Text>
              <Text style={styles.rowSub}>Show nearby venues and celebration packages</Text>
            </View>
            <Switch
              value={gpsTracking}
              onValueChange={setGpsTracking}
              trackColor={{ false: '#e2e8f0', true: '#e11d48' }}
            />
          </View>
        </View>

        {/* App Info */}
        <View style={styles.versionBox}>
          <Text style={styles.versionTitle}>happylokam Celebrations</Text>
          <Text style={styles.versionSub}>Official Operating System • 100% Encrypted & Verified</Text>
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
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    marginTop: 18,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  rowInfo: {
    flex: 1,
    marginRight: 12,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  rowSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  versionBox: {
    alignItems: 'center',
    marginTop: 30,
  },
  versionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  versionText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  versionSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  otaBadge: {
    backgroundColor: '#ffe4e6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  otaBadgeText: {
    color: '#e11d48',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
