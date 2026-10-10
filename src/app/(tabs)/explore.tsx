import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Modal,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search as SearchIcon,
  Sparkles,
  MapPin,
  Calendar,
  X,
  Ticket,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Minus,
  Plus,
  Phone,
  LogIn,
  Layers,
  Clock,
  User,
} from 'lucide-react-native';
import { router } from 'expo-router';
import RoomDatabase, { RoomEvent, RoomBooking, RoomUser } from '../../services/roomDatabase';
import CelebrationDialog, { DialogType } from '../../components/CelebrationDialog';
import RazorpayCheckout from 'react-native-razorpay';
import { API_BASE_URL } from '../../constants/api';

const CATEGORIES = ['All', 'Dandiya', 'Wedding', 'Birthday', 'Anniversary', 'Corporate'];
const LOCATIONS = ['All Locations', 'Patna', 'Kankarbagh', 'Boring Road', 'Bailey Road', 'Gaya', 'Muzaffarpur'];

// Celebration Dates (11 Oct to 18 Oct 2026)
const CELEBRATION_DATES = [
  { id: '11', day: 'SUN', dayNum: '11', full: '11 Oct 2026' },
  { id: '12', day: 'MON', dayNum: '12', full: '12 Oct 2026' },
  { id: '13', day: 'TUE', dayNum: '13', full: '13 Oct 2026' },
  { id: '14', day: 'WED', dayNum: '14', full: '14 Oct 2026' },
  { id: '15', day: 'THU', dayNum: '15', full: '15 Oct 2026' },
  { id: '16', day: 'FRI', dayNum: '16', full: '16 Oct 2026' },
  { id: '17', day: 'SAT', dayNum: '17', full: '17 Oct 2026' },
  { id: '18', day: 'SUN', dayNum: '18', full: '18 Oct 2026' },
];

// Ticket Tiers Config
type TicketTierKey = 'single' | 'couple' | 'family4' | 'family6' | 'group5' | 'child';

const TICKET_TIERS_CONFIG: Array<{ key: TicketTierKey; name: string; tag: string; icon: string }> = [
  { key: 'single', name: 'Single Pass', tag: '1 Adult', icon: '👤' },
  { key: 'couple', name: 'Couple Pass', tag: 'Pair (2)', icon: '👫' },
  { key: 'family4', name: 'Family (4)', tag: '4 People', icon: '👨‍👩‍👧‍👦' },
  { key: 'family6', name: 'Family (6)', tag: '6 People', icon: '👨‍👩‍👧‍👦+2' },
  { key: 'group5', name: 'Group (5)', tag: '5 Adults', icon: '👥' },
  { key: 'child', name: 'Child Pass', tag: 'Kids (5-12)', icon: '🧒' },
];

const getEventTierPrice = (event: RoomEvent, tier: TicketTierKey): number => {
  const baseNumPrice = parseInt(String(event.price).replace(/[^0-9]/g, '')) || 0;
  if (event.ticketTiers && event.ticketTiers[tier] !== undefined) {
    return Number(event.ticketTiers[tier]) || baseNumPrice;
  }
  switch (tier) {
    case 'couple': return Math.round(baseNumPrice * 1.8);
    case 'family4': return Math.round(baseNumPrice * 3.4);
    case 'family6': return Math.round(baseNumPrice * 4.8);
    case 'group5': return Math.round(baseNumPrice * 4.2);
    case 'child': return Math.round(baseNumPrice * 0.5);
    default: return baseNumPrice;
  }
};

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState('All');
  const [activeLoc, setActiveLoc] = useState('All Locations');
  const [events, setEvents] = useState<RoomEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<RoomUser | null>(null);

  // Booking Checkout Sheet State
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<RoomEvent | null>(null);
  const [selectedTierKey, setSelectedTierKey] = useState<TicketTierKey>('single');
  const [passCount, setPassCount] = useState(1);
  const [contactPhoneNumber, setContactPhoneNumber] = useState('');
  const [bookingProcessing, setBookingProcessing] = useState(false);

  // Quick Auth Modal State
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Custom Celebration Dialog State
  const [dialogConfig, setDialogConfig] = useState<{
    visible: boolean;
    type: DialogType;
    badgeText?: string;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel?: () => void;
  }>({
    visible: false,
    type: 'success',
    title: '',
    message: '',
    onConfirm: () => {},
  });

  useEffect(() => {
    loadEvents();
    checkUser();
  }, []);

  const checkUser = async () => {
    const session = await RoomDatabase.getUserSession();
    setUser(session);
    if (session?.phone) {
      setContactPhoneNumber(session.phone);
    }
  };

  const loadEvents = async () => {
    try {
      // 1. Instant load from local Room Database
      const cached = await RoomDatabase.getEvents();
      if (cached.length > 0) {
        setEvents(cached);
        setLoading(false);
      }

      // 2. Fetch live genuine events from Admin Events API
      const res = await fetch(`${API_BASE_URL}/events`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const liveEvents: RoomEvent[] = json.data.map((item: any) => ({
            id: item.id,
            title: item.title,
            description: item.description,
            category: item.category,
            location: item.location,
            date: new Date(item.date).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            }),
            price: item.price ? `₹${item.price}` : 'Free',
            availableTickets: item.ticketsLeft ?? item.totalTickets,
            image: item.imageUrl || 'https://images.unsplash.com/photo-1604928141064-207cea6f571f?q=80&w=800',
            rating: 4.9,
            featured: true,
            ticketTiers: item.ticketTiers || undefined,
            syncTimestamp: Date.now(),
          }));

          setEvents(liveEvents);
          await RoomDatabase.saveEvents(liveEvents);
        }
      }
    } catch (e) {
      console.warn('Search load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleBookPress = async (event: RoomEvent) => {
    const isAuthed = await RoomDatabase.isAuthenticated();
    setSelectedEvent(event);
    setPassCount(1);
    setSelectedTierKey('single');
    
    const session = await RoomDatabase.getUserSession();
    if (session?.phone) {
      setContactPhoneNumber(session.phone);
    }

    if (!isAuthed) {
      setAuthModalVisible(true);
    } else {
      setBookingModalVisible(true);
    }
  };

  const handleQuickLogin = async () => {
    if (!authEmail.trim() || !authPassword.trim()) {
      setDialogConfig({
        visible: true,
        type: 'danger',
        title: 'Missing Details',
        message: 'Please enter both email and password.',
        confirmText: 'OK',
        onConfirm: () => setDialogConfig((prev) => ({ ...prev, visible: false })),
      });
      return;
    }

    setAuthLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail.trim(), password: authPassword.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        const newSession: RoomUser = {
          id: data.user?.id || 'u_' + Date.now(),
          name: data.user?.name || 'Celebration Lover',
          email: authEmail.trim(),
          phone: data.user?.phone || undefined,
          role: data.user?.role || 'USER',
          token: data.token,
          lastLogin: Date.now(),
        };
        await RoomDatabase.saveUserSession(newSession);
        setUser(newSession);
        if (data.user?.phone) {
          setContactPhoneNumber(data.user.phone);
        }
        setAuthModalVisible(false);

        // Open checkout modal after successful login
        if (selectedEvent) {
          setPassCount(1);
          setSelectedTierKey('single');
          setBookingModalVisible(true);
        }
      } else {
        setDialogConfig({
          visible: true,
          type: 'danger',
          title: 'Sign In Failed',
          message: data.message || 'Incorrect credentials. Please try again.',
          confirmText: 'Try Again',
          onConfirm: () => setDialogConfig((prev) => ({ ...prev, visible: false })),
        });
      }
    } catch {
      setDialogConfig({
        visible: true,
        type: 'danger',
        title: 'Connection Issue',
        message: 'Could not connect to server. Check your internet.',
        confirmText: 'OK',
        onConfirm: () => setDialogConfig((prev) => ({ ...prev, visible: false })),
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleConfirmReservation = async () => {
    if (!selectedEvent) return;

    setBookingProcessing(true);
    try {
      const tierUnitPrice = getEventTierPrice(selectedEvent, selectedTierKey);
      const subtotal = tierUnitPrice * passCount;
      const transactionFee = Number((subtotal * 0.02).toFixed(2));
      const feeGst = Number((transactionFee * 0.18).toFixed(2));
      const eventGst = subtotal > 500 ? Number((subtotal * 0.18).toFixed(2)) : 0;
      const totalAmount = Math.max(1, Math.round(subtotal + transactionFee + feeGst + eventGst));
      const activeTierObj = TICKET_TIERS_CONFIG.find(t => t.key === selectedTierKey) || TICKET_TIERS_CONFIG[0];
      const tierName = activeTierObj.name;
      let bookingId: string | null = null;

      // A real account phone is required; never use a made-up payment contact.
      let phoneToUse = contactPhoneNumber.replace(/\D/g, '');
      const session = await RoomDatabase.getUserSession();
      if (!phoneToUse && session?.phone) {
        phoneToUse = String(session.phone).replace(/\D/g, '');
      }
      if (!session?.token) throw new Error('Please sign in before making a payment.');
      if (!phoneToUse || phoneToUse.length < 10) throw new Error('Add a valid mobile number to your profile before payment.');

      // 1. Create Razorpay Payment Order on Backend
      let orderId: string | null = null;
      let paymentId: string | null = null;

      if (session.token) {
        try {
          const orderRes = await fetch(`${API_BASE_URL}/payments/create-order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
            body: JSON.stringify({ amount: totalAmount, currency: 'INR' }),
          });
          const orderData = await orderRes.json();
          if (orderRes.ok && orderData.success && orderData.data?.id) {
            orderId = orderData.data.id;
          }
          if (!orderId) throw new Error(orderData.message || 'Could not create a secure payment order.');

          // 2. Open Native Razorpay Checkout with full contact prefill
          const options: any = {
            description: `${passCount}x ${tierName} - ${selectedEvent.title}`,
            image: 'https://happylokam.com/logo.png',
            currency: 'INR',
            key: process.env.EXPO_PUBLIC_RAZORPAY_KEY || 'rzp_live_SjBHhCXWmZhVK6',
            amount: totalAmount * 100,
            name: 'HappyLokam Celebrations',
            order_id: orderId,
            prefill: {
              email: session.email || 'guest@happylokam.com',
              contact: phoneToUse,
              name: session.name || 'Celebration Lover',
            },
            readonly: {
              contact: true,
              email: true,
              name: true,
            },
            theme: { color: '#e11d48' },
          };

          const razorpayRes = await RazorpayCheckout.open(options);
          if (razorpayRes.razorpay_payment_id) {
            paymentId = razorpayRes.razorpay_payment_id;
          }
        } catch (payErr: any) {
          const errStr = typeof payErr === 'string' ? payErr : (payErr?.description || payErr?.message || '');
          if (errStr.includes('cancelled') || payErr?.code === 0 || payErr?.code === 2) {
            setDialogConfig({
              visible: true,
              type: 'info',
              title: 'Payment Cancelled',
              message: 'No charges made. You can complete booking anytime.',
              confirmText: 'OK',
              onConfirm: () => setDialogConfig((prev) => ({ ...prev, visible: false })),
            });
            return;
          }
          throw payErr;
        }

        // 3. Create Server Booking with Ticket Tier
        try {
          const bookingRes = await fetch(`${API_BASE_URL}/events/book`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
            body: JSON.stringify({
              userId: session.id,
              eventId: selectedEvent.id,
              date: new Date(selectedEvent.date).toISOString(),
              totalAmount: totalAmount,
              tickets: passCount,
              ticketsCount: passCount,
              tierType: selectedTierKey.toUpperCase(),
              tierName: tierName,
              paymentId: paymentId,
              orderId: orderId,
            }),
          });
          
          const data = await bookingRes.json();
          if (bookingRes.ok && data.success && data.data?.id) bookingId = data.data.id;
          if (!bookingId) throw new Error(data.message || 'Payment was received but the pass could not be confirmed.');
        } catch (e) { throw e; }
      }

      if (!bookingId) throw new Error('The booking could not be verified.');

      // Save to local Room Database
      const newBooking: RoomBooking = {
        id: bookingId,
        title: selectedEvent.title,
        category: selectedEvent.category,
        date: selectedEvent.date,
        amount: totalAmount,
        status: 'CONFIRMED',
        qrCode: `HL-TKT:${bookingId}`,
        tierType: selectedTierKey.toUpperCase(),
        tierName: tierName,
        ticketsCount: passCount,
        createdAt: new Date().toISOString(),
        serverVerified: true,
      };

      await RoomDatabase.saveBooking(newBooking);
      setBookingModalVisible(false);

      setDialogConfig({
        visible: true,
        type: 'success',
        title: 'Pass Confirmed! 🎉',
        message: `Booking #${bookingId} confirmed! Official QR pass is in Your Passes.`,
        confirmText: 'View Passes',
        cancelText: 'Keep Browsing',
        onConfirm: () => {
          setDialogConfig((prev) => ({ ...prev, visible: false }));
          router.push('/(tabs)/bookings');
        },
      });
    } catch {
      setDialogConfig({
        visible: true,
        type: 'danger',
        title: 'Booking Error',
        message: 'Could not complete reservation. Please try again.',
        confirmText: 'OK',
        onConfirm: () => setDialogConfig((prev) => ({ ...prev, visible: false })),
      });
    } finally {
      setBookingProcessing(false);
    }
  };

  const filtered = events.filter((ev) => {
    const matchesCat =
      activeCat === 'All' ||
      ev.category?.toLowerCase() === activeCat.toLowerCase() ||
      (ev.category && ev.category.toLowerCase().includes(activeCat.toLowerCase())) ||
      (activeCat && activeCat.toLowerCase().includes(ev.category?.toLowerCase() || '')) ||
      (ev.title && ev.title.toLowerCase().includes(activeCat.toLowerCase()));

    const matchesLoc =
      activeLoc === 'All Locations' ||
      ev.location?.toLowerCase().includes(activeLoc.toLowerCase());

    const matchesQuery =
      query.trim() === '' ||
      ev.title.toLowerCase().includes(query.toLowerCase()) ||
      ev.location.toLowerCase().includes(query.toLowerCase()) ||
      (ev.category && ev.category.toLowerCase().includes(query.toLowerCase())) ||
      (ev.description && ev.description.toLowerCase().includes(query.toLowerCase()));

    return matchesCat && matchesLoc && matchesQuery;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#090b10" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <View style={styles.headerBadge}>
              <Sparkles size={12} color="#f43f5e" />
              <Text style={styles.headerBadgeText}>LIVE VERIFIED EVENTS</Text>
            </View>
            <Text style={styles.title}>Explore Passes</Text>
          </View>

          {!user ? (
            <TouchableOpacity
              style={styles.headerSignInBtn}
              onPress={() => router.push('/login')}
              activeOpacity={0.85}
            >
              <LogIn size={15} color="#ffffff" />
              <Text style={styles.headerSignInText}>Sign In / Register</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.headerUserPill}
              onPress={() => router.push('/(tabs)/profile')}
              activeOpacity={0.85}
            >
              <Text style={styles.headerUserName}>{user.name.split(' ')[0]}</Text>
              <ChevronRight size={14} color="#f43f5e" />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.subtitle}>Discover live Dandiya, Weddings & Celebrations</Text>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <SearchIcon size={18} color="#94a3b8" />
          <TextInput
            placeholder="Search Dandiya, Patna, Gandhi Maidan, VIP..."
            style={styles.searchInput}
            placeholderTextColor="#64748b"
            value={query}
            onChangeText={setQuery}
          />
          {query.trim().length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} style={{ padding: 4 }}>
              <X size={16} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Filter Chips */}
      <View style={styles.categoriesWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setActiveCat(cat)}
              style={[styles.catBadge, activeCat === cat && styles.catBadgeActive]}
              activeOpacity={0.8}
            >
              <Text style={[styles.catText, activeCat === cat && styles.catTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Location Filter Pills */}
      <View style={styles.locationsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
          {LOCATIONS.map((loc) => (
            <TouchableOpacity
              key={loc}
              onPress={() => setActiveLoc(loc)}
              style={[styles.locBadge, activeLoc === loc && styles.locBadgeActive]}
              activeOpacity={0.8}
            >
              <MapPin size={12} color={activeLoc === loc ? '#ffffff' : '#94a3b8'} />
              <Text style={[styles.locText, activeLoc === loc && styles.locTextActive]}>{loc}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Results */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e11d48" />
          <Text style={styles.loadingText}>Fetching celebrations...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Sparkles size={40} color="#f43f5e" />
          <Text style={styles.emptyTitle}>No matching celebrations found</Text>
          <Text style={styles.emptySub}>Try searching for "Dandiya" or "Patna"</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.results}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const singlePrice = getEventTierPrice(item, 'single');
            const couplePrice = getEventTierPrice(item, 'couple');
            return (
              <TouchableOpacity
                style={styles.resultCard}
                activeOpacity={0.92}
                onPress={() => handleBookPress(item)}
              >
                <Image source={{ uri: item.image }} style={styles.resultImage} />
                <View style={styles.resultTag}>
                  <Text style={styles.resultTagText}>{item.category || 'Celebration'}</Text>
                </View>

                <View style={styles.resultContent}>
                  <Text style={styles.resultTitle}>{item.title}</Text>

                  <View style={styles.resultMetaRow}>
                    <Calendar size={13} color="#94a3b8" />
                    <Text style={styles.resultLocText}>{item.date}</Text>
                  </View>

                  <View style={styles.resultLoc}>
                    <MapPin size={13} color="#94a3b8" />
                    <Text style={styles.resultLocText} numberOfLines={1}>
                      {item.location}
                    </Text>
                  </View>

                  {/* 6 Tiers Price Quick Badges */}
                  <View style={styles.tierHintRow}>
                    <View style={styles.tierBadgeSmall}>
                      <Text style={styles.tierBadgeSmallText}>Single: ₹{singlePrice}</Text>
                    </View>
                    <View style={styles.tierBadgeSmall}>
                      <Text style={styles.tierBadgeSmallText}>Couple: ₹{couplePrice}</Text>
                    </View>
                    <View style={styles.tierBadgeSmall}>
                      <Text style={styles.tierBadgeSmallText}>+4 More Tiers</Text>
                    </View>
                  </View>

                  <View style={styles.cardFooter}>
                    <View>
                      <Text style={styles.pricePrefix}>Starting from</Text>
                      <Text style={styles.resultPrice}>₹{singlePrice}</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.bookPassBtn}
                      onPress={() => handleBookPress(item)}
                      activeOpacity={0.88}
                    >
                      <Text style={styles.bookPassText}>Book Pass</Text>
                      <ArrowRight size={14} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          ListFooterComponent={<View style={{ height: 100 }} />}
        />
      )}

      {/* Quick In-App Auth Modal */}
      <Modal
        visible={authModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAuthModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={22} color="#e11d48" />
                <Text style={styles.modalTitle}>Sign In to Book</Text>
              </View>
              <TouchableOpacity onPress={() => setAuthModalVisible(false)} style={styles.modalCloseBtn}>
                <X size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Please sign in or create an account to reserve celebration passes.
            </Text>

            <View style={{ gap: 8, marginVertical: 10 }}>
              <TouchableOpacity
                style={styles.modalPrimaryBtn}
                onPress={() => {
                  setAuthModalVisible(false);
                  router.push('/login');
                }}
                activeOpacity={0.88}
              >
                <LogIn size={15} color="#ffffff" />
                <Text style={styles.modalPrimaryBtnText}>Sign In to Your Account</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSecondaryBtn}
                onPress={() => {
                  setAuthModalVisible(false);
                  router.push('/signup');
                }}
                activeOpacity={0.88}
              >
                <User size={15} color="#f43f5e" />
                <Text style={styles.modalSecondaryBtnText}>Create New Account (Sign Up)</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalOrRow}>
              <View style={styles.modalOrLine} />
              <Text style={styles.modalOrText}>OR QUICK SIGN IN</Text>
              <View style={styles.modalOrLine} />
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Email address"
              placeholderTextColor="#64748b"
              keyboardType="email-address"
              autoCapitalize="none"
              value={authEmail}
              onChangeText={setAuthEmail}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Password"
              placeholderTextColor="#64748b"
              secureTextEntry
              value={authPassword}
              onChangeText={setAuthPassword}
            />

            <TouchableOpacity
              style={styles.modalSubmitBtn}
              onPress={handleQuickLogin}
              disabled={authLoading}
              activeOpacity={0.88}
            >
              {authLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.modalSubmitText}>Sign In & Continue</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={{ marginTop: 14, alignItems: 'center' }}
              onPress={() => {
                setAuthModalVisible(false);
                router.push('/signup');
              }}
            >
              <Text style={{ fontSize: 13, color: '#f43f5e', fontWeight: '700' }}>
                New to happylokam? Create Account
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Celebration Reservation Checkout Sheet with UX Thumb-Zone Law */}
      <Modal
        visible={bookingModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBookingModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.checkoutSheetContainer}>
            {/* Sheet Header */}
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ticket size={20} color="#e11d48" />
                <Text style={styles.modalTitle}>Reserve Celebration Pass</Text>
              </View>
              <TouchableOpacity onPress={() => setBookingModalVisible(false)} style={styles.modalCloseBtn}>
                <X size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {selectedEvent && (
              <>
                {/* Scrollable details */}
                <ScrollView showsVerticalScrollIndicator={false} style={styles.checkoutScrollArea}>
                  <Text style={styles.checkoutEventTitle}>{selectedEvent.title}</Text>
                  <Text style={styles.checkoutEventDate}>
                    📅 {selectedEvent.date} • 📍 {selectedEvent.location}
                  </Text>

                  {/* CELEBRATION TIME */}
                  <View style={styles.timingCard}>
                    <Clock size={14} color="#fbbf24" />
                    <Text style={styles.timingCardText}>
                      Celebration Timing: 06:30 PM - 11:30 PM (Entry starts 06:00 PM)
                    </Text>
                  </View>

                  {/* 6 Ticket Tiers Horizontal Selector */}
                  <Text style={[styles.checkoutSectionLabel, { marginTop: 14 }]}>Select Ticket Tier</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tiersScroll}>
                    {TICKET_TIERS_CONFIG.map((tier) => {
                      const price = getEventTierPrice(selectedEvent, tier.key);
                      const isSelected = selectedTierKey === tier.key;
                      return (
                        <TouchableOpacity
                          key={tier.key}
                          onPress={() => setSelectedTierKey(tier.key)}
                          style={[styles.tierPill, isSelected && styles.tierPillActive]}
                          activeOpacity={0.85}
                        >
                          <View style={styles.tierPillTop}>
                            <Text style={styles.tierPillIcon}>{tier.icon}</Text>
                            <View style={[styles.tierTagBadge, isSelected && styles.tierTagBadgeActive]}>
                              <Text style={[styles.tierTagBadgeText, isSelected && styles.tierTagBadgeTextActive]}>{tier.tag}</Text>
                            </View>
                          </View>
                          <Text style={[styles.tierPillName, isSelected && styles.tierPillNameActive]}>{tier.name}</Text>
                          <Text style={[styles.tierPillPrice, isSelected && styles.tierPillPriceActive]}>₹{price}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  {/* Number of Passes */}
                  <Text style={styles.checkoutSectionLabel}>Number of Passes</Text>
                  <View style={styles.quantityRow}>
                    <View>
                      <Text style={styles.quantityLabel}>Pass Quantity</Text>
                      <Text style={{ fontSize: 11, color: '#94a3b8' }}>
                        {TICKET_TIERS_CONFIG.find(t => t.key === selectedTierKey)?.name}
                      </Text>
                    </View>
                    <View style={styles.quantityControls}>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => setPassCount((c) => Math.max(1, c - 1))}
                      >
                        <Minus size={16} color="#ffffff" />
                      </TouchableOpacity>
                      <Text style={styles.qtyValue}>{passCount}</Text>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => setPassCount((c) => Math.min(10, c + 1))}
                      >
                        <Plus size={16} color="#ffffff" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Contact Phone (Prefills Razorpay so user is NEVER prompted) */}
                  <Text style={styles.checkoutSectionLabel}>Contact Phone Number</Text>
                  <View style={styles.phoneInputRow}>
                    <Phone size={18} color="#e11d48" style={{ marginRight: 8 }} />
                    <TextInput
                      style={styles.phoneInput}
                      placeholder="Enter 10-digit mobile number"
                      placeholderTextColor="#64748b"
                      keyboardType="phone-pad"
                      maxLength={10}
                      value={contactPhoneNumber}
                      onChangeText={setContactPhoneNumber}
                    />
                  </View>
                  <Text style={styles.phoneHint}>Auto-prefilled for instant checkout & WhatsApp pass delivery</Text>

                  {/* Breakdown details */}
                  {(() => {
                    const tierUnitPrice = getEventTierPrice(selectedEvent, selectedTierKey);
                    const subtotal = tierUnitPrice * passCount;
                    const transactionFee = Number((subtotal * 0.02).toFixed(2));
                    const feeGst = Number((transactionFee * 0.18).toFixed(2));
                    const eventGst = subtotal > 500 ? Number((subtotal * 0.18).toFixed(2)) : 0;
                    const totalAmount = Math.max(1, Math.round(subtotal + transactionFee + feeGst + eventGst));
                    const activeTierName = TICKET_TIERS_CONFIG.find(t => t.key === selectedTierKey)?.name || 'Pass';

                    return (
                      <View style={styles.breakdownCard}>
                        <View style={styles.summaryRow}>
                          <Text style={styles.summaryLabel}>{activeTierName} ({passCount}x @ ₹{tierUnitPrice})</Text>
                          <Text style={styles.summaryValue}>₹{subtotal}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                          <Text style={styles.summaryLabel}>Platform Fee (2%)</Text>
                          <Text style={styles.summaryValue}>₹{transactionFee}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                          <Text style={styles.summaryLabel}>GST on Fee (18%)</Text>
                          <Text style={styles.summaryValue}>₹{feeGst}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                          <Text style={styles.summaryLabel}>Celebration GST (18% on &gt; ₹500)</Text>
                          <Text style={styles.summaryValue}>{eventGst > 0 ? `₹${eventGst}` : '₹0 (Exempt)'}</Text>
                        </View>
                      </View>
                    );
                  })()}
                  <View style={{ height: 20 }} />
                </ScrollView>

                {/* STICKY BOTTOM ACTION BAR (Thumb Zone UX Law) */}
                {(() => {
                  const tierUnitPrice = getEventTierPrice(selectedEvent, selectedTierKey);
                  const subtotal = tierUnitPrice * passCount;
                  const transactionFee = Number((subtotal * 0.02).toFixed(2));
                  const feeGst = Number((transactionFee * 0.18).toFixed(2));
                  const eventGst = subtotal > 500 ? Number((subtotal * 0.18).toFixed(2)) : 0;
                  const totalAmount = Math.max(1, Math.round(subtotal + transactionFee + feeGst + eventGst));
                  const activeTierName = TICKET_TIERS_CONFIG.find(t => t.key === selectedTierKey)?.name || 'Pass';

                  return (
                    <View style={styles.stickyThumbBar}>
                      <View style={styles.thumbPriceBlock}>
                        <Text style={styles.thumbTierText}>{activeTierName} • {passCount}x</Text>
                        <Text style={styles.thumbTotalAmount}>₹{totalAmount}</Text>
                      </View>

                      <TouchableOpacity
                        style={styles.thumbPayBtn}
                        onPress={handleConfirmReservation}
                        disabled={bookingProcessing}
                        activeOpacity={0.88}
                      >
                        {bookingProcessing ? (
                          <ActivityIndicator color="#ffffff" />
                        ) : (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.thumbPayBtnText}>Book Now</Text>
                            <ArrowRight size={18} color="#ffffff" />
                          </View>
                        )}
                      </TouchableOpacity>
                    </View>
                  );
                })()}
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Custom Designed Celebration Dialog */}
      <CelebrationDialog
        visible={dialogConfig.visible}
        type={dialogConfig.type}
        badgeText={dialogConfig.badgeText}
        title={dialogConfig.title}
        message={dialogConfig.message}
        confirmText={dialogConfig.confirmText}
        cancelText={dialogConfig.cancelText}
        onConfirm={dialogConfig.onConfirm}
        onCancel={dialogConfig.onCancel || (() => setDialogConfig((prev) => ({ ...prev, visible: false })))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090b10' },
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 14 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  headerBadgeText: { color: '#f43f5e', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  title: { fontSize: 28, fontWeight: '900', color: '#ffffff' },
  subtitle: { fontSize: 13, color: '#94a3b8', marginTop: 3, fontWeight: '500' },

  headerSignInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#e11d48',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  headerSignInText: { color: '#ffffff', fontSize: 12, fontWeight: '800' },
  headerUserPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#121622',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1c2333',
  },
  headerUserName: { color: '#ffffff', fontSize: 12, fontWeight: '700' },

  searchRow: { paddingHorizontal: 20, marginBottom: 12 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121622',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 50,
    borderWidth: 1.5,
    borderColor: '#1c2333',
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14, color: '#ffffff' },

  categoriesWrapper: { marginBottom: 10 },
  catBadge: {
    backgroundColor: '#121622',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#1c2333',
  },
  catBadgeActive: {
    backgroundColor: '#e11d48',
    borderColor: '#e11d48',
  },
  catText: { fontSize: 13, fontWeight: '600', color: '#94a3b8' },
  catTextActive: { color: '#ffffff', fontWeight: '800' },

  locationsWrapper: { marginBottom: 14 },
  locBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#121622',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#1c2333',
  },
  locBadgeActive: {
    backgroundColor: 'rgba(225, 29, 72, 0.25)',
    borderColor: '#e11d48',
  },
  locText: { fontSize: 12, fontWeight: '600', color: '#94a3b8' },
  locTextActive: { color: '#f43f5e', fontWeight: '800' },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  loadingText: { color: '#94a3b8', marginTop: 12, fontSize: 14, fontWeight: '500' },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#ffffff', marginTop: 12 },
  emptySub: { fontSize: 13, color: '#94a3b8', marginTop: 4 },

  results: { paddingHorizontal: 20, paddingBottom: 20 },
  resultCard: {
    backgroundColor: '#121622',
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1c2333',
  },
  resultImage: { width: '100%', height: 160 },
  resultTag: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(9, 11, 16, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.4)',
  },
  resultTagText: { color: '#f43f5e', fontSize: 11, fontWeight: '800' },
  resultContent: { padding: 16 },
  resultTitle: { fontSize: 18, fontWeight: '800', color: '#ffffff', marginBottom: 6 },
  resultMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  resultLoc: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  resultLocText: { fontSize: 13, color: '#94a3b8', fontWeight: '500' },

  tierHintRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  tierBadgeSmall: {
    backgroundColor: '#1a202e',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: '#252d3d',
  },
  tierBadgeSmallText: { fontSize: 10, fontWeight: '700', color: '#cbd5e1' },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1c2333',
  },
  pricePrefix: { fontSize: 11, color: '#94a3b8', fontWeight: '600' },
  resultPrice: { fontSize: 19, fontWeight: '900', color: '#ffffff' },
  bookPassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e11d48',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    shadowColor: '#e11d48',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  bookPassText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },

  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#121622',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1c2333',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1c2333',
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#ffffff' },
  modalCloseBtn: { padding: 6, backgroundColor: '#1a202e', borderRadius: 20 },
  modalSubtitle: { fontSize: 13, color: '#94a3b8', marginBottom: 16, marginTop: 4 },
  modalInput: {
    backgroundColor: '#090b10',
    borderWidth: 1,
    borderColor: '#1c2333',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    color: '#ffffff',
    fontSize: 14,
    marginBottom: 12,
  },
  modalSubmitBtn: {
    backgroundColor: '#e11d48',
    borderRadius: 14,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  modalSubmitText: { color: '#ffffff', fontWeight: '800', fontSize: 15 },

  // Checkout Sheet with Thumb Zone UX
  checkoutSheetContainer: {
    backgroundColor: '#121622',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#1c2333',
  },
  checkoutScrollArea: { paddingHorizontal: 20, paddingTop: 14 },
  checkoutEventTitle: { fontSize: 20, fontWeight: '800', color: '#ffffff', marginBottom: 4 },
  checkoutEventDate: { fontSize: 13, color: '#94a3b8', marginBottom: 16 },

  checkoutSectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#cbd5e1',
    marginTop: 14,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  tiersScroll: { gap: 10, paddingBottom: 6 },
  tierPill: {
    backgroundColor: '#090b10',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#1c2333',
    minWidth: 110,
    alignItems: 'center',
  },
  tierPillActive: {
    borderColor: '#e11d48',
    backgroundColor: 'rgba(225, 29, 72, 0.15)',
  },
  tierPillTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  tierPillIcon: { fontSize: 16 },
  tierTagBadge: { backgroundColor: '#1c2333', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  tierTagBadgeActive: { backgroundColor: '#e11d48' },
  tierTagBadgeText: { fontSize: 9, fontWeight: '700', color: '#94a3b8' },
  tierTagBadgeTextActive: { color: '#ffffff' },
  tierPillName: { fontSize: 12, fontWeight: '700', color: '#cbd5e1' },
  tierPillNameActive: { color: '#ffffff' },
  tierPillPrice: { fontSize: 15, fontWeight: '900', color: '#cbd5e1', marginTop: 2 },
  tierPillPriceActive: { color: '#f43f5e' },

  quantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#090b10',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1c2333',
  },
  quantityLabel: { fontSize: 14, fontWeight: '700', color: '#ffffff' },
  quantityControls: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  qtyBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#1a202e',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#252d3d',
  },
  qtyValue: { fontSize: 16, fontWeight: '800', color: '#ffffff' },

  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090b10',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: '#1c2333',
  },
  phoneInput: { flex: 1, fontSize: 14, color: '#ffffff' },
  phoneHint: { fontSize: 11, color: '#94a3b8', marginTop: 4 },

  breakdownCard: {
    backgroundColor: '#090b10',
    borderRadius: 16,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#1c2333',
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontSize: 12, color: '#94a3b8' },
  summaryValue: { fontSize: 12, fontWeight: '700', color: '#cbd5e1' },

  // Sticky Thumb Zone Bar (Follows UX thumb law)
  stickyThumbBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0d1117',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#1c2333',
  },
  thumbPriceBlock: { justifyContent: 'center' },
  thumbTierText: { fontSize: 11, color: '#94a3b8', fontWeight: '600' },
  thumbTotalAmount: { fontSize: 22, fontWeight: '900', color: '#ffffff' },
  thumbPayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e11d48',
    paddingHorizontal: 22,
    height: 48,
    borderRadius: 14,
    shadowColor: '#e11d48',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  thumbPayBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '800' },

  // Date Selector Styles
  dateSelectorHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 8,
  },
  selectedDateBadge: {
    backgroundColor: 'rgba(225, 29, 72, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.35)',
  },
  selectedDateBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#f43f5e',
  },
  dateSelectorRow: {
    gap: 8,
    paddingBottom: 4,
  },
  dateChip: {
    backgroundColor: '#121622',
    borderWidth: 1,
    borderColor: '#1c2333',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    minWidth: 54,
  },
  dateChipActive: {
    backgroundColor: '#e11d48',
    borderColor: '#e11d48',
  },
  dateChipDay: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  dateChipDayActive: {
    color: '#ffffff',
  },
  dateChipNum: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    marginVertical: 1,
  },
  dateChipNumActive: {
    color: '#ffffff',
  },
  dateChipMonth: {
    fontSize: 9,
    fontWeight: '700',
    color: '#f43f5e',
    textTransform: 'uppercase',
  },
  dateChipMonthActive: {
    color: '#ffe4e6',
  },
  timingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 4,
    gap: 8,
  },
  timingCardText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fef3c7',
    flex: 1,
  },

  // Modal Extra Buttons
  modalPrimaryBtn: {
    backgroundColor: '#e11d48',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  modalPrimaryBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },
  modalSecondaryBtn: {
    backgroundColor: 'rgba(225, 29, 72, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.4)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 12,
    gap: 6,
  },
  modalSecondaryBtnText: {
    color: '#f43f5e',
    fontWeight: '700',
    fontSize: 13,
  },
  modalOrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    gap: 10,
  },
  modalOrLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#1c2333',
  },
  modalOrText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 1,
  },
});
