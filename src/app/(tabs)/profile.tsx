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
  Platform,
} from 'react-native';
import {
  Camera,
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
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { getUserWallet } from '../../services/api';
import RoomDatabase from '../../services/roomDatabase';
import WalletModal from '../../components/WalletModal';
import SidebarDrawer from '../../components/SidebarDrawer';

const { width } = Dimensions.get('window');

export default function ProfileTab() {
  const insets = useSafeAreaInsets();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState({
    name: 'Guest User',
    email: 'guest@happylokam.com',
    balance: 0,
    bonus: 0,
  });

  const [isWalletOpen, setWalletOpen] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {
    try {
      const session = await RoomDatabase.getUserSession();
      if (session && session.name) {
        setIsLoggedIn(true);
        setUserData({
          name: session.name,
          email: session.email || 'user@happylokam.com',
          balance: typeof session.walletBalance === 'number' ? session.walletBalance : 250,
          bonus: 0,
        });
      } else {
        setIsLoggedIn(false);
        setUserData({
          name: 'Guest User',
          email: 'guest@happylokam.com',
          balance: 0,
          bonus: 0,
        });
      }
    } catch {
      setIsLoggedIn(false);
    }
  };

  const handleLogout = async () => {
    await RoomDatabase.clearUserSession();
    setIsLoggedIn(false);
    setUserData({
      name: 'Guest User',
      email: 'guest@happylokam.com',
      balance: 0,
      bonus: 0,
    });
    router.replace('/login');
  };

  const accountItems = [
    {
      icon: User,
      label: 'Personal Information',
      color: '#3b82f6',
      bg: '#eff6ff',
      action: () => (isLoggedIn ? router.push('/personal-info') : router.push('/login')),
    },
    { icon: Heart, label: 'Saved Venues & Ideas', color: '#e11d48', bg: '#fff1f2', action: () => router.push('/favorites') },
    {
      icon: Ticket,
      label: 'My Bookings & Passes',
      color: '#d97706',
      bg: '#fffbeb',
      action: () => (isLoggedIn ? router.push('/(tabs)/bookings') : router.push('/login')),
    },
  ];

  const preferenceItems = [
    { icon: Bell, label: 'Notifications & Broadcasts', color: '#ec4899', bg: '#fdf2f8', action: () => router.push('/notifications') },
    { icon: Settings, label: 'App Settings', color: '#64748b', bg: '#f1f5f9', action: () => router.push('/settings') },
    { icon: Shield, label: 'Privacy & Security', color: '#10b981', bg: '#ecfdf5', action: () => router.push('/privacy-security') },
    { icon: Phone, label: 'Help & Support', color: '#6366f1', bg: '#eef2ff', action: () => router.push('/help-support') },
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

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomScrollPadding }]} showsVerticalScrollIndicator={false}>
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
                <View style={styles.cameraBadge}>
                  <Camera size={12} color="#ffffff" />
                </View>
              </View>

              <View style={styles.profileTextInfo}>
                <Text style={styles.profileName}>{userData.name}</Text>
                <Text style={styles.profileEmail}>{userData.email}</Text>
                <View style={styles.premiumBadge}>
                  <Sparkles size={12} color="#e11d48" />
                  <Text style={styles.premiumBadgeText}>Premium Member</Text>
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
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                    borderRadius: 10,
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

        {/* Floating Wallet Card Overlapping Header */}
        <View style={styles.walletContainer}>
          <TouchableOpacity
            style={styles.walletCard}
            onPress={() => {
              if (isLoggedIn) {
                setWalletOpen(true);
              } else {
                router.push('/login');
              }
            }}
            activeOpacity={0.9}
          >
            <View>
              <Text style={styles.walletLabel}>Happylokam Wallet</Text>
              <View style={styles.walletBalanceRow}>
                <Text style={styles.walletBalance}>
                  {isLoggedIn ? `₹${userData.balance.toLocaleString('en-IN')}` : 'Sign in to access Wallet'}
                </Text>
                {isLoggedIn && (
                  <View style={{ backgroundColor: '#ecfdf5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 }}>
                    <Text style={{ color: '#059669', fontSize: 10, fontWeight: '800' }}>ACTIVE</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.walletIconBox}>
              <CreditCard size={24} color="#fb7185" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Menu Sections */}
        <View style={styles.menuSections}>
          {/* Account Section */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionHeader}>Account</Text>
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
                    <item.icon size={20} color={item.color} />
                  </View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <ChevronRight size={18} color="#cbd5e1" />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Preferences Section */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionHeader}>Preferences</Text>
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
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <ChevronRight size={18} color="#cbd5e1" />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Log Out Button */}
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            activeOpacity={0.85}
          >
            <LogOut size={20} color="#e11d48" />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc', // Slate-50
  },
  topHeader: {
    height: Platform.OS === 'ios' ? 96 : 72,
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
    paddingBottom: 96,
  },
  profileHeaderCard: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 16,
    elevation: 3,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
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
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 38,
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
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.4,
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748b',
    marginBottom: 8,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#ffe4e6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  premiumBadgeText: {
    color: '#e11d48',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Floating Wallet Card Overlapping
  walletContainer: {
    paddingHorizontal: 20,
    marginTop: -24,
    zIndex: 20,
    marginBottom: 28,
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
    fontSize: 10.5,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  walletBalanceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  walletBalance: {
    fontSize: 32,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  walletBonusBadge: {
    color: '#34d399', // Emerald-400
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
  },
  walletIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },

  // Menu Sections
  menuSections: {
    paddingHorizontal: 20,
    gap: 24,
  },
  sectionBlock: {
    gap: 10,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '900',
    color: '#94a3b8',
    letterSpacing: 1.5,
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
    padding: 16,
    gap: 14,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  menuIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
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
    paddingVertical: 16,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#e11d48',
  },
});
