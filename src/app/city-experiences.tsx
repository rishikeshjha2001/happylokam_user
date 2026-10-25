import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Compass,
  MapPin,
  Calendar,
  Star,
  Sparkles,
  ArrowRight,
  Ticket,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import ComingSoonPlaceholder from '../components/ComingSoonPlaceholder';

interface ExperienceItem {
  id: string;
  title: string;
  city: string;
  badge: string;
  rating: number;
  duration: string;
  price: number;
  image: string;
  description: string;
}

const EXPERIENCES: ExperienceItem[] = [
  {
    id: 'exp-patna-1',
    title: 'ganga cruise & royal evening aarti pass',
    city: 'patna',
    badge: 'bestseller',
    rating: 4.9,
    duration: '3.5 Hours',
    price: 899,
    image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80',
    description: 'Exclusive sunset luxury river cruise along NIT Ghat with folk music and VIP deck seating for the Ganga Aarti.',
  },
  {
    id: 'exp-patna-2',
    title: 'bihar heritage food & kebab trail',
    city: 'patna',
    badge: 'curated culinary',
    rating: 4.8,
    duration: '2.5 Hours',
    price: 650,
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    description: 'Guided tasting tour through the historic Old Patna lanes, featuring authentic Bihari litti-chokha & royal sweets.',
  },
  {
    id: 'exp-ranchi-1',
    title: 'hundru falls adventure & safari camp',
    city: 'ranchi',
    badge: 'loksafari certified',
    rating: 4.9,
    duration: '1 Full Day',
    price: 1850,
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    description: 'Trek into the lush Chota Nagpur plateau, waterfall swimming, tribal lunch, and sunset canopy campfire.',
  },
  {
    id: 'exp-varanasi-1',
    title: 'subah-e-banaras morning heritage boat & aarti',
    city: 'varanasi',
    badge: 'royal spiritual',
    rating: 5.0,
    duration: '4 Hours',
    price: 1200,
    image: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=800&q=80',
    description: 'Private dawn rowboat through Assi to Dashashwamedh Ghats with Vedic chants and heritage silk workshop visit.',
  },
];

const CITIES_TABS = [
  { key: 'all', label: 'All Cities', status: 'LIVE' },
  { key: 'patna', label: 'Patna', status: 'LIVE' },
  { key: 'ranchi', label: 'Ranchi', status: 'LIVE' },
  { key: 'varanasi', label: 'Varanasi', status: 'LIVE' },
  { key: 'kolkata', label: 'Kolkata', status: 'SOON' },
  { key: 'lucknow', label: 'Lucknow', status: 'SOON' },
  { key: 'delhi', label: 'Delhi NCR', status: 'SOON' },
];

export default function CityExperiencesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeCity, setActiveCity] = useState('all');

  const selectedTabObj = CITIES_TABS.find((t) => t.key === activeCity);
  const isSoonCity = selectedTabObj?.status === 'SOON';

  const filtered = EXPERIENCES.filter((e) =>
    activeCity === 'all' ? true : e.city === activeCity
  );

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
          <Text style={styles.headerTitle}>city experiences & passes</Text>
          <Text style={styles.headerSubtitle}>Curated local adventures & VIP access</Text>
        </View>
        <View style={styles.expBadge}>
          <Compass size={18} color="#e11d48" />
        </View>
      </View>

      {/* City Tabs */}
      <View style={styles.tabBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScroll}
        >
          {CITIES_TABS.map((t) => {
            const active = activeCity === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                style={[styles.cityTab, active && styles.cityTabActive]}
                onPress={() => setActiveCity(t.key)}
                activeOpacity={0.8}
              >
                <Text style={[styles.cityTabText, active && styles.cityTabTextActive]}>
                  {t.label.toLowerCase()}
                </Text>
                {t.status === 'SOON' && (
                  <View style={styles.soonDot}>
                    <Text style={styles.soonDotText}>soon</Text>
                  </View>
                )}
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
        {isSoonCity ? (
          <ComingSoonPlaceholder
            title={`experiences coming soon to ${selectedTabObj?.label.toLowerCase()}!`}
            subtitle="curating exclusive heritage trails, VIP festival access, and luxury stay packages for this city. Get notified on early bird launch!"
            city={selectedTabObj?.label}
          />
        ) : filtered.length > 0 ? (
          <View style={styles.cardsList}>
            {filtered.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.card}
                activeOpacity={0.9}
                onPress={() => router.push('/(tabs)/loksafari')}
              >
                <Image source={{ uri: item.image }} style={styles.cardImg} />
                <View style={styles.badgeRow}>
                  <View style={styles.ratingBadge}>
                    <Star size={12} color="#f59e0b" fill="#f59e0b" />
                    <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                  </View>
                  <View style={styles.bestsellerBadge}>
                    <Sparkles size={11} color="#ffffff" />
                    <Text style={styles.bestsellerText}>{item.badge}</Text>
                  </View>
                </View>

                <View style={styles.cardInfo}>
                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <MapPin size={12} color="#64748b" />
                      <Text style={styles.metaText}>{item.city}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Calendar size={12} color="#64748b" />
                      <Text style={styles.metaText}>{item.duration}</Text>
                    </View>
                  </View>

                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardDesc} numberOfLines={2}>
                    {item.description}
                  </Text>

                  <View style={styles.cardFooter}>
                    <View>
                      <Text style={styles.pricePrefix}>Starting from</Text>
                      <Text style={styles.priceAmount}>
                        ₹{item.price.toLocaleString('en-IN')}{' '}
                        <Text style={styles.priceSuffix}>/ person</Text>
                      </Text>
                    </View>
                    <View style={styles.bookBtn}>
                      <Ticket size={14} color="#ffffff" />
                      <Text style={styles.bookBtnText}>reserve pass</Text>
                      <ArrowRight size={13} color="#ffffff" />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <ComingSoonPlaceholder
            title="new experiences rolling out soon!"
            subtitle="more verified adventure passes are being added daily across bihar and eastern india."
          />
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
  expBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#fff1f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  tabScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  cityTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cityTabActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  cityTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  cityTabTextActive: {
    color: '#ffffff',
  },
  soonDot: {
    backgroundColor: '#e11d48',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  soonDotText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#ffffff',
  },
  scrollBody: {
    padding: 20,
    paddingBottom: 40,
  },
  cardsList: {
    gap: 18,
  },
  card: {
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
  cardImg: {
    width: '100%',
    height: 180,
    backgroundColor: '#e2e8f0',
  },
  badgeRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  bestsellerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e11d48',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  bestsellerText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
    textTransform: 'lowercase',
  },
  cardInfo: {
    padding: 16,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'lowercase',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    textTransform: 'lowercase',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
    paddingTop: 12,
  },
  pricePrefix: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
  },
  priceAmount: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0f172a',
  },
  priceSuffix: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e11d48',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    gap: 6,
  },
  bookBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
    textTransform: 'lowercase',
  },
});
