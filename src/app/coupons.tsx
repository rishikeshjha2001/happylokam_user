import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Share,
  Clipboard,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Tag,
  Copy,
  CheckCircle2,
  Sparkles,
  Percent,
  Calendar,
  Gift,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import ComingSoonPlaceholder from '../components/ComingSoonPlaceholder';

interface CouponItem {
  id: string;
  code: string;
  title: string;
  discount: string;
  description: string;
  category: string;
  minBooking: string;
  expires: string;
  isPopular?: boolean;
}

const CURATED_COUPONS: CouponItem[] = [
  {
    id: 'c1',
    code: 'happylokam500',
    title: 'welcome celebration gift',
    discount: '₹500 OFF',
    description: 'Instant ₹500 discount on your first royal venue booking or loksafari expedition pass.',
    category: 'all',
    minBooking: '₹2,500',
    expires: 'Valid until 31 Dec 2026',
    isPopular: true,
  },
  {
    id: 'c2',
    code: 'royalwedding2026',
    title: 'royal banquet & wedding mega perk',
    discount: '15% OFF',
    description: 'Get up to ₹15,000 off on 500+ guest wedding banquet reservations and catering packages.',
    category: 'wedding',
    minBooking: '₹50,000',
    expires: 'Valid for 2026-2027 season',
    isPopular: true,
  },
  {
    id: 'c3',
    code: 'dandiyavip',
    title: 'dandiya & festival pass perk',
    discount: '₹200 OFF',
    description: 'Save ₹200 on couple & VIP stage passes for upcoming Dandiya Nights and music festivals.',
    category: 'tickets',
    minBooking: '₹800',
    expires: 'Limited availability',
  },
  {
    id: 'c4',
    code: 'safariexplore',
    title: 'loksafari eco-resort trail',
    discount: '10% OFF',
    description: 'Enjoy 10% instant rebate on jungle safari tents, adventure gear and nature tours.',
    category: 'safari',
    minBooking: '₹4,000',
    expires: 'Valid on weekend slots',
  },
];

const CATEGORIES = [
  { key: 'all', label: 'All Offers' },
  { key: 'wedding', label: 'Weddings' },
  { key: 'tickets', label: 'Passes & Dandiya' },
  { key: 'safari', label: 'LokSafari' },
  { key: 'unreleased', label: 'International' },
];

export default function CouponsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (code: string) => {
    Clipboard.setString(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const filteredCoupons = CURATED_COUPONS.filter((c) =>
    activeTab === 'all' ? true : c.category === activeTab
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
          <Text style={styles.headerTitle}>happylokam coupons & perks</Text>
          <Text style={styles.headerSubtitle}>Verified promo codes for instant savings</Text>
        </View>
        <View style={styles.giftBadge}>
          <Gift size={18} color="#e11d48" />
        </View>
      </View>

      {/* Category Pills */}
      <View style={styles.categoryWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORIES.map((cat) => {
            const isActive = activeTab === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                style={[styles.catPill, isActive && styles.catPillActive]}
                onPress={() => setActiveTab(cat.key)}
                activeOpacity={0.8}
              >
                <Text
                  style={[styles.catPillText, isActive && styles.catPillTextActive]}
                >
                  {cat.label.toLowerCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.contentScroll}
        showsVerticalScrollIndicator={false}
      >
        {filteredCoupons.length > 0 ? (
          <View style={styles.couponList}>
            {filteredCoupons.map((item) => {
              const isCopied = copiedCode === item.code;
              return (
                <View key={item.id} style={styles.couponCard}>
                  {item.isPopular && (
                    <View style={styles.popularTag}>
                      <Sparkles size={11} color="#ffffff" />
                      <Text style={styles.popularTagText}>most popular</Text>
                    </View>
                  )}

                  <View style={styles.couponTopRow}>
                    <View style={styles.discountBadge}>
                      <Percent size={14} color="#e11d48" />
                      <Text style={styles.discountText}>{item.discount.toLowerCase()}</Text>
                    </View>
                    <Text style={styles.minBookingText}>Min. {item.minBooking}</Text>
                  </View>

                  <Text style={styles.couponTitle}>{item.title}</Text>
                  <Text style={styles.couponDesc}>{item.description}</Text>

                  {/* Cutout Line */}
                  <View style={styles.cutoutWrap}>
                    <View style={styles.cutoutCircleLeft} />
                    <View style={styles.cutoutDash} />
                    <View style={styles.cutoutCircleRight} />
                  </View>

                  {/* Code & Copy Row */}
                  <View style={styles.codeRow}>
                    <View style={styles.codeBox}>
                      <Tag size={14} color="#64748b" />
                      <Text style={styles.codeText}>{item.code}</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.copyBtn, isCopied && styles.copyBtnSuccess]}
                      onPress={() => handleCopy(item.code)}
                      activeOpacity={0.85}
                    >
                      {isCopied ? (
                        <>
                          <CheckCircle2 size={14} color="#ffffff" />
                          <Text style={styles.copyBtnText}>copied!</Text>
                        </>
                      ) : (
                        <>
                          <Copy size={14} color="#0f172a" />
                          <Text style={[styles.copyBtnText, { color: '#0f172a' }]}>
                            copy code
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>

                  <View style={styles.expiryRow}>
                    <Calendar size={12} color="#94a3b8" />
                    <Text style={styles.expiryText}>{item.expires.toLowerCase()}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <ComingSoonPlaceholder
            title="exclusive offers coming soon!"
            subtitle="we are curating exclusive luxury hotel and international destination vouchers for this category. Stay tuned!"
            category={activeTab}
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
  giftBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#fff1f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryWrap: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  categoryScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  catPillActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  catPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  catPillTextActive: {
    color: '#ffffff',
  },
  contentScroll: {
    padding: 20,
    paddingBottom: 40,
  },
  couponList: {
    gap: 16,
  },
  couponCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  popularTag: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#e11d48',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  popularTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
    textTransform: 'lowercase',
  },
  couponTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  discountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff1f2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#e11d48',
  },
  minBookingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  couponTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
    textTransform: 'lowercase',
  },
  couponDesc: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 14,
  },
  cutoutWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: -18,
    marginVertical: 6,
  },
  cutoutCircleLeft: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderRightWidth: 1,
    borderColor: '#e2e8f0',
  },
  cutoutDash: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  cutoutCircleRight: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderLeftWidth: 1,
    borderColor: '#e2e8f0',
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 8,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
  },
  codeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.5,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  copyBtnSuccess: {
    backgroundColor: '#10b981',
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
    textTransform: 'lowercase',
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  expiryText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
});
