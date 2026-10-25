import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  RefreshControl,
  StatusBar,
  Animated,
  Platform,
  Alert,
  BackHandler,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Bell,
  Search,
  SlidersHorizontal,
  Sparkles,
  Gift,
  Camera,
  Coffee,
  Heart,
  Star,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  Flame,
  Shield,
  Plus,
  Ticket,
  Menu,
  LogIn,
  Calendar,
  User as UserIcon,
  Navigation,
  X,
} from 'lucide-react-native';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import Svg, { Defs, LinearGradient as SvgGradient, RadialGradient, Stop, Rect } from 'react-native-svg';
import { getHeroSlides, getVenues, getPackages, getUserWallet } from '../../services/api';
import { DbHeroSlide, DbVenue, DbPackage, DB_HERO_SLIDES } from '../../constants/databaseModels';
import RoomDatabase from '../../services/roomDatabase';
import {
  AdminCustomSection,
  AdminCustomCategory,
  getAdminCustomSections,
  getAdminCustomCategories,
} from '../../services/adminSections';
import PaymentModal from '../../components/PaymentModal';
import SidebarDrawer from '../../components/SidebarDrawer';
import WalletModal from '../../components/WalletModal';
import AdminSectionModal from '../../components/AdminSectionModal';
import CelebrationDialog from '../../components/CelebrationDialog';
import AdvancedFilterModal, {
  FilterState,
  DEFAULT_FILTERS,
} from '../../components/AdvancedFilterModal';
import OtaSync from '../../services/otaSync';

const { width } = Dimensions.get('window');

const getHeroImageSource = (img: any) => {
  if (!img) return require('../../../assets/hero_vedic_vivah.jpg');
  if (typeof img === 'number') return img;
  if (typeof img === 'string') {
    const lower = img.toLowerCase();
    if (lower.includes('vedic') || lower.includes('havan') || lower.includes('mandap')) {
      return require('../../../assets/hero_vedic_vivah.jpg');
    }
    if (lower.includes('corporate') || lower.includes('secret') || lower.includes('buffet')) {
      return require('../../../assets/hero_corporate_events.jpg');
    }
    if (lower.includes('birthday') || lower.includes('throne') || lower.includes('fiesta')) {
      return require('../../../assets/hero_birthday_throne.jpg');
    }
    if (lower.includes('ring') || lower.includes('lakeside') || lower.includes('palace')) {
      return require('../../../assets/hero_wedding_rings.jpg');
    }
    if (img.startsWith('http://') || img.startsWith('https://')) {
      return { uri: img };
    }
  }
  return require('../../../assets/hero_vedic_vivah.jpg');
};

const QUICK_CATEGORIES = [
  { id: 'q1', name: 'Weddings', icon: Sparkles, color: '#e11d48', bg: '#ffe4e6', border: '#fecdd3' },
  { id: 'q2', name: 'Birthdays', icon: Gift, color: '#4f46e5', bg: '#e0e7ff', border: '#c7d2fe' },
  { id: 'q3', name: 'Shoots', icon: Camera, color: '#db2777', bg: '#fce7f3', border: '#fbcfe8' },
  { id: 'q4', name: 'Catering', icon: Coffee, color: '#d97706', bg: '#fef3c7', border: '#fde68a' },
];

export default function HomeTab() {
  const insets = useSafeAreaInsets();

  const [slides, setSlides] = useState<DbHeroSlide[]>([]);
  const [venues, setVenues] = useState<DbVenue[]>([]);
  const [packages, setPackages] = useState<DbPackage[]>([]);
  const [adminSections, setAdminSections] = useState<AdminCustomSection[]>([]);
  const [adminCategories, setAdminCategories] = useState<AdminCustomCategory[]>([]);
  const [userProfile, setUserProfile] = useState<{ name: string; email: string; balance: number } | null>(null);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('All India');
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Modals & Filters
  const [checkoutItem, setCheckoutItem] = useState<any>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isWalletOpen, setWalletOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [homeFilters, setHomeFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const CITIES_LIST = [
    'All India',
    'Patna',
    'Hyderabad',
    'Mumbai',
    'Delhi NCR',
    'Bengaluru',
    'Pune',
    'Jaipur',
    'Kolkata',
    'Chennai',
    'Ahmedabad',
    'Lucknow',
    'Chandigarh',
    'Varanasi',
  ];

  const handleDetectGps = async () => {
    try {
      setDetectingGps(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location Permission', 'Please enable location permissions or choose your city manually.');
        setDetectingGps(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [address] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      const cityName = address?.city || address?.district || address?.subregion || 'Patna';
      setSelectedCity(cityName);
      await RoomDatabase.saveLocation(cityName);
      setIsLocationModalOpen(false);
    } catch (e) {
      Alert.alert('GPS Notice', 'Could not detect location automatically. Please select your city manually.');
    } finally {
      setDetectingGps(false);
    }
  };

  const handleSelectCity = async (cityName: string) => {
    setSelectedCity(cityName);
    await RoomDatabase.saveLocation(cityName);
    setIsLocationModalOpen(false);
  };

  // Hero animation
  const slideOpacity = useRef(new Animated.Value(1)).current;

  const loadData = async () => {
    try {
      const [heroData, venueData, pkgData, session, customSecs, customCats, savedLoc, favs] = await Promise.all([
        getHeroSlides(),
        getVenues(),
        getPackages(),
        RoomDatabase.getUserSession(),
        getAdminCustomSections(),
        getAdminCustomCategories(),
        RoomDatabase.getLocation(),
        RoomDatabase.getFavorites(),
      ]);

      if (favs && Array.isArray(favs)) {
        setLikedIds(favs.map((f: any) => f.id));
      }

      if (customCats && Array.isArray(customCats)) {
        setAdminCategories(customCats);
      }

      if (heroData && heroData.length > 0) {
        setSlides(heroData);
      } else {
        setSlides(DB_HERO_SLIDES);
      }

      setVenues(venueData);
      setPackages(pkgData);
      setAdminSections(customSecs);
      if (savedLoc) {
        setSelectedCity(savedLoc);
      }
      if (session && session.name) {
        setUserProfile({
          name: session.name,
          email: session.email || '',
          balance: session.walletBalance || 0,
        });
      } else {
        setUserProfile(null);
      }
    } catch (e) {
      console.warn('Home data load error:', e);
    }
  };

  useEffect(() => {
    loadData();

    // Start live OTA auto-sync for instant updates when admin uploads new items
    OtaSync.startAutoSync(20000);
    const unsubscribeOta = OtaSync.subscribe(() => {
      loadData();
    });

    // Hardware back press listener on Home screen with premium confirmation dialog
    const backAction = () => {
      setShowExitDialog(true);
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => {
      backHandler.remove();
      unsubscribeOta();
      OtaSync.stopAutoSync();
    };
  }, []);

  // Slide rotation timer synchronized with ScrollView
  const heroScrollRef = useRef<ScrollView>(null);

  const goToSlide = (index: number) => {
    if (index < 0 || index >= slides.length) return;
    heroScrollRef.current?.scrollTo({ x: index * width, animated: true });
    setCurrentSlide(index);
  };

  const handleNextSlide = () => {
    if (slides.length <= 1) return;
    const next = (currentSlide + 1) % slides.length;
    goToSlide(next);
  };

  const handlePrevSlide = () => {
    if (slides.length <= 1) return;
    const prev = (currentSlide - 1 + slides.length) % slides.length;
    goToSlide(prev);
  };

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => {
        const next = (prev + 1) % slides.length;
        heroScrollRef.current?.scrollTo({ x: next * width, animated: true });
        return next;
      });
    }, 4500);
    return () => clearInterval(timer);
  }, [slides.length]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const toggleLike = async (item: any) => {
    const itemObj = typeof item === 'string' ? { id: item, title: 'Saved Item' } : item;
    try {
      const isNowFav = await RoomDatabase.toggleFavorite(itemObj);
      setLikedIds((prev) => (isNowFav ? [...prev, itemObj.id] : prev.filter((i) => i !== itemObj.id)));
    } catch {
      setLikedIds((prev) => (prev.includes(itemObj.id) ? prev.filter((i) => i !== itemObj.id) : [...prev, itemObj.id]));
    }
  };

  const handleOpenDetail = (item: any) => {
    router.push({
      pathname: '/item-detail',
      params: {
        id: item.id,
        title: item.title || item.name || '',
        subtitle: item.subtitle || '',
        location: item.location || item.city || '',
        price: String(item.price || ''),
        image: item.image || item.imageUrl || '',
        itemType: item.itemType || (item.type?.toLowerCase().includes('ticket') ? 'TICKET' : 'BOOKING'),
        cornerTag: item.cornerTag || item.tag || '',
        rating: String(item.rating || 4.9),
        description: item.description || '',
      },
    });
  };

  const handleBookNow = async (item: any) => {
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
    setCheckoutItem(item);
  };

  const activeHero = slides[currentSlide] || {
    title: 'Summer Wedding Fiesta',
    subtitle: 'Flat 20% off on premium venues',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
    badge: 'Featured',
  };

  // Convert raw descriptions to clean, punchy taglines for the vignette
  const getCleanTagline = (hero: DbHeroSlide) => {
    if (hero.subtitle && hero.subtitle.length < 50) return hero.subtitle;
    if (hero.badge?.toLowerCase().includes('birthday')) return 'All-inclusive birthday bashes from ₹25k';
    if (hero.badge?.toLowerCase().includes('sacred') || hero.badge?.toLowerCase().includes('wedding'))
      return 'Flat 20% off on grand royal mandaps';
    return hero.subtitle || 'Experience grandeur like never before';
  };

  const homeActiveFilterCount =
    (homeFilters.category !== 'All' ? 1 : 0) +
    (homeFilters.sortBy !== 'featured' ? 1 : 0) +
    (homeFilters.priceRange !== 'all' ? 1 : 0) +
    (homeFilters.minRating > 0 ? 1 : 0) +
    (homeFilters.city !== 'All' ? 1 : 0) +
    (homeFilters.capacity !== 'all' ? 1 : 0) +
    homeFilters.amenities.length;

  const searchSuggestions = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    const allSecItems = adminSections.flatMap((s) => s.items || []);
    const pool = [...allSecItems, ...venues, ...packages];
    const seen = new Set<string>();
    const results: any[] = [];
    pool.forEach((it: any) => {
      const id = it.id || it.title;
      if (!seen.has(id)) {
        seen.add(id);
        const text = `${it.title || it.name || ''} ${it.location || it.city || ''} ${it.type || ''} ${(it.tags || []).join(' ')}`.toLowerCase();
        if (text.includes(q)) {
          results.push(it);
        }
      }
    });
    return results.slice(0, 4);
  }, [searchQuery, adminSections, venues, packages]);

  // Safe area top for status bar clearance (ensures greeting header is never cut off)
  const headerTopPadding = Math.max(insets.top + 10, 48);
  const heroBannerHeight = 410 + Math.max(insets.top, 24);

  // Safe area bottom for 3-button < o [] navigation and bottom dock
  const contentBottomPadding = 90 + Math.max(insets.bottom, 24);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: contentBottomPadding }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#e11d48" />}
      >
        {/* ========================================== */}
        {/* HERO SLIDER WITH INTEGRATED HEADER         */}
        {/* ========================================== */}
        <View style={[styles.heroBanner, { height: heroBannerHeight }]}>
          {/* Swipable Horizontal Multi-Image Carousel */}
          <ScrollView
            ref={heroScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const slideIdx = Math.round(e.nativeEvent.contentOffset.x / width);
              if (slideIdx !== currentSlide && slideIdx >= 0 && slideIdx < slides.length) {
                setCurrentSlide(slideIdx);
              }
            }}
            style={StyleSheet.absoluteFill}
          >
            {slides.map((slide, idx) => (
              <View key={slide.id || idx} style={{ width, height: heroBannerHeight }}>
                <Image
                  source={getHeroImageSource(slide.image)}
                  style={styles.heroImage}
                  resizeMode="cover"
                />
              </View>
            ))}
          </ScrollView>

          {/* Advanced Multi-Layer Optical Cinema Lens Vignette */}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Svg height="100%" width="100%">
              <Defs>
                {/* 1. Master Elliptical Optical Lens Radial Falloff */}
                <RadialGradient id="masterOpticalLens" cx="50%" cy="38%" rx="72%" ry="65%" fx="50%" fy="38%">
                  <Stop offset="0%" stopColor="#000000" stopOpacity="0" />
                  <Stop offset="32%" stopColor="#000000" stopOpacity="0" />
                  <Stop offset="55%" stopColor="#020617" stopOpacity="0.10" />
                  <Stop offset="72%" stopColor="#020617" stopOpacity="0.32" />
                  <Stop offset="85%" stopColor="#020617" stopOpacity="0.60" />
                  <Stop offset="95%" stopColor="#020617" stopOpacity="0.84" />
                  <Stop offset="100%" stopColor="#020617" stopOpacity="0.94" />
                </RadialGradient>

                {/* 2. Four Optical Corner Vignette Gradients */}
                <RadialGradient id="cornerTL" cx="0%" cy="0%" r="60%">
                  <Stop offset="0%" stopColor="#000000" stopOpacity="0.75" />
                  <Stop offset="45%" stopColor="#000000" stopOpacity="0.32" />
                  <Stop offset="80%" stopColor="#000000" stopOpacity="0.06" />
                  <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
                </RadialGradient>
                <RadialGradient id="cornerTR" cx="100%" cy="0%" r="60%">
                  <Stop offset="0%" stopColor="#000000" stopOpacity="0.75" />
                  <Stop offset="45%" stopColor="#000000" stopOpacity="0.32" />
                  <Stop offset="80%" stopColor="#000000" stopOpacity="0.06" />
                  <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
                </RadialGradient>
                <RadialGradient id="cornerBL" cx="0%" cy="100%" r="65%">
                  <Stop offset="0%" stopColor="#020617" stopOpacity="0.88" />
                  <Stop offset="45%" stopColor="#020617" stopOpacity="0.45" />
                  <Stop offset="80%" stopColor="#020617" stopOpacity="0.10" />
                  <Stop offset="100%" stopColor="#020617" stopOpacity="0" />
                </RadialGradient>
                <RadialGradient id="cornerBR" cx="100%" cy="100%" r="65%">
                  <Stop offset="0%" stopColor="#020617" stopOpacity="0.88" />
                  <Stop offset="45%" stopColor="#020617" stopOpacity="0.45" />
                  <Stop offset="80%" stopColor="#020617" stopOpacity="0.10" />
                  <Stop offset="100%" stopColor="#020617" stopOpacity="0" />
                </RadialGradient>

                {/* 3. Top Scrim for Status Bar & Header Navigation Clarity */}
                <SvgGradient id="topNavScrim" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor="#000000" stopOpacity="0.72" />
                  <Stop offset="35%" stopColor="#000000" stopOpacity="0.35" />
                  <Stop offset="70%" stopColor="#000000" stopOpacity="0.08" />
                  <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
                </SvgGradient>

                {/* 4. Organic Cinema Bottom Scrim for Title & Badge Readability */}
                <SvgGradient id="bottomCinemaScrim" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor="#0f172a" stopOpacity="0" />
                  <Stop offset="25%" stopColor="#0f172a" stopOpacity="0.15" />
                  <Stop offset="50%" stopColor="#0f172a" stopOpacity="0.45" />
                  <Stop offset="75%" stopColor="#0f172a" stopOpacity="0.78" />
                  <Stop offset="90%" stopColor="#0f172a" stopOpacity="0.92" />
                  <Stop offset="100%" stopColor="#0f172a" stopOpacity="0.98" />
                </SvgGradient>
              </Defs>

              {/* Layer 1: Master Elliptical Optical Lens Radial Vignette */}
              <Rect x="0" y="0" width="100%" height="100%" fill="url(#masterOpticalLens)" />

              {/* Layer 2: Four-Corner Lens Falloff Shadows */}
              <Rect x="0" y="0" width="55%" height="45%" fill="url(#cornerTL)" />
              <Rect x="45%" y="0" width="55%" height="45%" fill="url(#cornerTR)" />
              <Rect x="0" y="55%" width="55%" height="45%" fill="url(#cornerBL)" />
              <Rect x="45%" y="55%" width="55%" height="45%" fill="url(#cornerBR)" />

              {/* Layer 3: Top Navigation & Status Bar Scrim */}
              <Rect x="0" y="0" width="100%" height="135" fill="url(#topNavScrim)" />

              {/* Layer 4: Bottom Text & Badge Scrim */}
              <Rect x="0" y="40%" width="100%" height="60%" fill="url(#bottomCinemaScrim)" />
            </Svg>
          </View>

          {/* Integrated Header at the top of Hero (Clear of Status Bar) */}
          <View style={[styles.integratedHeader, { top: headerTopPadding }]}>
            {/* Left: Menu button */}
            <TouchableOpacity
              style={styles.menuBtn}
              onPress={() => setSidebarOpen(true)}
              activeOpacity={0.8}
            >
              <Menu size={22} color="#ffffff" strokeWidth={2.4} />
            </TouchableOpacity>

            {/* Center: Location Pill */}
            <TouchableOpacity
              style={styles.locationHeaderBtn}
              onPress={() => setIsLocationModalOpen(true)}
              activeOpacity={0.85}
            >
              <MapPin size={12} color="#f43f5e" />
              <Text style={styles.locationHeaderBtnText} numberOfLines={1}>
                {selectedCity}
              </Text>
              <ChevronDown size={12} color="#ffffff" />
            </TouchableOpacity>

            {/* Right: User Name if logged in, or Sign In button if guest */}
            <View style={styles.headerRightActions}>
              {userProfile && userProfile.name ? (
                <TouchableOpacity
                  style={styles.userHeaderBtn}
                  onPress={() => router.push('/(tabs)/profile')}
                  activeOpacity={0.8}
                >
                  <View style={styles.userHeaderAvatar}>
                    <UserIcon size={13} color="#ffffff" />
                  </View>
                  <Text style={styles.userHeaderBtnText} numberOfLines={1}>
                    {userProfile.name.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.signInHeaderBtn}
                  onPress={() => router.push('/login')}
                  activeOpacity={0.85}
                >
                  <LogIn size={13} color="#ffffff" />
                  <Text style={styles.signInHeaderBtnText}>Sign In</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.bellBtn}
                onPress={() => router.push('/notifications')}
                activeOpacity={0.8}
              >
                <Bell size={18} color="#ffffff" />
                <View style={styles.bellAlertDot} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Hero Bottom Vignette Content with Punchy Tagline & Pagination Indicators */}
          <View style={styles.heroContentBox}>
            {/* Interactive Pagination Capsule Pills */}
            <View style={styles.heroPaginationRow}>
              {slides.map((_, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => goToSlide(idx)}
                  activeOpacity={0.7}
                  style={[
                    styles.heroDot,
                    idx === currentSlide && styles.heroDotActive,
                  ]}
                />
              ))}
              <View style={styles.heroCounterBadge}>
                <Text style={styles.heroCounterText}>
                  {currentSlide + 1} / {slides.length}
                </Text>
              </View>
            </View>

            <View style={styles.featuredBadge}>
              <Flame size={12} color="#ffffff" />
              <Text style={styles.featuredBadgeText}>{activeHero.badge || 'FEATURED OFFER'}</Text>
            </View>

            <Text style={styles.heroTitle} numberOfLines={2}>
              {activeHero.title}
            </Text>

            <TouchableOpacity
              style={styles.heroSubRow}
              onPress={() => router.push('/(tabs)/explore')}
              activeOpacity={0.8}
            >
              <Text style={styles.heroSubtitle}>{getCleanTagline(activeHero)}</Text>
              <View style={styles.heroArrowCircle}>
                <ArrowRight size={13} color="#ffffff" strokeWidth={2.5} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* ========================================== */}
        {/* OVERLAPPING SEARCH BAR                    */}
        {/* ========================================== */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <View style={styles.searchIconBox}>
              <Search size={20} color="#e11d48" />
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="Search wedding, birthday, pandit, catering..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={() =>
                router.push({
                  pathname: '/(tabs)/explore',
                  params: searchQuery.trim() ? { search: searchQuery.trim() } : {},
                })
              }
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={{ padding: 6, marginRight: 4 }}
              >
                <X size={16} color="#94a3b8" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.filterBtn, homeActiveFilterCount > 0 && styles.filterBtnActive]}
              onPress={() => setIsFilterModalOpen(true)}
              activeOpacity={0.75}
            >
              <SlidersHorizontal size={18} color={homeActiveFilterCount > 0 ? '#ffffff' : '#475569'} />
              {homeActiveFilterCount > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{homeActiveFilterCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Live Floating Instant Search Autocomplete Suggestions */}
          {searchQuery.trim().length > 0 && (
            <View style={styles.suggestionsContainer}>
              <View style={styles.suggestionsHeader}>
                <Text style={styles.suggestionsHeaderText}>
                  Matches for "{searchQuery}" ({searchSuggestions.length})
                </Text>
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Text style={styles.suggestionsCloseText}>Close ✕</Text>
                </TouchableOpacity>
              </View>

              {searchSuggestions.length === 0 ? (
                <View style={styles.noSuggestionRow}>
                  <Text style={styles.noSuggestionText}>No exact matches found. Press below to explore all items.</Text>
                </View>
              ) : (
                searchSuggestions.map((item: any, idx: number) => (
                  <TouchableOpacity
                    key={item.id || idx}
                    style={styles.suggestionItem}
                    onPress={() => {
                      setSearchQuery('');
                      handleOpenDetail(item);
                    }}
                    activeOpacity={0.85}
                  >
                    <Image
                      source={{
                        uri: item.image || item.imageUrl || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
                      }}
                      style={styles.suggestionThumb}
                    />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.suggestionTitle} numberOfLines={1}>
                        {item.title || item.name}
                      </Text>
                      <Text style={styles.suggestionSub} numberOfLines={1}>
                        📍 {item.location || item.city || 'Pan-India'} • {item.type || 'Celebration'}
                      </Text>
                    </View>
                    <View style={styles.suggestionPriceBox}>
                      <Text style={styles.suggestionPriceText}>
                        {typeof item.price === 'number' ? `₹${item.price.toLocaleString('en-IN')}` : item.price}
                      </Text>
                      <ChevronRight size={14} color="#94a3b8" />
                    </View>
                  </TouchableOpacity>
                ))
              )}

              <TouchableOpacity
                style={styles.seeAllExploreBtn}
                onPress={() => {
                  const q = searchQuery.trim();
                  setSearchQuery('');
                  router.push({
                    pathname: '/(tabs)/explore',
                    params: { search: q },
                  });
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.seeAllExploreBtnText}>View all matches in Explore tab →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Smart Advanced Search Keyword / Category Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cityPillScroll}>
            {[
              { label: '✨ All Categories', query: '', category: 'All' },
              { label: '👑 Wedding Mandaps', query: 'wedding', category: 'Weddings' },
              { label: '🎂 Birthday Themes', query: 'birthday', category: 'Birthdays' },
              { label: '🔥 Vedic Pandit', query: 'pandit', category: 'Pandit' },
              { label: '🍽️ Catering Feasts', query: 'catering', category: 'Catering' },
              { label: '🎨 Haldi & Decor', query: 'decor', category: 'Decor' },
              { label: '🏰 Luxury Venues', query: 'venue', category: 'Venues' },
              { label: '📸 Photo Shoots', query: 'shoot', category: 'Photography' },
            ].map((chip) => {
              const active = searchQuery.toLowerCase() === chip.query.toLowerCase() || (chip.query === '' && !searchQuery);
              return (
                <TouchableOpacity
                  key={chip.label}
                  style={[styles.cityChip, active && styles.cityChipActive]}
                  onPress={() => {
                    setSearchQuery(chip.query);
                    router.push({
                      pathname: '/(tabs)/explore',
                      params: chip.category !== 'All' ? { category: chip.category, search: chip.query } : {},
                    });
                  }}
                  activeOpacity={0.75}
                >
                  <Sparkles size={11} color={active ? '#ffffff' : '#e11d48'} />
                  <Text style={[styles.cityChipText, active && styles.cityChipTextActive]}>{chip.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ========================================== */}
        {/* QUICK CATEGORIES ROW                      */}
        {/* ========================================== */}
        <View style={styles.quickCatRow}>
          {QUICK_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={styles.quickCatItem}
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/explore',
                  params: { category: cat.name },
                })
              }
              activeOpacity={0.8}
            >
              <View style={[styles.quickCatIconBox, { backgroundColor: cat.bg, borderColor: cat.border }]}>
                <cat.icon size={24} color={cat.color} />
              </View>
              <Text style={styles.quickCatName}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </View>


        {/* ========================================== */}
        {/* DYNAMIC ADMIN CUSTOM CATEGORIES            */}
        {/* ========================================== */}
        {adminCategories.length > 0 && (
          <View style={{ marginTop: 22 }}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <View style={styles.secCustomTagPill}>
                  <Text style={styles.secCustomTagText}>CURATED THEMES</Text>
                </View>
                <Text style={styles.sectionTitle}>Celebration Categories</Text>
                <Text style={styles.sectionSubtitle}>Handpicked themes, catering & venues</Text>
              </View>
              <TouchableOpacity
                style={styles.viewAllRow}
                onPress={() => router.push('/(tabs)/explore')}
                activeOpacity={0.7}
              >
                <Text style={styles.viewAllText}>View All</Text>
                <ChevronRight size={14} color="#e11d48" />
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            >
              {adminCategories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={styles.catBannerCard}
                  activeOpacity={0.88}
                  onPress={() =>
                    router.push({
                      pathname: '/(tabs)/explore',
                      params: { category: cat.name },
                    })
                  }
                >
                  <Image source={{ uri: cat.image }} style={styles.catBannerImg} />
                  <View style={styles.catBannerOverlay} />
                  {cat.tag && (
                    <View style={styles.catTagBadge}>
                      <Text style={styles.catTagBadgeText}>{cat.tag}</Text>
                    </View>
                  )}
                  <View style={styles.catBannerContent}>
                    <Text style={styles.catBannerTitle} numberOfLines={1}>{cat.name}</Text>
                    <Text style={styles.catBannerSub}>
                      {cat.items?.length ? `${cat.items.length} Celebration Items` : 'Explore Collection'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ========================================== */}
        {/* DYNAMIC ADMIN CUSTOM SECTIONS              */}
        {/* ========================================== */}
        {adminSections.map((sec) => (
          <View key={sec.id} style={{ marginTop: 22 }}>
            <View style={styles.sectionHeaderRow}>
              <View>
                {sec.tag && (
                  <View style={styles.secCustomTagPill}>
                    <Text style={styles.secCustomTagText}>{sec.tag}</Text>
                  </View>
                )}
                <Text style={styles.sectionTitle}>{sec.title}</Text>
                <Text style={styles.sectionSubtitle}>{sec.subtitle}</Text>
              </View>
              <TouchableOpacity
                style={styles.viewAllRow}
                onPress={() => router.push('/(tabs)/explore')}
                activeOpacity={0.7}
              >
                <Text style={styles.viewAllText}>View All</Text>
                <ChevronRight size={14} color="#e11d48" />
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            >
              {sec.items.map((it) => {
                const isLiked = likedIds.includes(it.id);
                return (
                  <View key={it.id} style={styles.horizontalCard}>
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() =>
                        router.push({
                          pathname: '/item-detail',
                          params: {
                            id: it.id,
                            title: it.title,
                            subtitle: it.subtitle,
                            price: String(it.price),
                            image: it.image,
                            type: it.itemType || it.type,
                            cornerTag: it.cornerTag,
                            location: it.location,
                          },
                        })
                      }
                      style={styles.cardImageContainer}
                    >
                      <Image source={{ uri: it.image }} style={styles.cardImage} />
                      <View style={styles.cardImageOverlay} />

                      {it.cornerTag ? (
                        <View style={styles.cardCornerTagBadge}>
                          <Text style={styles.cardCornerTagText}>{it.cornerTag.toUpperCase()}</Text>
                        </View>
                      ) : null}

                      <TouchableOpacity
                        style={styles.likeBtn}
                        onPress={() => toggleLike(it)}
                        activeOpacity={0.8}
                      >
                        <Heart
                          size={15}
                          color={isLiked ? '#e11d48' : '#475569'}
                          fill={isLiked ? '#e11d48' : 'transparent'}
                        />
                      </TouchableOpacity>

                      <View style={styles.ratingBadge}>
                        <Star size={11} color="#f59e0b" fill="#f59e0b" style={{ marginRight: 3 }} />
                        <Text style={styles.ratingText}>{it.rating}</Text>
                      </View>
                    </TouchableOpacity>

                    <View style={styles.cardContent}>
                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() =>
                          router.push({
                            pathname: '/item-detail',
                            params: {
                              id: it.id,
                              title: it.title,
                              subtitle: it.subtitle,
                              price: String(it.price),
                              image: it.image,
                              type: it.itemType || it.type,
                              cornerTag: it.cornerTag,
                              location: it.location,
                            },
                          })
                        }
                      >
                        <Text style={styles.cardTitle} numberOfLines={1}>
                          {it.title}
                        </Text>
                        {it.location && (
                          <View style={styles.locationRow}>
                            <MapPin size={12} color="#94a3b8" style={{ marginRight: 3 }} />
                            <Text style={styles.locationText} numberOfLines={1}>
                              {it.location}
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>

                      <View style={styles.cardFooter}>
                        <View style={[styles.typePill, { backgroundColor: it.itemType === 'TICKET' ? '#fef3c7' : '#e0e7ff' }]}>
                          <Text style={[styles.typePillText, { color: it.itemType === 'TICKET' ? '#b45309' : '#3730a3' }]}>
                            {it.itemType === 'TICKET' ? '🎫 TICKET' : '📅 BOOKING'}
                          </Text>
                        </View>
                        <View style={styles.priceContainer}>
                          <Text style={styles.startsAtText}>{it.itemType === 'TICKET' ? 'Per Ticket' : 'From'}</Text>
                          <Text style={styles.priceValue}>
                            {typeof it.price === 'number' ? `₹${it.price.toLocaleString('en-IN')}` : it.price}
                          </Text>
                        </View>
                      </View>

                      {/* Direct "Book / Get Ticket" Button */}
                      <TouchableOpacity
                        style={styles.cardBookNowBtn}
                        onPress={() => handleBookNow(it)}
                        activeOpacity={0.85}
                      >
                        {it.itemType === 'TICKET' ? <Ticket size={13} color="#ffffff" /> : <Calendar size={13} color="#ffffff" />}
                        <Text style={styles.cardBookNowText}>
                          {it.itemType === 'TICKET' ? 'Get Ticket Pass' : 'Reserve Booking'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        ))}

        {/* ========================================== */}
        {/* HORIZONTAL SECTION: PREMIUM VENUES        */}
        {/* ========================================== */}
        {venues.length > 0 && (
          <View style={{ marginTop: 22 }}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Premium Venues</Text>
                <Text style={styles.sectionSubtitle}>Handpicked luxury locations</Text>
              </View>
              <TouchableOpacity
                style={styles.viewAllRow}
                onPress={() => router.push('/(tabs)/explore')}
                activeOpacity={0.7}
              >
                <Text style={styles.viewAllText}>View All</Text>
                <ChevronRight size={14} color="#e11d48" />
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            >
              {venues.map((venue) => {
                const isLiked = likedIds.includes(venue.id);
                return (
                  <View key={venue.id} style={styles.horizontalCard}>
                    {/* Image & Wishlist Button */}
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => handleOpenDetail(venue)}
                      style={styles.cardImageContainer}
                    >
                      <Image source={{ uri: venue.image }} style={styles.cardImage} />
                      <View style={styles.cardImageOverlay} />

                      <TouchableOpacity
                        style={styles.likeBtn}
                        onPress={() => toggleLike(venue)}
                        activeOpacity={0.8}
                      >
                        <Heart
                          size={15}
                          color={isLiked ? '#e11d48' : '#475569'}
                          fill={isLiked ? '#e11d48' : 'transparent'}
                        />
                      </TouchableOpacity>

                      <View style={styles.ratingBadge}>
                        <Star size={11} color="#f59e0b" fill="#f59e0b" style={{ marginRight: 3 }} />
                        <Text style={styles.ratingText}>{venue.rating}</Text>
                      </View>
                    </TouchableOpacity>

                    {/* Card Info */}
                    <View style={styles.cardContent}>
                      <TouchableOpacity onPress={() => handleOpenDetail(venue)} activeOpacity={0.85}>
                        <Text style={styles.cardTitle} numberOfLines={1}>
                          {venue.title}
                        </Text>
                      </TouchableOpacity>
                      <View style={styles.locationRow}>
                        <MapPin size={12} color="#94a3b8" style={{ marginRight: 3 }} />
                        <Text style={styles.locationText} numberOfLines={1}>
                          {venue.location}
                        </Text>
                      </View>

                      <View style={styles.cardFooter}>
                        <View style={styles.typePill}>
                          <Text style={styles.typePillText}>{venue.type}</Text>
                        </View>
                        <View style={styles.priceContainer}>
                          <Text style={styles.startsAtText}>Starts at</Text>
                          <Text style={styles.priceValue}>{venue.price}</Text>
                        </View>
                      </View>

                      {/* Direct "Book Now" Button */}
                      <TouchableOpacity
                        style={styles.cardBookNowBtn}
                        onPress={() => handleBookNow(venue)}
                        activeOpacity={0.85}
                      >
                        <Ticket size={13} color="#ffffff" />
                        <Text style={styles.cardBookNowText}>Book Now</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ========================================== */}
        {/* HORIZONTAL SECTION: CURATED PACKAGES      */}
        {/* ========================================== */}
        {packages.length > 0 && (
          <View style={{ marginTop: 22 }}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Curated Packages</Text>
                <Text style={styles.sectionSubtitle}>All-inclusive celebrations</Text>
              </View>
              <TouchableOpacity
                style={styles.viewAllRow}
                onPress={() => router.push('/(tabs)/explore')}
                activeOpacity={0.7}
              >
                <Text style={styles.viewAllText}>View All</Text>
                <ChevronRight size={14} color="#e11d48" />
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            >
              {packages.map((pkg) => {
                const isLiked = likedIds.includes(pkg.id);
                return (
                  <View key={pkg.id} style={styles.horizontalCard}>
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => handleOpenDetail(pkg)}
                      style={styles.cardImageContainer}
                    >
                      <Image source={{ uri: pkg.image }} style={styles.cardImage} />
                      <View style={styles.cardImageOverlay} />

                      <TouchableOpacity
                        style={styles.likeBtn}
                        onPress={() => toggleLike(pkg)}
                        activeOpacity={0.8}
                      >
                        <Heart
                          size={15}
                          color={isLiked ? '#e11d48' : '#475569'}
                          fill={isLiked ? '#e11d48' : 'transparent'}
                        />
                      </TouchableOpacity>

                      <View style={styles.ratingBadge}>
                        <Star size={11} color="#f59e0b" fill="#f59e0b" style={{ marginRight: 3 }} />
                        <Text style={styles.ratingText}>{pkg.rating}</Text>
                      </View>
                    </TouchableOpacity>

                    <View style={styles.cardContent}>
                      <TouchableOpacity onPress={() => handleOpenDetail(pkg)} activeOpacity={0.85}>
                        <Text style={styles.cardTitle} numberOfLines={1}>
                          {pkg.title}
                        </Text>
                      </TouchableOpacity>
                      <Text style={styles.tagsText} numberOfLines={1}>
                        {pkg.tags.join(' • ')}
                      </Text>

                      <View style={styles.cardFooter}>
                        <View style={styles.typePill}>
                          <Text style={styles.typePillText}>{pkg.type}</Text>
                        </View>
                        <View style={styles.priceContainer}>
                          <Text style={styles.startsAtText}>Starts at</Text>
                          <Text style={styles.priceValue}>{pkg.price}</Text>
                        </View>
                      </View>

                      {/* Direct "Book Now" Button */}
                      <TouchableOpacity
                        style={styles.cardBookNowBtn}
                        onPress={() => handleBookNow(pkg)}
                        activeOpacity={0.85}
                      >
                        <Ticket size={13} color="#ffffff" />
                        <Text style={styles.cardBookNowText}>Book Now</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Empty state when no sections exist yet */}
        {adminSections.length === 0 && venues.length === 0 && packages.length === 0 && (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 24 }}>
            <Sparkles size={40} color="#e11d48" />
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#0f172a', marginTop: 14 }}>
              Welcome to HappyLokam
            </Text>
            <Text style={{ fontSize: 13, color: '#64748b', textAlign: 'center', marginTop: 6, lineHeight: 18 }}>
              New celebrations, curated themes, and venue passes verified by HappyLokam Support will appear here live.
            </Text>
            <TouchableOpacity
              style={{ marginTop: 18, backgroundColor: '#e11d48', paddingHorizontal: 22, paddingVertical: 10, borderRadius: 20 }}
              onPress={onRefresh}
              activeOpacity={0.85}
            >
              <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 13 }}>Refresh Feed 🔄</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Review Booking / Payment Modal */}
      <PaymentModal
        visible={!!checkoutItem}
        item={checkoutItem}
        onClose={() => setCheckoutItem(null)}
        onSuccess={() => {
          setCheckoutItem(null);
          router.push('/(tabs)/bookings');
        }}
      />

      {/* Sidebar Drawer */}
      <SidebarDrawer
        visible={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenWallet={() => setWalletOpen(true)}
        user={{
          name: (userProfile?.name || 'Guest User').replace(' ✨', ''),
          email: userProfile?.email || '',
        }}
      />

      {/* Wallet Modal */}
      <WalletModal
        visible={isWalletOpen}
        onClose={() => setWalletOpen(false)}
        balance={userProfile?.balance || 0}
      />

      {/* Admin Section Manager Modal */}
      <AdminSectionModal
        visible={isAdminModalOpen}
        sections={adminSections}
        onClose={() => setIsAdminModalOpen(false)}
        onSectionsUpdated={(updated) => setAdminSections(updated)}
        onCategoriesUpdated={(updated) => setAdminCategories(updated)}
        onHeroSlidesUpdated={(updated) => setSlides(updated)}
      />

      {/* Advanced Filter Modal from Home Search */}
      <AdvancedFilterModal
        visible={isFilterModalOpen}
        filters={homeFilters}
        totalMatches={adminSections.flatMap((s) => s.items || []).length + venues.length + packages.length}
        onClose={() => setIsFilterModalOpen(false)}
        onApply={(applied) => {
          setHomeFilters(applied);
          setIsFilterModalOpen(false);
          router.push({
            pathname: '/(tabs)/explore',
            params: {
              category: applied.category !== 'All' ? applied.category : undefined,
              priceRange: applied.priceRange !== 'all' ? applied.priceRange : undefined,
              sortBy: applied.sortBy !== 'featured' ? applied.sortBy : undefined,
              minRating: applied.minRating > 0 ? String(applied.minRating) : undefined,
              city: applied.city !== 'All' ? applied.city : undefined,
              capacity: applied.capacity !== 'all' ? applied.capacity : undefined,
              amenities: applied.amenities.length > 0 ? applied.amenities.join(',') : undefined,
              search: searchQuery.trim() || undefined,
            },
          });
        }}
        onReset={() => setHomeFilters(DEFAULT_FILTERS)}
      />

      {/* Location Selector Modal */}
      <Modal
        visible={isLocationModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsLocationModalOpen(false)}
      >
        <View style={styles.locModalOverlay}>
          <View style={styles.locModalContent}>
            <View style={styles.locModalHeader}>
              <View>
                <Text style={styles.locModalTitle}>Select Your Location</Text>
                <Text style={styles.locModalSubtitle}>Choose GPS detection or select your city</Text>
              </View>
              <TouchableOpacity onPress={() => setIsLocationModalOpen(false)} style={styles.locModalClose}>
                <X size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* GPS Auto-Detect Button */}
            <TouchableOpacity
              style={styles.gpsDetectBtn}
              onPress={handleDetectGps}
              disabled={detectingGps}
              activeOpacity={0.85}
            >
              <Navigation size={18} color="#ffffff" />
              {detectingGps ? (
                <ActivityIndicator size="small" color="#ffffff" style={{ marginLeft: 8 }} />
              ) : (
                <Text style={styles.gpsDetectBtnText}>Detect Location via GPS</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.locDividerText}>OR SELECT MANUALLY</Text>

            <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
              <View style={styles.cityGrid}>
                {CITIES_LIST.map((city) => {
                  const isSelected = selectedCity === city;
                  return (
                    <TouchableOpacity
                      key={city}
                      style={[styles.cityItem, isSelected && styles.cityItemActive]}
                      onPress={() => handleSelectCity(city)}
                      activeOpacity={0.75}
                    >
                      <MapPin size={14} color={isSelected ? '#ffffff' : '#e11d48'} />
                      <Text style={[styles.cityItemText, isSelected && styles.cityItemTextActive]}>
                        {city}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Premium Exit Confirmation Modal */}
      <CelebrationDialog
        visible={showExitDialog}
        type="exit"
        badgeText="EXIT APPLICATION"
        title="Leaving HappyLokam? 🏰"
        message="Are you sure you want to exit the application, or would you like to stay and continue exploring grand venues and celebration passes?"
        confirmText="Exit App"
        cancelText="Stay & Explore ✨"
        onConfirm={() => BackHandler.exitApp()}
        onCancel={() => setShowExitDialog(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc', // Slate-50
  },
  scrollContent: {
    flexGrow: 1,
  },

  // Hero Section
  heroBanner: {
    width: '100%',
    backgroundColor: '#0f172a',
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: 'hidden',
    position: 'relative',
  },
  heroImage: {
    ...(StyleSheet.absoluteFill as any),
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroDarkOverlay: {
    ...(StyleSheet.absoluteFill as any),
    backgroundColor: 'rgba(15, 23, 42, 0.08)',
  },
  heroRadialVignette: {
    display: 'none',
  },
  heroBottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 250,
    backgroundColor: 'transparent',
  },
  integratedHeader: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 20,
  },
  menuBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  locationHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    gap: 5,
    maxWidth: width * 0.4,
  },
  locationHeaderBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  locModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  locModalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  locModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  locModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  locModalSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  locModalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpsDetectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e11d48',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  gpsDetectBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  locDividerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.5,
    marginBottom: 12,
    textAlign: 'center',
  },
  cityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 20,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  cityItemActive: {
    backgroundColor: '#e11d48',
    borderColor: '#e11d48',
  },
  cityItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  cityItemTextActive: {
    color: '#ffffff',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  userHeaderAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#e11d48',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userHeaderBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  signInHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#e11d48',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  signInHeaderBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  bellBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    position: 'relative',
  },
  bellAlertDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#e11d48',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  heroNavBtnLeft: {
    position: 'absolute',
    left: 12,
    top: '46%',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 25,
  },
  heroNavBtnRight: {
    position: 'absolute',
    right: 12,
    top: '46%',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 25,
  },
  heroPaginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  heroDot: {
    height: 5,
    width: 7,
    borderRadius: 3.5,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  heroDotActive: {
    width: 24,
    backgroundColor: '#ffffff',
  },
  heroCounterBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    marginLeft: 6,
  },
  heroCounterText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
  },
  heroContentBox: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    zIndex: 15,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(225, 29, 72, 0.95)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 5,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(254, 205, 211, 0.3)',
  },
  featuredBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 27,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
    lineHeight: 33,
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.65)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  heroSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.95)',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  heroArrowCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Overlapping Search
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: -24,
    zIndex: 30,
    marginBottom: 20,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  searchIconBox: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    position: 'relative',
  },
  filterBtnActive: {
    backgroundColor: '#e11d48',
    borderColor: '#e11d48',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#0f172a',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  filterBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  suggestionsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 8,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  suggestionsHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  suggestionsCloseText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
  },
  noSuggestionRow: {
    padding: 16,
    alignItems: 'center',
  },
  noSuggestionText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  suggestionThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
  },
  suggestionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  suggestionSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  suggestionPriceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  suggestionPriceText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#e11d48',
  },
  seeAllExploreBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff1f2',
  },
  seeAllExploreBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#e11d48',
  },

  // Quick Categories
  quickCatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 22,
  },
  quickCatItem: {
    alignItems: 'center',
    gap: 6,
  },
  quickCatIconBox: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  quickCatName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },

  // Admin Banner
  adminBannerContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  adminBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    borderRadius: 18,
    padding: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  adminBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  adminIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#e11d48',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminBannerTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
  },
  adminBannerSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 1,
  },
  adminAddPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 4,
  },
  adminAddPillText: {
    color: '#e11d48',
    fontSize: 12,
    fontWeight: '900',
  },

  // Section Headers
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  secCustomTagPill: {
    backgroundColor: '#fff1f2',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  secCustomTagText: {
    color: '#e11d48',
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
  },
  viewAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingBottom: 2,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#e11d48',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Horizontal Card
  horizontalList: {
    paddingHorizontal: 20,
    gap: 14,
    paddingBottom: 8,
  },
  horizontalCard: {
    width: 275,
    backgroundColor: '#ffffff',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 3,
  },
  cardImageContainer: {
    width: '100%',
    height: 155,
    position: 'relative',
    backgroundColor: '#f1f5f9',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardImageOverlay: {
    ...(StyleSheet.absoluteFill as any),
    backgroundColor: 'rgba(15, 23, 42, 0.15)',
  },
  likeBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  ratingBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0f172a',
  },
  cardContent: {
    padding: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  locationText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    flex: 1,
  },
  tagsText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    marginBottom: 10,
  },
  typePill: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  typePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  startsAtText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#e11d48',
  },
  cardBookNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e11d48',
    paddingVertical: 9,
    borderRadius: 12,
    gap: 6,
    shadowColor: '#e11d48',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  cardBookNowText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: -0.1,
  },
  cardCornerTagBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#dc2626',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    zIndex: 10,
    elevation: 3,
    shadowColor: '#dc2626',
    shadowOpacity: 0.35,
    shadowRadius: 4,
  },
  cardCornerTagText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cityPillScroll: {
    marginTop: 10,
    flexDirection: 'row',
  },
  cityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cityChipActive: {
    backgroundColor: '#e11d48',
    borderColor: '#e11d48',
  },
  cityChipText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  cityChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  catBannerCard: {
    width: 170,
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
    marginRight: 12,
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  catBannerImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  catBannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  catTagBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#e11d48',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  catTagBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  catBannerContent: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
  },
  catBannerTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  catBannerSub: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
});

