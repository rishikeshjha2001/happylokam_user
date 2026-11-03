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
} from 'lucide-react-native';
import RoomDatabase from '../services/roomDatabase';
import { getAdminSectionItemById, AdminSectionItem } from '../services/adminSections';
import PaymentModal from '../components/PaymentModal';
import MLRecommendation from '../services/mlRecommendationEngine';

const { width } = Dimensions.get('window');

const AMENITIES_LIST = [
  { icon: '❄️', title: 'Central AC Hall', desc: 'Full climate control' },
  { icon: '🚗', title: 'Valet Parking', desc: 'Capacity for 200+ cars' },
  { icon: '🛏️', title: 'Luxury Suites', desc: 'Bridal & family rooms' },
  { icon: '⚡', title: '100% DG Backup', desc: 'Uninterrupted power' },
  { icon: '🥗', title: 'Pure Veg Kitchen', desc: 'Dedicated prep area' },
  { icon: '🎶', title: 'Concert Stage & DJ', desc: 'Intelligent sound system' },
  { icon: '🛡️', title: 'Quality Assured', desc: 'On-site happylokam team' },
  { icon: '💐', title: 'Bespoke Decor', desc: 'Custom theme & lighting' },
];

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
  const [bookingDays, setBookingDays] = useState(1);

  // Rating & Review State
  const [ratings, setRatings] = useState<any[]>([]);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [userStars, setUserStars] = useState(5);
  const [userReviewText, setUserReviewText] = useState('');

  // Hardware Back Handler: smoothly navigates back through modal and screens
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
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
    }, [showPayment, ratingModalVisible])
  );

  const itemId = params.id || 'default_item';

  useEffect(() => {
    loadItemData();
    checkFavorite();
    loadRatings();
  }, [itemId]);

  const loadItemData = async () => {
    setLoading(true);
    try {
      if (params.id && !params.id.startsWith('mock_')) {
        const fetched = await getAdminSectionItemById(params.id);
        if (fetched) {
          setItem(fetched);
          if (fetched.availableDates && fetched.availableDates.length > 0) {
            setSelectedDate(fetched.availableDates[0]);
          }
          if (fetched.availableTimes && fetched.availableTimes.length > 0) {
            setSelectedTime(fetched.availableTimes[0]);
          }
          if (fetched.capacity) {
            setGuestCount(Math.min(fetched.capacity, 200));
          }
          setLoading(false);
          return;
        }
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
        availableDates: ['2026-10-25', '2026-10-28', '2026-11-02', '2026-11-10'],
        availableTimes: ['10:00 AM - 02:00 PM', '04:00 PM - 08:00 PM', '07:00 PM - 11:30 PM'],
        capacity: 350,
      };
      setItem(fallbackItem);
      setSelectedDate(fallbackItem.availableDates[0]);
      setSelectedTime(fallbackItem.availableTimes[0]);
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

  const hasPerPlate = Boolean(item.pricePerPlate && Number(item.pricePerPlate) > 0) || isPerPerson;
  const hasPerGuest = Boolean(item.pricePerGuest && Number(item.pricePerGuest) > 0);
  const hasBaseHall = Boolean(item.baseHallPrice && Number(item.baseHallPrice) > 0);

  const plateRate = item.pricePerPlate ? Number(item.pricePerPlate) : (isPerPerson ? basePriceNum : 0);
  const guestRate = item.pricePerGuest ? Number(item.pricePerGuest) : 0;
  const hallRate = item.baseHallPrice ? Number(item.baseHallPrice) : (!hasPerPlate && !hasPerGuest && !isPerPerson ? basePriceNum : 0);

  const calculatedBase = isTicket
    ? basePriceNum
    : (hasPerPlate || hasPerGuest || hasBaseHall
        ? (hallRate * bookingDays) + (hasPerPlate ? plateRate * platesCount : 0) + (hasPerGuest ? guestRate * guestCount : 0)
        : (isPerPerson
            ? basePriceNum * guestCount * bookingDays
            : basePriceNum * bookingDays));

  const mainPhoto = item.image || item.imageUrl || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80';
  const galleryImages = [
    mainPhoto,
    'https://images.unsplash.com/photo-1544077960-604201fe74bc?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80',
  ];

  const handleScrollImage = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slide = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveImageIndex(slide);
  };

  const mapDirectionUrl = item.mapUrl || item.googleMapsUrl || item.directionUrl;
  const hasMapDirection = Boolean(mapDirectionUrl && typeof mapDirectionUrl === 'string' && mapDirectionUrl.trim().length > 0);

  const handleOpenGoogleMaps = () => {
    if (mapDirectionUrl) {
      Linking.openURL(mapDirectionUrl);
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
    setShowPayment(true);
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
            {galleryImages.map((imgUri, idx) => (
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

            <View style={styles.photoCountPill}>
              <Text style={styles.photoCountText}>
                📸 {activeImageIndex + 1} / {galleryImages.length}
              </Text>
            </View>
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
              <Text style={styles.metaText}>4.9 (120+ verified)</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <MapPin size={16} color="#64748b" />
              <Text style={styles.metaText}>{item.location || 'Pan-India Available'}</Text>
            </View>
            {item.capacity && (
              <>
                <View style={styles.metaDivider} />
                <View style={styles.metaItem}>
                  <Users size={16} color="#64748b" />
                  <Text style={styles.metaText}>{item.capacity} Spots</Text>
                </View>
              </>
            )}
          </View>

          {/* Interactive Google Maps Location & Direction Box */}
          <View style={styles.locationCard}>
            <View style={styles.locationHeaderRow}>
              <View style={styles.locationIconBox}>
                <MapPin size={20} color="#e11d48" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.locationCardTitle}>{item.location || 'Jaipur & Delhi NCR'}</Text>
                <Text style={styles.locationCardSub}>Prime central celebration hub • Verified GPS coordinates</Text>
              </View>
            </View>
            {hasMapDirection && (
              <TouchableOpacity
                style={styles.mapsBtn}
                onPress={handleOpenGoogleMaps}
                activeOpacity={0.85}
              >
                <Navigation size={15} color="#ffffff" />
                <Text style={styles.mapsBtnText}>See Location on Google Maps</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Venue & Package Amenities Grid */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>Key Amenities & Highlights</Text>
            <View style={styles.amenitiesGrid}>
              {AMENITIES_LIST.map((am, i) => (
                <View key={i} style={styles.amenityCard}>
                  <Text style={styles.amenityIcon}>{am.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.amenityTitle}>{am.title}</Text>
                    <Text style={styles.amenityDesc}>{am.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
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
              {/* Start Date Picker */}
              <View style={styles.sectionBlock}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={styles.sectionTitle}>Celebration Start Date</Text>
                  <Text style={styles.sectionSubtitle}>Pick your event date</Text>
                </View>

                {/* Interactive Date Scroll (Next 14 Days) */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                  {Array.from({ length: 14 }).map((_, idx) => {
                    const d = new Date();
                    d.setDate(d.getDate() + idx + 1);
                    const isoDate = d.toISOString().split('T')[0];
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

              {/* Number of Guests they can feed / accommodate */}
              <View style={styles.sectionBlock}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={styles.sectionTitle}>Number of Guests to Feed / Accommodate</Text>
                  <Text style={styles.capacityBadge}>
                    Max: {item.capacity || 1000}
                  </Text>
                </View>

                <View style={styles.guestPickerCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.guestPickerLabel}>Guest Count</Text>
                    <Text style={styles.guestPickerSub}>Catering, buffet plates & seating scale automatically</Text>
                  </View>
                  <View style={styles.guestCounterRow}>
                    <TouchableOpacity
                      style={styles.counterBtn}
                      onPress={() => setGuestCount(Math.max(25, guestCount - 25))}
                    >
                      <Minus size={16} color="#0f172a" />
                    </TouchableOpacity>
                    <TextInput
                      style={styles.guestInput}
                      keyboardType="numeric"
                      value={String(guestCount)}
                      onChangeText={(val) => {
                        const parsed = parseInt(val.replace(/\D/g, ''), 10);
                        if (!isNaN(parsed)) setGuestCount(Math.max(1, parsed));
                      }}
                    />
                    <TouchableOpacity
                      style={styles.counterBtn}
                      onPress={() => setGuestCount(guestCount + 25)}
                    >
                      <Plus size={16} color="#0f172a" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Quick Guest Count Pills */}
                <View style={styles.quickChipsRow}>
                  {[50, 100, 250, 500, 1000].map((count) => (
                    <TouchableOpacity
                      key={count}
                      style={[styles.quickChip, guestCount === count && styles.quickChipActive]}
                      onPress={() => setGuestCount(count)}
                    >
                      <Text style={[styles.quickChipText, guestCount === count && styles.quickChipTextActive]}>
                        {count} Guests
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Optional Per-Plate Catering Selector */}
              {hasPerPlate && (
                <View style={styles.sectionBlock}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={styles.sectionTitle}>Catering Plates & Buffet Servings</Text>
                    <Text style={styles.capacityBadge}>
                      ₹{plateRate}/Plate
                    </Text>
                  </View>

                  <View style={styles.guestPickerCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.guestPickerLabel}>Number of Plates</Text>
                      <Text style={styles.guestPickerSub}>Add or subtract plates anytime</Text>
                    </View>
                    <View style={styles.guestCounterRow}>
                      <TouchableOpacity
                        style={styles.counterBtn}
                        onPress={() => setPlatesCount(Math.max(10, platesCount - 25))}
                      >
                        <Minus size={16} color="#0f172a" />
                      </TouchableOpacity>
                      <TextInput
                        style={styles.guestInput}
                        keyboardType="numeric"
                        value={String(platesCount)}
                        onChangeText={(val) => {
                          const parsed = parseInt(val.replace(/\D/g, ''), 10);
                          if (!isNaN(parsed)) setPlatesCount(Math.max(1, parsed));
                        }}
                      />
                      <TouchableOpacity
                        style={styles.counterBtn}
                        onPress={() => setPlatesCount(platesCount + 25)}
                      >
                        <Plus size={16} color="#0f172a" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.quickChipsRow}>
                    {[50, 100, 200, 350, 500].map((count) => (
                      <TouchableOpacity
                        key={count}
                        style={[styles.quickChip, platesCount === count && styles.quickChipActive]}
                        onPress={() => setPlatesCount(count)}
                      >
                        <Text style={[styles.quickChipText, platesCount === count && styles.quickChipTextActive]}>
                          {count} Plates
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </>
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

          {/* Transparent Price Breakdown Card */}
          <View style={styles.priceBreakdownCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <Gift size={18} color="#e11d48" />
              <Text style={styles.priceBreakdownTitle}>Transparent Price Breakdown</Text>
            </View>

            {/* Base Calculation Formula */}
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>
                {isTicket
                  ? 'Digital Pass Price'
                  : hasBaseHall && hasPerPlate
                    ? `Hall Base (₹${hallRate.toLocaleString('en-IN')}) + Plates (${platesCount} × ₹${plateRate})`
                    : hasPerPlate
                      ? `Catering Plates (₹${plateRate} × ${platesCount} Plates)`
                      : hasPerGuest
                        ? `Guest Charges (₹${guestRate} × ${guestCount} Guests)`
                        : isPerPerson
                          ? `Per-Plate Rate (₹${basePriceNum} × ${guestCount} Guests × ${bookingDays} Days)`
                          : `Daily Package Rate (₹${basePriceNum.toLocaleString('en-IN')} × ${bookingDays} Days)`}
              </Text>
              <Text style={styles.breakdownVal}>₹{calculatedBase.toLocaleString('en-IN')}</Text>
            </View>

            {!isTicket && (
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Duration & Attendance</Text>
                <Text style={styles.breakdownValHighlight}>
                  {bookingDays} Day{bookingDays === 1 ? '' : 's'} • {guestCount} Guests
                </Text>
              </View>
            )}

            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>GST & Regulatory Taxes (18%)</Text>
              <Text style={styles.breakdownValGreen}>Included in estimate</Text>
            </View>

            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>happylokam Assurance Fee</Text>
              <Text style={styles.breakdownValGreen}>FREE (₹0)</Text>
            </View>

            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Celebration Wallet Discount</Text>
              <Text style={styles.breakdownValRed}>Redeemable at Checkout</Text>
            </View>

            <View style={styles.breakdownDivider} />

            <View style={styles.breakdownRowTotal}>
              <Text style={styles.breakdownTotalLabel}>Net Estimated Total</Text>
              <Text style={styles.breakdownTotalVal}>₹{calculatedBase.toLocaleString('en-IN')}</Text>
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
        <View>
          <Text style={styles.footerPriceLabel}>
            {isTicket ? 'Per Digital Pass' : `${bookingDays} Day(s) • ${guestCount} Guests`}
          </Text>
          <Text style={styles.footerPrice}>₹{calculatedBase.toLocaleString('en-IN')}</Text>
        </View>
        <TouchableOpacity
          style={styles.bookBtn}
          onPress={handleInitiateBooking}
          activeOpacity={0.9}
        >
          {isTicket ? <Ticket size={18} color="#ffffff" /> : <Calendar size={18} color="#ffffff" />}
          <Text style={styles.bookBtnText}>
            {isTicket ? 'Book Digital Pass' : 'Reserve & Book'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Payment / Booking Modal */}
      {showPayment && (
        <PaymentModal
          visible={showPayment}
          item={{
            ...item,
            calculatedSubtotal: calculatedBase,
            price: calculatedBase,
            bookingDays,
            guestCount,
            platesCount,
            pricePerPlate: plateRate,
            baseHallPrice: hallRate,
            pricePerGuest: guestRate,
            selectedDate,
          }}
          onClose={() => setShowPayment(false)}
          onSuccess={() => {
            setShowPayment(false);
            router.push('/(tabs)/bookings');
          }}
        />
      )}

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
});

