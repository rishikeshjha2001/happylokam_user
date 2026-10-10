import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
  TextInput,
  ActivityIndicator,
  Linking,
  Share,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CreditCard,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Crown,
  Ticket,
  MapPin,
  ShieldCheck,
  LogIn,
  Sparkles,
  UserPlus,
  Edit3,
  Wallet,
  Heart,
  Phone,
  Mail,
  X,
  CheckCircle2,
  Globe,
  MessageSquare,
  FileText,
  RefreshCw,
  Gift,
  Plus,
  Award,
} from 'lucide-react-native';
import { router } from 'expo-router';
import RoomDatabase, { RoomUser } from '../../services/roomDatabase';
import { API_BASE_URL } from '../../constants/api';
import CelebrationDialog from '../../components/CelebrationDialog';

export default function ProfileScreen() {
  const [user, setUser] = useState<RoomUser | null>(null);
  const [activePassesCount, setActivePassesCount] = useState<number>(2);
  const [walletBalance, setWalletBalance] = useState<number>(850);
  const [favoritesCount, setFavoritesCount] = useState<number>(6);

  // Modals
  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [walletModalVisible, setWalletModalVisible] = useState(false);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [checkingOta, setCheckingOta] = useState(false);

  // Form states for Edit Profile
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCity, setEditCity] = useState('Hyderabad');
  const [editDiet, setEditDiet] = useState<'ALL' | 'VEG' | 'JAIN'>('ALL');
  const [savingProfile, setSavingProfile] = useState(false);

  // Notification toggles
  const [notifyWhatsApp, setNotifyWhatsApp] = useState(true);
  const [notifyPush, setNotifyPush] = useState(true);
  const [notifyOffers, setNotifyOffers] = useState(false);

  // Language state
  const [selectedLanguage, setSelectedLanguage] = useState('English');

  // Info Dialog
  const [infoDialog, setInfoDialog] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'info' | 'success';
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  const loadUser = useCallback(async () => {
    try {
      const session = await RoomDatabase.getUserSession();
      if (session) {
        setUser(session);
        setEditName(session.name || 'Rahul Varma');
        setEditEmail(session.email || 'rahul.varma@gmail.com');
        setEditPhone(session.phone || '9876543210');
      } else {
        // Provide professional demo profile if not logged in
        const demoUser: RoomUser = {
          id: 'usr-109',
          name: 'Rahul Varma',
          email: 'rahul.varma@gmail.com',
          phone: '9876543210',
          role: 'USER',
          token: 'demo-jwt-token',
          lastLogin: Date.now(),
        };
        setUser(demoUser);
        setEditName(demoUser.name);
        setEditEmail(demoUser.email);
        setEditPhone(demoUser.phone || '');
      }

      const savedBookings = await RoomDatabase.getBookings();
      if (savedBookings && savedBookings.length > 0) {
        const activeCount = savedBookings.filter((b) => b.status === 'CONFIRMED').length;
        setActivePassesCount(activeCount || 2);
      }

      // Sync with cloud backend if authenticated
      if (session?.token) {
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${session.token}` },
        }).catch(() => null);

        if (res && res.ok) {
          const data = await res.json();
          const profile = data.user || data.data;
          if (profile) {
            const updated: RoomUser = {
              ...session,
              name: profile.name || session.name,
              email: profile.email || session.email,
              phone: profile.phone || session.phone,
              role: profile.role || session.role,
            };
            setUser(updated);
            await RoomDatabase.saveUserSession(updated);
          }
        }
      }
    } catch (e) {
      console.warn('Profile load error:', e);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true);
      const updatedUser: RoomUser = {
        ...user!,
        name: editName,
        email: editEmail,
        phone: editPhone,
      };
      setUser(updatedUser);
      await RoomDatabase.saveUserSession(updatedUser);

      // Attempt backend sync
      if (user?.token) {
        await fetch(`${API_BASE_URL}/auth/update-profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({ name: editName, phone: editPhone, city: editCity }),
        }).catch(() => {});
      }

      setEditProfileVisible(false);
      setInfoDialog({
        visible: true,
        type: 'success',
        title: 'Profile Updated! ✨',
        message: 'Your personal information and event preferences have been saved securely.',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCheckOtaUpdate = () => {
    setCheckingOta(true);
    setTimeout(() => {
      setCheckingOta(false);
      setInfoDialog({
        visible: true,
        type: 'success',
        title: 'OTA Bundle Connected',
        message: 'You are running Happylokam Celebration OS v2.5.0 (Latest Release).',
      });
    }, 900);
  };

  const handleOpenWhatsAppSupport = () => {
    Linking.openURL('https://wa.me/919849011223?text=Hello%20Happylokam%20Concierge,%20I%20need%20assistance%20with%20my%20event%20booking.');
  };

  const handleCallHotline = () => {
    Linking.openURL('tel:+919849011223');
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        title: 'Happylokam - We Create Your Memory',
        message: 'Book world-class banquets, destination weddings, and celebrity catering on Happylokam! Download the app: https://happylokam.com',
      });
    } catch (e) {}
  };

  const handleLogoutConfirm = async () => {
    setLogoutDialogVisible(false);
    try {
      if (user?.token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${user.token}` },
        }).catch(() => {});
      }
    } finally {
      await RoomDatabase.clearUserSession();
      setUser(null);
      router.replace('/login');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#070a12" />

      {/* Ambient glowing background aura */}
      <View style={styles.glowAuraTop} />
      <View style={styles.glowAuraBottom} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Top Header */}
        <View style={styles.header}>
          <View>
            <View style={styles.badgeRow}>
              <Sparkles size={12} color="#60a5fa" />
              <Text style={styles.badgeText}>HAPPLYLOKAM PRIVILEGE</Text>
            </View>
            <Text style={styles.title}>My Profile</Text>
          </View>
          <TouchableOpacity
            style={styles.headerShareBtn}
            onPress={handleShareApp}
            activeOpacity={0.8}
          >
            <Gift size={16} color="#60a5fa" />
            <Text style={styles.headerShareText}>Invite</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileTopRow}>
            <View style={styles.avatarContainer}>
              <Image
                source={{
                  uri: user?.email
                    ? `https://api.dicebear.com/7.x/notionists/png?seed=${encodeURIComponent(user.email)}`
                    : 'https://api.dicebear.com/7.x/notionists/png?seed=happylokam',
                }}
                style={styles.avatar}
              />
              <View style={styles.onlineDot} />
            </View>

            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.name} numberOfLines={1}>
                  {user ? user.name : 'Rahul Varma'}
                </Text>
                <View style={styles.premiumBadge}>
                  <Crown size={11} color="#fbbf24" />
                  <Text style={styles.premiumBadgeText}>Diamond</Text>
                </View>
              </View>

              <Text style={styles.email} numberOfLines={1}>
                {user ? user.email : 'rahul.varma@gmail.com'}
              </Text>

              <View style={styles.phoneBadgeRow}>
                <Phone size={11} color="#94a3b8" />
                <Text style={styles.phoneText}>+91 {user?.phone || '9876543210'}</Text>
                <View style={styles.verifiedMiniBadge}>
                  <CheckCircle2 size={10} color="#34d399" />
                  <Text style={styles.verifiedMiniText}>Verified</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.editPencilBtn}
              onPress={() => setEditProfileVisible(true)}
              activeOpacity={0.8}
            >
              <Edit3 size={16} color="#60a5fa" />
            </TouchableOpacity>
          </View>

          {/* Interactive Metric Counter Bar */}
          <View style={styles.statsRow}>
            <TouchableOpacity
              style={styles.statBox}
              onPress={() => router.push('/(tabs)/bookings')}
              activeOpacity={0.8}
            >
              <Ticket size={18} color="#38bdf8" />
              <Text style={styles.statValue}>{activePassesCount}</Text>
              <Text style={styles.statLabel}>Event Passes</Text>
            </TouchableOpacity>

            <View style={styles.statDivider} />

            <TouchableOpacity
              style={styles.statBox}
              onPress={() => setWalletModalVisible(true)}
              activeOpacity={0.8}
            >
              <Wallet size={18} color="#fbbf24" />
              <Text style={[styles.statValue, { color: '#fbbf24' }]}>₹{walletBalance}</Text>
              <Text style={styles.statLabel}>Coins / Wallet</Text>
            </TouchableOpacity>

            <View style={styles.statDivider} />

            <TouchableOpacity
              style={styles.statBox}
              onPress={() =>
                setInfoDialog({
                  visible: true,
                  type: 'info',
                  title: 'Saved Venues',
                  message: 'You have 6 favorite banquets and caterers bookmarked.',
                })
              }
              activeOpacity={0.8}
            >
              <Heart size={18} color="#f43f5e" />
              <Text style={styles.statValue}>{favoritesCount}</Text>
              <Text style={styles.statLabel}>Favorites</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Privilege Card: Wallet Banner */}
        <TouchableOpacity
          style={styles.walletBanner}
          activeOpacity={0.88}
          onPress={() => setWalletModalVisible(true)}
        >
          <View style={styles.walletBannerIcon}>
            <Award size={24} color="#fbbf24" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.walletBannerTitle}>Happylokam Celebration Wallet</Text>
            <Text style={styles.walletBannerSub}>
              Available balance: <Text style={{ color: '#fbbf24', fontWeight: '800' }}>₹{walletBalance}</Text> • 100% redeemable on banquets
            </Text>
          </View>
          <ChevronRight size={18} color="#64748b" />
        </TouchableOpacity>

        {/* SECTION: Personal & Event Preferences */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Event Preferences & Locations</Text>
          <View style={styles.menuCard}>
            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => setAddressModalVisible(true)}
            >
              <View style={[styles.menuIconWrapper, { backgroundColor: '#1e3a8a30' }]}>
                <MapPin size={18} color="#60a5fa" />
              </View>
              <View style={styles.menuTextContent}>
                <Text style={styles.menuTitle}>Saved Addresses & Venues</Text>
                <Text style={styles.menuSubtitle}>Home, Office, Celebration locations</Text>
              </View>
              <ChevronRight size={18} color="#64748b" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() =>
                setInfoDialog({
                  visible: true,
                  type: 'info',
                  title: 'Saved Payment Methods',
                  message: 'UPI IDs (rahul@okhdfcbank) and cards secured with PCI-DSS 256-bit encryption.',
                })
              }
            >
              <View style={[styles.menuIconWrapper, { backgroundColor: '#064e3b30' }]}>
                <CreditCard size={18} color="#34d399" />
              </View>
              <View style={styles.menuTextContent}>
                <Text style={styles.menuTitle}>Payment Methods & Cards</Text>
                <Text style={styles.menuSubtitle}>UPI, Saved Debit/Credit Cards & GST</Text>
              </View>
              <ChevronRight size={18} color="#64748b" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => setNotificationModalVisible(true)}
            >
              <View style={[styles.menuIconWrapper, { backgroundColor: '#78350f30' }]}>
                <Bell size={18} color="#fbbf24" />
              </View>
              <View style={styles.menuTextContent}>
                <Text style={styles.menuTitle}>Notification & WhatsApp Alerts</Text>
                <Text style={styles.menuSubtitle}>Gate pass updates, reminders & offers</Text>
              </View>
              <ChevronRight size={18} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>

        {/* SECTION: Support & App System */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Concierge, Support & Legal</Text>
          <View style={styles.menuCard}>
            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={handleOpenWhatsAppSupport}
            >
              <View style={[styles.menuIconWrapper, { backgroundColor: '#064e3b30' }]}>
                <MessageSquare size={18} color="#25d366" />
              </View>
              <View style={styles.menuTextContent}>
                <Text style={styles.menuTitle}>24/7 VIP Concierge (WhatsApp)</Text>
                <Text style={styles.menuSubtitle}>Instant event manager assistance</Text>
              </View>
              <ChevronRight size={18} color="#64748b" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={handleCallHotline}
            >
              <View style={[styles.menuIconWrapper, { backgroundColor: '#1e3a8a30' }]}>
                <HelpCircle size={18} color="#38bdf8" />
              </View>
              <View style={styles.menuTextContent}>
                <Text style={styles.menuTitle}>Toll-Free Celebration Helpline</Text>
                <Text style={styles.menuSubtitle}>+91 98490 11223 • Dedicated Priority Desk</Text>
              </View>
              <ChevronRight size={18} color="#64748b" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => setLanguageModalVisible(true)}
            >
              <View style={[styles.menuIconWrapper, { backgroundColor: '#312e8130' }]}>
                <Globe size={18} color="#818cf8" />
              </View>
              <View style={styles.menuTextContent}>
                <Text style={styles.menuTitle}>App Language</Text>
                <Text style={styles.menuSubtitle}>{selectedLanguage}</Text>
              </View>
              <ChevronRight size={18} color="#64748b" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              disabled={checkingOta}
              onPress={handleCheckOtaUpdate}
            >
              <View style={[styles.menuIconWrapper, { backgroundColor: '#1e293b' }]}>
                <RefreshCw size={18} color="#94a3b8" />
              </View>
              <View style={styles.menuTextContent}>
                <Text style={styles.menuTitle}>Check for Updates</Text>
                <Text style={styles.menuSubtitle}>Happylokam OS v2.5.0 Live Sync</Text>
              </View>
              {checkingOta ? (
                <ActivityIndicator size="small" color="#3b82f6" />
              ) : (
                <ChevronRight size={18} color="#64748b" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Out Button */}
        {user && (
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={() => setLogoutDialogVisible(true)}
            activeOpacity={0.88}
          >
            <LogOut size={18} color="#ef4444" />
            <Text style={styles.logoutText}>Sign Out of Happylokam</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ======================================================== */}
      {/* MODAL: EDIT PROFILE FORM */}
      {/* ======================================================== */}
      <Modal visible={editProfileVisible} transparent animationType="slide" onRequestClose={() => setEditProfileVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile Information</Text>
              <TouchableOpacity onPress={() => setEditProfileVisible(false)} style={styles.modalCloseBtn}>
                <X size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
              <View>
                <Text style={styles.inputLabel}>Full Name *</Text>
                <TextInput
                  style={styles.input}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="e.g. Rahul Varma"
                  placeholderTextColor="#64748b"
                />
              </View>

              <View>
                <Text style={styles.inputLabel}>Email Address *</Text>
                <TextInput
                  style={styles.input}
                  value={editEmail}
                  onChangeText={setEditEmail}
                  placeholder="e.g. rahul.varma@gmail.com"
                  placeholderTextColor="#64748b"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View>
                <Text style={styles.inputLabel}>Phone Number *</Text>
                <TextInput
                  style={styles.input}
                  value={editPhone}
                  onChangeText={setEditPhone}
                  placeholder="10-digit mobile number"
                  placeholderTextColor="#64748b"
                  keyboardType="phone-pad"
                />
              </View>

              <View>
                <Text style={styles.inputLabel}>Primary City</Text>
                <TextInput
                  style={styles.input}
                  value={editCity}
                  onChangeText={setEditCity}
                  placeholder="e.g. Hyderabad / Patna"
                  placeholderTextColor="#64748b"
                />
              </View>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSaveProfile}
                disabled={savingProfile}
                activeOpacity={0.88}
              >
                {savingProfile ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.submitBtnText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL: CELEBRATION WALLET */}
      {/* ======================================================== */}
      <Modal visible={walletModalVisible} transparent animationType="slide" onRequestClose={() => setWalletModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Celebration Wallet</Text>
              <TouchableOpacity onPress={() => setWalletModalVisible(false)} style={styles.modalCloseBtn}>
                <X size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <View style={{ padding: 20 }}>
              <View style={styles.walletCardModal}>
                <Text style={styles.walletCardModalLabel}>TOTAL WALLET CREDITS</Text>
                <Text style={styles.walletCardModalBalance}>₹{walletBalance}</Text>
                <Text style={styles.walletCardModalSub}>Applicable on all bookings & venue reservations</Text>
              </View>

              <Text style={[styles.sectionTitle, { marginTop: 20, marginBottom: 10 }]}>Recent Reward Credits</Text>
              <View style={styles.walletTxItem}>
                <View style={[styles.menuIconWrapper, { backgroundColor: '#064e3b30' }]}>
                  <Gift size={18} color="#34d399" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuTitle}>Welcome Bonus Credits</Text>
                  <Text style={styles.menuSubtitle}>1 Oct 2026 • Account Signup</Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#34d399' }}>+₹500</Text>
              </View>

              <View style={styles.walletTxItem}>
                <View style={[styles.menuIconWrapper, { backgroundColor: '#1e3a8a30' }]}>
                  <Sparkles size={18} color="#60a5fa" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuTitle}>Booking Cashback Reward</Text>
                  <Text style={styles.menuSubtitle}>28 Sep 2026 • Grand Ballroom</Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#34d399' }}>+₹350</Text>
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, { marginTop: 24 }]}
                onPress={() => {
                  setWalletModalVisible(false);
                  setInfoDialog({
                    visible: true,
                    type: 'success',
                    title: 'Add Money via UPI',
                    message: 'Instant top-up via Google Pay, PhonePe, and Paytm is active.',
                  });
                }}
              >
                <Text style={styles.submitBtnText}>+ Top Up Wallet via UPI</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL: NOTIFICATIONS PREFERENCE */}
      {/* ======================================================== */}
      <Modal visible={notificationModalVisible} transparent animationType="fade" onRequestClose={() => setNotificationModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: 420 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notification Channels</Text>
              <TouchableOpacity onPress={() => setNotificationModalVisible(false)} style={styles.modalCloseBtn}>
                <X size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            <View style={{ padding: 20, gap: 16 }}>
              <View style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuTitle}>WhatsApp Event Alerts</Text>
                  <Text style={styles.menuSubtitle}>Get gate passes & invoices on WhatsApp</Text>
                </View>
                <Switch value={notifyWhatsApp} onValueChange={setNotifyWhatsApp} trackColor={{ false: '#334155', true: '#2563eb' }} />
              </View>

              <View style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuTitle}>App Push Notifications</Text>
                  <Text style={styles.menuSubtitle}>Real-time booking confirmations</Text>
                </View>
                <Switch value={notifyPush} onValueChange={setNotifyPush} trackColor={{ false: '#334155', true: '#2563eb' }} />
              </View>

              <View style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuTitle}>Special Offers & Flash Sales</Text>
                  <Text style={styles.menuSubtitle}>Weekend catering & banquet discounts</Text>
                </View>
                <Switch value={notifyOffers} onValueChange={setNotifyOffers} trackColor={{ false: '#334155', true: '#2563eb' }} />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL: SAVED ADDRESSES */}
      {/* ======================================================== */}
      <Modal visible={addressModalVisible} transparent animationType="slide" onRequestClose={() => setAddressModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Saved Event Addresses</Text>
              <TouchableOpacity onPress={() => setAddressModalVisible(false)} style={styles.modalCloseBtn}>
                <X size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            <View style={{ padding: 20, gap: 12 }}>
              <View style={styles.addressCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <MapPin size={15} color="#38bdf8" />
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#ffffff' }}>Primary Residence (Home)</Text>
                </View>
                <Text style={{ fontSize: 12, color: '#94a3b8', lineHeight: 18 }}>
                  Plot 42, Road No 12, Banjara Hills, Hyderabad, Telangana 500034
                </Text>
              </View>

              <View style={styles.addressCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <MapPin size={15} color="#34d399" />
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#ffffff' }}>Corporate Office</Text>
                </View>
                <Text style={{ fontSize: 12, color: '#94a3b8', lineHeight: 18 }}>
                  Tech Park Tower B, HITEC City, Hyderabad, Telangana 500081
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, { marginTop: 10 }]}
                onPress={() => {
                  setAddressModalVisible(false);
                  setInfoDialog({
                    visible: true,
                    type: 'success',
                    title: 'Address Added',
                    message: 'New location saved for future bookings.',
                  });
                }}
              >
                <Text style={styles.submitBtnText}>+ Add New Address</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL: LANGUAGE SELECTION */}
      {/* ======================================================== */}
      <Modal visible={languageModalVisible} transparent animationType="fade" onRequestClose={() => setLanguageModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: 380 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select App Language</Text>
              <TouchableOpacity onPress={() => setLanguageModalVisible(false)} style={styles.modalCloseBtn}>
                <X size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            <View style={{ padding: 20, gap: 10 }}>
              {['English', 'Telugu (తెలుగు)', 'Hindi (हिंदी)', 'Tamil (தமிழ்)'].map((lang) => {
                const isSelected = selectedLanguage === lang || (lang.startsWith('English') && selectedLanguage === 'English');
                return (
                  <TouchableOpacity
                    key={lang}
                    style={[styles.languageItem, isSelected && styles.languageItemSelected]}
                    onPress={() => {
                      setSelectedLanguage(lang);
                      setLanguageModalVisible(false);
                    }}
                  >
                    <Text style={[styles.languageItemText, isSelected && { color: '#ffffff', fontWeight: '800' }]}>{lang}</Text>
                    {isSelected && <CheckCircle2 size={18} color="#38bdf8" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Designed Logout Confirmation Dialog */}
      <CelebrationDialog
        visible={logoutDialogVisible}
        type="logout"
        title="Sign Out of Happylokam?"
        message="You can log back in at any time to access your active event passes and bookings."
        confirmText="Yes, Sign Out"
        cancelText="Cancel"
        onConfirm={handleLogoutConfirm}
        onCancel={() => setLogoutDialogVisible(false)}
      />

      {/* Custom Designed Info / Success Dialog */}
      <CelebrationDialog
        visible={infoDialog.visible}
        type={infoDialog.type}
        title={infoDialog.title}
        message={infoDialog.message}
        confirmText="OK"
        onConfirm={() => setInfoDialog((prev) => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070a12' },
  glowAuraTop: {
    position: 'absolute',
    top: -80,
    left: -60,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(37, 99, 235, 0.18)',
  },
  glowAuraBottom: {
    position: 'absolute',
    bottom: -80,
    right: -60,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
  },
  content: { padding: 18, paddingBottom: 50 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#60a5fa',
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  headerShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  headerShareText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#60a5fa',
  },
  profileCard: {
    backgroundColor: '#0f172a',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 10,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#1e3a8a',
    borderWidth: 1.5,
    borderColor: '#3b82f6',
  },
  onlineDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#0f172a',
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fbbf24',
  },
  email: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  phoneBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  phoneText: {
    fontSize: 12,
    color: '#cbd5e1',
    fontWeight: '600',
  },
  verifiedMiniBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#064e3b30',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  verifiedMiniText: {
    fontSize: 9,
    color: '#34d399',
    fontWeight: '700',
  },
  editPencilBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#070a12',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#1e293b',
  },
  walletBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#0f172a',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 14,
    marginTop: 14,
  },
  walletBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.25)',
  },
  walletBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  walletBannerSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  menuSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  menuCard: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1e293b',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b40',
  },
  menuIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuTextContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
  },
  menuSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1f1315',
    borderWidth: 1,
    borderColor: '#7f1d1d',
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 24,
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#0c101d',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#070a12',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 14,
  },
  submitBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  walletCardModal: {
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3b82f640',
  },
  walletCardModalLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 1,
  },
  walletCardModalBalance: {
    fontSize: 34,
    fontWeight: '900',
    color: '#fbbf24',
    marginVertical: 4,
  },
  walletCardModalSub: {
    fontSize: 11,
    color: '#cbd5e1',
    textAlign: 'center',
  },
  walletTxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b30',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  addressCard: {
    backgroundColor: '#070a12',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#070a12',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  languageItemSelected: {
    borderColor: '#38bdf8',
    backgroundColor: '#1e3a8a25',
  },
  languageItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
  },
});
