import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
  Animated,
} from 'react-native';
import {
  Sparkles,
  Bell,
  CheckCircle2,
  MapPin,
  Compass,
  ArrowRight,
  Send,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

interface ComingSoonPlaceholderProps {
  title?: string;
  subtitle?: string;
  city?: string;
  category?: string;
  onExploreLive?: () => void;
  showCitySwitcher?: boolean;
  onSelectCity?: (city: string) => void;
}

const CITIES = [
  { name: 'Patna', status: 'LIVE' },
  { name: 'Ranchi', status: 'LIVE' },
  { name: 'Varanasi', status: 'LIVE' },
  { name: 'Bodh Gaya', status: 'LIVE' },
  { name: 'Muzaffarpur', status: 'SOON' },
  { name: 'Darbhanga', status: 'SOON' },
  { name: 'Kolkata', status: 'SOON' },
  { name: 'Lucknow', status: 'SOON' },
];

export default function ComingSoonPlaceholder({
  title = 'coming soon to your city!',
  subtitle = 'happylokam is expanding rapidly across eastern india. We are hand-curating royal venues, verified caterers, and luxury passes for this region.',
  city,
  category,
  onExploreLive,
  showCitySwitcher = true,
  onSelectCity,
}: ComingSoonPlaceholderProps) {
  const router = useRouter();
  const [notified, setNotified] = useState(false);
  const [selectedCity, setSelectedCity] = useState(city || 'Patna');

  const handleNotifyMe = async () => {
    try {
      const key = `@notif_pref_${selectedCity}_${category || 'all'}`;
      await AsyncStorage.setItem(key, 'true');
      setNotified(true);
    } catch {
      setNotified(true);
    }
  };

  const handleWhatsAppInquiry = () => {
    const text = encodeURIComponent(
      `Hello happylokam Support, I am looking for ${category || 'event venues & passes'} in ${selectedCity}. Please let me know when services become available or share custom concierge options!`
    );
    Linking.openURL(`https://wa.me/918292888200?text=${text}`).catch(() => {
      Linking.openURL('tel:+918292888200');
    });
  };

  const handleCityPress = (c: { name: string; status: string }) => {
    setSelectedCity(c.name);
    if (onSelectCity) {
      onSelectCity(c.name);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Glow Badge */}
      <View style={styles.badgeWrap}>
        <View style={styles.sparkleIcon}>
          <Sparkles size={16} color="#e11d48" />
        </View>
        <Text style={styles.badgeText}>happylokam expansion</Text>
      </View>

      {/* Main Title */}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      {/* City Switcher Row */}
      {showCitySwitcher && (
        <View style={styles.citySection}>
          <View style={styles.citySectionHeader}>
            <MapPin size={14} color="#64748b" />
            <Text style={styles.citySectionTitle}>select a region to explore</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cityRow}
          >
            {CITIES.map((c) => {
              const isSelected = selectedCity.toLowerCase() === c.name.toLowerCase();
              const isLive = c.status === 'LIVE';
              return (
                <TouchableOpacity
                  key={c.name}
                  style={[
                    styles.cityChip,
                    isSelected && styles.cityChipSelected,
                    isLive && styles.cityChipLiveBorder,
                  ]}
                  onPress={() => handleCityPress(c)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.cityChipText,
                      isSelected && styles.cityChipTextSelected,
                    ]}
                  >
                    {c.name.toLowerCase()}
                  </Text>
                  <View
                    style={[
                      styles.statusPill,
                      isLive ? styles.statusPillLive : styles.statusPillSoon,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        isLive ? styles.statusTextLive : styles.statusTextSoon,
                      ]}
                    >
                      {isLive ? 'live' : 'soon'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Action Card */}
      <View style={styles.actionCard}>
        <View style={styles.actionHeader}>
          <View style={styles.bellIconBox}>
            <Bell size={20} color="#e11d48" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>be first on the vip guest list</Text>
            <Text style={styles.actionDesc}>
              Get ₹1,000 celebration credits & priority pass booking notification the moment we launch in {selectedCity.toLowerCase()}.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.notifyBtn, notified && styles.notifyBtnSuccess]}
          onPress={handleNotifyMe}
          disabled={notified}
          activeOpacity={0.85}
        >
          {notified ? (
            <>
              <CheckCircle2 size={18} color="#ffffff" />
              <Text style={styles.notifyBtnText}>we'll notify you first! ✨</Text>
            </>
          ) : (
            <>
              <Bell size={18} color="#ffffff" />
              <Text style={styles.notifyBtnText}>notify me on launch</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Concierge & Browse Live Venues */}
      <View style={styles.secondaryActions}>
        <TouchableOpacity
          style={styles.exploreLiveBtn}
          onPress={() => {
            if (onExploreLive) {
              onExploreLive();
            } else {
              router.push('/(tabs)/explore');
            }
          }}
          activeOpacity={0.85}
        >
          <Compass size={18} color="#0f172a" />
          <Text style={styles.exploreLiveText}>browse active patna & bihar venues</Text>
          <ArrowRight size={16} color="#0f172a" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.conciergeBtn}
          onPress={handleWhatsAppInquiry}
          activeOpacity={0.85}
        >
          <Send size={16} color="#059669" />
          <Text style={styles.conciergeBtnText}>need urgent booking? chat with concierge</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.brandFooter}>happylokam • luxury celebrations & event passes</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 460,
  },
  badgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff1f2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fecdd3',
    marginBottom: 14,
    gap: 6,
  },
  sparkleIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#e11d48',
    textTransform: 'lowercase',
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0f172a',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 8,
    textTransform: 'lowercase',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
    marginBottom: 20,
    textTransform: 'lowercase',
  },
  citySection: {
    width: '100%',
    marginBottom: 20,
  },
  citySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  citySectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'lowercase',
    letterSpacing: 0.2,
  },
  cityRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  cityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  cityChipSelected: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  cityChipLiveBorder: {
    borderColor: '#cbd5e1',
  },
  cityChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  cityChipTextSelected: {
    color: '#ffffff',
  },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusPillLive: {
    backgroundColor: '#dcfce7',
  },
  statusPillSoon: {
    backgroundColor: '#f1f5f9',
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '800',
  },
  statusTextLive: {
    color: '#16a34a',
  },
  statusTextSoon: {
    color: '#94a3b8',
  },
  actionCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 16,
  },
  actionHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  bellIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#fff1f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    textTransform: 'lowercase',
    marginBottom: 3,
  },
  actionDesc: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 17,
  },
  notifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e11d48',
    borderRadius: 14,
    paddingVertical: 12,
    gap: 8,
  },
  notifyBtnSuccess: {
    backgroundColor: '#10b981',
  },
  notifyBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    textTransform: 'lowercase',
  },
  secondaryActions: {
    width: '100%',
    gap: 10,
    marginBottom: 16,
  },
  exploreLiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  exploreLiveText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    textTransform: 'lowercase',
  },
  conciergeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ecfdf5',
    borderRadius: 14,
    paddingVertical: 11,
    gap: 6,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  conciergeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
    textTransform: 'lowercase',
  },
  brandFooter: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
});
