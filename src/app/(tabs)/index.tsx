import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
  FlatList,
  RefreshControl,
  BackHandler,
  Modal,
  TextInput,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  MapPin,
  ChevronRight,
  Star,
  Calendar,
  Flame,
  Cake,
  Sparkles,
  Users,
  Camera,
  Music,
  Utensils,
  Flower2,
  Gem,
  Palette,
  CheckCircle2,
  X,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Minus,
  Plus,
  LogIn,
  Layers,
  Phone,
  Clock,
  User,
} from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';
import RoomDatabase, { RoomEvent, RoomVenue, RoomUser } from '../../services/roomDatabase';
import CelebrationDialog, { DialogType } from '../../components/CelebrationDialog';
import CelebrationParticles from '../../components/CelebrationParticles';
import RazorpayCheckout from 'react-native-razorpay';
import { API_BASE_URL } from '../../constants/api';

const { width } = Dimensions.get('window');

// Premium Celebration Categories
const CELEBRATION_CATEGORIES = [
  { id: 'all', name: 'All', icon: Sparkles, color: '#e11d48' },
  { id: 'Dandiya', name: 'Dandiya & Garba', icon: Flame, color: '#f43f5e' },
  { id: 'Birthday', name: 'Birthdays', icon: Cake, color: '#8b5cf6' },
  { id: 'Wedding', name: 'Royal Weddings', icon: Gem, color: '#f59e0b' },
  { id: 'Anniversary', name: 'Anniversaries', icon: Sparkles, color: '#ec4899' },
  { id: 'Corporate', name: 'Corporate', icon: Users, color: '#3b82f6' },
];

// Our Services Showcase
const SERVICES = [
  { id: 's1', title: 'Photography', subtitle: '4K Drone & Cinema', icon: Camera, color: '#e11d48' },
  { id: 's2', title: 'Royal Venues', subtitle: 'Heritage Lawns', icon: Gem, color: '#8b5cf6' },
  { id: 's3', title: 'Floral Decor', subtitle: 'Theme Backdrops', icon: Flower2, color: '#ec4899' },
  { id: 's4', title: 'DJ & Sound', subtitle: 'Live Band & JBL', icon: Music, color: '#3b82f6' },
  { id: 's5', title: 'Catering', subtitle: 'Gourmet Buffet', icon: Utensils, color: '#10b981' },
  { id: 's6', title: 'Bridal Artistry', subtitle: 'Premium Styling', icon: Palette, color: '#f59e0b' },
];

const HERO_SLIDES = [
  {
    id: 's1',
    category: 'All',
    title: 'Enjoy Every Moment Of Your Life',
    subtitle: 'From grand festival nights to joyous private parties, make every second count.',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200&auto=format&fit=crop',
    badge: 'LIVE CELEBRATION',
    badgeColor: '#10b981',
    badgeTextColor: '#ffffff',
    titleColor: '#ffffff',
    subtitleColor: '#e2e8f0',
    ctaText: 'Explore Now',
    ctaBg: '#10b981',
    overlayBg: 'rgba(9, 11, 16, 0.72)',
  },
  {
    id: 's2',
    category: 'Wedding',
    title: 'Stress-Free Celebrations',
    subtitle: 'Royal venues, authentic catering & photography managed by celebration experts.',
    image: require('../../../assets/wedding_1.jpg'),
    badge: 'ROYAL WEDDINGS',
    badgeColor: '#f59e0b',
    badgeTextColor: '#000000',
    titleColor: '#ffffff',
    subtitleColor: '#fef3c7',
    ctaText: 'Plan Event',
    ctaBg: '#f59e0b',
    overlayBg: 'rgba(28, 12, 3, 0.75)',
  },
  {
    id: 's3',
    category: 'Birthday',
    title: 'Book Your Birthday',
    subtitle: 'VIP theme decor, cakes, DJ line arrays & private banquet party halls in Patna.',
    image: require('../../../assets/birthday_1.jpg'),
    badge: 'VIP BASH',
    badgeColor: '#8b5cf6',
    badgeTextColor: '#ffffff',
    titleColor: '#ffffff',
    subtitleColor: '#ede9fe',
    ctaText: 'Book Birthday',
    ctaBg: '#8b5cf6',
    overlayBg: 'rgba(20, 5, 38, 0.75)',
  },
  {
    id: 's4',
    category: 'Dandiya',
    title: "HappyLokam: India's 1st Celebration Platform",
    subtitle: '100% verified gate passes, instant QR entry & memorable festive experiences.',
    image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1200&auto=format&fit=crop',
    badge: "INDIA'S #1 CELEBRATION OS",
    badgeColor: '#e11d48',
    badgeTextColor: '#ffffff',
    titleColor: '#ffffff',
    subtitleColor: '#ffe4e6',
    ctaText: 'Get Passes',
    ctaBg: '#e11d48',
    overlayBg: 'rgba(38, 4, 16, 0.76)',
  }
];

export default function HomeScreen() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [events, setEvents] = useState<RoomEvent[]>([]);
  const [venues, setVenues] = useState<RoomVenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOfflineCached, setIsOfflineCached] = useState(false);
  const [user, setUser] = useState<RoomUser | null>(null);

  // Hero Auto-Slider State
  const sliderRef = useRef<ScrollView>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fadeAnim.setValue(0.35);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [activeSlide]);

  useEffect(() => {
    let current = activeSlide;
    const interval = setInterval(() => {
      current = (current + 1) % HERO_SLIDES.length;
      sliderRef.current?.scrollTo({ x: current * width, animated: true });
      setActiveSlide(current);
    }, 4500);
    return () => clearInterval(interval);
  }, [activeSlide]);

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
    type: 'exit',
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Booking Auth Modal State
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [selectedTargetEvent, setSelectedTargetEvent] = useState<RoomEvent | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Ticket Tiers State
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

  // Payment Modal State
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [pendingBookingEvent, setPendingBookingEvent] = useState<RoomEvent | null>(null);
  const [checkoutTicketCount, setCheckoutTicketCount] = useState<number>(1);
  const [selectedTierKey, setSelectedTierKey] = useState<TicketTierKey>('single');
  const [contactPhoneNumber, setContactPhoneNumber] = useState('');

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
  const [selectedCelebrationDate, setSelectedCelebrationDate] = useState('all');

  // Refresh user session on screen focus
  useFocusEffect(
    useCallback(() => {
      const fetchUser = async () => {
        const session = await RoomDatabase.getUserSession();
        setUser(session);
        if (session?.phone) {
          setContactPhoneNumber(session.phone);
        }
      };
      fetchUser();

      const onBackPress = () => {
        setDialogConfig({
          visible: true,
          type: 'exit',
          title: 'Exit happylokam?',
          message: 'Close the celebration app?',
          confirmText: 'Exit App',
          cancelText: 'Stay',
          onConfirm: () => {
            setDialogConfig((prev) => ({ ...prev, visible: false }));
            BackHandler.exitApp();
          },
        });
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

  const loadData = async () => {
    try {
      // Step A: Load from Room Database
      const cachedEvents = await RoomDatabase.getEvents();
      const cachedVenues = await RoomDatabase.getVenues();
      if (cachedEvents.length > 0) {
        setEvents(cachedEvents);
        setIsOfflineCached(true);
        setLoading(false);
      }
      if (cachedVenues.length > 0) {
        setVenues(cachedVenues);
      }

      // Step B: Fetch live genuine server data
      const [eventsRes, listingsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/events`).catch(() => null),
        fetch(`${API_BASE_URL}/listings`).catch(() => null),
      ]);

      if (eventsRes && eventsRes.ok) {
        const eventsJson = await eventsRes.json();
        if (eventsJson.success && Array.isArray(eventsJson.data)) {
          const formattedEvents: RoomEvent[] = eventsJson.data.map((item: any) => ({
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
            ticketTiers: item.ticketTiers || {
              single: item.price || 0,
              couple: Math.round((item.price || 0) * 1.8),
              family4: Math.round((item.price || 0) * 3.4),
              family6: Math.round((item.price || 0) * 4.8),
              group5: Math.round((item.price || 0) * 4.2),
              child: Math.round((item.price || 0) * 0.5),
            },
            availableTickets: item.ticketsLeft ?? item.totalTickets,
            image: item.imageUrl || 'https://images.unsplash.com/photo-1604928141064-207cea6f571f?q=80&w=800',
            rating: 4.9,
            featured: true,
            syncTimestamp: Date.now(),
          }));

          setEvents(formattedEvents);
          await RoomDatabase.saveEvents(formattedEvents);
          setIsOfflineCached(false);
        }
      }

      if (listingsRes && listingsRes.ok) {
        const listingsJson = await listingsRes.json();
        if (listingsJson.success && Array.isArray(listingsJson.data)) {
          const formattedVenues: RoomVenue[] = listingsJson.data.map((item: any) => ({
            id: item.id,
            title: item.name,
            category: 'Venue',
            location: `${item.city || 'Patna'}, Bihar`,
            price: item.price ? `₹${item.price}/event` : 'Price on request',
            rating: 4.9,
            image: item.images?.[0] || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=800',
            syncTimestamp: Date.now(),
          }));

          setVenues(formattedVenues);
          await RoomDatabase.saveVenues(formattedVenues);
        }
      }
    } catch (e) {
      console.warn('Error loading celebration data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Auth Guard on Booking
  const handleBookingPress = async (event: RoomEvent) => {
    const isAuthed = await RoomDatabase.isAuthenticated();
    setCheckoutTicketCount(1);
    setSelectedTierKey('single');
    const session = await RoomDatabase.getUserSession();
    if (session?.phone) {
      setContactPhoneNumber(session.phone);
    }
    if (!isAuthed) {
      setSelectedTargetEvent(event);
      setAuthModalVisible(true);
    } else {
      setPendingBookingEvent(event);
      setPaymentModalVisible(true);
    }
  };

  const handlePaymentConfirm = async () => {
    if (!pendingBookingEvent) return;
    const event = pendingBookingEvent;
    setPaymentProcessing(true);
    
    setTimeout(async () => {
      const tierUnitPrice = getEventTierPrice(event, selectedTierKey);
      const subtotal = tierUnitPrice * checkoutTicketCount;
      const transactionFee = Number((subtotal * 0.02).toFixed(2));
      const feeGst = Number((transactionFee * 0.18).toFixed(2));
      const eventGst = subtotal > 500 ? Number((subtotal * 0.18).toFixed(2)) : 0;
      const totalAmount = Math.max(1, Math.round(subtotal + transactionFee + feeGst + eventGst));
      const activeTierObj = TICKET_TIERS_CONFIG.find(t => t.key === selectedTierKey) || TICKET_TIERS_CONFIG[0];
      const tierName = activeTierObj.name;

      // Use the account's real delivery number; never substitute a fake number.
      let phoneToUse = contactPhoneNumber.replace(/\D/g, '');
      const session = await RoomDatabase.getUserSession();
      if (!phoneToUse && session?.phone) {
        phoneToUse = String(session.phone).replace(/\D/g, '');
      }
      if (!session?.token) {
        setPaymentProcessing(false);
        setDialogConfig({ visible: true, type: 'danger', title: 'Sign in required', message: 'Please sign in before making a payment.', confirmText: 'OK', onConfirm: () => setDialogConfig(prev => ({ ...prev, visible: false })) });
        return;
      }
      if (!phoneToUse || phoneToUse.length < 10) {
        setPaymentProcessing(false);
        setDialogConfig({ visible: true, type: 'danger', title: 'Mobile number required', message: 'Add a valid mobile number to your profile before payment.', confirmText: 'OK', onConfirm: () => setDialogConfig(prev => ({ ...prev, visible: false })) });
        return;
      }

      try {
          const orderRes = await fetch(`${API_BASE_URL}/payments/create-order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
            body: JSON.stringify({ amount: totalAmount, currency: 'INR' }),
          });

          const orderData = await orderRes.json();
          const orderId = orderRes.ok && orderData.success && orderData.data?.id ? orderData.data.id : undefined;
          if (!orderId) throw new Error(orderData.message || 'Could not create a secure payment order.');

          const options: any = {
            description: `${checkoutTicketCount}x ${tierName} - ${event.title}`,
            image: 'https://happylokam.com/logo.png',
            currency: 'INR',
            key: process.env.EXPO_PUBLIC_RAZORPAY_KEY || 'rzp_live_SjBHhCXWmZhVK6',
            amount: totalAmount * 100,
            name: 'HappyLokam Celebrations',
            order_id: orderId,
            prefill: {
              email: session.email || 'user@happylokam.com',
              contact: phoneToUse,
              name: session.name || 'Celebration Lover'
            },
            readonly: {
              contact: true,
              email: true,
              name: true,
            },
            theme: { color: '#e11d48' }
          };

          const paymentResponse = await RazorpayCheckout.open(options);
          
          if (!paymentResponse.razorpay_payment_id) throw new Error('Payment cancelled');

          const bookingRes = await fetch(`${API_BASE_URL}/events/book`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
            body: JSON.stringify({
              userId: session.id,
              eventId: event.id,
              date: new Date(event.date).toISOString(),
              totalAmount: totalAmount,
              tickets: checkoutTicketCount,
              ticketsCount: checkoutTicketCount,
              tierType: selectedTierKey.toUpperCase(),
              tierName: tierName,
              paymentId: paymentResponse.razorpay_payment_id,
              orderId: paymentResponse.razorpay_order_id,
              signature: paymentResponse.razorpay_signature
            }),
          });
          
          const data = await bookingRes.json();
          const bookingId = bookingRes.ok && data.success && data.data?.id ? data.data.id : undefined;
          if (!bookingId) throw new Error(data.message || 'Payment was received but the pass could not be confirmed.');

          await RoomDatabase.saveBooking({
            id: bookingId,
            title: event.title,
            category: event.category,
            date: event.date,
            amount: totalAmount,
            status: 'CONFIRMED',
            tierType: selectedTierKey.toUpperCase(),
            tierName,
            ticketsCount: checkoutTicketCount,
            qrCode: data.data?.qrCode || `HL-TKT:${bookingId}`,
            createdAt: data.data?.createdAt || new Date().toISOString(),
            serverVerified: true,
          });

          setPaymentProcessing(false);
          setPaymentModalVisible(false);
          setPendingBookingEvent(null);
          setDialogConfig({
            visible: true,
            type: 'success',
            title: 'Pass Confirmed! 🎉',
            message: `Your verified celebration pass #${bookingId} is secured in your tickets.`,
            confirmText: 'View Pass',
            cancelText: 'Keep Browsing',
            onConfirm: () => {
              setDialogConfig((prev) => ({ ...prev, visible: false }));
              router.push('/(tabs)/bookings');
            },
          });
        } catch (e: any) {
          console.warn('Payment or backend sync failed', e);
          setPaymentProcessing(false);
          setPaymentModalVisible(false);
          
          const errStr = typeof e === 'string' ? e : (e?.description || e?.message || '');
          const isCancelled = 
            e?.code === 0 || 
            e?.code === 2 || 
            errStr.includes('cancelled') || 
            errStr.includes('payment_error');

          if (isCancelled) {
            setDialogConfig({
              visible: true,
              type: 'cancelled',
              badgeText: 'PAYMENT CANCELLED',
              title: 'Payment Cancelled',
              message: 'No amount was deducted. You can book anytime.',
              confirmText: 'Got It',
              onConfirm: () => setDialogConfig(prev => ({ ...prev, visible: false })),
            });
          } else {
            setDialogConfig({
              visible: true,
              type: 'error',
              badgeText: 'PAYMENT NOTICE',
              title: 'Payment Incomplete',
              message: 'Transaction could not be completed. Please try again.',
              confirmText: 'OK',
              onConfirm: () => setDialogConfig(prev => ({ ...prev, visible: false }))
            });
          }
        }
    }, 1800);
  };

  const handleAuthSubmit = async () => {
    if (!authEmail || !authPassword) {
      setDialogConfig({
        visible: true,
        type: 'danger',
        title: 'Missing Details',
        message: 'Please enter your email and password.',
        confirmText: 'OK',
        onConfirm: () => setDialogConfig((prev) => ({ ...prev, visible: false })),
      });
      return;
    }

    setAuthLoading(true);
    try {
      const endpoint =
        authMode === 'login'
          ? `${API_BASE_URL}/auth/login`
          : `${API_BASE_URL}/auth/register`;

      const bodyData =
        authMode === 'login'
          ? { email: authEmail, password: authPassword }
          : { name: authName || 'Celebration Lover', email: authEmail, password: authPassword };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });

      const data = await res.json();
      if (res.ok && data.token) {
        const newSession: RoomUser = {
          id: data.user?.id || 'u_' + Date.now(),
          name: data.user?.name || authName || 'Guest User',
          email: authEmail,
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

        if (selectedTargetEvent) {
          setPendingBookingEvent(selectedTargetEvent);
          setSelectedTargetEvent(null);
          setPaymentModalVisible(true);
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
        message: 'Check your internet connection.',
        confirmText: 'OK',
        onConfirm: () => setDialogConfig((prev) => ({ ...prev, visible: false })),
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const filteredEvents = events.filter((event) => {
    const matchesCategory = selectedCategory === 'all' ||
      event.category?.toLowerCase() === selectedCategory.toLowerCase() ||
      event.category?.toLowerCase().includes(selectedCategory.toLowerCase()) ||
      selectedCategory.toLowerCase().includes(event.category?.toLowerCase() || '') ||
      event.title?.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesDate = selectedCelebrationDate === 'all' || event.date === selectedCelebrationDate;
    return matchesCategory && matchesDate;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#090b10" />

      {/* Ambient background glows */}
      <View style={styles.glowAuraLeft} />
      <View style={styles.glowAuraRight} />

      {/* Modern Top Header with Sign In & Profile Indicator */}
      <View style={styles.header}>
        <View>
          <View style={styles.brandRow}>
            <Text style={styles.brandLogo}>happylokam</Text>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>CELEBRATION OS</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.locationContainer}
            onPress={() => router.push('/(tabs)/explore')}
            activeOpacity={0.8}
          >
            <MapPin size={13} color="#f43f5e" />
            <Text style={styles.locationText}>Patna, Bihar</Text>
            <ChevronRight size={13} color="#94a3b8" />
            {isOfflineCached && (
              <View style={styles.offlinePill}>
                <Text style={styles.offlineText}>Cached</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {!user ? (
          <TouchableOpacity
            style={styles.headerSignInBtn}
            onPress={() => router.push('/login')}
            activeOpacity={0.88}
          >
            <LogIn size={15} color="#ffffff" />
            <Text style={styles.headerSignInText}>Sign In / Register</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => router.push('/(tabs)/profile')}
            activeOpacity={0.85}
          >
            <View style={styles.userBadge}>
              <Text style={styles.userBadgeText}>{user.name.split(' ')[0]}</Text>
            </View>
            <Image
              source={{
                uri: user.email
                  ? `https://api.dicebear.com/7.x/notionists/png?seed=${encodeURIComponent(user.email)}`
                  : 'https://api.dicebear.com/7.x/notionists/png?seed=happylokam',
              }}
              style={styles.avatar}
            />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#e11d48" />
        }
      >
        {/* Premium Celebration Slider (Tapping Navigates to Explore) */}
        <View style={{ marginBottom: 16 }}>
          <ScrollView 
            ref={sliderRef}
            horizontal 
            pagingEnabled 
            showsHorizontalScrollIndicator={false}
            snapToInterval={width}
            decelerationRate="fast"
            onMomentumScrollEnd={(e) => {
               const slide = Math.round(e.nativeEvent.contentOffset.x / width);
               setActiveSlide(slide);
            }}
          >
            {HERO_SLIDES.map((slide) => (
              <View key={slide.id} style={{ width, paddingHorizontal: 16 }}>
                <TouchableOpacity
                  activeOpacity={0.92}
                  style={styles.premiumBanner}
                  onPress={() => router.push('/(tabs)/explore')}
                >
                  <Image source={typeof slide.image === 'string' ? { uri: slide.image } : slide.image} style={styles.premiumImage} />
                  <View style={[styles.premiumGradient, { backgroundColor: slide.overlayBg }]}>
                    <View style={[styles.premiumTopBadge, { backgroundColor: slide.badgeColor }]}>
                      <Flame size={13} color={slide.badgeTextColor} />
                      <Text style={[styles.premiumTopBadgeText, { color: slide.badgeTextColor }]}>{slide.badge}</Text>
                    </View>

                    <Animated.View style={[styles.heroTextContainer, { opacity: fadeAnim }]}>
                      <Text style={[styles.premiumTitle, { color: slide.titleColor }]} numberOfLines={2}>
                        {slide.title}
                      </Text>
                      <Text style={[styles.premiumSubtitle, { color: slide.subtitleColor }]} numberOfLines={2}>
                        {slide.subtitle}
                      </Text>
                    </Animated.View>

                    <View style={styles.premiumActionRow}>
                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => router.push('/(tabs)/explore')}
                        style={[styles.premiumCtaBtn, { backgroundColor: slide.ctaBg }]}
                      >
                        <Text style={styles.premiumCtaText}>{slide.ctaText}</Text>
                        <ChevronRight size={16} color="#ffffff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
          <View style={styles.paginationRow}>
             {HERO_SLIDES.map((_, i) => (
                <View key={i} style={[styles.dot, i === activeSlide ? styles.activeDot : null]} />
             ))}
          </View>
        </View>

        {/* Celebration Categories Filter */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionHeading}>Celebrations</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesRow}>
            {CELEBRATION_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const IconComp = cat.icon;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    isSelected && styles.categoryChipSelected,
                  ]}
                  onPress={() => setSelectedCategory(cat.id)}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.categoryIconCircle,
                      { backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.2)' : 'rgba(244, 63, 94, 0.12)' },
                    ]}
                  >
                    <IconComp size={15} color={isSelected ? '#ffffff' : '#f43f5e'} />
                  </View>
                  <Text
                    style={[
                      styles.categoryChipText,
                      isSelected && styles.categoryChipTextSelected,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Celebration Dates Filter Strip (11 - 18 Oct 2026) */}
        <View style={styles.dateFilterSection}>
          <View style={styles.dateFilterHeader}>
            <Calendar size={14} color="#f43f5e" />
            <Text style={styles.dateFilterHeading}>Dandiya Nights (11 – 18 Oct)</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateFilterRow}>
            <TouchableOpacity
              style={[
                styles.dateFilterChip,
                selectedCelebrationDate === 'all' && styles.dateFilterChipActive,
              ]}
              onPress={() => setSelectedCelebrationDate('all')}
              activeOpacity={0.8}
            >
              <Text style={[styles.dateFilterChipText, selectedCelebrationDate === 'all' && styles.dateFilterChipTextActive]}>All dates</Text>
            </TouchableOpacity>
            {CELEBRATION_DATES.map((d) => {
              const isSelected = selectedCelebrationDate === d.full;
              return (
                <TouchableOpacity
                  key={d.id}
                  style={[
                    styles.dateFilterChip,
                    isSelected && styles.dateFilterChipActive,
                  ]}
                  onPress={() => setSelectedCelebrationDate(d.full)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dateFilterChipText, isSelected && styles.dateFilterChipTextActive]}>{d.dayNum} Oct</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Live Admin Events Showcase */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionHeading}>Live Events & Passes</Text>
            <Text style={styles.sectionSub}>Real-time verified inventory</Text>
          </View>
          <TouchableOpacity
            style={styles.seeAllBtn}
            onPress={() => router.push('/(tabs)/explore')}
          >
            <Text style={styles.seeAllText}>Explore all</Text>
            <ChevronRight size={15} color="#e11d48" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#e11d48" />
            <Text style={styles.loadingText}>Syncing Room Database...</Text>
          </View>
        ) : filteredEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <Sparkles size={32} color="#f43f5e" />
            <Text style={styles.emptyStateTitle}>No events in this category</Text>
            <Text style={styles.emptyStateSub}>Switch category or pull down to refresh</Text>
          </View>
        ) : (
          <FlatList
            data={filteredEvents}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.eventsScrollList}
            snapToInterval={width * 0.78 + 16}
            decelerationRate="fast"
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.celebrationCard}
                activeOpacity={0.92}
                onPress={() => handleBookingPress(item)}
              >
                <Image source={{ uri: item.image }} style={styles.cardImage} />

                <View style={styles.cardTagPill}>
                  <Text style={styles.cardTagText}>{item.category || 'Celebration'}</Text>
                </View>

                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.title}
                  </Text>

                  <View style={styles.metaRow}>
                    <Calendar size={13} color="#94a3b8" />
                    <Text style={styles.metaText}>{item.date}</Text>
                  </View>

                  <View style={styles.metaRow}>
                    <MapPin size={13} color="#94a3b8" />
                    <Text style={styles.metaText} numberOfLines={1}>
                      {item.location}
                    </Text>
                  </View>

                  <View style={styles.cardFooter}>
                    <View>
                      <Text style={styles.priceLabel}>Starting from</Text>
                      <Text style={styles.cardPrice}>₹{getEventTierPrice(item, 'single')}</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.bookPassBtn}
                      onPress={() => handleBookingPress(item)}
                    >
                      <Text style={styles.bookPassText}>Book Now</Text>
                      <ArrowRight size={13} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        )}

        {/* Our Services Section */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionHeading}>Celebration Services</Text>
            <Text style={styles.sectionSub}>Everything you need for a memorable celebration</Text>
          </View>
        </View>

        <View style={styles.servicesGrid}>
          {SERVICES.map((srv) => {
            const SrvIcon = srv.icon;
            return (
              <TouchableOpacity
                key={srv.id}
                style={styles.serviceItemCard}
                activeOpacity={0.88}
                onPress={() => router.push('/(tabs)/explore')}
              >
                <View style={[styles.serviceIconContainer, { backgroundColor: 'rgba(225, 29, 72, 0.12)' }]}>
                  <SrvIcon size={22} color="#f43f5e" />
                </View>
                <Text style={styles.serviceItemTitle}>{srv.title}</Text>
                <Text style={styles.serviceItemSub} numberOfLines={2}>
                  {srv.subtitle}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Featured Venues Section */}
        {venues.length > 0 && (
          <>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionHeading}>Royal Venues & Lawns</Text>
                <Text style={styles.sectionSub}>Curated banquet halls in Patna</Text>
              </View>
            </View>

            {venues.map((v) => (
              <TouchableOpacity
                key={v.id}
                style={styles.venueFullCard}
                activeOpacity={0.92}
                onPress={() => router.push('/(tabs)/explore')}
              >
                <Image source={{ uri: v.image }} style={styles.venueFullImage} />
                <View style={styles.venueOverlay}>
                  <View style={styles.venueRatingPill}>
                    <Star size={11} color="#fbbf24" fill="#fbbf24" />
                    <Text style={styles.venueRatingText}>4.9 Top Rated</Text>
                  </View>
                  <Text style={styles.venueFullTitle}>{v.title}</Text>
                  <View style={styles.venueLocationRow}>
                    <MapPin size={13} color="#ffffff" />
                    <Text style={styles.venueLocationText}>{v.location}</Text>
                  </View>
                  <Text style={styles.venueFullPrice}>Starts from {v.price}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Animated Booking Auth Modal */}
      <Modal
        visible={authModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAuthModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <ShieldCheck size={20} color="#e11d48" />
                <Text style={styles.modalTitle}>Sign In to Book</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setAuthModalVisible(false)}
              >
                <X size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Please sign in to reserve celebration passes.
            </Text>

            <View style={styles.authToggle}>
              <TouchableOpacity
                style={[styles.toggleBtn, authMode === 'login' && styles.toggleBtnActive]}
                onPress={() => setAuthMode('login')}
              >
                <Text style={[styles.toggleText, authMode === 'login' && styles.toggleTextActive]}>
                  Sign In
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, authMode === 'signup' && styles.toggleBtnActive]}
                onPress={() => setAuthMode('signup')}
              >
                <Text style={[styles.toggleText, authMode === 'signup' && styles.toggleTextActive]}>
                  Register
                </Text>
              </TouchableOpacity>
            </View>

            {authMode === 'signup' && (
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Rishi Kumar"
                  placeholderTextColor="#64748b"
                  value={authName}
                  onChangeText={setAuthName}
                />
              </View>
            )}

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.textInput}
                placeholder="user@example.com"
                placeholderTextColor="#64748b"
                keyboardType="email-address"
                autoCapitalize="none"
                value={authEmail}
                onChangeText={setAuthEmail}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.textInput}
                placeholder="••••••••"
                placeholderTextColor="#64748b"
                secureTextEntry
                value={authPassword}
                onChangeText={setAuthPassword}
              />
            </View>

            <TouchableOpacity
              style={styles.authSubmitBtn}
              onPress={handleAuthSubmit}
              disabled={authLoading}
            >
              {authLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.authSubmitText}>
                  {authMode === 'login' ? 'Sign In & Reserve' : 'Create Account'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.fullScreenAuthLink}
              onPress={() => {
                setAuthModalVisible(false);
                router.push('/login');
              }}
            >
              <Text style={styles.fullScreenAuthText}>Or open dedicated sign-in screen</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Payment Checkout Modal with Thumb Zone UX Law */}
      <Modal
        visible={paymentModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => !paymentProcessing && setPaymentModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.checkoutSheetContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <CreditCard size={20} color="#e11d48" />
                <Text style={styles.modalTitle}>Secure Checkout</Text>
              </View>
              {!paymentProcessing && (
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setPaymentModalVisible(false)}
                >
                  <X size={18} color="#94a3b8" />
                </TouchableOpacity>
              )}
            </View>

            {pendingBookingEvent && (() => {
              const tierUnitPrice = getEventTierPrice(pendingBookingEvent, selectedTierKey);
              const subtotal = tierUnitPrice * checkoutTicketCount;
              const transactionFee = Number((subtotal * 0.02).toFixed(2));
              const feeGst = Number((transactionFee * 0.18).toFixed(2));
              const eventGst = subtotal > 500 ? Number((subtotal * 0.18).toFixed(2)) : 0;
              const totalAmount = Math.max(1, Math.round(subtotal + transactionFee + feeGst + eventGst));
              const activeTierObj = TICKET_TIERS_CONFIG.find(t => t.key === selectedTierKey) || TICKET_TIERS_CONFIG[0];

              return (
                <>
                  <ScrollView showsVerticalScrollIndicator={false} style={styles.checkoutScrollArea}>
                    <Text style={styles.checkoutEventTitle}>{pendingBookingEvent.title}</Text>
                    <Text style={styles.checkoutEventDate}>
                      📅 {pendingBookingEvent.date} • 📍 {pendingBookingEvent.location}
                    </Text>

                    {/* CELEBRATION TIME */}
                    <View style={styles.timingCard}>
                      <Clock size={14} color="#fbbf24" />
                      <Text style={styles.timingCardText}>
                        Celebration Timing: 06:30 PM - 11:30 PM (Entry starts 06:00 PM)
                      </Text>
                    </View>

                    {/* 1. CHOOSE TICKET TIER */}
                    <Text style={[styles.checkoutSectionLabel, { marginTop: 14 }]}>Select Ticket Tier</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
                      {TICKET_TIERS_CONFIG.map((tier) => {
                        const isSelected = selectedTierKey === tier.key;
                        const price = getEventTierPrice(pendingBookingEvent, tier.key);
                        return (
                          <TouchableOpacity
                            key={tier.key}
                            onPress={() => setSelectedTierKey(tier.key)}
                            activeOpacity={0.8}
                            style={[styles.tierPill, isSelected && styles.tierPillActive]}
                          >
                            <Text style={styles.tierPillIcon}>{tier.icon} {tier.tag}</Text>
                            <Text style={[styles.tierPillName, isSelected && styles.tierPillNameActive]}>
                              {tier.name}
                            </Text>
                            <Text style={[styles.tierPillPrice, isSelected && styles.tierPillPriceActive]}>
                              ₹{price}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>

                    {/* 2. PASS QUANTITY COUNTER */}
                    <Text style={styles.checkoutSectionLabel}>Number of Passes</Text>
                    <View style={styles.quantityRow}>
                      <View>
                        <Text style={styles.quantityLabel}>{activeTierObj.name}</Text>
                        <Text style={{ fontSize: 11, color: '#94a3b8' }}>₹{tierUnitPrice} per pass</Text>
                      </View>
                      <View style={styles.quantityControls}>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => setCheckoutTicketCount((c) => Math.max(1, c - 1))}
                        >
                          <Minus size={16} color="#ffffff" />
                        </TouchableOpacity>
                        <Text style={styles.qtyValue}>{checkoutTicketCount}</Text>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => setCheckoutTicketCount((c) => Math.min(10, c + 1))}
                        >
                          <Plus size={16} color="#ffffff" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* 3. CONTACT PHONE NUMBER (PREVENTS RAZORPAY PROMPT!) */}
                    <Text style={styles.checkoutSectionLabel}>WhatsApp & Pass Delivery Phone</Text>
                    <View style={styles.phoneInputRow}>
                      <Phone size={18} color="#e11d48" style={{ marginRight: 8 }} />
                      <TextInput
                        value={contactPhoneNumber}
                        onChangeText={setContactPhoneNumber}
                        placeholder="10-digit mobile number"
                        placeholderTextColor="#64748b"
                        keyboardType="phone-pad"
                        maxLength={10}
                        style={styles.phoneInput}
                      />
                    </View>
                    <Text style={styles.phoneHint}>
                      Pass QR code and instant confirmation will be sent here.
                    </Text>

                    {/* 4. PRICE BREAKDOWN */}
                    <View style={styles.breakdownCard}>
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>{checkoutTicketCount}x {activeTierObj.name} (₹{tierUnitPrice})</Text>
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
                        <Text style={styles.summaryValue}>
                          {eventGst > 0 ? `₹${eventGst}` : '₹0 (Exempt)'}
                        </Text>
                      </View>
                    </View>
                    <View style={{ height: 20 }} />
                  </ScrollView>

                  {/* STICKY BOTTOM ACTION BAR (Thumb Zone UX Law) */}
                  <View style={styles.stickyThumbBar}>
                    <View style={styles.thumbPriceBlock}>
                      <Text style={styles.thumbTierText}>{activeTierObj.name} • {checkoutTicketCount}x</Text>
                      <Text style={styles.thumbTotalAmount}>₹{totalAmount}</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.thumbPayBtn}
                      onPress={handlePaymentConfirm}
                      disabled={paymentProcessing}
                      activeOpacity={0.88}
                    >
                      {paymentProcessing ? (
                        <ActivityIndicator color="#ffffff" />
                      ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.thumbPayBtnText}>Book Now</Text>
                          <ArrowRight size={18} color="#ffffff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              );
            })()}
          </View>
        </View>
      </Modal>

      {/* Dedicated Authentication Modal (Prompted before Booking if guest) */}
      <Modal
        visible={authModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAuthModalVisible(false)}
      >
        <View style={styles.authModalBackdrop}>
          <View style={styles.authModalCard}>
            <View style={styles.authModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Sparkles size={18} color="#e11d48" />
                <Text style={styles.authModalTitle}>Sign In to Book Passes</Text>
              </View>
              <TouchableOpacity
                onPress={() => setAuthModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <X size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.authModalSubtitle}>
              Celebration gate passes and verified QR codes are linked directly to your account.
            </Text>

            {/* Direct Navigation Action Buttons */}
            <View style={{ gap: 10, marginVertical: 12 }}>
              <TouchableOpacity
                style={styles.authPrimaryBtn}
                onPress={() => {
                  setAuthModalVisible(false);
                  router.push('/login');
                }}
                activeOpacity={0.88}
              >
                <LogIn size={16} color="#ffffff" />
                <Text style={styles.authPrimaryBtnText}>Sign In to Your Account</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.authSecondaryBtn}
                onPress={() => {
                  setAuthModalVisible(false);
                  router.push('/signup');
                }}
                activeOpacity={0.88}
              >
                <User size={16} color="#f43f5e" />
                <Text style={styles.authSecondaryBtnText}>Create New Account (Sign Up)</Text>
              </TouchableOpacity>
            </View>

            {/* In-Sheet Quick Sign In */}
            <View style={styles.authOrRow}>
              <View style={styles.authOrLine} />
              <Text style={styles.authOrText}>OR QUICK SIGN IN</Text>
              <View style={styles.authOrLine} />
            </View>

            <View style={styles.quickAuthInputs}>
              <TextInput
                placeholder="Email address"
                placeholderTextColor="#64748b"
                keyboardType="email-address"
                autoCapitalize="none"
                value={authEmail}
                onChangeText={setAuthEmail}
                style={styles.authInputField}
              />
              <TextInput
                placeholder="Password"
                placeholderTextColor="#64748b"
                secureTextEntry
                value={authPassword}
                onChangeText={setAuthPassword}
                style={styles.authInputField}
              />
              <TouchableOpacity
                style={styles.quickSubmitBtn}
                onPress={handleAuthSubmit}
                disabled={authLoading}
                activeOpacity={0.88}
              >
                {authLoading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.quickSubmitBtnText}>Sign In & Continue Booking</Text>
                )}
              </TouchableOpacity>
            </View>
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

  glowAuraLeft: {
    position: 'absolute',
    top: -50,
    left: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(225, 29, 72, 0.12)',
  },
  glowAuraRight: {
    position: 'absolute',
    top: 250,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    backgroundColor: '#090b10',
    borderBottomWidth: 1,
    borderBottomColor: '#1c2333',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandLogo: {
    fontSize: 26,
    fontWeight: '900',
    color: '#e11d48',
    letterSpacing: -0.5,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(225, 29, 72, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.35)',
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e11d48',
  },
  liveText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#f43f5e',
    letterSpacing: 0.8,
  },
  locationContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  locationText: { fontSize: 13, fontWeight: '700', color: '#cbd5e1' },
  offlinePill: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    marginLeft: 6,
  },
  offlineText: { fontSize: 10, fontWeight: '700', color: '#fbbf24' },

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

  profileBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  userBadge: {
    backgroundColor: '#121622',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1c2333',
  },
  userBadgeText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#121622', borderWidth: 2, borderColor: '#f43f5e' },

  scrollContent: { paddingBottom: 30 },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#252d3d',
  },
  activeDot: {
    width: 18,
    backgroundColor: '#e11d48',
  },

  // Premium Hero Banner
  premiumBanner: {
    marginTop: 16,
    height: 250,
    borderRadius: 26,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#1c2333',
  },
  premiumImage: { width: '100%', height: '100%', position: 'absolute' },
  premiumGradient: {
    ...StyleSheet.absoluteFill,
    padding: 20,
    justifyContent: 'space-between',
  },
  heroTextContainer: { marginVertical: 4 },
  premiumTopBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
  },
  premiumTopBadgeText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  premiumTitle: {
    fontSize: 21,
    fontWeight: '900',
    lineHeight: 27,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  premiumSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginTop: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  premiumActionRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 4 },
  premiumCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 30,
    gap: 4,
  },
  premiumCtaText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },

  // Categories Section
  categoriesSection: { marginTop: 20 },
  sectionHeading: { fontSize: 18, fontWeight: '800', color: '#ffffff', paddingHorizontal: 20 },
  sectionSub: { fontSize: 12, color: '#94a3b8', fontWeight: '500', paddingHorizontal: 20, marginTop: 2 },
  categoriesRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121622',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1c2333',
    gap: 8,
  },
  categoryChipSelected: {
    backgroundColor: '#e11d48',
    borderColor: '#e11d48',
  },
  categoryIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryChipText: { fontSize: 13, fontWeight: '700', color: '#94a3b8' },
  categoryChipTextSelected: { color: '#ffffff' },

  // Date Filter Strip
  dateFilterSection: {
    marginTop: 14,
    paddingHorizontal: 20,
  },
  dateFilterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  dateFilterHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#e2e8f0',
    letterSpacing: 0.2,
  },
  dateFilterRow: {
    gap: 8,
    paddingBottom: 4,
  },
  dateFilterChip: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#121622',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1c2333',
    minWidth: 72,
  },
  dateFilterChipActive: {
    backgroundColor: '#e11d48',
    borderColor: '#e11d48',
  },
  dateFilterChipText: { fontSize: 12, fontWeight: '800', color: '#94a3b8' },
  dateFilterChipTextActive: { color: '#ffffff' },
  dateFilterChipDay: { fontSize: 10, fontWeight: '700', color: '#94a3b8', letterSpacing: 0.5 },
  dateFilterChipDayActive: { color: '#ffffff' },
  dateFilterChipNum: { fontSize: 18, fontWeight: '900', color: '#cbd5e1', marginTop: 1 },
  dateFilterChipNumActive: { color: '#ffffff' },
  dateFilterChipMonth: { fontSize: 9, fontWeight: '700', color: '#64748b', letterSpacing: 0.8 },
  dateFilterChipMonthActive: { color: 'rgba(255,255,255,0.8)' },

  // Section Header Row
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 20,
    marginTop: 20,
    marginBottom: 8,
  },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText: { fontSize: 13, fontWeight: '700', color: '#f43f5e' },

  // Events List
  eventsScrollList: { paddingHorizontal: 16, paddingVertical: 8 },
  celebrationCard: {
    width: width * 0.78,
    backgroundColor: '#121622',
    borderRadius: 20,
    marginRight: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1c2333',
  },
  cardImage: { width: '100%', height: 160 },
  cardTagPill: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(9, 11, 16, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.4)',
  },
  cardTagText: { color: '#f43f5e', fontSize: 11, fontWeight: '800' },
  cardBody: { padding: 14 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#ffffff', marginBottom: 8, minHeight: 40 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  metaText: { fontSize: 12, color: '#94a3b8', fontWeight: '500', flex: 1 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1c2333',
  },
  priceLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '600' },
  cardPrice: { fontSize: 18, fontWeight: '900', color: '#ffffff' },
  bookPassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e11d48',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    gap: 4,
  },
  bookPassText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },

  // Services Grid
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginTop: 10,
    justifyContent: 'space-between',
  },
  serviceItemCard: {
    width: '48%',
    backgroundColor: '#121622',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1c2333',
  },
  serviceIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  serviceItemTitle: { fontSize: 14, fontWeight: '800', color: '#ffffff' },
  serviceItemSub: { fontSize: 11, color: '#94a3b8', marginTop: 2, fontWeight: '500' },

  // Venues Full Card
  venueFullCard: {
    marginHorizontal: 16,
    marginTop: 12,
    height: 190,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1c2333',
  },
  venueFullImage: { width: '100%', height: '100%' },
  venueOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(9, 11, 16, 0.65)',
    padding: 16,
    justifyContent: 'flex-end',
  },
  venueRatingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#1c2333',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
    marginBottom: 6,
  },
  venueRatingText: { fontSize: 11, fontWeight: '800', color: '#fbbf24' },
  venueFullTitle: { color: '#ffffff', fontSize: 18, fontWeight: '800' },
  venueLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  venueLocationText: { color: '#cbd5e1', fontSize: 12, fontWeight: '500' },
  venueFullPrice: { color: '#f43f5e', fontSize: 13, fontWeight: '700', marginTop: 4 },

  loadingContainer: { padding: 40, alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  emptyState: { padding: 40, alignItems: 'center' },
  emptyStateTitle: { marginTop: 12, fontSize: 15, fontWeight: '700', color: '#ffffff' },
  emptyStateSub: { marginTop: 4, fontSize: 12, color: '#94a3b8' },

  // Modal Backdrop
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
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#ffffff' },
  modalCloseBtn: { padding: 6, backgroundColor: '#1a202e', borderRadius: 20 },
  modalSubtitle: { fontSize: 13, color: '#94a3b8', marginBottom: 14, marginTop: 4 },

  authToggle: {
    flexDirection: 'row',
    backgroundColor: '#090b10',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1c2333',
  },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  toggleBtnActive: { backgroundColor: '#e11d48' },
  toggleText: { fontSize: 13, fontWeight: '700', color: '#94a3b8' },
  toggleTextActive: { color: '#ffffff' },
  inputWrapper: { marginBottom: 12 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#cbd5e1', marginBottom: 4 },
  textInput: {
    backgroundColor: '#090b10',
    borderWidth: 1,
    borderColor: '#1c2333',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#ffffff',
  },
  authSubmitBtn: {
    backgroundColor: '#e11d48',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  authSubmitText: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
  fullScreenAuthLink: { marginTop: 14, alignItems: 'center' },
  fullScreenAuthText: { color: '#f43f5e', fontSize: 12, fontWeight: '600' },

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
  tierPillIcon: { fontSize: 11, color: '#94a3b8', fontWeight: '700', marginBottom: 4 },
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

  // Auth Modal Styles
  authModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  authModalCard: {
    width: '100%',
    backgroundColor: '#0f1420',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: '#1c2333',
    shadowColor: '#e11d48',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  authModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  authModalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
  },
  authModalSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
    marginBottom: 16,
  },
  authPrimaryBtn: {
    backgroundColor: '#e11d48',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 14,
    gap: 8,
  },
  authPrimaryBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
  authSecondaryBtn: {
    backgroundColor: 'rgba(225, 29, 72, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.4)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
  },
  authSecondaryBtnText: {
    color: '#f43f5e',
    fontWeight: '700',
    fontSize: 13,
  },
  authOrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
    gap: 10,
  },
  authOrLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#1c2333',
  },
  authOrText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 1,
  },
  quickAuthInputs: {
    gap: 10,
  },
  authInputField: {
    backgroundColor: '#121622',
    borderWidth: 1,
    borderColor: '#1c2333',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: '#ffffff',
    fontSize: 14,
  },
  quickSubmitBtn: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  quickSubmitBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },
});
