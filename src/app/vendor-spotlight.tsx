import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Users,
  Star,
  ShieldCheck,
  MapPin,
  Sparkles,
  PhoneCall,
  Send,
  Building,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import ComingSoonPlaceholder from '../components/ComingSoonPlaceholder';

interface Vendor {
  id: string;
  name: string;
  category: string;
  city: string;
  rating: number;
  reviewsCount: number;
  experience: string;
  startingPrice: string;
  image: string;
  verified: boolean;
  specialty: string;
}

const VENDORS: Vendor[] = [
  {
    id: 'v1',
    name: 'royal patliputra royal caterers',
    category: 'catering',
    city: 'patna',
    rating: 4.9,
    reviewsCount: 142,
    experience: '12+ Years',
    startingPrice: '₹850 / Plate',
    image: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=80',
    verified: true,
    specialty: 'Authentic Awadhi & Bihari Royal Cuisine for 1,000+ Guests',
  },
  {
    id: 'v2',
    name: 'loksafari cinematic drone & media',
    category: 'photography',
    city: 'patna',
    rating: 5.0,
    reviewsCount: 88,
    experience: '8+ Years',
    startingPrice: '₹45,000 / Day',
    image: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=800&q=80',
    verified: true,
    specialty: '4K Ultra Drone Fly-throughs & Cinematic Wedding Teasers',
  },
  {
    id: 'v3',
    name: 'shree krishna floral & royal stage decor',
    category: 'decor',
    city: 'patna',
    rating: 4.8,
    reviewsCount: 110,
    experience: '15+ Years',
    startingPrice: '₹60,000 / Event',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
    verified: true,
    specialty: 'Imported Orchid Stage Mandaps & Dynamic Architectural Lighting',
  },
  {
    id: 'v4',
    name: 'jharkhand heritage band & sound orchestra',
    category: 'music',
    city: 'ranchi',
    rating: 4.9,
    reviewsCount: 76,
    experience: '10+ Years',
    startingPrice: '₹35,000 / Night',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
    verified: true,
    specialty: 'Live Brass Symphony, Sufi Fusion & Dandiya Beats',
  },
];

const CATEGORIES = [
  { key: 'all', label: 'All Vendors' },
  { key: 'catering', label: 'Catering' },
  { key: 'photography', label: 'Photography & Drone' },
  { key: 'decor', label: 'Decor & Mandap' },
  { key: 'music', label: 'DJ & Live Sound' },
  { key: 'makeup', label: 'Bridal Makeup' },
];

export default function VendorSpotlightScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedCat, setSelectedCat] = useState('all');
  const [selectedCity, setSelectedCity] = useState('patna');

  const isLiveCity = ['patna', 'ranchi', 'varanasi'].includes(selectedCity.toLowerCase());

  const filtered = VENDORS.filter((v) => {
    const matchCat = selectedCat === 'all' || v.category === selectedCat;
    const matchCity = selectedCity === 'all' || v.city.toLowerCase() === selectedCity.toLowerCase();
    return matchCat && matchCity;
  });

  const handleContactVendor = (v: Vendor) => {
    const msg = encodeURIComponent(
      `Hello happylokam Support, I want to book verified vendor: ${v.name} (${v.category}) for my celebration in ${v.city}. Please connect me!`
    );
    Linking.openURL(`https://wa.me/918969255561?text=${msg}`).catch(() => {
      Linking.openURL('tel:+918969255561');
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color="#0f172a" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>verified vendor spotlight</Text>
          <Text style={styles.headerSubtitle}>Trusted catering, photo & decor teams</Text>
        </View>
        <View style={styles.vendorBadge}>
          <Building size={18} color="#e11d48" />
        </View>
      </View>

      {/* City Switcher */}
      <View style={styles.cityBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {['patna', 'ranchi', 'varanasi', 'kolkata', 'lucknow'].map((c) => {
            const active = selectedCity.toLowerCase() === c;
            return (
              <TouchableOpacity
                key={c}
                style={[styles.cityChip, active && styles.cityChipActive]}
                onPress={() => setSelectedCity(c)}
                activeOpacity={0.8}
              >
                <Text style={[styles.cityChipText, active && styles.cityChipTextActive]}>
                  {c}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Category Pills */}
      <View style={styles.catBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {CATEGORIES.map((cat) => {
            const active = selectedCat === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                style={[styles.catChip, active && styles.catChipActive]}
                onPress={() => setSelectedCat(cat.key)}
                activeOpacity={0.8}
              >
                <Text style={[styles.catChipText, active && styles.catChipTextActive]}>
                  {cat.label.toLowerCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.scrollBody}
        showsVerticalScrollIndicator={false}
      >
        {!isLiveCity || filtered.length === 0 ? (
          <ComingSoonPlaceholder
            title={`vendor network coming soon in ${selectedCity.toLowerCase()}!`}
            subtitle="our partner onboarding team is curating premier vendors for this region. Are you a vendor? Join happylokam today."
            city={selectedCity}
            category={selectedCat}
            onSelectCity={(c) => setSelectedCity(c)}
          />
        ) : (
          <View style={styles.vendorList}>
            {filtered.map((vendor) => (
              <View key={vendor.id} style={styles.vendorCard}>
                <Image source={{ uri: vendor.image }} style={styles.vendorImg} />

                <View style={styles.vendorContent}>
                  <View style={styles.verifiedRow}>
                    <View style={styles.verifiedTag}>
                      <ShieldCheck size={13} color="#10b981" />
                      <Text style={styles.verifiedText}>happylokam verified</Text>
                    </View>
                    <View style={styles.ratingBox}>
                      <Star size={12} color="#f59e0b" fill="#f59e0b" />
                      <Text style={styles.ratingVal}>
                        {vendor.rating.toFixed(1)} ({vendor.reviewsCount})
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.vendorName}>{vendor.name}</Text>
                  <Text style={styles.specialtyText}>{vendor.specialty}</Text>

                  <View style={styles.metaRow}>
                    <View style={styles.metaCol}>
                      <Text style={styles.metaLabel}>LOCATION</Text>
                      <View style={styles.metaValRow}>
                        <MapPin size={11} color="#64748b" />
                        <Text style={styles.metaVal}>{vendor.city}</Text>
                      </View>
                    </View>
                    <View style={styles.metaCol}>
                      <Text style={styles.metaLabel}>EXPERIENCE</Text>
                      <Text style={styles.metaVal}>{vendor.experience}</Text>
                    </View>
                    <View style={styles.metaCol}>
                      <Text style={styles.metaLabel}>EST. PRICING</Text>
                      <Text style={[styles.metaVal, { color: '#e11d48', fontWeight: '800' }]}>
                        {vendor.startingPrice}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.contactBtn}
                    onPress={() => handleContactVendor(vendor)}
                    activeOpacity={0.85}
                  >
                    <Send size={14} color="#ffffff" />
                    <Text style={styles.contactBtnText}>inquire & check availability</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    textTransform: 'lowercase',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  vendorBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#fff1f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cityBar: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  cityChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cityChipActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  cityChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  cityChipTextActive: {
    color: '#ffffff',
  },
  catBar: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  catChipActive: {
    backgroundColor: '#e11d48',
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  catChipTextActive: {
    color: '#ffffff',
  },
  scrollBody: {
    padding: 20,
    paddingBottom: 40,
  },
  vendorList: {
    gap: 18,
  },
  vendorCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  vendorImg: {
    width: '100%',
    height: 160,
    backgroundColor: '#e2e8f0',
  },
  vendorContent: {
    padding: 16,
  },
  verifiedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
    textTransform: 'lowercase',
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
    textTransform: 'lowercase',
    marginBottom: 4,
  },
  specialtyText: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 12,
    marginBottom: 14,
  },
  metaCol: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
    marginBottom: 2,
  },
  metaValRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  metaVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e11d48',
    borderRadius: 12,
    paddingVertical: 11,
    gap: 6,
  },
  contactBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
    textTransform: 'lowercase',
  },
});
