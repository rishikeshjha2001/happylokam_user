import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  TextInput,
  Modal,
  Linking,
  NativeSyntheticEvent,
  NativeScrollEvent,
  BackHandler,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Heart,
  Share2,
  Star,
  MapPin,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  Sparkles,
  Ticket,
  ShieldCheck,
  MessageSquare,
  Send,
  Navigation,
  Phone,
  Plus,
  Minus,
  Gift,
  Info,
  Check,
  User,
  QrCode,
  Wallet,
  LogIn,
  Utensils,
  CalendarDays,
} from 'lucide-react-native';
import RoomDatabase from '../services/roomDatabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAdminSectionItemById, AdminSectionItem, bookSectionItem } from '../services/adminSections';
import { createRazorpayOrder, verifyRazorpayPayment, getUserWallet } from '../services/api';
import PaymentModal from '../components/PaymentModal';
import CelebrationDatePickerModal from '../components/CelebrationDatePickerModal';
import RazorpayCheckout from 'react-native-razorpay';
import MLRecommendation from '../services/mlRecommendationEngine';
import { getGoogleMapsNavigationUrl } from '../utils/distance';

const { width } = Dimensions.get('window');
const RAZORPAY_KEY = process.env.EXPO_PUBLIC_RAZORPAY_KEY || 'rzp_live_SjBHhCXWmZhVK6';

export const CELEBRATION_OPTIONS = [
  { id: 'WEDDING', label: '💍 Wedding & Ring Ceremony', icon: '💍' },
  { id: 'BIRTHDAY', label: '🎂 Birthday & Milestone Party', icon: '🎂' },
  { id: 'OFFICE_EVENTS', label: '🏢 Corporate & Office Events', icon: '🏢' },
  { id: 'ANNIVERSARY', label: '🥂 Anniversary & Romance', icon: '🥂' },
  { id: 'COCKTAIL_PARTY', label: '🎶 Cocktail & Social Night', icon: '🎶' },
  { id: 'FESTIVE', label: '🌸 Festive & Religious Puja', icon: '🌸' },
  { id: 'REUNION', label: '🎓 Farewell & Alumni Reunion', icon: '🎓' },
  { id: 'BABY_SHOWER', label: '👶 Baby Shower & Naming', icon: '👶' },
];

function formatSelectedDateHuman(dateStr: string): string {
  if (!dateStr) return 'Date not chosen';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function ItemDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    id?: string;
    title?: string;
    subtitle?: string;
    price?: string;
    image?: string;
    type?: string;
    location?: string;
    cornerTag?: string;
    description?: string;
    capacity?: string;
    minGuests?: string;
    maxGuests?: string;
    baseHallPrice?: string;
    pricePerPlateVeg?: string;
    pricePerPlateNonVeg?: string;
    supportedCelebrations?: string;
    addOnServices?: string;
  }>();

  const [item, setItem] = useState<AdminSectionItem | any>(null);
  const [loading, setLoading] = useState(true);
  const [isFav, setIsFav] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [guestCount, setGuestCount] = useState(150);
  const [platesCount, setPlatesCount] = useState(100);
  const [vegPlatesCount, setVegPlatesCount] = useState(60);
  const [nonVegPlatesCount, setNonVegPlatesCount] = useState(40);
  const [bookingDays, setBookingDays] = useState(1);
  const [customPlatesEnabled, setCustomPlatesEnabled] = useState(false);
  const [selectedCelebration, setSelectedCelebration] = useState<string>('WEDDING');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);

  // Celebration Date Picker Modal State
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);

  // Guest Details & Wallet State on Celebration Details Page
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWallet, setUseWallet] = useState(false);
  const [paying, setPaying] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);

  // Rating & Review State
  const [ratings, setRatings] = useState<any[]>([]);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [userStars, setUserStars] = useState(5);
  const [userReviewText, setUserReviewText] = useState('');

  // Hardware Back Handler: smoothly navigates back through modal and screens
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (confirmedBooking) {
          setConfirmedBooking(null);
          return true;
        }
        if (calendarModalVisible) {
          setCalendarModalVisible(false);
          return true;
        }
        if (showPayment) {
          setShowPayment(false);
          return true;
        }
        if (ratingModalVisible) {
          setRatingModalVisible(false);
          return true;
        }
        if (router.canGoBack()) {
          router.back();
          return true;
        }
        router.replace('/(tabs)');
        return true;
      };

      const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => sub.remove();
    }, [confirmedBooking, calendarModalVisible, showPayment, ratingModalVisible])
  );

  const itemId = params.id || 'default_item';

  useEffect(() => {
    loadItemData();
    checkFavorite();
    loadRatings();

    // Check user authentication & session for celebration pass
    RoomDatabase.isAuthenticated().then((authed) => setIsLoggedIn(authed));
    RoomDatabase.getUserSession().then((session) => {
      if (session) {
        if (session.name) setGuestName(session.name);
        if (session.phone) setGuestPhone(session.phone);
      }
    });
    RoomDatabase.getWalletBalance().then((bal) => {
      setWalletBalance(bal);
      if (bal > 0) setUseWallet(true);
    });
  }, [itemId]);

  const loadItemData = async () => {
    setLoading(true);
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const defaultTomorrow = tomorrow.toISOString().split('T')[0];

      if (params.id && !params.id.startsWith('mock_')) {
        const fetched = await getAdminSectionItemById(params.id);
        if (fetched) {
          setItem(fetched);
          if (fetched.availableDates && fetched.availableDates.length > 0) {
            setSelectedDate(fetched.availableDates[0]);
          } else if (!selectedDate) {
            setSelectedDate(defaultTomorrow);
          }
          if (fetched.availableTimes && fetched.availableTimes.length > 0) {
            setSelectedTime(fetched.availableTimes[0]);
          }
          if (fetched.minGuests) {
            setGuestCount(Math.max(Number(fetched.minGuests), 10));
          } else if (fetched.capacity) {
            setGuestCount(Math.min(fetched.capacity, 200));
          }
          if (fetched.supportedCelebrations && fetched.supportedCelebrations.length > 0) {
            setSelectedCelebration(fetched.supportedCelebrations[0]);
          }
          setLoading(false);
          return;
        }
      }

      let parsedSupportedCelebrations: string[] = [];
      if (params.supportedCelebrations) {
        try {
          parsedSupportedCelebrations = JSON.parse(params.supportedCelebrations);
        } catch {}
      }

      let parsedAddOns: any[] = [];
      if (params.addOnServices) {
        try {
          parsedAddOns = JSON.parse(params.addOnServices);
        } catch {}
      }

      // Fallback from navigation query params
      const fallbackItem: any = {
        id: params.id || 'sec_item_1',
        title: params.title || 'Grand Celebration Experience',
        subtitle: params.subtitle || 'Exclusive celebration service package by happylokam',
        price: params.price ? (parseInt(params.price.replace(/\D/g, ''), 10) || 1499) : 1499,
        image: params.image || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
        cornerTag: params.cornerTag || 'SPECIAL',
        type: params.type || 'CELEBRATION',
        location: params.location || 'Verified Celebration Venue',
        description: params.description || params.subtitle || 'Exclusive celebration service package curated with highest quality and satisfaction guarantee.',
        features: [
          'Dedicated Event Concierge & On-Site Coordinator',
          'Premium Custom Themes & Floral Installations',
          'Professional Sound, Stage & Lighting Setup',
          'Full Hygiene Verified & Catering Oversight',
        ],
        availableDates: [defaultTomorrow],
        availableTimes: ['10:00 AM - 02:00 PM', '04:00 PM - 08:00 PM', '07:00 PM - 11:30 PM'],
        capacity: params.capacity ? parseInt(params.capacity, 10) : 350,
        minGuests: params.minGuests ? parseInt(params.minGuests, 10) : 50,
        maxGuests: params.maxGuests ? parseInt(params.maxGuests, 10) : 500,
        pricePerPlateVeg: params.pricePerPlateVeg ? parseFloat(params.pricePerPlateVeg) : undefined,
        pricePerPlateNonVeg: params.pricePerPlateNonVeg ? parseFloat(params.pricePerPlateNonVeg) : undefined,
        baseHallPrice: params.baseHallPrice ? parseFloat(params.baseHallPrice) : undefined,
        supportedCelebrations: parsedSupportedCelebrations.length > 0 ? parsedSupportedCelebrations : undefined,
        addOnServices: parsedAddOns.length > 0 ? parsedAddOns : undefined,
      };
      setItem(fallbackItem);
      setSelectedDate(defaultTomorrow);
      setSelectedTime(fallbackItem.availableTimes[0]);
      if (fallbackItem.minGuests) {
        setGuestCount(fallbackItem.minGuests);
      }
      if (parsedSupportedCelebrations.length > 0) {
        setSelectedCelebration(parsedSupportedCelebrations[0]);
      }
    } catch (e) {
      console.warn('ItemDetail load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const checkFavorite = async () => {
    if (itemId) {
      const fav = await RoomDatabase.isFavorite(itemId);
      setIsFav(fav);
    }
  };

  const handleToggleFav = async () => {
    if (!item) return;
    const toggled = await RoomDatabase.toggleFavorite({
      id: item.id,
      title: item.title,
      image: item.image || item.imageUrl,
      price: item.price,
      location: item.location,
      type: item.type,
      cornerTag: item.cornerTag,
    });
    setIsFav(toggled);
  };

  const loadRatings = async () => {
    const list = await RoomDatabase.getRatings();
    const filtered = list.filter((r) => r.itemId === itemId);
    setRatings(filtered);
  };

  const handleOpenReviewModal = async () => {
    const session = await RoomDatabase.getUserSession();
    if (!session?.token) {
      Alert.alert('Sign In Required 🔐', 'Please sign in to share your celebration review.', [
        { text: 'Sign In', onPress: () => router.push('/login') },
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }

    try {
      const bookings = await RoomDatabase.getBookings();
      const currentItemId = item?.id || itemId;
      const completedBooking = (bookings || []).find((b: any) => {
        const matches = (b.itemId && b.itemId === currentItemId) ||
                        (b.venueId && b.venueId === currentItemId) ||
                        (b.title && item?.title && b.title.trim().toLowerCase() === item.title.trim().toLowerCase());
        const isCompleted = b.status?.toUpperCase() === 'COMPLETED';
        const isPastDate = b.date ? new Date(b.date).getTime() <= Date.now() : true;
        return matches && isCompleted && isPastDate;
      });

      if (!completedBooking) {
        Alert.alert(
          'Verified Reviews Only 🌟',
          'To ensure authentic celebration quality, reviews can only be submitted after your booking is completed and your celebration event date has concluded.'
        );
        return;
      }

      setRatingModalVisible(true);
    } catch {
      Alert.alert(
        'Verified Reviews Only 🌟',
        'To ensure authentic celebration quality, reviews can only be submitted after your booking is completed and your celebration event date has concluded.'
      );
    }
  };

  const handleSubmitRating = async () => {
    if (!userReviewText.trim()) {
      Alert.alert('Required', 'Please write a brief review of your experience.');
      return;
    }

    const session = await RoomDatabase.getUserSession();
    const newRating = {
      itemId,
      rating: userStars,
      review: userReviewText.trim(),
      userName: session?.name || 'Happy Customer',
      createdAt: 'Just now',
    };

    await RoomDatabase.saveRating(newRating);
    setRatings([newRating, ...ratings]);
    setUserReviewText('');
    setRatingModalVisible(false);
    Alert.alert('Thank You! ⭐', 'Your feedback and rating have been posted successfully.');
  };

  if (loading || !item) {
    return (
      <View style={[styles.loadingCenter, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#e11d48" />
        <Text style={styles.loadingText}>Loading celebration details...</Text>
      </View>
    );
  }

  const isTicket = item.itemType === 'TICKET' || item.type?.toLowerCase().includes('ticket') || item.type?.toLowerCase().includes('pass');
  const basePriceNum = typeof item.price === 'number' 
    ? item.price 
    : (parseInt(String(item.price).replace(/\D/g, ''), 10) || 1499);

  const isPerPerson = (item.priceUnit && (item.priceUnit.toLowerCase().includes('plate') || item.priceUnit.toLowerCase().includes('person'))) ||
    (item.category && (item.category.toLowerCase().includes('cater') || item.category.toLowerCase().includes('buffet')));

  const hasDefaultPerPlate = Boolean((item.pricePerPlate && Number(item.pricePerPlate) > 0) || (item.pricePerPlateVeg && Number(item.pricePerPlateVeg) > 0)) || isPerPerson;
  const hasPerPlate = hasDefaultPerPlate || customPlatesEnabled;
  const hasPerGuest = Boolean(item.pricePerGuest && Number(item.pricePerGuest) > 0);
  const hasBaseHall = Boolean(item.baseHallPrice && Number(item.baseHallPrice) > 0);

  const vegPlateRate = item.pricePerPlateVeg ? Number(item.pricePerPlateVeg) : (item.pricePerPlate ? Number(item.pricePerPlate) : (isPerPerson ? basePriceNum : 450));
  const nonVegPlateRate = item.pricePerPlateNonVeg ? Number(item.pricePerPlateNonVeg) : (item.pricePerPlate ? Number(item.pricePerPlate) + 150 : (isPerPerson ? basePriceNum + 150 : 650));
  const plateRate = vegPlateRate;
  const guestRate = item.pricePerGuest ? Number(item.pricePerGuest) : 0;
  const hallRate = item.baseHallPrice ? Number(item.baseHallPrice) : (!hasDefaultPerPlate && !hasPerGuest && !isPerPerson ? basePriceNum : 0);

  const minGuestsAllowed = item.minGuests ? Number(item.minGuests) : 50;
  const maxGuestsAllowed = item.maxGuests ? Number(item.maxGuests) : (item.capacity ? Number(item.capacity) : 1000);

  // Supported Celebrations & Add-on Services
  const supportedCelebrationsList: string[] =
    item.supportedCelebrations && Array.isArray(item.supportedCelebrations) && item.supportedCelebrations.length > 0
      ? item.supportedCelebrations
      : ['WEDDING', 'BIRTHDAY', 'OFFICE_EVENTS', 'ANNIVERSARY', 'COCKTAIL_PARTY', 'FESTIVE'];

  const availableAddonsList: { id: string; name: string; price: number; description?: string }[] =
    item.addOnServices && Array.isArray(item.addOnServices) && item.addOnServices.length > 0
      ? item.addOnServices
      : [
          { id: 'add_dj', name: 'DJ & Sound System Setup', price: 12000, description: 'Dual JBL subs + wireless mics' },
          { id: 'add_decor', name: 'Grand Floral Stage & Entrance Decor', price: 25000, description: 'Fresh floral entrance + ambient lights' },
          { id: 'add_drone', name: '4K Drone & Candid Photography', price: 18000, description: 'Full day coverage with reel cuts' },
          { id: 'add_av', name: '4K Projector & AV Screen Setup', price: 5000, description: 'High lumen projector for videos & slides' },
        ];

  const addOnsSubtotal = availableAddonsList
    .filter((a) => selectedAddons.includes(a.id))
    .reduce((sum, a) => sum + Number(a.price), 0);

  // Subtotal calculation
  const totalPlatesCount = vegPlatesCount + nonVegPlatesCount;
  const hallSubtotal = hallRate * bookingDays;
  const vegPlatesSubtotal = hasPerPlate ? vegPlateRate * vegPlatesCount : 0;
  const nonVegPlatesSubtotal = hasPerPlate ? nonVegPlateRate * nonVegPlatesCount : 0;
  const platesSubtotal = vegPlatesSubtotal + nonVegPlatesSubtotal;
  const guestSubtotal = hasPerGuest ? guestRate * guestCount : 0;

  const calculatedBase = isTicket
    ? basePriceNum
    : (hasPerPlate || hasPerGuest || hasBaseHall
        ? hallSubtotal + platesSubtotal + guestSubtotal + addOnsSubtotal
        : (isPerPerson
            ? basePriceNum * guestCount * bookingDays + addOnsSubtotal
            : basePriceNum * bookingDays + addOnsSubtotal));

  // Razorpay 2% Commission + 18% GST on that 2% Commission
  const razorpayCommission = Math.round(calculatedBase * 0.02 * 100) / 100;
  const razorpayGst = Math.round(razorpayCommission * 0.18 * 100) / 100;
  const razorpayTotalFee = Math.round((razorpayCommission + razorpayGst) * 100) / 100;

  // Gross total with gateway fee
  const totalWithGatewayFee = Math.round((calculatedBase + razorpayTotalFee) * 100) / 100;

  // Wallet perk deduction
  const maxWalletApplicable = Math.min(walletBalance, totalWithGatewayFee);
  const walletDiscount = useWallet ? maxWalletApplicable : 0;

  // Final Net Payable
  const finalPayable = Math.max(0, Math.round((totalWithGatewayFee - walletDiscount) * 100) / 100);

  const mainPhoto = item.image || item.imageUrl || '';
  const galleryImages = (Array.isArray(item.images) && item.images.length > 0)
    ? item.images
    : (mainPhoto ? [mainPhoto] : []);

  const handleScrollImage = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slide = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveImageIndex(slide);
  };

  const navigationUrl = getGoogleMapsNavigationUrl({
    latitude: item.latitude ? parseFloat(String(item.latitude)) : undefined,
    longitude: item.longitude ? parseFloat(String(item.longitude)) : undefined,
    address: item.location || item.city,
    title: item.title,
    mapUrl: item.mapUrl || item.googleMapsUrl || item.directionUrl,
  });

  const handleOpenGoogleMaps = async () => {
    try {
      const supported = await Linking.canOpenURL(navigationUrl);
      if (supported) {
        await Linking.openURL(navigationUrl);
      } else {
        await Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((item.title || '') + ' ' + (item.location || ''))}`);
      }
    } catch {
      Linking.openURL(navigationUrl).catch(() => {});
    }
  };

  const handleWhatsAppInquiry = () => {
    const text = encodeURIComponent(
      `Hello happylokam! I am interested in booking: "${item.title}" (${item.location || 'Pan-India'}). Please share package details and availability.`
    );
    Linking.openURL(`https://wa.me/918969255561?text=${text}`);
  };

  const handlePhoneCall = () => {
    Linking.openURL('tel:+918969255561');
  };

  const handleInitiateBooking = async () => {
    // 1. Auth Guard Check
    const authed = await RoomDatabase.isAuthenticated();
    if (!authed) {
      Alert.alert(
        'Login Required 🔐',
        'Please log in or create an account to book your celebration pass and receive your digital ticket.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Log In Now',
            onPress: () => router.push('/login'),
          },
        ]
      );
      return;
    }

    // 2. Date Check
    if (!selectedDate) {
      setCalendarModalVisible(true);
      Alert.alert('Celebration Date Required 📅', 'Please pick your celebration date to continue.');
      return;
    }

    if (item.blackoutDates && Array.isArray(item.blackoutDates) && item.blackoutDates.includes(selectedDate)) {
      Alert.alert(
        'Date Unavailable ❌',
        `The selected date (${selectedDate}) has been marked as blocked or unavailable for this venue. Please pick another celebration date.`
      );
      return;
    }

    // 3. Guest Capacity Check (for non-tickets)
    if (!isTicket) {
      if (guestCount < minGuestsAllowed) {
        Alert.alert('Minimum Guests', `This venue requires a minimum of ${minGuestsAllowed} guests.`);
        return;
      }
      if (guestCount > maxGuestsAllowed) {
        Alert.alert('Capacity Exceeded', `This venue can accommodate up to ${maxGuestsAllowed} guests maximum.`);
        return;
      }
    }

    // 4. Name & Phone validation
    if (!guestName.trim()) {
      Alert.alert('Name Required', 'Please enter your full name for the celebration pass.');
      return;
    }
    const cleanPhone = guestPhone.trim().replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      Alert.alert('Phone Required', 'Please enter a valid 10-digit mobile number for ticket SMS & entry.');
      return;
    }

    setPaying(true);
    try {
      const numGuests = guestCount || 1;
      const numPlates = hasPerPlate ? totalPlatesCount : 0;
      const numDays = bookingDays || 1;
      const selectedAddonObjects = availableAddonsList.filter((a) => selectedAddons.includes(a.id));
      const addonsNote = selectedAddonObjects.length > 0 ? ` • Add-ons: ${selectedAddonObjects.map((a) => a.name).join(', ')}` : '';
      const dynamicNotes = isTicket
        ? 'Mobile Ticket Pass'
        : `Celebration: ${selectedCelebration} (${numDays} Day${numDays > 1 ? 's' : ''}${hasPerPlate ? ` • ${vegPlatesCount} Veg + ${nonVegPlatesCount} Non-Veg Plates` : ` • ${numGuests} Guests`}${addonsNote})`;

      // Call backend bookSectionItem
      const bookingResult = await bookSectionItem(item.id, {
        bookingDate: selectedDate,
        quantity: 1,
        guestCount: numGuests,
        platesCount: numPlates,
        vegPlatesCount: hasPerPlate ? vegPlatesCount : 0,
        nonVegPlatesCount: hasPerPlate ? nonVegPlatesCount : 0,
        pricePerPlateVeg: vegPlateRate,
        pricePerPlateNonVeg: nonVegPlateRate,
        bookingDays: numDays,
        customSubtotal: finalPayable,
        pricePerPlate: vegPlateRate,
        userName: guestName.trim(),
        userPhone: guestPhone.trim(),
        notes: dynamicNotes,
        walletDiscount,
        celebrationType: selectedCelebration,
        selectedAddOns: selectedAddonObjects,
      });

      const confirmedServerId = bookingResult?.data?.id || (bookingResult as any)?.id;
      if (!confirmedServerId) {
        throw new Error(bookingResult?.error || 'The booking could not be created on the server.');
      }

      // Razorpay Native Checkout
      let paymentId = '';
      let orderId = '';
      let signature = '';

      if (finalPayable > 0) {
        const razorpayOrder = await createRazorpayOrder(
          finalPayable,
          `hl_sec_${Date.now()}`,
          { sectionBookingId: confirmedServerId, purpose: 'SECTION' }
        );
        orderId = razorpayOrder.id;

        const userSession = await RoomDatabase.getUserSession();
        const customerContact = cleanPhone || userSession?.phone || '9570729077';
        const customerEmail = userSession?.email || 'customer@happylokam.com';
        const customerName = guestName.trim() || userSession?.name || 'HappyLokam Guest';

        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          await new Promise((resolve) => {
            if ((window as any).Razorpay) return resolve(true);
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
          });

          if ((window as any).Razorpay) {
            await new Promise((resolve) => {
              const rzp = new (window as any).Razorpay({
                description: item.title || 'Celebration Booking',
                image: 'https://happylokam.com/favicon.png',
                currency: 'INR',
                key: RAZORPAY_KEY,
                amount: Math.round(finalPayable * 100),
                name: 'happylokam Celebrations',
                order_id: orderId.startsWith('order_') && orderId.length > 15 ? orderId : undefined,
                prefill: {
                  email: customerEmail,
                  contact: customerContact,
                  name: customerName,
                  method: 'upi',
                },
                theme: { color: '#e11d48' },
                handler: (resp: any) => {
                  if (resp?.razorpay_payment_id) {
                    paymentId = resp.razorpay_payment_id;
                    orderId = resp.razorpay_order_id || orderId;
                    signature = resp.razorpay_signature || signature;
                  }
                  resolve(true);
                },
                modal: {
                  ondismiss: () => resolve(false),
                },
              });
              rzp.open();
            });
          }
        } else if (RazorpayCheckout && typeof RazorpayCheckout.open === 'function') {
          const rzpOptions: any = {
            description: item.title || 'Celebration Booking',
            image: 'https://happylokam.com/favicon.png',
            currency: 'INR',
            key: RAZORPAY_KEY,
            amount: Math.round(finalPayable * 100),
            name: 'happylokam Celebrations',
            order_id: orderId,
            prefill: {
              email: customerEmail,
              contact: customerContact,
              name: customerName,
              method: 'upi',
            },
            theme: { color: '#e11d48' },
            retry: { enabled: true, max_count: 3 },
          };
          const rzpRes: any = await RazorpayCheckout.open(rzpOptions);
          if (rzpRes?.razorpay_payment_id) {
            paymentId = rzpRes.razorpay_payment_id;
            orderId = rzpRes.razorpay_order_id || orderId;
            signature = rzpRes.razorpay_signature || signature;
          }
        }

        if (!paymentId || !orderId || !signature) {
          throw new Error('Payment was not completed.');
        }

        await verifyRazorpayPayment({
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signature,
          sectionBookingId: confirmedServerId,
          amount: finalPayable,
        });
      }

      const confirmedTicketCode = bookingResult?.data?.ticketCode || (bookingResult as any)?.ticketCode;
      const ticketId = confirmedTicketCode || confirmedServerId;
      const checkInOtp = bookingResult?.data?.checkInOtp || (bookingResult as any)?.checkInOtp;

      const localBooking = {
        id: confirmedServerId || ('hlc_' + Date.now()),
        title: item.title || 'Celebration Booking',
        category: isTicket ? 'Ticket Pass' : (item.type || item.itemType || 'Reservation'),
        date: selectedDate,
        amount: finalPayable,
        status: 'CONFIRMED' as const,
        tierName: isTicket ? 'Ticket Pass' : 'Confirmed Booking',
        ticketsCount: 1,
        qrCode: ticketId,
        ticketCode: ticketId,
        checkInOtp: checkInOtp,
        guestCount: numGuests,
        platesCount: numPlates,
        serverVerified: true,
        createdAt: new Date().toISOString(),
      };
      await RoomDatabase.saveBooking(localBooking);

      // Realtime Partner Database Sync
      try {
        const PARTNER_BOOKINGS_STORAGE = '@happylokam_partner_bookings_v2';
        const rawPB = await AsyncStorage.getItem(PARTNER_BOOKINGS_STORAGE);
        const currentPB = rawPB ? JSON.parse(rawPB) : [];
        const newPartnerBooking = {
          id: confirmedServerId || ('hlc_' + Date.now()),
          userId: 'usr_celebration_guest',
          customerName: guestName.trim() || 'Celebration Customer',
          customerPhone: guestPhone.trim() || '+91 8969255561',
          customerEmail: 'customer@happylokam.com',
          venueId: item.id,
          venue: { name: item.title },
          serviceName: item.title,
          celebrationType: selectedCelebration,
          date: selectedDate,
          bookingDate: selectedDate,
          bookingDays: numDays,
          guestCount: numGuests,
          platesCount: numPlates,
          vegPlatesCount: hasPerPlate ? vegPlatesCount : 0,
          nonVegPlatesCount: hasPerPlate ? nonVegPlatesCount : 0,
          pricePerPlateVeg: vegPlateRate,
          pricePerPlateNonVeg: nonVegPlateRate,
          baseHallPrice: hallRate,
          selectedAddOns: selectedAddonObjects,
          status: 'CONFIRMED',
          baseAmount: calculatedBase,
          platformFee: razorpayCommission,
          taxAmount: razorpayGst,
          totalAmount: finalPayable,
          paymentStatus: 'PAID',
          ticketId: ticketId,
          ticketCode: ticketId,
          checkInOtp: checkInOtp || '8842',
          createdAt: new Date().toISOString(),
        };
        const updatedPB = [newPartnerBooking, ...currentPB.filter((b: any) => b.id !== newPartnerBooking.id)];
        await AsyncStorage.setItem(PARTNER_BOOKINGS_STORAGE, JSON.stringify(updatedPB));
      } catch (syncErr) {
        console.warn('Partner booking sync note:', syncErr);
      }

      if (useWallet && walletDiscount > 0) {
        await RoomDatabase.deductWalletBalance(walletDiscount);
        setWalletBalance((prev) => Math.max(0, prev - walletDiscount));
      }

      try {
        const freshWallet = await getUserWallet();
        if (typeof freshWallet?.walletBalance === 'number') {
          await RoomDatabase.setWalletBalance(freshWallet.walletBalance);
          setWalletBalance(freshWallet.walletBalance);
        }
      } catch {}

      await RoomDatabase.addNotification({
        id: 'notif_bkg_' + Date.now(),
        title: `Booking Confirmed: ${localBooking.title} 🎉`,
        message: `Your celebration ${isTicket ? 'digital ticket' : 'reservation'} is confirmed for ${selectedDate}. Pass Code: ${ticketId}${checkInOtp ? ` • Check-In OTP: ${checkInOtp}` : ''}. Total paid: ₹${finalPayable.toLocaleString('en-IN')}.`,
        sentAt: new Date().toISOString(),
        isRead: false,
      });

      setConfirmedBooking({ ...localBooking, ticketCode: ticketId, checkInOtp });
    } catch (e: any) {
      if (e?.code === 0 || e?.description?.toLowerCase().includes('cancel')) {
        setPaying(false);
        return;
      }
      Alert.alert('Booking Notice', e?.message || 'Your booking could not be completed. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 110 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        {/* Multi-Photo Carousel Gallery */}
        <View style={styles.heroContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScrollImage}
          >
            {galleryImages.map((imgUri: string, idx: number) => (
              <View key={idx} style={{ width, height: 320 }}>
                <Image
                  source={{ uri: imgUri }}
                  style={styles.heroImage}
                  resizeMode="cover"
                />
                <View style={styles.heroOverlay} />
              </View>
            ))}
          </ScrollView>

          {/* Top Bar Navigation */}
          <View style={[styles.topBar, { top: insets.top + 8 }]}>
            <TouchableOpacity
              style={styles.iconCircle}
              onPress={() => router.back()}
              activeOpacity={0.8}
            >
              <ArrowLeft size={20} color="#0f172a" />
            </TouchableOpacity>

            <View style={styles.topActionsRow}>
              <TouchableOpacity
                style={styles.iconCircle}
                onPress={handleToggleFav}
                activeOpacity={0.8}
              >
                <Heart
                  size={20}
                  color={isFav ? '#e11d48' : '#0f172a'}
                  fill={isFav ? '#e11d48' : 'none'}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Red Corner Badge */}
          {item.cornerTag && (
            <View style={styles.cornerTagBadge}>
              <Sparkles size={11} color="#ffffff" />
              <Text style={styles.cornerTagText}>{item.cornerTag.toUpperCase()}</Text>
            </View>
          )}

          {/* Type Pill & Photo Index Indicator */}
          <View style={styles.heroBottomRow}>
            <View style={styles.typePill}>
              {isTicket ? <Ticket size={12} color="#ffffff" /> : <Calendar size={12} color="#ffffff" />}
              <Text style={styles.typePillText}>{item.type || 'EXPERIENCE'}</Text>
            </View>

            {galleryImages.length > 1 && (
              <View style={styles.photoCountPill}>
                <Text style={styles.photoCountText}>
                  📸 {activeImageIndex + 1} / {galleryImages.length}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Content Body */}
        <View style={styles.body}>
          {/* Title & Price Header */}
          <View style={styles.titleRow}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.title}>{item.title}</Text>
              {item.subtitle ? <Text style={styles.subtitle}>{item.subtitle}</Text> : null}
            </View>
            <View style={styles.priceBox}>
              <Text style={styles.priceLabel}>Starting from</Text>
              <Text style={styles.priceAmount}>₹{basePriceNum.toLocaleString('en-IN')}</Text>
              <Text style={styles.priceUnit}>/ {item.priceUnit || (isTicket ? 'ticket' : 'package')}</Text>
            </View>
          </View>

          {/* Meta Info Bar */}
          <View style={styles.metaBar}>
            <View style={styles.metaItem}>
              <Star size={16} color="#eab308" fill="#eab308" />
              <Text style={styles.metaText}>
                {item.reviews && item.reviews > 0
                  ? `${item.rating || 4.9} (${item.reviews} reviews)`
                  : `${item.rating || 4.9} • Verified Listing`}
              </Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <MapPin size={16} color="#64748b" />
              <Text style={styles.metaText}>{item.location || 'Patna, Bihar'}</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Users size={16} color="#2563eb" />
              <Text style={[styles.metaText, { color: '#1d4ed8', fontWeight: '700' }]}>
                👥 {minGuestsAllowed} – {maxGuestsAllowed} Guests
              </Text>
            </View>
          </View>

          {/* Interactive Google Maps Location & Direction Box */}
          <View style={styles.locationCard}>
            <View style={styles.locationHeaderRow}>
              <View style={styles.locationIconBox}>
                <MapPin size={20} color="#e11d48" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.locationCardTitle}>{item.location || 'Patna, Bihar'}</Text>
                <Text style={styles.locationCardSub}>Prime central celebration hub • Verified GPS coordinates</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.mapsBtn}
              onPress={handleOpenGoogleMaps}
              activeOpacity={0.85}
            >
              <Navigation size={15} color="#ffffff" />
              <Text style={styles.mapsBtnText}>📍 Navigate on Google Maps</Text>
            </TouchableOpacity>
          </View>

          {/* Celebration Specialist Concierge Box */}
          <View style={styles.conciergeCard}>
            <View style={styles.conciergeTopRow}>
              <View style={styles.conciergeAvatar}>
                <Sparkles size={20} color="#e11d48" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.conciergeTitle}>happylokam Celebration Concierge</Text>
                <Text style={styles.conciergeSub}>
                  Need custom floral arrangements, catering changes, or private venue tour? Connect with our senior event planner.
                </Text>
              </View>
            </View>
            <View style={styles.conciergeBtnsRow}>
              <TouchableOpacity
                style={styles.whatsappBtn}
                onPress={handleWhatsAppInquiry}
                activeOpacity={0.85}
              >
                <MessageSquare size={16} color="#ffffff" />
                <Text style={styles.whatsappBtnText}>Chat on WhatsApp</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.callBtn}
                onPress={handlePhoneCall}
                activeOpacity={0.85}
              >
                <Phone size={16} color="#0f172a" />
                <Text style={styles.callBtnText}>Call Concierge</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ============================================================== */}
          {/* 1. TICKET PASSES FLOW: ADMIN SETS AVAILABLE DAYS/DATES        */}
          {/* ============================================================== */}
          {isTicket && (
            <View style={styles.sectionBlock}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <View>
                  <Text style={styles.sectionTitle}>Celebration Pass Dates</Text>
                  <Text style={styles.sectionSubtitle}>
                    Validity configured by admin ({item.availableDates?.length || 1} available date{item.availableDates?.length === 1 ? '' : 's'})
                  </Text>
                </View>
                <View style={styles.adminVerifiedPill}>
                  <ShieldCheck size={12} color="#10b981" />
                  <Text style={styles.adminVerifiedPillText}>Admin Verified</Text>
                </View>
              </View>

              {item.availableDates && item.availableDates.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                  {item.availableDates.map((date: string) => {
                    const isSelected = selectedDate === date;
                    return (
                      <TouchableOpacity
                        key={date}
                        style={[styles.dateChip, isSelected && styles.dateChipSelected]}
                        onPress={() => setSelectedDate(date)}
                        activeOpacity={0.8}
                      >
                        <Calendar size={13} color={isSelected ? '#ffffff' : '#64748b'} />
                        <Text style={[styles.dateChipText, isSelected && styles.dateChipTextSelected]}>
                          {date}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              ) : (
                <View style={styles.adminDateNotice}>
                  <Calendar size={15} color="#3b82f6" />
                  <Text style={styles.adminDateNoticeText}>
                    Date: {selectedDate || 'Valid for Scheduled Event Dates'}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* ============================================================== */}
          {/* 2. ALL OTHER SERVICES: DATES PICKER, HOW MANY DAYS & GUEST FEED */}
          {/*    (NO TIME OKAY: TIME SLOTS COMPLETELY REMOVED)             */}
          {/* ============================================================== */}
          {!isTicket && (
            <>
              {/* Event / Celebration Type Selector ("What are you celebrating?") */}
              <View style={styles.sectionBlock}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={styles.sectionTitle}>What are you celebrating? *</Text>
                  <View style={styles.themePill}>
                    <Sparkles size={11} color="#e11d48" />
                    <Text style={styles.themePillText}>Select Theme</Text>
                  </View>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                  {supportedCelebrationsList.map((celebId) => {
                    const celebObj = CELEBRATION_OPTIONS.find((c) => c.id === celebId) || {
                      id: celebId,
                      label: celebId.replace(/_/g, ' '),
                      icon: '🎉',
                    };
                    const isSelected = selectedCelebration === celebId;
                    return (
                      <TouchableOpacity
                        key={celebId}
                        style={[styles.celebChip, isSelected && styles.celebChipSelected]}
                        onPress={() => setSelectedCelebration(celebId)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.celebChipText, isSelected && styles.celebChipTextSelected]}>
                          {celebObj.label}
                        </Text>
                        {isSelected && <Check size={12} color="#ffffff" strokeWidth={3} style={{ marginLeft: 6 }} />}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Interactive Celebration Date Picker */}
              <View style={styles.sectionBlock}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={styles.sectionTitle}>Celebration Event Date</Text>
                  <TouchableOpacity
                    onPress={() => setCalendarModalVisible(true)}
                    style={styles.openCalendarPill}
                    activeOpacity={0.8}
                  >
                    <Calendar size={13} color="#e11d48" />
                    <Text style={styles.openCalendarPillText}>Open Calendar</Text>
                  </TouchableOpacity>
                </View>

                {/* Primary Chosen Date Display Card */}
                <TouchableOpacity
                  style={styles.chosenDateCard}
                  onPress={() => setCalendarModalVisible(true)}
                  activeOpacity={0.85}
                >
                  <View style={styles.chosenDateLeft}>
                    <View style={styles.chosenDateIcon}>
                      <CalendarDays size={22} color="#e11d48" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.chosenDateLabel}>CONFIRMED CELEBRATION DATE</Text>
                      <Text style={styles.chosenDateVal}>{formatSelectedDateHuman(selectedDate)}</Text>
                      <Text style={styles.chosenDateSub}>Tap to change or pick any future month</Text>
                    </View>
                  </View>
                  <View style={styles.changeDateBtn}>
                    <Text style={styles.changeDateBtnText}>Change 📅</Text>
                  </View>
                </TouchableOpacity>

                {/* Quick Upcoming Day Chips (Next 14 Days) */}
                <Text style={styles.quickDateHeader}>OR QUICK PICK UPCOMING DATES:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                  {Array.from({ length: 14 }).map((_, idx) => {
                    const d = new Date();
                    d.setDate(d.getDate() + idx + 1);
                    const isoDate = d.toISOString().split('T')[0];
                    const isBlackedOut = Array.isArray(item?.blackoutDates) && item.blackoutDates.includes(isoDate);
                    if (isBlackedOut) return null;
                    const label = d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
                    const isSelected = selectedDate === isoDate;
                    return (
                      <TouchableOpacity
                        key={isoDate}
                        style={[styles.dateChip, isSelected && styles.dateChipSelected]}
                        onPress={() => setSelectedDate(isoDate)}
                        activeOpacity={0.8}
                      >
                        <Calendar size={13} color={isSelected ? '#ffffff' : '#64748b'} />
                        <Text style={[styles.dateChipText, isSelected && styles.dateChipTextSelected]}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* How Many Days Stepper & Quick Selector */}
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionTitle}>Booking Duration (How Many Days?)</Text>
                <View style={styles.guestPickerCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.guestPickerLabel}>Number of Days</Text>
                    <Text style={styles.guestPickerSub}>
                      {bookingDays === 1 ? '1 Day Celebration' : `${bookingDays} Days Multi-Day Booking`}
                    </Text>
                  </View>
                  <View style={styles.guestCounterRow}>
                    <TouchableOpacity
                      style={styles.counterBtn}
                      onPress={() => setBookingDays(Math.max(1, bookingDays - 1))}
                    >
                      <Minus size={16} color="#0f172a" />
                    </TouchableOpacity>
                    <Text style={styles.guestCountVal}>{bookingDays} {bookingDays === 1 ? 'Day' : 'Days'}</Text>
                    <TouchableOpacity
                      style={styles.counterBtn}
                      onPress={() => setBookingDays(bookingDays + 1)}
                    >
                      <Plus size={16} color="#0f172a" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Quick Days Selector Pills */}
                <View style={styles.quickChipsRow}>
                  {[1, 2, 3, 5, 7].map((num) => (
                    <TouchableOpacity
                      key={num}
                      style={[styles.quickChip, bookingDays === num && styles.quickChipActive]}
                      onPress={() => setBookingDays(num)}
                    >
                      <Text style={[styles.quickChipText, bookingDays === num && styles.quickChipTextActive]}>
                        {num} {num === 1 ? 'Day' : 'Days'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Guest Attendance Section */}
              <View style={styles.sectionBlock}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={styles.sectionTitle}>Guest Attendance</Text>
                  <Text style={styles.capacityBadge}>
                    Capacity: {minGuestsAllowed} - {maxGuestsAllowed} Guests
                  </Text>
                </View>

                <View style={styles.guestPickerCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.guestPickerLabel}>Expected Guests</Text>
                    <Text style={styles.guestPickerSub}>Allowed: {minGuestsAllowed} to {maxGuestsAllowed}</Text>
                  </View>
                  <View style={styles.guestCounterRow}>
                    <TouchableOpacity
                      style={styles.counterBtn}
                      onPress={() => setGuestCount(Math.max(minGuestsAllowed, guestCount - 25))}
                    >
                      <Minus size={16} color="#0f172a" />
                    </TouchableOpacity>
                    <TextInput
                      style={styles.guestInput}
                      keyboardType="numeric"
                      value={String(guestCount)}
                      onChangeText={(val) => {
                        const parsed = parseInt(val.replace(/\D/g, ''), 10);
                        if (!isNaN(parsed)) setGuestCount(Math.min(maxGuestsAllowed, Math.max(1, parsed)));
                      }}
                    />
                    <TouchableOpacity
                      style={styles.counterBtn}
                      onPress={() => setGuestCount(Math.min(maxGuestsAllowed, guestCount + 25))}
                    >
                      <Plus size={16} color="#0f172a" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.quickChipsRow}>
                  {(() => {
                    const preset = [50, 100, 250, 500, 800].filter((count) => count >= minGuestsAllowed && count <= maxGuestsAllowed);
                    const list = preset.length > 0 ? preset : Array.from(new Set([minGuestsAllowed, Math.round((minGuestsAllowed + maxGuestsAllowed) / 2), maxGuestsAllowed]));
                    return list.map((count) => (
                      <TouchableOpacity
                        key={count}
                        style={[styles.quickChip, guestCount === count && styles.quickChipActive]}
                        onPress={() => setGuestCount(count)}
                      >
                        <Text style={[styles.quickChipText, guestCount === count && styles.quickChipTextActive]}>
                          {count} Guests
                        </Text>
                      </TouchableOpacity>
                    ));
                  })()}
                </View>
              </View>

              {/* Custom Plates & Catering Section */}
              <View style={styles.sectionBlock}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Utensils size={18} color="#e11d48" />
                    <Text style={styles.sectionTitle}>Plates & Food Catering</Text>
                  </View>
                  <Text style={styles.capacityBadge}>
                    Veg ₹{vegPlateRate} • Non-Veg ₹{nonVegPlateRate}
                  </Text>
                </View>

                {/* Option to toggle custom plates if not default per plate */}
                {!hasDefaultPerPlate && (
                  <TouchableOpacity
                    style={[
                      styles.togglePlatesCard,
                      customPlatesEnabled && styles.togglePlatesCardActive,
                    ]}
                    onPress={() => {
                      setCustomPlatesEnabled(!customPlatesEnabled);
                      if (!customPlatesEnabled && totalPlatesCount <= 0) {
                        const half = Math.round(guestCount / 2);
                        setVegPlatesCount(half);
                        setNonVegPlatesCount(guestCount - half);
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                      <View style={[styles.toggleCheckbox, customPlatesEnabled && styles.toggleCheckboxActive]}>
                        {customPlatesEnabled && <Check size={14} color="#ffffff" strokeWidth={3} />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.togglePlatesTitle}>
                          {customPlatesEnabled ? 'Catering Plates Included' : '+ Add Food Catering Plates'}
                        </Text>
                        <Text style={styles.togglePlatesSub}>
                          Pure Veg ₹{vegPlateRate}/plate • Non-Veg ₹{nonVegPlateRate}/plate • Verified Hygiene
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}

                {/* Custom Plates Counter & Steppers */}
                {hasPerPlate && (
                  <>
                    {/* Pure Veg Plates Stepper */}
                    <View style={[styles.guestPickerCard, { borderLeftWidth: 4, borderLeftColor: '#10b981' }]}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={[styles.guestPickerLabel, { color: '#047857' }]}>🟢 Pure Veg Plates</Text>
                        </View>
                        <Text style={styles.guestPickerSub}>
                          Rate: ₹{vegPlateRate} × {vegPlatesCount} = ₹{(vegPlateRate * vegPlatesCount).toLocaleString('en-IN')}
                        </Text>
                      </View>
                      <View style={styles.guestCounterRow}>
                        <TouchableOpacity
                          style={styles.counterBtn}
                          onPress={() => setVegPlatesCount(Math.max(0, vegPlatesCount - 25))}
                        >
                          <Minus size={16} color="#0f172a" />
                        </TouchableOpacity>
                        <TextInput
                          style={styles.guestInput}
                          keyboardType="numeric"
                          value={String(vegPlatesCount)}
                          onChangeText={(val) => {
                            const parsed = parseInt(val.replace(/\D/g, ''), 10);
                            setVegPlatesCount(isNaN(parsed) ? 0 : parsed);
                          }}
                        />
                        <TouchableOpacity
                          style={styles.counterBtn}
                          onPress={() => setVegPlatesCount(vegPlatesCount + 25)}
                        >
                          <Plus size={16} color="#0f172a" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Non-Veg Plates Stepper */}
                    <View style={[styles.guestPickerCard, { borderLeftWidth: 4, borderLeftColor: '#ef4444', marginTop: 10 }]}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={[styles.guestPickerLabel, { color: '#b91c1c' }]}>🔴 Non-Veg Plates</Text>
                        </View>
                        <Text style={styles.guestPickerSub}>
                          Rate: ₹{nonVegPlateRate} × {nonVegPlatesCount} = ₹{(nonVegPlateRate * nonVegPlatesCount).toLocaleString('en-IN')}
                        </Text>
                      </View>
                      <View style={styles.guestCounterRow}>
                        <TouchableOpacity
                          style={styles.counterBtn}
                          onPress={() => setNonVegPlatesCount(Math.max(0, nonVegPlatesCount - 25))}
                        >
                          <Minus size={16} color="#0f172a" />
                        </TouchableOpacity>
                        <TextInput
                          style={styles.guestInput}
                          keyboardType="numeric"
                          value={String(nonVegPlatesCount)}
                          onChangeText={(val) => {
                            const parsed = parseInt(val.replace(/\D/g, ''), 10);
                            setNonVegPlatesCount(isNaN(parsed) ? 0 : parsed);
                          }}
                        />
                        <TouchableOpacity
                          style={styles.counterBtn}
                          onPress={() => setNonVegPlatesCount(nonVegPlatesCount + 25)}
                        >
                          <Plus size={16} color="#0f172a" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Combined Plates Summary Banner */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: 10, borderRadius: 8, marginTop: 8, borderWidth: 1, borderColor: '#e2e8f0' }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155' }}>
                        Total Plates: <Text style={{ color: '#0f172a', fontWeight: '900' }}>{totalPlatesCount}</Text> ({vegPlatesCount} Veg + {nonVegPlatesCount} Non-Veg)
                      </Text>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: '#e11d48' }}>
                        ₹{platesSubtotal.toLocaleString('en-IN')}
                      </Text>
                    </View>

                    {/* Quick Preset Plates Chips */}
                    <View style={styles.quickChipsRow}>
                      <TouchableOpacity
                        style={[styles.quickChip, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}
                        onPress={() => {
                          setVegPlatesCount(guestCount);
                          setNonVegPlatesCount(0);
                        }}
                      >
                        <Text style={[styles.quickChipText, { color: '#16a34a', fontWeight: '700' }]}>
                          100% Veg ({guestCount})
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.quickChip, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}
                        onPress={() => {
                          const half = Math.round(guestCount / 2);
                          setVegPlatesCount(half);
                          setNonVegPlatesCount(guestCount - half);
                        }}
                      >
                        <Text style={[styles.quickChipText, { color: '#dc2626', fontWeight: '700' }]}>
                          50/50 Split
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.quickChip, { backgroundColor: '#fff1f2', borderColor: '#fecdd3' }]}
                        onPress={() => {
                          const vegPortion = Math.round(guestCount * 0.7);
                          setVegPlatesCount(vegPortion);
                          setNonVegPlatesCount(guestCount - vegPortion);
                        }}
                      >
                        <Text style={[styles.quickChipText, { color: '#e11d48', fontWeight: '800' }]}>
                          70% Veg / 30% Non-Veg
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>

              {/* Optional Custom Add-on Services (DJ, Stage, Drone, AV) */}
              <View style={styles.sectionBlock}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Sparkles size={18} color="#e11d48" />
                    <Text style={styles.sectionTitle}>Optional Add-on Services</Text>
                  </View>
                  {selectedAddons.length > 0 && (
                    <Text style={[styles.capacityBadge, { backgroundColor: '#fef2f2', color: '#e11d48', borderColor: '#fecaca' }]}>
                      {selectedAddons.length} Selected (+₹{addOnsSubtotal.toLocaleString('en-IN')})
                    </Text>
                  )}
                </View>

                {availableAddonsList.map((addon) => {
                  const isChecked = selectedAddons.includes(addon.id);
                  return (
                    <TouchableOpacity
                      key={addon.id}
                      style={[
                        styles.togglePlatesCard,
                        isChecked && styles.togglePlatesCardActive,
                        { marginBottom: 8 },
                      ]}
                      onPress={() => {
                        if (isChecked) {
                          setSelectedAddons(selectedAddons.filter((id) => id !== addon.id));
                        } else {
                          setSelectedAddons([...selectedAddons, addon.id]);
                        }
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                        <View style={[styles.toggleCheckbox, isChecked && styles.toggleCheckboxActive]}>
                          {isChecked && <Check size={14} color="#ffffff" strokeWidth={3} />}
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={styles.togglePlatesTitle}>{addon.name}</Text>
                            <Text style={{ fontSize: 13, fontWeight: '800', color: isChecked ? '#e11d48' : '#0f172a' }}>
                              +₹{addon.price.toLocaleString('en-IN')}
                            </Text>
                          </View>
                          {addon.description ? (
                            <Text style={styles.togglePlatesSub}>{addon.description}</Text>
                          ) : null}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {/* Guest Information Section for Pass */}
          <View style={styles.sectionBlock}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <User size={18} color="#e11d48" />
              <Text style={styles.sectionTitle}>Guest Information for Pass</Text>
            </View>
            <View style={styles.guestInputsCard}>
              <View style={styles.inputRow}>
                <User size={16} color="#94a3b8" />
                <TextInput
                  style={styles.guestFieldInput}
                  placeholder="Full Name (for entry pass)"
                  placeholderTextColor="#94a3b8"
                  value={guestName}
                  onChangeText={setGuestName}
                />
              </View>
              <View style={styles.inputDivider} />
              <View style={styles.inputRow}>
                <Phone size={16} color="#94a3b8" />
                <TextInput
                  style={styles.guestFieldInput}
                  placeholder="10-digit Phone Number"
                  placeholderTextColor="#94a3b8"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={guestPhone}
                  onChangeText={setGuestPhone}
                />
              </View>
            </View>
          </View>

          {/* Wallet Discount Toggle if user has balance */}
          {walletBalance > 0 && (
            <TouchableOpacity
              style={[styles.walletCard, useWallet && styles.walletCardActive]}
              onPress={() => setUseWallet(!useWallet)}
              activeOpacity={0.85}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <View style={styles.walletIconCircle}>
                  <Wallet size={18} color={useWallet ? '#059669' : '#64748b'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.walletTitle}>Use happylokam Celebration Balance</Text>
                  <Text style={styles.walletSub}>
                    Available: ₹{walletBalance.toLocaleString('en-IN')} (Save ₹{maxWalletApplicable.toLocaleString('en-IN')})
                  </Text>
                </View>
              </View>
              <View style={[styles.toggleCheckbox, useWallet && { backgroundColor: '#10b981', borderColor: '#10b981' }]}>
                {useWallet && <Check size={14} color="#ffffff" strokeWidth={3} />}
              </View>
            </TouchableOpacity>
          )}

          {/* Features Included */}
          {item.features && item.features.length > 0 && (
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>What's Included</Text>
              <View style={styles.featuresCard}>
                {item.features.map((feat: string, idx: number) => (
                  <View key={idx} style={styles.featureRow}>
                    <CheckCircle2 size={16} color="#10b981" />
                    <Text style={styles.featureText}>{feat}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Transparent Price Breakdown Card with Razorpay 2% + 18% GST */}
          <View style={styles.priceBreakdownCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <Gift size={18} color="#e11d48" />
              <Text style={styles.priceBreakdownTitle}>Transparent Price Breakdown</Text>
            </View>

            {/* Base items breakdown */}
            {hasBaseHall && (
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Venue / Hall Base ({bookingDays} Day{bookingDays > 1 ? 's' : ''})</Text>
                <Text style={styles.breakdownVal}>₹{hallSubtotal.toLocaleString('en-IN')}</Text>
              </View>
            )}

            {hasPerPlate && (
              <>
                {vegPlatesCount > 0 && (
                  <View style={styles.breakdownRow}>
                    <Text style={[styles.breakdownLabel, { color: '#15803d' }]}>🟢 Pure Veg Catering ({vegPlatesCount} × ₹{vegPlateRate})</Text>
                    <Text style={styles.breakdownVal}>₹{vegPlatesSubtotal.toLocaleString('en-IN')}</Text>
                  </View>
                )}
                {nonVegPlatesCount > 0 && (
                  <View style={styles.breakdownRow}>
                    <Text style={[styles.breakdownLabel, { color: '#b91c1c' }]}>🔴 Non-Veg Catering ({nonVegPlatesCount} × ₹{nonVegPlateRate})</Text>
                    <Text style={styles.breakdownVal}>₹{nonVegPlatesSubtotal.toLocaleString('en-IN')}</Text>
                  </View>
                )}
              </>
            )}

            {hasPerGuest && (
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Guest Attendance ({guestCount} × ₹{guestRate})</Text>
                <Text style={styles.breakdownVal}>₹{guestSubtotal.toLocaleString('en-IN')}</Text>
              </View>
            )}

            {!hasBaseHall && !hasPerPlate && !hasPerGuest && (
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Package Base Rate</Text>
                <Text style={styles.breakdownVal}>₹{calculatedBase.toLocaleString('en-IN')}</Text>
              </View>
            )}

            {!isTicket && (
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Event Schedule</Text>
                <Text style={styles.breakdownValHighlight}>
                  {formatSelectedDateHuman(selectedDate)} • {bookingDays} Day{bookingDays === 1 ? '' : 's'}
                </Text>
              </View>
            )}

            {/* Selected Add-on Services breakdown */}
            {selectedAddons.length > 0 && (
              <View style={styles.breakdownRow}>
                <Text style={[styles.breakdownLabel, { color: '#e11d48', fontWeight: '700' }]}>
                  ✨ Add-on Services ({selectedAddons.length})
                </Text>
                <Text style={[styles.breakdownVal, { color: '#e11d48', fontWeight: '800' }]}>
                  ₹{addOnsSubtotal.toLocaleString('en-IN')}
                </Text>
              </View>
            )}

            {/* Razorpay 2% Commission */}
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Razorpay Payment Gateway Fee (2%)</Text>
              <Text style={styles.breakdownVal}>₹{razorpayCommission.toFixed(2)}</Text>
            </View>

            {/* 18% GST on that 2% Commission */}
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>GST on Gateway Fee (18% on 2%)</Text>
              <Text style={styles.breakdownVal}>₹{razorpayGst.toFixed(2)}</Text>
            </View>

            {/* Wallet discount */}
            {useWallet && walletDiscount > 0 && (
              <View style={styles.breakdownRow}>
                <Text style={[styles.breakdownLabel, { color: '#059669', fontWeight: '700' }]}>Wallet Credit Discount</Text>
                <Text style={[styles.breakdownVal, { color: '#059669', fontWeight: '800' }]}>-₹{walletDiscount.toFixed(2)}</Text>
              </View>
            )}

            <View style={styles.breakdownDivider} />

            <View style={styles.breakdownRowTotal}>
              <Text style={styles.breakdownTotalLabel}>Net Total Amount Payable</Text>
              <Text style={styles.breakdownTotalVal}>₹{finalPayable.toLocaleString('en-IN')}</Text>
            </View>
          </View>

          {/* Description */}
          {item.description ? (
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>About this Package</Text>
              <Text style={styles.descText}>{item.description}</Text>
            </View>
          ) : null}

          {/* Safety & Guarantee */}
          <View style={styles.guaranteeCard}>
            <ShieldCheck size={26} color="#059669" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.guaranteeTitle}>happylokam 100% Quality Assured</Text>
              <Text style={styles.guaranteeSub}>
                Verified vendors, on-site backup staff, secure online payments with instant digital ticket passes.
              </Text>
            </View>
          </View>

          {/* Ratings & Customer Reviews */}
          <View style={styles.sectionBlock}>
            <View style={styles.reviewHeaderRow}>
              <Text style={styles.sectionTitle}>Reviews & Ratings</Text>
              <TouchableOpacity
                style={styles.addReviewBtn}
                onPress={handleOpenReviewModal}
                activeOpacity={0.8}
              >
                <Star size={13} color="#e11d48" />
                <Text style={styles.addReviewBtnText}>Rate & Review</Text>
              </TouchableOpacity>
            </View>

            {ratings.length === 0 ? (
              <View style={styles.emptyReviewBox}>
                <MessageSquare size={26} color="#94a3b8" />
                <Text style={styles.emptyReviewText}>
                  No reviews yet. Be the first to share your celebration experience!
                </Text>
              </View>
            ) : (
              ratings.map((r, i) => (
                <View key={i} style={styles.reviewCard}>
                  <View style={styles.reviewTopRow}>
                    <Text style={styles.reviewUser}>{r.userName || 'Verified Guest'}</Text>
                    <View style={styles.starsRow}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={12}
                          color={s <= r.rating ? '#eab308' : '#e2e8f0'}
                          fill={s <= r.rating ? '#eab308' : 'none'}
                        />
                      ))}
                    </View>
                  </View>
                  <Text style={styles.reviewText}>{r.review}</Text>
                  <Text style={styles.reviewTime}>{r.createdAt}</Text>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Sticky Action Footer */}
      <View style={[styles.bottomFooter, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={styles.footerPriceLabel} numberOfLines={1}>
            {isTicket
              ? 'Per Digital Pass'
              : `${hasPerPlate ? `${platesCount} Plates` : `${guestCount} Guests`} • ${bookingDays} Day(s)`}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
            <Text style={styles.footerPrice}>₹{finalPayable.toLocaleString('en-IN')}</Text>
            {walletDiscount > 0 && (
              <Text style={styles.footerDiscountText}>(-₹{walletDiscount.toFixed(0)} Wallet)</Text>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={[styles.bookBtn, paying && { opacity: 0.7 }]}
          onPress={handleInitiateBooking}
          disabled={paying}
          activeOpacity={0.9}
        >
          {paying ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <>
              {isTicket ? <Ticket size={18} color="#ffffff" /> : <Calendar size={18} color="#ffffff" />}
              <Text style={styles.bookBtnText}>
                {isTicket ? 'Book Digital Pass' : `Reserve & Pay ₹${finalPayable.toLocaleString('en-IN')}`}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Interactive Celebration Date Picker Modal */}
      <CelebrationDatePickerModal
        visible={calendarModalVisible}
        selectedDate={selectedDate}
        blackoutDates={item?.blackoutDates || []}
        onSelectDate={(newDate) => {
          setSelectedDate(newDate);
          setCalendarModalVisible(false);
        }}
        onClose={() => setCalendarModalVisible(false)}
      />

      {/* Confirmed Digital Ticket Pass Modal */}
      <Modal
        visible={Boolean(confirmedBooking)}
        transparent
        animationType="slide"
        onRequestClose={() => setConfirmedBooking(null)}
      >
        <View style={styles.confirmedOverlay}>
          <View style={styles.confirmedCard}>
            <View style={styles.confirmedIconWrap}>
              <CheckCircle2 size={42} color="#10b981" />
            </View>
            <Text style={styles.confirmedTitle}>Booking Confirmed! 🎉</Text>
            <Text style={styles.confirmedSub}>
              Your celebration spot has been secured. Your digital entry pass and receipt details are below:
            </Text>

            <View style={styles.confirmedTicketBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.confirmedTicketName} numberOfLines={1}>{item.title || 'Celebration Booking'}</Text>
                  <Text style={styles.confirmedTicketDate}>
                    {formatSelectedDateHuman(confirmedBooking?.date || selectedDate)}
                  </Text>
                </View>
                <View style={styles.confirmedBadge}>
                  <Text style={styles.confirmedBadgeText}>CONFIRMED</Text>
                </View>
              </View>

              <View style={styles.ticketDetailsRow}>
                <View>
                  <Text style={styles.ticketFieldLabel}>Guest / Contact</Text>
                  <Text style={styles.ticketFieldValue}>{guestName || 'Verified Guest'}</Text>
                  <Text style={styles.ticketFieldSub}>{guestPhone}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.ticketFieldLabel}>Amount Paid</Text>
                  <Text style={styles.ticketFieldAmount}>₹{(confirmedBooking?.amount ?? finalPayable).toLocaleString('en-IN')}</Text>
                  <Text style={styles.ticketFieldSub}>Incl. 2% Gateway + 18% GST</Text>
                </View>
              </View>

              <View style={styles.qrSection}>
                <View style={styles.qrIconWrap}>
                  <QrCode size={70} color="#0f172a" />
                </View>
                <Text style={styles.ticketPassCode}>
                  Pass Code: {confirmedBooking?.ticketCode || confirmedBooking?.id}
                </Text>
                {confirmedBooking?.checkInOtp ? (
                  <View style={styles.ticketOtpBadge}>
                    <Text style={styles.ticketOtpLabel}>VENUE CHECK-IN OTP</Text>
                    <Text style={styles.ticketOtpValue}>{confirmedBooking.checkInOtp}</Text>
                    <Text style={styles.ticketOtpHint}>Share this 4-digit OTP with the venue manager on arrival</Text>
                  </View>
                ) : null}
                <Text style={styles.ticketScanHint}>Present this digital pass or pass code at the venue / desk.</Text>
              </View>
            </View>

            <View style={styles.confirmedActions}>
              <TouchableOpacity
                style={styles.confirmedDoneBtn}
                onPress={() => {
                  setConfirmedBooking(null);
                  router.push('/(tabs)/bookings');
                }}
                activeOpacity={0.88}
              >
                <Text style={styles.confirmedDoneBtnText}>View in My Bookings</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmedStayBtn}
                onPress={() => setConfirmedBooking(null)}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmedStayBtnText}>Stay on Package Details</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Rating & Review Modal */}
      <Modal visible={ratingModalVisible} transparent animationType="fade" onRequestClose={() => setRatingModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.ratingModalCard}>
            <Text style={styles.ratingModalTitle}>Share Your Experience</Text>
            <Text style={styles.ratingModalSub}>How was your celebration or service experience?</Text>

            <View style={styles.ratingStarsPicker}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setUserStars(star)}
                  style={{ padding: 6 }}
                >
                  <Star
                    size={32}
                    color={star <= userStars ? '#eab308' : '#cbd5e1'}
                    fill={star <= userStars ? '#eab308' : 'none'}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.reviewInput}
              placeholder="Write your feedback here (arrangements, decor, staff behavior)..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={4}
              value={userReviewText}
              onChangeText={setUserReviewText}
            />

            <View style={styles.modalBtnsRow}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setRatingModalVisible(false)}
              >
                <Text style={styles.cancelModalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitModalBtn}
                onPress={handleSubmitRating}
              >
                <Text style={styles.submitModalBtnText}>Submit Rating</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  heroContainer: {
    position: 'relative',
    width: '100%',
    height: 320,
    backgroundColor: '#0f172a',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.25)',
  },
  topBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  topActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cornerTagBadge: {
    position: 'absolute',
    top: 60,
    right: 16,
    backgroundColor: '#dc2626',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    elevation: 4,
    shadowColor: '#dc2626',
    shadowOpacity: 0.35,
    shadowRadius: 5,
  },
  cornerTagText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  heroBottomRow: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typePill: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  typePillText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  photoCountPill: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  photoCountText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  body: {
    padding: 20,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
    lineHeight: 20,
  },
  priceBox: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: 11,
    color: '#94a3b8',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  priceAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: '#e11d48',
    marginTop: 2,
  },
  priceUnit: {
    fontSize: 11,
    color: '#64748b',
  },
  metaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  metaDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#cbd5e1',
    marginHorizontal: 12,
  },
  locationCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 22,
  },
  locationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffe4e6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  locationCardSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  mapsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#e11d48',
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  mapsBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  amenityCard: {
    width: (width - 50) / 2,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  amenityIcon: {
    fontSize: 22,
  },
  amenityTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  amenityDesc: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  conciergeCard: {
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  conciergeTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  conciergeAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#f43f5e',
  },
  conciergeTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#9f1239',
  },
  conciergeSub: {
    fontSize: 12,
    color: '#881337',
    marginTop: 4,
    lineHeight: 18,
  },
  conciergeBtnsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  whatsappBtn: {
    flex: 1,
    backgroundColor: '#25d366',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  whatsappBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },
  callBtn: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  callBtnText: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 12,
  },
  guestPickerCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  guestPickerLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  guestPickerSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  guestCounterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  counterBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestCountVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    minWidth: 32,
    textAlign: 'center',
  },
  sectionBlock: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  sectionSubtitle: { fontSize: 12, color: '#64748b', marginTop: 4 },
  themePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff1f2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  themePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#e11d48',
  },
  celebChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  celebChipSelected: {
    backgroundColor: '#e11d48',
    borderColor: '#e11d48',
  },
  celebChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  celebChipTextSelected: {
    color: '#ffffff',
  },
  chipsScroll: {
    flexDirection: 'row',
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dateChipSelected: {
    backgroundColor: '#e11d48',
    borderColor: '#e11d48',
  },
  dateChipText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  dateChipTextSelected: {
    color: '#ffffff',
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  timeChipSelected: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  timeChipText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  timeChipTextSelected: {
    color: '#ffffff',
  },
  featuresCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 13,
    color: '#334155',
    flex: 1,
    lineHeight: 18,
  },
  priceBreakdownCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 24,
  },
  priceBreakdownTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  breakdownLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  breakdownVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  breakdownValGreen: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  breakdownValRed: {
    fontSize: 12,
    fontWeight: '700',
    color: '#e11d48',
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 10,
  },
  breakdownRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  breakdownTotalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  breakdownTotalVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#e11d48',
  },
  descText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
  },
  guaranteeCard: {
    backgroundColor: '#ecfdf5',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    marginBottom: 24,
  },
  guaranteeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065f46',
  },
  guaranteeSub: {
    fontSize: 12,
    color: '#047857',
    marginTop: 4,
    lineHeight: 18,
  },
  reviewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff1f2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addReviewBtnText: {
    fontSize: 12,
    color: '#e11d48',
    fontWeight: '700',
  },
  emptyReviewBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  emptyReviewText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  reviewCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  reviewTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewUser: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewText: {
    fontSize: 13,
    color: '#475569',
    marginTop: 6,
    lineHeight: 18,
  },
  reviewTime: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 6,
  },
  bottomFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingHorizontal: 20,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  footerPriceLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  footerPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  bookBtn: {
    backgroundColor: '#e11d48',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  bookBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  ratingModalCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  ratingModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  ratingModalSub: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
  ratingStarsPicker: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: 18,
  },
  reviewInput: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: '#0f172a',
    textAlignVertical: 'top',
    height: 90,
  },
  modalBtnsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    width: '100%',
  },
  cancelModalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  cancelModalBtnText: {
    color: '#475569',
    fontWeight: '700',
    fontSize: 14,
  },
  submitModalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#e11d48',
    alignItems: 'center',
  },
  submitModalBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  adminVerifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  adminVerifiedPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#065f46',
  },
  adminDateNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  adminDateNoticeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e40af',
  },
  quickChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  quickChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  quickChipActive: {
    backgroundColor: '#e11d48',
    borderColor: '#e11d48',
  },
  quickChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  quickChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  capacityBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  guestInput: {
    width: 60,
    height: 36,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  breakdownValHighlight: {
    fontSize: 13,
    fontWeight: '700',
    color: '#e11d48',
  },
  openCalendarPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff1f2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fecdd3',
  },
  openCalendarPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#e11d48',
  },
  chosenDateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    marginBottom: 14,
  },
  chosenDateLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  chosenDateIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#fff1f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chosenDateLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chosenDateVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  chosenDateSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#e11d48',
    marginTop: 2,
  },
  changeDateBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  changeDateBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  quickDateHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  togglePlatesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  togglePlatesCardActive: {
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3',
  },
  toggleCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  toggleCheckboxActive: {
    backgroundColor: '#e11d48',
    borderColor: '#e11d48',
  },
  togglePlatesTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  togglePlatesSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  guestInputsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    padding: 14,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inputDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
  },
  guestFieldInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    paddingVertical: 4,
  },
  walletCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  walletCardActive: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  walletIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  walletSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  footerDiscountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  confirmedOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmedCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
  },
  confirmedIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  confirmedTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },
  confirmedSub: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    marginBottom: 20,
  },
  confirmedTicketBox: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    marginBottom: 20,
  },
  confirmedTicketName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  confirmedTicketDate: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e11d48',
    marginTop: 2,
  },
  confirmedBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  confirmedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#065f46',
  },
  ticketDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
    marginVertical: 12,
  },
  ticketFieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  ticketFieldValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  ticketFieldAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#059669',
    marginTop: 2,
  },
  ticketFieldSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  qrSection: {
    alignItems: 'center',
    paddingTop: 8,
  },
  qrIconWrap: {
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  ticketPassCode: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.5,
  },
  ticketScanHint: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 4,
  },
  ticketOtpBadge: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1.5,
    borderColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginVertical: 10,
    width: '100%',
  },
  ticketOtpLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 1,
  },
  ticketOtpValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#047857',
    letterSpacing: 6,
    marginVertical: 2,
  },
  ticketOtpHint: {
    fontSize: 10,
    fontWeight: '600',
    color: '#059669',
  },
  confirmedActions: {
    width: '100%',
    gap: 10,
  },
  confirmedDoneBtn: {
    width: '100%',
    backgroundColor: '#e11d48',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmedDoneBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  confirmedStayBtn: {
    width: '100%',
    backgroundColor: '#f1f5f9',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmedStayBtnText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
  },
});

