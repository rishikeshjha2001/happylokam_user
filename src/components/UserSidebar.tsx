import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  Image,
  ScrollView,
  Share,
  Linking,
  Platform,
} from 'react-native';
import {
  X,
  Home,
  Search,
  Ticket,
  Wallet,
  Tag,
  Share2,
  Headphones,
  User,
  LogOut,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Gift,
  Zap,
  ArrowRight,
  ExternalLink,
  Compass,
} from 'lucide-react-native';
import { router } from 'expo-router';
import RoomDatabase, { RoomUser } from '../services/roomDatabase';
import { API_BASE_URL } from '../constants/api';

const { width, height } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(width * 0.82, 340);

interface UserSidebarProps {
  visible: boolean;
  onClose: () => void;
  user: RoomUser | null;
  onLogout?: () => void;
}

export default function UserSidebar({ visible, onClose, user, onLogout }: UserSidebarProps) {
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Wallet and coupon state
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [walletModalVisible, setWalletModalVisible] = useState(false);
  const [couponsModalVisible, setCouponsModalVisible] = useState(false);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();

      fetchWalletAndCoupons();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const fetchWalletAndCoupons = async () => {
    try {
      const session = await RoomDatabase.getUserSession();
      if (session?.token) {
        // Fetch user wallet
        const walletRes = await fetch(`${API_BASE_URL}/user/wallet`, {
          headers: { Authorization: `Bearer ${session.token}` },
        }).catch(() => null);

        if (walletRes && walletRes.ok) {
          const wJson = await walletRes.json();
          if (wJson.success && wJson.data?.walletBalance !== undefined) {
            setWalletBalance(wJson.data.walletBalance);
          }
        }
      }

      // Fetch active coupons
      const offersRes = await fetch(`${API_BASE_URL}/offers`).catch(() => null);
      if (offersRes && offersRes.ok) {
        const oJson = await offersRes.json();
        const list = Array.isArray(oJson.data) ? oJson.data : (Array.isArray(oJson) ? oJson : []);
        setCoupons(list);
      }
    } catch (e) {
      console.warn('Sidebar data fetch error', e);
    }
  };

  const handleShareReferral = async () => {
    try {
      const referralCode = user?.referralCode || 'LOKAM-VIP';
      await Share.share({
        message: `Join me on HappyLokam for luxury weddings, banquets & dandiya passes! Use my invite code ${referralCode} to get instant discounts on your booking: https://happylokam.com/ref/${referralCode}`,
        title: 'HappyLokam VIP Invite',
      });
    } catch (e) {
      console.warn('Share error', e);
    }
  };

  const handleConciergeSupport = () => {
    const phone = '919988776655';
    const message = `Hello HappyLokam Concierge, I need assistance with my celebration booking / wallet discount. User: ${user?.name || 'Guest'}`;
    const url = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Linking.openURL(`tel:+919988776655`);
        }
      })
      .catch(() => Linking.openURL(`tel:+919988776655`));
  };

  const navigateTo = (path: any) => {
    onClose();
    setTimeout(() => {
      router.push(path);
    }, 240);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        </Animated.View>

        {/* Sliding Drawer Container */}
        <Animated.View
          style={[
            styles.drawer,
            {
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          {/* Header Close Row */}
          <View style={styles.topBar}>
            <View style={styles.brandRow}>
              <View style={styles.logoBadge}>
                <Sparkles size={14} color="#e11d48" />
              </View>
              <Text style={styles.brandTitle}>happylokam</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
              <X size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.drawerScroll}>
            {/* User Profile Card */}
            <TouchableOpacity
              style={styles.profileCard}
              activeOpacity={0.88}
              onPress={() => {
                if (user) {
                  navigateTo('/(tabs)/profile');
                } else {
                  navigateTo('/login');
                }
              }}
            >
              <View style={styles.avatarWrap}>
                <Image
                  source={{
                    uri: user?.email
                      ? `https://api.dicebear.com/7.x/notionists/png?seed=${encodeURIComponent(user.email)}`
                      : 'https://api.dicebear.com/7.x/notionists/png?seed=happylokam',
                  }}
                  style={styles.avatar as any}
                />
                <View style={styles.onlineDot} />
              </View>

              <View style={styles.profileInfo}>
                <Text style={styles.userName} numberOfLines={1}>
                  {user ? user.name : 'Welcome, Guest'}
                </Text>
                <Text style={styles.userSubtitle} numberOfLines={1}>
                  {user ? (user.phone || user.email) : 'Tap to sign in & unlock discounts'}
                </Text>
                <View style={styles.tierPill}>
                  <ShieldCheck size={11} color="#e11d48" />
                  <Text style={styles.tierText}>{user ? 'VIP Member' : 'Guest Tier'}</Text>
                </View>
              </View>

              <ChevronRight size={16} color="#94a3b8" />
            </TouchableOpacity>

            {/* Wallet & Booking Discount Card */}
            <TouchableOpacity
              style={styles.walletCard}
              activeOpacity={0.92}
              onPress={() => setWalletModalVisible(true)}
            >
              <View style={styles.walletHeader}>
                <View style={styles.walletIconWrap}>
                  <Wallet size={16} color="#ffffff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.walletLabel}>CELEBRATION WALLET</Text>
                  <Text style={styles.walletSub}>Next Booking Discount</Text>
                </View>
                <View style={styles.walletAmountPill}>
                  <Text style={styles.walletAmount}>₹{walletBalance.toLocaleString('en-IN')}</Text>
                </View>
              </View>
              <View style={styles.walletFooter}>
                <Text style={styles.walletNote}>
                  ✨ Admin-credited instant discount applied at checkout
                </Text>
                <ChevronRight size={13} color="#f59e0b" />
              </View>
            </TouchableOpacity>

            {/* Navigation Section */}
            <View style={styles.navSection}>
              <Text style={styles.sectionTitle}>EXPLORE & BOOKINGS</Text>

              <TouchableOpacity
                style={styles.navItem}
                onPress={() => navigateTo('/(tabs)')}
                activeOpacity={0.7}
              >
                <View style={[styles.navIconBox, { backgroundColor: '#fee2e2' }]}>
                  <Home size={18} color="#e11d48" />
                </View>
                <Text style={styles.navText}>Home Overview</Text>
                <ChevronRight size={15} color="#cbd5e1" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navItem}
                onPress={() => navigateTo('/(tabs)/explore')}
                activeOpacity={0.7}
              >
                <View style={[styles.navIconBox, { backgroundColor: '#ede9fe' }]}>
                  <Search size={18} color="#7c3aed" />
                </View>
                <Text style={styles.navText}>Advanced Search & Filters</Text>
                <View style={styles.hotBadge}>
                  <Text style={styles.hotBadgeText}>Hot</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navItem}
                onPress={() => navigateTo('/(tabs)/bookings')}
                activeOpacity={0.7}
              >
                <View style={[styles.navIconBox, { backgroundColor: '#e0f2fe' }]}>
                  <Ticket size={18} color="#0284c7" />
                </View>
                <Text style={styles.navText}>My Celebration Bookings</Text>
                <ChevronRight size={15} color="#cbd5e1" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navItem}
                onPress={() => navigateTo('/(tabs)/loksafari')}
                activeOpacity={0.7}
              >
                <View style={[styles.navIconBox, { backgroundColor: '#ecfdf5' }]}>
                  <Compass size={18} color="#059669" />
                </View>
                <Text style={styles.navText}>LokSafari Expeditions</Text>
                <View style={[styles.hotBadge, { backgroundColor: '#10b981' }]}>
                  <Text style={styles.hotBadgeText}>NEW</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Discounts & Perks Section */}
            <View style={styles.navSection}>
              <Text style={styles.sectionTitle}>REWARDS & SAVINGS</Text>

              <TouchableOpacity
                style={styles.navItem}
                onPress={() => setWalletModalVisible(true)}
                activeOpacity={0.7}
              >
                <View style={[styles.navIconBox, { backgroundColor: '#fef3c7' }]}>
                  <Zap size={18} color="#d97706" />
                </View>
                <Text style={styles.navText}>Wallet Discount Perks</Text>
                <View style={styles.balanceTag}>
                  <Text style={styles.balanceTagText}>₹{walletBalance}</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navItem}
                onPress={() => setCouponsModalVisible(true)}
                activeOpacity={0.7}
              >
                <View style={[styles.navIconBox, { backgroundColor: '#dcfce7' }]}>
                  <Tag size={18} color="#16a34a" />
                </View>
                <Text style={styles.navText}>Coupons & Promo Codes</Text>
                <View style={styles.couponCountPill}>
                  <Text style={styles.couponCountText}>{coupons.length > 0 ? `${coupons.length} Active` : 'Offers'}</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Concierge & Support */}
            <View style={styles.navSection}>
              <Text style={styles.sectionTitle}>PREMIUM SERVICE</Text>

              <TouchableOpacity
                style={styles.navItem}
                onPress={handleConciergeSupport}
                activeOpacity={0.7}
              >
                <View style={[styles.navIconBox, { backgroundColor: '#ecfdf5' }]}>
                  <Headphones size={18} color="#059669" />
                </View>
                <Text style={styles.navText}>VIP Concierge (WhatsApp)</Text>
                <ExternalLink size={14} color="#059669" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navItem}
                onPress={() => {
                  if (user) {
                    navigateTo('/(tabs)/profile');
                  } else {
                    navigateTo('/login');
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.navIconBox, { backgroundColor: '#f1f5f9' }]}>
                  <User size={18} color="#475569" />
                </View>
                <Text style={styles.navText}>Profile & Settings</Text>
                <ChevronRight size={15} color="#cbd5e1" />
              </TouchableOpacity>
            </View>

            {/* Logout / Switch Account */}
            {user && (
              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={async () => {
                  onClose();
                  if (onLogout) {
                    onLogout();
                  } else {
                    await RoomDatabase.clearUserSession();
                    router.replace('/(tabs)');
                  }
                }}
                activeOpacity={0.8}
              >
                <LogOut size={16} color="#ef4444" />
                <Text style={styles.logoutText}>Sign Out</Text>
              </TouchableOpacity>
            )}

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerVersion}>HappyLokam OS v2.4 (Enterprise Edition)</Text>
              <Text style={styles.footerTagline}>Bihar's #1 Luxury Wedding & Celebration Network</Text>
            </View>
          </ScrollView>
        </Animated.View>
      </View>

      {/* Wallet Details Modal */}
      <Modal
        visible={walletModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setWalletModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconWrap}>
                <Wallet size={20} color="#e11d48" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Celebration Wallet</Text>
                <Text style={styles.modalSubtitle}>System-Generated Booking Discounts</Text>
              </View>
              <TouchableOpacity onPress={() => setWalletModalVisible(false)} style={styles.modalCloseBtn}>
                <X size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.walletBalanceCard}>
              <Text style={styles.wbLabel}>CURRENT DISCOUNT CREDIT</Text>
              <Text style={styles.wbAmount}>₹{walletBalance.toLocaleString('en-IN')}</Text>
              <Text style={styles.wbDesc}>
                Admin allocates discount amounts directly to your wallet for your next booking or pass reservation.
              </Text>
            </View>

            <View style={styles.walletPerksList}>
              <View style={styles.perkRow}>
                <CheckCircle2 size={16} color="#10b981" />
                <Text style={styles.perkText}>Instant deduction at checkout on royal venues and passes.</Text>
              </View>
              <View style={styles.perkRow}>
                <CheckCircle2 size={16} color="#10b981" />
                <Text style={styles.perkText}>Stackable with seasonal festival promo codes.</Text>
              </View>
              <View style={styles.perkRow}>
                <CheckCircle2 size={16} color="#10b981" />
                <Text style={styles.perkText}>Credits never expire until redeemed on a confirmed order.</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalActionBtn}
              onPress={() => {
                setWalletModalVisible(false);
                navigateTo('/(tabs)/explore');
              }}
              activeOpacity={0.88}
            >
              <Text style={styles.modalActionBtnText}>Explore Venues & Apply Discount</Text>
              <ArrowRight size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Coupons List Modal */}
      <Modal
        visible={couponsModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCouponsModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={[styles.modalIconWrap, { backgroundColor: '#dcfce7' }]}>
                <Tag size={20} color="#16a34a" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Active Promo Coupons</Text>
                <Text style={styles.modalSubtitle}>Generated by Admin & Brand Partners</Text>
              </View>
              <TouchableOpacity onPress={() => setCouponsModalVisible(false)} style={styles.modalCloseBtn}>
                <X size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              {coupons.length === 0 ? (
                <View style={styles.emptyCouponBox}>
                  <Tag size={28} color="#94a3b8" />
                  <Text style={styles.emptyCouponTitle}>Festival Promo Codes</Text>
                  <Text style={styles.emptyCouponSub}>Use coupon code <Text style={{ fontWeight: '800', color: '#e11d48' }}>HAPPY10</Text> or <Text style={{ fontWeight: '800', color: '#e11d48' }}>DANDIYA2026</Text> at checkout for instant savings!</Text>
                </View>
              ) : (
                coupons.map((c) => (
                  <View key={c.id || c.code} style={styles.couponItem}>
                    <View style={styles.couponLeft}>
                      <Text style={styles.couponCode}>{c.code}</Text>
                      <Text style={styles.couponTitle}>{c.title || `${c.discountPercent}% Off Total Booking`}</Text>
                      {c.description ? <Text style={styles.couponDesc}>{c.description}</Text> : null}
                    </View>
                    <View style={styles.couponRight}>
                      <View style={styles.discountBadge}>
                        <Text style={styles.discountBadgeText}>{c.discountPercent}% OFF</Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.applyBtn, copiedCoupon === c.code && { backgroundColor: '#10b981' }]}
                        onPress={() => {
                          setCopiedCoupon(c.code);
                          setTimeout(() => setCopiedCoupon(null), 2000);
                        }}
                      >
                        <Text style={styles.applyBtnText}>{copiedCoupon === c.code ? 'Copied' : 'Copy'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalActionBtn}
              onPress={() => {
                setCouponsModalVisible(false);
                navigateTo('/(tabs)/explore');
              }}
              activeOpacity={0.88}
            >
              <Text style={styles.modalActionBtnText}>Browse Experiences</Text>
              <ArrowRight size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  drawer: {
    width: DRAWER_WIDTH,
    height: '100%',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 24,
    zIndex: 999,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  logoBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#ffe4e6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerScroll: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 36,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 18,
    padding: 12,
    marginBottom: 16,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffe4e6',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  userSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  tierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffe4e6',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  tierText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#e11d48',
  },
  walletCard: {
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#374151',
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  walletIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#e11d48',
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fbbf24',
    letterSpacing: 0.8,
  },
  walletSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  walletAmountPill: {
    backgroundColor: '#1f2937',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  walletAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fbbf24',
  },
  walletFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
  },
  walletNote: {
    fontSize: 10,
    color: '#94a3b8',
    flex: 1,
  },
  navSection: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 2,
  },
  navIconBox: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  navText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  hotBadge: {
    backgroundColor: '#f43f5e',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  hotBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  balanceTag: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  balanceTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#d97706',
  },
  couponCountPill: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  couponCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16a34a',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fee2e2',
    marginTop: 6,
    marginBottom: 20,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ef4444',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  footerVersion: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  footerTagline: {
    fontSize: 9,
    color: '#94a3b8',
    marginTop: 2,
  },
  // Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  modalIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ffe4e6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletBalanceCard: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  wbLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fbbf24',
    letterSpacing: 0.8,
  },
  wbAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: '#ffffff',
    marginVertical: 4,
  },
  wbDesc: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 16,
  },
  walletPerksList: {
    gap: 8,
    marginBottom: 18,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  perkText: {
    fontSize: 12,
    color: '#334155',
    flex: 1,
  },
  modalActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#e11d48',
    paddingVertical: 13,
    borderRadius: 14,
  },
  modalActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  // Coupon items
  emptyCouponBox: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    marginBottom: 12,
  },
  emptyCouponTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 8,
  },
  emptyCouponSub: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  couponItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    marginBottom: 10,
  },
  couponLeft: {
    flex: 1,
  },
  couponCode: {
    fontSize: 14,
    fontWeight: '800',
    color: '#e11d48',
    letterSpacing: 0.5,
  },
  couponTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 2,
  },
  couponDesc: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  couponRight: {
    alignItems: 'flex-end',
    gap: 6,
    marginLeft: 8,
  },
  discountBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  discountBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#16a34a',
  },
  applyBtn: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  applyBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
});
