import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Menu,
  Star,
  Clock,
  Compass,
  Ticket,
  ArrowRight,
  User,
} from 'lucide-react-native';
import { getLoksafari } from '../../services/api';
import { DbLokSafariItem } from '../../constants/databaseModels';
import { getAdminCustomSections } from '../../services/adminSections';
import PaymentModal from '../../components/PaymentModal';
import SidebarDrawer from '../../components/SidebarDrawer';
import WalletModal from '../../components/WalletModal';

const { width } = Dimensions.get('window');

export default function LokSafariTab() {
  const insets = useSafeAreaInsets();

  const [safaris, setSafaris] = useState<DbLokSafariItem[]>([]);
  const [checkoutItem, setCheckoutItem] = useState<any>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isWalletOpen, setWalletOpen] = useState(false);

  useEffect(() => {
    const onBackPress = () => {
      router.replace('/(tabs)');
      return true;
    };
    const backSub = BackHandler.addEventListener('hardwareBackPress', onBackPress);

    Promise.all([getLoksafari(), getAdminCustomSections()]).then(([backendSafaris, sections]) => {
      let combined: DbLokSafariItem[] = [...backendSafaris];
      (sections || []).forEach((sec) => {
        const titleLower = (sec.title || '').toLowerCase();
        const tagLower = (sec.tag || '').toLowerCase();
        if (
          titleLower.includes('safari') ||
          titleLower.includes('tour') ||
          titleLower.includes('trip') ||
          tagLower.includes('safari') ||
          tagLower.includes('nature')
        ) {
          (sec.items || []).forEach((it: any) => {
            combined.push({
              id: it.id,
              title: it.title,
              duration: it.subtitle || 'Custom Expedition',
              price: typeof it.price === 'number' ? `₹${it.price.toLocaleString('en-IN')}` : String(it.price),
              difficulty: 'Moderate',
              rating: it.rating || 4.9,
              highlights: it.features || [it.cornerTag || 'Exclusive'],
              image: it.image,
              type: it.type || sec.title,
              location: it.location,
            });
          });
        }
      });
      setSafaris(combined);
    }).catch(console.warn);
  }, []);

  const topHeaderPadding = Math.max(insets.top, 14);
  const bottomScrollPadding = 90 + Math.max(insets.bottom, 24);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* Top Header */}
      <View style={[styles.header, { paddingTop: topHeaderPadding }]}>
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => setSidebarOpen(true)}
          activeOpacity={0.8}
        >
          <Menu size={20} color="#ffffff" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.brandTitle}>happylokam</Text>
        </View>

        <TouchableOpacity
          style={styles.avatarBorder}
          onPress={() => setSidebarOpen(true)}
          activeOpacity={0.8}
        >
          <View style={{ width: '100%', height: '100%', backgroundColor: '#fff1f2', alignItems: 'center', justifyContent: 'center' }}>
            <User size={18} color="#e11d48" />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomScrollPadding }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>LokSafari</Text>
          <Text style={styles.pageSubtitle}>Curated luxury wildlife & nature expeditions</Text>
        </View>

        {/* Safari Cards */}
        <View style={styles.cardsList}>
          {safaris.length === 0 ? (
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 24 }}>
              <Compass size={48} color="#94a3b8" strokeWidth={1.5} />
              <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '700', marginTop: 16 }}>No Active Expeditions</Text>
              <Text style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', marginTop: 6, lineHeight: 18 }}>
                Curated wilderness tours and safari packages uploaded via the admin portal will appear right here.
              </Text>
            </View>
          ) : (
            safaris.map((item) => (
              <View key={item.id} style={styles.safariCard}>
                <TouchableOpacity
                  activeOpacity={0.94}
                  onPress={() => setCheckoutItem(item)}
                  style={styles.cardImageTouch}
                >
                  <Image source={{ uri: item.image }} style={styles.cardImage} />
                  <View style={styles.cardOverlay} />

                  {/* Star Rating Badge */}
                  <View style={styles.ratingBadge}>
                    <Star size={12} color="#fbbf24" fill="#fbbf24" style={{ marginRight: 4 }} />
                    <Text style={styles.ratingText}>{item.rating}</Text>
                  </View>
                </TouchableOpacity>

                {/* Bottom Glass Card */}
                <View style={styles.glassBottomCard}>
                  <View style={styles.cardTopRow}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={styles.typeKicker}>{item.type}</Text>
                      <Text style={styles.itemTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                    </View>
                    <View style={styles.priceContainer}>
                      <Text style={styles.perPersonLabel}>Per Person</Text>
                      <Text style={styles.priceValue}>{item.price}</Text>
                    </View>
                  </View>

                  {/* Duration & Difficulty */}
                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Clock size={13} color="rgba(255,255,255,0.7)" style={{ marginRight: 5 }} />
                      <Text style={styles.metaText}>{item.duration}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Compass size={13} color="rgba(255,255,255,0.7)" style={{ marginRight: 5 }} />
                      <Text style={styles.metaText}>{item.difficulty}</Text>
                    </View>
                  </View>

                  {/* Highlights Pills */}
                  <View style={styles.highlightsRow}>
                    {item.highlights.map((h) => (
                      <View key={h} style={styles.highlightPill}>
                        <Text style={styles.highlightText}>{h}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Direct Book Now Button */}
                  <TouchableOpacity
                    style={styles.bookSafariBtn}
                    onPress={() => setCheckoutItem(item)}
                    activeOpacity={0.85}
                  >
                    <Ticket size={15} color="#ffffff" />
                    <Text style={styles.bookSafariBtnText}>Book Expedition</Text>
                    <ArrowRight size={14} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Review Booking / Payment Modal */}
      <PaymentModal
        visible={!!checkoutItem}
        item={checkoutItem}
        onClose={() => setCheckoutItem(null)}
        onSuccess={() => {
          setCheckoutItem(null);
        }}
      />

      {/* Sidebar Drawer */}
      <SidebarDrawer
        visible={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenWallet={() => setWalletOpen(true)}
      />

      {/* Wallet Modal */}
      <WalletModal
        visible={isWalletOpen}
        onClose={() => setWalletOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    height: 72,
    backgroundColor: 'rgba(15, 23, 42, 0.98)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 30,
  },
  menuBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#e11d48',
    letterSpacing: -0.6,
  },
  avatarBorder: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    overflow: 'hidden',
    backgroundColor: '#1e293b',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    flexGrow: 1,
  },
  titleSection: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
  },
  pageTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.65)',
  },
  cardsList: {
    paddingHorizontal: 20,
    gap: 22,
  },
  safariCard: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: '#1e293b',
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  cardImageTouch: {
    width: '100%',
    height: 280,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardOverlay: {
    ...(StyleSheet.absoluteFill as any),
    backgroundColor: 'rgba(15, 23, 42, 0.25)',
  },
  ratingBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#ffffff',
  },
  glassBottomCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    padding: 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  typeKicker: {
    fontSize: 10,
    fontWeight: '900',
    color: '#fda4af',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  itemTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.3,
    lineHeight: 24,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  perPersonLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.6)',
    textTransform: 'uppercase',
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  highlightsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  highlightPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  highlightText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  bookSafariBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e11d48',
    paddingVertical: 13,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#e11d48',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  bookSafariBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
});
