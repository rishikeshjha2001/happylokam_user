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
  Image,
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
  MapPin,
  Camera,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  Gift,
  Tag,
  Calculator,
  Gamepad2,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import RoomDatabase, { RoomBooking } from '../../services/roomDatabase';
import { getUserWallet } from '../../services/api';
import SidebarDrawer from '../../components/SidebarDrawer';
import WalletModal from '../../components/WalletModal';
import SwipeTabContainer from '../../components/SwipeTabContainer';
import TicTacToeGame from '../../components/TicTacToeGame';

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
  const [isWalletOpen, setWalletOpen] = useState(false);
  const [isGameModalOpen, setGameModalOpen] = useState(false);

  const loadProfileData = async () => {
    try {
      const [session, bList, fList, serverWallet] = await Promise.all([
        RoomDatabase.getUserSession(),
        RoomDatabase.getBookings(),
        RoomDatabase.getFavorites(),
        getUserWallet().catch(() => ({ walletBalance: 0 })),
      ]);

      const bal = typeof serverWallet?.walletBalance === 'number' ? serverWallet.walletBalance : await RoomDatabase.getWalletBalance();

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
          name: 'Welcome, Guest',
          email: 'Sign in to access your digital passes',
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
      name: 'Welcome, Guest',
      email: 'Sign in to access your digital passes',
      balance: 0,
      phone: '',
      referralCode: '',
    });
    router.replace('/login');
  };

  const celebrationItems = [
    {
      icon: Ticket,
      label: 'My Bookings & QR Passes',
      sub: `${bookingsCount} Confirmed passes & tickets`,
      color: '#d97706',
      bg: '#fffbeb',
      action: () => (isLoggedIn ? router.push('/(tabs)/bookings') : router.push('/login')),
    },
    {
      icon: CreditCard,
      label: 'HappyWallet Balance & Bonus',
      sub: `₹${userData.balance.toLocaleString('en-IN')} Celebration cash`,
      color: '#059669',
      bg: '#ecfdf5',
      action: () => router.push('/wallet'),
    },
    {
      icon: MapPin,
      label: 'Saved Celebration Addresses',
      sub: 'Manage delivery & venue locations',
      color: '#0284c7',
      bg: '#f0f9ff',
      action: () => router.push('/addresses'),
    },
    {
      icon: Heart,
      label: 'Saved Venues & Wishlist',
      sub: `${favoritesCount} Saved celebration packages`,
      color: '#e11d48',
      bg: '#fff1f2',
      action: () => router.push('/favorites'),
    },
    {
      icon: Gamepad2,
      label: 'Celebration Tic-Tac-Toe',
      sub: 'Play offline vs Bot or with friends',
      color: '#059669',
      bg: '#d1fae5',
      action: () => setGameModalOpen(true),
    },
    {
      icon: Calculator,
      label: 'AI Event Budget Planner',
      sub: 'Calculate food, venue & decor estimates',
      color: '#7c3aed',
      bg: '#ede9fe',
      action: () => router.push('/event-planner'),
    },
  ];

  const preferenceItems = [
    {
      icon: User,
      label: 'Personal Information',
      sub: 'Name, email, contact & profile details',
      color: '#3b82f6',
      bg: '#eff6ff',
      action: () => (isLoggedIn ? router.push('/personal-info') : router.push('/login')),
    },
    {
      icon: Bell,
      label: 'Notifications & Alerts',
      sub: 'Booking updates & celebration drops',
      color: '#8b5cf6',
      bg: '#f5f3ff',
      action: () => router.push('/notifications'),
    },
    {
      icon: Phone,
      label: 'Help & Concierge Support',
      sub: 'WhatsApp & 24/7 dedicated assistance',
      color: '#10b981',
      bg: '#ecfdf5',
      action: () => router.push('/help-support'),
    },
    {
      icon: Shield,
      label: 'Privacy & Security',
      sub: 'Account encryption & permissions',
      color: '#64748b',
      bg: '#f8fafc',
      action: () => router.push('/privacy-security'),
    },
    {
      icon: Settings,
      label: 'App Settings',
      sub: 'Preferences & device storage',
      color: '#475569',
      bg: '#f1f5f9',
      action: () => router.push('/settings'),
    },
  ];

  const topHeaderPadding = Math.max(insets.top, 14);
  const bottomScrollPadding = 90 + Math.max(insets.bottom, 24);

  return (
    <SwipeTabContainer currentTab="profile">
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

          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => router.push('/notifications')}
            activeOpacity={0.8}
          >
            <Bell size={19} color="#334155" />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomScrollPadding }]}
          showsVerticalScrollIndicator={false}
        >
          {/* 1. Buttery Smooth Curved Profile Header Card */}
          <View style={styles.profileHeaderCard}>
            <View style={styles.profileRow}>
              {/* Avatar with Camera Badge */}
              <View style={styles.avatarContainer}>
                <View style={styles.avatarInner}>
                  {isLoggedIn && userData.name && userData.name !== 'Welcome, Guest' ? (
                    <Text style={styles.avatarLetter}>
                      {userData.name.charAt(0).toUpperCase()}
                    </Text>
                  ) : (
                    <User size={30} color="#e11d48" />
                  )}
                </View>
                <View style={styles.cameraBadge}>
                  <Camera size={12} color="#ffffff" />
                </View>
              </View>

              {/* Profile Info */}
              <View style={styles.profileTextInfo}>
                <Text style={styles.profileName} numberOfLines={1}>
                  {userData.name}
                </Text>
                <Text style={styles.profileEmail} numberOfLines={1}>
                  {userData.email}
                </Text>

                {isLoggedIn ? (
                  <View style={styles.premiumBadge}>
                    <Sparkles size={11} color="#e11d48" />
                    <Text style={styles.premiumBadgeText}>VIP CELEBRATION HOST</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.signInPill}
                    onPress={() => router.push('/login')}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.signInPillText}>Sign In / Register</Text>
                    <ChevronRight size={12} color="#ffffff" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* 2. Overlapping Floating Dark Wallet Card */}
          <View style={styles.walletContainer}>
            <TouchableOpacity
              style={styles.walletCard}
              onPress={() => router.push('/wallet')}
              activeOpacity={0.9}
            >
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.walletLabel}>HAPPYWALLET BALANCE</Text>
                  <View style={styles.walletActiveBadge}>
                    <Text style={styles.walletActiveText}>AUTO-APPLIED</Text>
                  </View>
                </View>

                <View style={styles.walletBalanceRow}>
                  <Text style={styles.walletBalance}>
                    ₹{userData.balance.toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.walletBonusBadge}>+ ₹500 Bonus Active</Text>
                </View>

                <Text style={styles.walletSub}>
                  Tap to view statement, cashback & coupon history
                </Text>
              </View>

              <View style={styles.walletIconBox}>
                <CreditCard size={22} color="#fda4af" />
              </View>
            </TouchableOpacity>
          </View>

          {/* 3. Latest Confirmed Pass Pill (If present) */}
          {latestBooking && (
            <View style={styles.passSection}>
              <TouchableOpacity
                style={styles.passCard}
                onPress={() => router.push('/(tabs)/bookings')}
                activeOpacity={0.85}
              >
                <View style={styles.passIconCircle}>
                  <Ticket size={20} color="#e11d48" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.passHeaderTitle} numberOfLines={1}>
                    {latestBooking.title}
                  </Text>
                  <Text style={styles.passSubText}>
                    {latestBooking.date || 'Active Booking'} • Tap to open QR Pass
                  </Text>
                </View>
                <ChevronRight size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>
          )}

          {/* 4. Grouped Menu Sections */}
          <View style={styles.menuSections}>
            {/* Section: Celebrations & Passes */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeader}>Celebrations & Passes</Text>
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
                      <item.icon size={20} color={item.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.menuLabel}>{item.label}</Text>
                      <Text style={styles.menuSubText}>{item.sub}</Text>
                    </View>
                    <ChevronRight size={18} color="#cbd5e1" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Section: Account & Preferences */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeader}>Account & Preferences</Text>
              <View style={styles.cardGroup}>
                {preferenceItems.map((item, idx) => (
                  <TouchableOpacity
                    key={item.label}
                    style={[
                      styles.menuRow,
                      idx !== preferenceItems.length - 1 && styles.menuRowBorder,
                    ]}
                    onPress={item.action}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.menuIconBox, { backgroundColor: item.bg }]}>
                      <item.icon size={20} color={item.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.menuLabel}>{item.label}</Text>
                      <Text style={styles.menuSubText}>{item.sub}</Text>
                    </View>
                    <ChevronRight size={18} color="#cbd5e1" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 5. Buttery Smooth Log Out / Sign In Button */}
            {isLoggedIn ? (
              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={handleLogout}
                activeOpacity={0.85}
              >
                <LogOut size={19} color="#e11d48" />
                <Text style={styles.logoutText}>Log Out Account</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.logoutBtn, { borderColor: '#e11d48', backgroundColor: '#fff1f2' }]}
                onPress={() => router.push('/login')}
                activeOpacity={0.85}
              >
                <User size={19} color="#e11d48" />
                <Text style={styles.logoutText}>Sign In / Register</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        {/* Wallet Modal */}
        <WalletModal
          visible={isWalletOpen}
          onClose={() => setWalletOpen(false)}
          balance={userData.balance}
        />

        {/* Sidebar Drawer */}
        <SidebarDrawer
          visible={isSidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onOpenWallet={() => setWalletOpen(true)}
          user={{ name: userData.name, email: userData.email }}
        />

        {/* Offline Celebration Tic-Tac-Toe Game */}
        <TicTacToeGame visible={isGameModalOpen} onClose={() => setGameModalOpen(false)} />
      </View>
    </SwipeTabContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc', // Slate-50
  },
  topHeader: {
    height: Platform.OS === 'ios' ? 96 : 72,
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
    paddingBottom: 96,
  },

  // 1. Buttery Curved Profile Header
  profileHeaderCard: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 44,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarContainer: {
    position: 'relative',
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#fff1f2',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 38,
    backgroundColor: '#ffe4e6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 28,
    fontWeight: '900',
    color: '#e11d48',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#e11d48',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  profileTextInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 21,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.4,
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748b',
    marginBottom: 6,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#ffe4e6',
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  premiumBadgeText: {
    color: '#e11d48',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  signInPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#e11d48',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  signInPillText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },

  // 2. Overlapping Floating Dark Wallet Card
  walletContainer: {
    paddingHorizontal: 20,
    marginTop: -26,
    zIndex: 20,
    marginBottom: 24,
  },
  walletCard: {
    backgroundColor: '#0f172a', // Slate-900
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  walletLabel: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  walletActiveBadge: {
    backgroundColor: '#059669',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  walletActiveText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.4,
  },
  walletBalanceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginTop: 4,
    marginBottom: 4,
  },
  walletBalance: {
    fontSize: 30,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  walletBonusBadge: {
    color: '#34d399', // Emerald-400
    fontSize: 11.5,
    fontWeight: '800',
    marginBottom: 4,
  },
  walletSub: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  walletIconBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },

  // 3. Latest Confirmed Pass Preview
  passSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  passCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fed7aa',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  passIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fff1f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  passHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  passSubText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748b',
    marginTop: 1,
  },

  // 4. Menu Sections
  menuSections: {
    paddingHorizontal: 20,
    gap: 22,
  },
  sectionBlock: {
    gap: 8,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '900',
    color: '#94a3b8',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginLeft: 4,
  },
  cardGroup: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 14,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  menuIconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#1e293b',
  },
  menuSubText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
    marginTop: 1,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#ffe4e6',
    borderRadius: 22,
    paddingVertical: 15,
    marginTop: 6,
    shadowColor: '#e11d48',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  logoutText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#e11d48',
  },
});
