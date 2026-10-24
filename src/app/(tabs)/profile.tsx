import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Platform,
  BackHandler,
  ActivityIndicator,
} from 'react-native';
import {
  Sparkles,
  CreditCard,
  User,
  Heart,
  Ticket,
  Settings,
  Shield,
  Phone,
  LogOut,
  ChevronRight,
  Menu,
  Bell,
  Gift,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import RoomDatabase, { RoomBooking } from '../../services/roomDatabase';
import SidebarDrawer from '../../components/SidebarDrawer';

const { width } = Dimensions.get('window');

export default function ProfileTab() {
  const insets = useSafeAreaInsets();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState({
    name: 'Guest User',
    email: 'guest@happylokam.com',
    balance: 0,
    phone: '',
    referralCode: '',
  });

  const [bookingsCount, setBookingsCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [latestBooking, setLatestBooking] = useState<RoomBooking | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadProfileData = async () => {
    try {
      const [session, bList, fList, bal] = await Promise.all([
        RoomDatabase.getUserSession(),
        RoomDatabase.getBookings(),
        RoomDatabase.getFavorites(),
        RoomDatabase.getWalletBalance(),
      ]);

      if (session && session.name) {
        setIsLoggedIn(true);
        setUserData({
          name: session.name,
          email: session.email || 'user@happylokam.com',
          balance: bal,
          phone: session.phone || '',
          referralCode: session.referralCode || 'HL-CELEB',
        });
      } else {
        setIsLoggedIn(false);
        setUserData({
          name: 'Guest User',
          email: 'guest@happylokam.com',
          balance: 0,
          phone: '',
          referralCode: '',
        });
      }

      setBookingsCount(bList.length);
      setFavoritesCount(fList.length);
      if (bList.length > 0) {
        setLatestBooking(bList[0]);
      } else {
        setLatestBooking(null);
      }
    } catch (e) {
      console.warn('Profile load error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfileData();

    const onBackPress = () => {
      router.replace('/(tabs)');
      return true;
    };
    const backSub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backSub.remove();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfileData();
    }, [])
  );

  const handleLogout = async () => {
    await RoomDatabase.clearUserSession();
    setIsLoggedIn(false);
    setUserData({
      name: 'Guest User',
      email: 'guest@happylokam.com',
      balance: 0,
      phone: '',
      referralCode: '',
    });
    router.replace('/login');
  };

  const celebrationItems = [
    {
      icon: Ticket,
      label: 'My Bookings & Passes',
      sub: `${bookingsCount} Confirmed passes & reservations`,
      color: '#d97706',
      bg: '#fffbeb',
      action: () => (isLoggedIn ? router.push('/(tabs)/bookings') : router.push('/login')),
    },
    {
      icon: CreditCard,
      label: 'Celebration Wallet',
      sub: `₹${userData.balance.toLocaleString('en-IN')} Non-withdrawable celebration cash`,
      color: '#e11d48',
      bg: '#fff1f2',
      action: () => router.push('/wallet'),
    },
    {
      icon: MapPin,
      label: 'Saved Celebration Locations',
      sub: 'Home, banquet lawns, and event addresses',
      color: '#0284c7',
      bg: '#f0f9ff',
      action: () => router.push('/addresses'),
    },
    {
      icon: Heart,
      label: 'Saved Venues & Wishlist',
      sub: `${favoritesCount} Saved celebration packages`,
      color: '#ec4899',
      bg: '#fdf2f8',
      action: () => router.push('/favorites'),
    },
  ];

  const accountItems = [
    {
      icon: User,
      label: 'Personal Information',
      sub: 'Name, phone, email, and preferences',
      color: '#3b82f6',
      bg: '#eff6ff',
      action: () => (isLoggedIn ? router.push('/personal-info') : router.push('/login')),
    },
    {
      icon: Bell,
      label: 'Notifications & Broadcasts',
      sub: 'Booking updates & admin drops',
      color: '#8b5cf6',
      bg: '#f5f3ff',
      action: () => router.push('/notifications'),
    },
    {
      icon: Phone,
      label: 'Help & Concierge Support',
      sub: 'WhatsApp, direct helpline & live chat',
      color: '#10b981',
      bg: '#ecfdf5',
      action: () => router.push('/help-support'),
    },
    {
      icon: Shield,
      label: 'Privacy & Security',
      sub: 'Data protection & device safety',
      color: '#64748b',
      bg: '#f8fafc',
      action: () => router.push('/privacy-security'),
    },
    {
      icon: Settings,
      label: 'App Settings',
      sub: 'OTA updates & language',
      color: '#475569',
      bg: '#f1f5f9',
      action: () => router.push('/settings'),
    },
  ];

  const topHeaderPadding = Math.max(insets.top, 14);
  const bottomScrollPadding = 90 + Math.max(insets.bottom, 24);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Top Header */}
      <View style={[styles.topHeader, { paddingTop: topHeaderPadding }]}>
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => setSidebarOpen(true)}
          activeOpacity={0.8}
        >
          <Menu size={20} color="#334155" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.brandTitle}>happylokam</Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomScrollPadding }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card Header */}
        <View style={styles.profileHeaderCard}>
          {isLoggedIn ? (
            <View style={styles.profileRow}>
              <View style={[styles.avatarContainer, { backgroundColor: '#ffe4e6', alignItems: 'center', justifyContent: 'center' }]}>
                {userData.name && userData.name !== 'Guest User' ? (
                  <Text style={{ fontSize: 24, fontWeight: '900', color: '#e11d48' }}>
                    {userData.name.charAt(0).toUpperCase()}
                  </Text>
                ) : (
                  <User size={28} color="#e11d48" />
                )}
              </View>

              <View style={styles.profileTextInfo}>
                <Text style={styles.profileName}>{userData.name}</Text>
                <Text style={styles.profileEmail}>{userData.email}</Text>
                <View style={styles.premiumBadge}>
                  <Sparkles size={12} color="#e11d48" />
                  <Text style={styles.premiumBadgeText}>Verified Celebration Host</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6 }}>
              <View style={[styles.avatarContainer, { backgroundColor: '#ffe4e6', alignItems: 'center', justifyContent: 'center' }]}>
                <User size={28} color="#e11d48" />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.profileName}>Welcome, Guest!</Text>
                <Text style={styles.profileEmail}>Sign in to view your celebration bookings & passes</Text>
                <TouchableOpacity
                  style={{
                    backgroundColor: '#e11d48',
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 12,
                    alignSelf: 'flex-start',
                    marginTop: 8,
                  }}
                  onPress={() => router.push('/login')}
                  activeOpacity={0.85}
                >
                  <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 12 }}>Sign In / Register</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Quick Stats Metric Bar */}
        <View style={styles.statsBar}>
          <TouchableOpacity
            style={styles.statBox}
            onPress={() => (isLoggedIn ? router.push('/(tabs)/bookings') : router.push('/login'))}
            activeOpacity={0.8}
          >
            <Text style={styles.statNumber}>{bookingsCount}</Text>
            <Text style={styles.statLabel}>My Bookings</Text>
          </TouchableOpacity>

          <View style={styles.statDivider} />

          <TouchableOpacity
            style={styles.statBox}
            onPress={() => (isLoggedIn ? router.push('/wallet') : router.push('/login'))}
            activeOpacity={0.8}
          >
            <Text style={[styles.statNumber, { color: '#059669' }]}>
              ₹{userData.balance.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.statLabel}>Wallet Cash</Text>
          </TouchableOpacity>

          <View style={styles.statDivider} />

          <TouchableOpacity
            style={styles.statBox}
            onPress={() => router.push('/favorites')}
            activeOpacity={0.8}
          >
            <Text style={styles.statNumber}>{favoritesCount}</Text>
            <Text style={styles.statLabel}>Saved Venues</Text>
          </TouchableOpacity>
        </View>

        {/* Floating Celebration Wallet Banner Card */}
        <View style={styles.walletContainer}>
          <TouchableOpacity
            style={styles.walletCard}
            onPress={() => router.push('/wallet')}
            activeOpacity={0.9}
          >
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.walletLabel}>Celebration Wallet</Text>
                <View style={styles.walletActiveBadge}>
                  <Text style={styles.walletActiveText}>AUTO-APPLIED</Text>
                </View>
              </View>
              <Text style={styles.walletBalance}>
                {isLoggedIn ? `₹${userData.balance.toLocaleString('en-IN')}` : 'Sign in to access Wallet'}
              </Text>
              <Text style={styles.walletHint}>
                Non-withdrawable credits • Deducts at checkout up to 100% off
              </Text>
            </View>

            <View style={styles.walletIconBox}>
              <CreditCard size={24} color="#e11d48" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Latest Confirmed Pass Preview Card (If any booking exists) */}
        {latestBooking && (
          <View style={styles.recentBookingContainer}>
            <View style={styles.recentBookingHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ticket size={16} color="#e11d48" />
                <Text style={styles.recentBookingTitle}>Latest Confirmed Pass</Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/bookings')}
                activeOpacity={0.7}
              >
                <Text style={styles.viewAllText}>View All ({bookingsCount})</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.bookingPassCard}
              onPress={() => router.push('/(tabs)/bookings')}
              activeOpacity={0.85}
            >
              <View style={styles.bookingPassTopRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bookingPassName} numberOfLines={1}>
                    {latestBooking.title}
                  </Text>
                  <View style={styles.bookingPassMetaRow}>
                    <Calendar size={12} color="#64748b" />
                    <Text style={styles.bookingPassMetaText}>{latestBooking.date}</Text>
                    <Text style={styles.bookingPassDot}>•</Text>
                    <Text style={styles.bookingPassMetaText}>
                      Code: {latestBooking.qrCode || `HL-${latestBooking.id.slice(-6).toUpperCase()}`}
                    </Text>
                  </View>
                </View>
                <View style={styles.confirmedPill}>
                  <CheckCircle2 size={12} color="#059669" />
                  <Text style={styles.confirmedPillText}>CONFIRMED</Text>
                </View>
              </View>

              <View style={styles.bookingPassFooterRow}>
                <Text style={styles.bookingAmountText}>
                  Total Paid: <Text style={{ color: '#0f172a', fontWeight: '900' }}>₹{latestBooking.amount.toLocaleString('en-IN')}</Text>
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                  <Text style={styles.viewPassLink}>View Pass</Text>
                  <ArrowRight size={13} color="#e11d48" />
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Celebration Services Group */}
        <View style={styles.menuSections}>
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionHeader}>Celebration Management</Text>
            <View style={styles.cardGroup}>
              {celebrationItems.map((item, idx) => (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.menuRow,
                    idx !== celebrationItems.length - 1 && styles.menuRowBorder,
                  ]}
                  onPress={item.action}
                  activeOpacity={0.7}
                >
                  <View style={[styles.menuIconBox, { backgroundColor: item.bg }]}>
                    <item.icon size={19} color={item.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                    <Text style={styles.menuSubLabel}>{item.sub}</Text>
                  </View>
                  <ChevronRight size={17} color="#cbd5e1" />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Account & Support Group */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionHeader}>Account & Help Desk</Text>
            <View style={styles.cardGroup}>
              {accountItems.map((item, idx) => (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.menuRow,
                    idx !== accountItems.length - 1 && styles.menuRowBorder,
                  ]}
                  onPress={item.action}
                  activeOpacity={0.7}
                >
                  <View style={[styles.menuIconBox, { backgroundColor: item.bg }]}>
                    <item.icon size={19} color={item.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                    <Text style={styles.menuSubLabel}>{item.sub}</Text>
                  </View>
                  <ChevronRight size={17} color="#cbd5e1" />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Log Out Button */}
          {isLoggedIn && (
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={handleLogout}
              activeOpacity={0.85}
            >
              <LogOut size={18} color="#e11d48" />
              <Text style={styles.logoutText}>Log Out Account</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Sidebar Drawer */}
      <SidebarDrawer
        visible={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenWallet={() => router.push('/wallet')}
        user={{ name: userData.name, email: userData.email }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  topHeader: {
    height: Platform.OS === 'ios' ? 96 : 74,
    paddingTop: Platform.OS === 'ios' ? 36 : 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 30,
  },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#e11d48',
    letterSpacing: -0.6,
  },
  scrollContent: {
    paddingTop: 16,
  },
  profileHeaderCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 62,
    height: 62,
    borderRadius: 31,
  },
  profileTextInfo: {
    flex: 1,
    marginLeft: 14,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  profileEmail: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff1f2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#e11d48',
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 18,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#e2e8f0',
  },
  walletContainer: {
    marginHorizontal: 16,
    marginTop: 14,
  },
  walletCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#fecdd3',
    shadowColor: '#e11d48',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  walletLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
    textTransform: 'uppercase',
  },
  walletActiveBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  walletActiveText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#059669',
  },
  walletBalance: {
    fontSize: 22,
    fontWeight: '900',
    color: '#e11d48',
    marginTop: 3,
  },
  walletHint: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  walletIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#fff1f2',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  recentBookingContainer: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  recentBookingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  recentBookingTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#e11d48',
  },
  bookingPassCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  bookingPassTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  bookingPassName: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0f172a',
  },
  bookingPassMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  bookingPassMetaText: {
    fontSize: 11,
    color: '#64748b',
  },
  bookingPassDot: {
    fontSize: 10,
    color: '#cbd5e1',
  },
  confirmedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  confirmedPillText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#059669',
  },
  bookingPassFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  bookingAmountText: {
    fontSize: 12,
    color: '#64748b',
  },
  viewPassLink: {
    fontSize: 12,
    fontWeight: '800',
    color: '#e11d48',
  },
  menuSections: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  sectionBlock: {
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  cardGroup: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  menuIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  menuSubLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    borderRadius: 18,
    paddingVertical: 14,
    marginTop: 6,
    marginBottom: 16,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#e11d48',
  },
});
