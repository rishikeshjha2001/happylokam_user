import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  StatusBar,
  Alert,
  BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import {
  Menu,
  Search,
  Star,
  MapPin,
  SlidersHorizontal,
  X,
  Ticket,
  Heart,
  ChevronRight,
  Sparkles,
  User,
} from 'lucide-react-native';
import { DbCategory } from '../../constants/databaseModels';
import { getVenues, getPackages, getCategories } from '../../services/api';
import { getAdminCustomSections, getAdminCustomCategories } from '../../services/adminSections';
import RoomDatabase from '../../services/roomDatabase';
import AdvancedFilterModal, {
  FilterState,
  DEFAULT_FILTERS,
} from '../../components/AdvancedFilterModal';
import PaymentModal from '../../components/PaymentModal';
import SidebarDrawer from '../../components/SidebarDrawer';
import WalletModal from '../../components/WalletModal';
import OtaSync from '../../services/otaSync';
import SwipeTabContainer from '../../components/SwipeTabContainer';

const { width } = Dimensions.get('window');

const BASE_CATEGORY_FILTERS = [
  'All',
  'Weddings',
  'Wedding Themes',
  'Wedding Offers',
  'Birthdays',
  'Birthday Themes',
  'DJ & Sound',
  'Bridal Makeup',
  'Catering',
  'Baby Shower',
  'Engagements',
  'Choreography',
  'Office Events',
  'Decor',
  'Pandit',
  'Venues',
  'Photography',
  'LokSafari',
  'Packages',
];

export default function ExploreTab() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    category?: string;
    search?: string;
    priceRange?: string;
    sortBy?: 'featured' | 'price_low' | 'price_high' | 'rating';
    minRating?: string;
    city?: string;
    capacity?: string;
    amenities?: string;
  }>();

  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [adminItems, setAdminItems] = useState<any[]>([]);
  const [likedIds, setLikedIds] = useState<string[]>([]);

  // Advanced Filters State
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  // Modals
  const [checkoutItem, setCheckoutItem] = useState<any>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isWalletOpen, setWalletOpen] = useState(false);

  const dynamicCategoryFilters = useMemo(() => {
    const list = ['All'];
    categories.forEach((c) => {
      if (c.type && !list.includes(c.type)) list.push(c.type);
    });
    BASE_CATEGORY_FILTERS.forEach((bc) => {
      if (!list.includes(bc)) list.push(bc);
    });
    return list;
  }, [categories]);

  useEffect(() => {
    if (params.category) {
      const match = dynamicCategoryFilters.find((c) => c.toLowerCase() === params.category?.toLowerCase());
      if (match) {
        setActiveCategory(match);
        if (!params.search) setSearchQuery('');
      } else {
        setSearchQuery(params.category);
      }
    }
    if (params.search) {
      setSearchQuery(params.search);
    }
    // Hydrate advanced filter state from route params
    if (params.priceRange || params.sortBy || params.minRating || params.city || params.capacity || params.amenities) {
      setFilters((prev) => ({
        ...prev,
        category: params.category || prev.category,
        priceRange: params.priceRange || prev.priceRange,
        sortBy: (params.sortBy as any) || prev.sortBy,
        minRating: params.minRating ? parseFloat(params.minRating) : prev.minRating,
        city: params.city || prev.city,
        capacity: params.capacity || prev.capacity,
        amenities: params.amenities ? params.amenities.split(',') : prev.amenities,
      }));
    }
  }, [
    params.category,
    params.search,
    params.priceRange,
    params.sortBy,
    params.minRating,
    params.city,
    params.capacity,
    params.amenities,
    dynamicCategoryFilters,
  ]);

  const loadData = () => {
    Promise.all([
      getVenues(),
      getPackages(),
      getAdminCustomSections(),
      getAdminCustomCategories(),
      getCategories(),
    ])
      .then(([vList, pList, secList, adminCats, apiCats]) => {
        setVenues(vList);
        setPackages(pList);

        // Build dynamic categories list from admin panel + backend with strict deduplication
        const seenCatIds = new Set<string>();
        const seenCatTypes = new Set<string>();
        const dynamicCats: DbCategory[] = [];

        (adminCats || []).forEach((c: any) => {
          const normType = (c.name || '').trim().toLowerCase();
          const cId = c.id || `admin_cat_${normType}`;
          if (normType && !seenCatTypes.has(normType)) {
            seenCatIds.add(cId);
            seenCatTypes.add(normType);
            const itemCount = Array.isArray(c.items) ? c.items.length : 0;
            dynamicCats.push({
              id: cId,
              type: c.name,
              title: c.name,
              count: itemCount > 0 ? `${itemCount} Options` : '',
              image: c.image || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
              size: 'large',
            });
          }
        });

        (apiCats || []).forEach((c: any) => {
          const normType = (c.type || c.name || '').trim().toLowerCase();
          const cId = c.id || `api_cat_${normType}`;
          if (normType && !seenCatTypes.has(normType)) {
            seenCatIds.add(cId);
            seenCatTypes.add(normType);
            dynamicCats.push(c);
          }
        });
        setCategories(dynamicCats);

        // Build flattened items from custom sections and categories
        const secItems = (secList || []).flatMap((s: any) =>
          (s.items || []).map((it: any) => ({
            ...it,
            sectionTitle: s.title,
            type: it.type || it.itemType || s.title,
          }))
        );
        const catItems = (adminCats || []).flatMap((c: any) =>
          (c.items || []).map((it: any) => ({
            ...it,
            sectionTitle: c.name,
            type: it.type || it.itemType || c.name,
          }))
        );

        const seenIds = new Set<string>();
        const combinedAdmin: any[] = [];
        [...secItems, ...catItems].forEach((it: any) => {
          if (it.id && !seenIds.has(it.id)) {
            seenIds.add(it.id);
            combinedAdmin.push(it);
          }
        });

        setAdminItems(combinedAdmin);
      })
      .catch(console.warn);
  };

  useEffect(() => {
    loadData();

    // Load initial favorites from RoomDatabase
    RoomDatabase.getFavorites().then((favs) => {
      setLikedIds(favs.map((f: any) => f.id));
    }).catch(() => {});

    // Listen to live OTA admin uploads
    const unsubOta = OtaSync.subscribe(() => {
      loadData();
    });

    // Android hardware back handler: navigate to Home
    const onBackPress = () => {
      router.replace('/(tabs)');
      return true;
    };
    const backSub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => {
      backSub.remove();
      unsubOta();
    };
  }, []);

  const toggleLike = async (item: any) => {
    try {
      const isNowFav = await RoomDatabase.toggleFavorite(item);
      setLikedIds((prev) => (isNowFav ? [...prev, item.id] : prev.filter((i) => i !== item.id)));
    } catch {
      setLikedIds((prev) => (prev.includes(item.id) ? prev.filter((i) => i !== item.id) : [...prev, item.id]));
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

  // Parse numerical price from string like "₹1.2L" or "₹45,000"
  const parsePrice = (priceStr: string | number): number => {
    if (!priceStr) return 0;
    if (typeof priceStr === 'number') return priceStr;
    const clean = String(priceStr).toUpperCase();
    if (clean.includes('L')) {
      const num = parseFloat(clean.replace(/[^\d.]/g, ''));
      return num * 100000;
    }
    return parseFloat(clean.replace(/[^\d.]/g, '')) || 0;
  };

  // Filtered Listings based on advanced multi-criteria engine
  const filteredItems = useMemo(() => {
    const combined = [...venues, ...packages, ...adminItems];

    return combined.filter((item) => {
      // 1. Category Filter with Semantic Matching
      if (activeCategory !== 'All') {
        const catKey = activeCategory.toLowerCase();
        const itemType = (item.type || '').toLowerCase();
        const itemTags = (item.tags || []).map((t: string) => String(t).toLowerCase()).join(' ');
        const itemTitle = (item.title || item.name || '').toLowerCase();

        let matchesCat = false;
        if (catKey === 'weddings') {
          matchesCat = itemType.includes('wedding') || itemTags.includes('wedding') || itemTitle.includes('wedding') || itemTitle.includes('mandap') || itemTags.includes('varmala');
        } else if (catKey === 'birthdays') {
          matchesCat = itemType.includes('birthday') || itemTags.includes('birthday') || itemTitle.includes('birthday') || itemTitle.includes('fiesta');
        } else if (catKey === 'packages') {
          matchesCat = itemType.includes('package') || itemTags.includes('package') || itemTitle.includes('package');
        } else if (catKey === 'decor') {
          matchesCat = itemType.includes('decor') || itemTags.includes('decor') || itemTitle.includes('decor') || itemTitle.includes('floral');
        } else if (catKey === 'catering') {
          matchesCat = itemType.includes('catering') || itemTags.includes('catering') || itemTitle.includes('catering') || itemTitle.includes('buffet') || itemTags.includes('ghee');
        } else if (catKey === 'pandit') {
          matchesCat = itemType.includes('pandit') || itemTags.includes('pandit') || itemTitle.includes('pandit') || itemTags.includes('vedic');
        } else if (catKey === 'venues') {
          matchesCat = itemType.includes('venue') || itemType.includes('palace') || itemType.includes('resort') || itemType.includes('haveli');
        } else if (catKey === 'photography') {
          matchesCat = itemType.includes('photo') || itemType.includes('shoot') || itemTags.includes('shoot');
        } else if (catKey.includes('dj') || catKey.includes('sound')) {
          matchesCat = itemType.includes('dj') || itemTags.includes('dj') || itemTitle.includes('dj') || itemTags.includes('sound') || itemTitle.includes('music');
        } else if (catKey.includes('makeup') || catKey.includes('bridal')) {
          matchesCat = itemType.includes('makeup') || itemTags.includes('makeup') || itemTitle.includes('makeup') || itemTags.includes('beauty') || itemTags.includes('bridal');
        } else if (catKey.includes('choreo') || catKey.includes('dance')) {
          matchesCat = itemType.includes('choreo') || itemTags.includes('dance') || itemTitle.includes('dance') || itemTitle.includes('sangeet');
        } else if (catKey.includes('theme')) {
          matchesCat = itemType.includes('theme') || itemTags.includes('theme') || itemTitle.includes('theme') || itemTitle.includes('setup') || itemTitle.includes('decor');
        } else {
          matchesCat = itemType.includes(catKey) || itemTags.includes(catKey) || itemTitle.includes(catKey);
        }

        if (!matchesCat) return false;
      }

      // 2. Advanced Multi-Keyword / NLP Search Matcher
      if (searchQuery.trim()) {
        const queryTokens = searchQuery
          .toLowerCase()
          .replace(/[^\w\s]/gi, ' ')
          .split(/\s+/)
          .filter(Boolean);

        const haystack = [
          item.title,
          item.name,
          item.subtitle,
          item.location,
          item.city,
          item.type,
          item.itemType,
          item.cornerTag,
          item.description,
          ...(item.tags || []),
          ...(item.features || []),
          ...(item.amenities || []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        // Match tokens flexibly
        const hasMatch = queryTokens.some((tok) => haystack.includes(tok));
        if (!hasMatch) return false;
      }

      // 3. Price Range Filter
      const priceVal = parsePrice(item.price);
      if (filters.priceRange === 'under_50k' && priceVal > 50000) return false;
      if (filters.priceRange === '50k_150k' && (priceVal < 50000 || priceVal > 150000)) return false;
      if (filters.priceRange === '150k_300k' && (priceVal < 150000 || priceVal > 300000)) return false;
      if (filters.priceRange === 'above_300k' && priceVal < 300000) return false;

      // 4. Rating Filter
      if (filters.minRating > 0 && (item.rating || 0) < filters.minRating) return false;

      // 5. City / Location Filter
      if (filters.city !== 'All') {
        const targetCity = filters.city.toLowerCase().trim();
        const itemLoc = `${item.location || ''} ${item.city || ''} ${item.title || ''}`.toLowerCase();
        if (!itemLoc.includes(targetCity)) return false;
      }

      // 6. Amenities Filter
      if (filters.amenities.length > 0) {
        const itemTags = (item.tags || []).map((t: string) => t.toLowerCase());
        const hasAnyAmenity = filters.amenities.some((am) =>
          itemTags.some((tag: string) => tag.includes(am.toLowerCase().slice(0, 4)))
        );
        // Soft match if item has tags
        if (itemTags.length > 0 && !hasAnyAmenity) return false;
      }

      return true;
    }).sort((a, b) => {
      if (filters.sortBy === 'price_low') return parsePrice(a.price) - parsePrice(b.price);
      if (filters.sortBy === 'price_high') return parsePrice(b.price) - parsePrice(a.price);
      if (filters.sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      return 0; // Default featured
    });
  }, [venues, packages, adminItems, activeCategory, searchQuery, filters]);

  const activeFilterCount =
    (activeCategory !== 'All' ? 1 : 0) +
    (filters.sortBy !== 'featured' ? 1 : 0) +
    (filters.priceRange !== 'all' ? 1 : 0) +
    (filters.minRating > 0 ? 1 : 0) +
    (filters.city !== 'All' ? 1 : 0) +
    (filters.capacity !== 'all' ? 1 : 0) +
    filters.amenities.length;

  const topHeaderPadding = Math.max(insets.top, 14);
  const bottomScrollPadding = 90 + Math.max(insets.bottom, 24);

  return (
    <SwipeTabContainer currentTab="explore">
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Top Header matching exact theme */}
      <View style={[styles.header, { paddingTop: topHeaderPadding }]}>
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
          style={styles.avatarBorder}
          onPress={() => setSidebarOpen(true)}
          activeOpacity={0.8}
        >
          <View style={{ width: '100%', height: '100%', backgroundColor: '#fff1f2', alignItems: 'center', justifyContent: 'center' }}>
            <User size={18} color="#e11d48" />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomScrollPadding }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Title, Search & Filter Trigger */}
        <View style={styles.searchSection}>
          <View style={styles.titleRow}>
            <View>
              <Text style={styles.pageTitle}>Explore</Text>
              <Text style={styles.pageSub}>Find verified venues, decorators & artists</Text>
            </View>

            {/* Advanced Filters Button */}
            <TouchableOpacity
              style={[styles.advancedFilterTrigger, activeFilterCount > 0 && styles.advancedFilterTriggerActive]}
              onPress={() => setIsFilterModalOpen(true)}
              activeOpacity={0.85}
            >
              <SlidersHorizontal size={16} color={activeFilterCount > 0 ? '#ffffff' : '#e11d48'} />
              <Text style={[styles.advancedFilterTriggerText, activeFilterCount > 0 && styles.advancedFilterTriggerTextActive]}>
                Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search Box */}
          <View style={styles.searchBox}>
            <Search size={18} color="#94a3b8" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search venues, decorators, cities..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
                <X size={16} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>

          {/* Horizontal Category Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChipsRow}
          >
            {dynamicCategoryFilters.map((filter) => {
              const isActive = activeCategory === filter;
              return (
                <TouchableOpacity
                  key={filter}
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                  onPress={() => setActiveCategory(filter)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                    {filter}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Quick Active Filter Pills Summary */}
          {activeFilterCount > 0 && (
            <View style={styles.activeSummaryRow}>
              <Text style={styles.summaryLabel}>Active Filters:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {filters.city !== 'All' && (
                  <TouchableOpacity
                    style={styles.summaryPill}
                    onPress={() => setFilters((p) => ({ ...p, city: 'All' }))}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.summaryPillText}>📍 {filters.city} ✕</Text>
                  </TouchableOpacity>
                )}
                {filters.minRating > 0 && (
                  <TouchableOpacity
                    style={styles.summaryPill}
                    onPress={() => setFilters((p) => ({ ...p, minRating: 0 }))}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.summaryPillText}>⭐ {filters.minRating}+ Stars ✕</Text>
                  </TouchableOpacity>
                )}
                {filters.priceRange !== 'all' && (
                  <TouchableOpacity
                    style={styles.summaryPill}
                    onPress={() => setFilters((p) => ({ ...p, priceRange: 'all' }))}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.summaryPillText}>💰 {filters.priceRange.replace('_', ' ')} ✕</Text>
                  </TouchableOpacity>
                )}
                {filters.amenities.map((am) => (
                  <TouchableOpacity
                    key={am}
                    style={styles.summaryPill}
                    onPress={() => setFilters((p) => ({ ...p, amenities: p.amenities.filter((x) => x !== am) }))}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.summaryPillText}>✨ {am} ✕</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity onPress={() => setFilters(DEFAULT_FILTERS)} style={styles.clearAllBtn}>
                  <Text style={styles.clearAllBtnText}>Clear All</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}
        </View>

        {/* Bento Grid: Categories (When All or Search is Empty) */}
        {activeCategory === 'All' && !searchQuery.trim() && activeFilterCount === 0 && (
          <View style={styles.gridContainer}>
            {categories.map((cat, idx) => {
              const isLarge = cat.size === 'large';
              return (
                <TouchableOpacity
                  key={`cat-${cat.id || ''}-${cat.type || ''}-${idx}`}
                  style={[styles.gridItem, isLarge ? styles.gridItemLarge : styles.gridItemSmall]}
                  onPress={() => setActiveCategory(cat.type)}
                  activeOpacity={0.9}
                >
                  <Image source={{ uri: cat.image }} style={styles.gridImage} />
                  <View style={styles.gridGradient} />
                  <View style={styles.gridContent}>
                    <Text style={styles.gridType}>{cat.type}</Text>
                    <Text style={styles.gridTitle} numberOfLines={1}>
                      {cat.title}
                    </Text>
                    {Boolean(cat.count) && <Text style={styles.gridCount}>{cat.count}</Text>}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Filtered Celebration Cards List */}
        <View style={styles.resultsContainer}>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>
              {activeCategory === 'All' ? 'Curated Listings' : `Verified ${activeCategory}`}
            </Text>
            <Text style={styles.resultsCountBadge}>{filteredItems.length} options found</Text>
          </View>

          {filteredItems.length === 0 ? (
            <View style={styles.emptyResultsBox}>
              <SlidersHorizontal size={40} color="#cbd5e1" />
              <Text style={styles.emptyResultsTitle}>No Matching Celebrations Found</Text>
              <Text style={styles.emptyResultsSub}>Try adjusting your budget, location, or rating filter.</Text>
              <TouchableOpacity
                style={styles.resetFiltersBtn}
                onPress={() => {
                  setFilters(DEFAULT_FILTERS);
                  setActiveCategory('All');
                  setSearchQuery('');
                }}
              >
                <Text style={styles.resetFiltersBtnText}>Reset All Filters</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.cardsGrid}>
              {filteredItems.map((item) => {
                const isLiked = likedIds.includes(item.id);
                return (
                  <View key={item.id} style={styles.celebrationCard}>
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => handleOpenDetail(item)}
                      style={styles.cardCover}
                    >
                      <Image source={{ uri: item.image }} style={styles.cardImg} />
                      <View style={styles.cardCoverOverlay} />

                      {/* Wishlist Button */}
                      <TouchableOpacity
                        style={styles.cardLikeBtn}
                        onPress={() => toggleLike(item)}
                        activeOpacity={0.8}
                      >
                        <Heart
                          size={15}
                          color={isLiked ? '#e11d48' : '#475569'}
                          fill={isLiked ? '#e11d48' : 'transparent'}
                        />
                      </TouchableOpacity>

                      {/* Rating Badge */}
                      <View style={styles.cardRatingPill}>
                        <Star size={11} color="#f59e0b" fill="#f59e0b" style={{ marginRight: 3 }} />
                        <Text style={styles.cardRatingText}>{item.rating || 4.9}</Text>
                      </View>
                    </TouchableOpacity>

                    {/* Card Body */}
                    <View style={styles.cardDetails}>
                      <View style={styles.cardTypeRow}>
                        <View style={styles.typeTag}>
                          <Text style={styles.typeTagText}>{item.type || 'Celebration'}</Text>
                        </View>
                        <Text style={styles.cardPriceText}>{item.price}</Text>
                      </View>

                      <TouchableOpacity onPress={() => handleOpenDetail(item)} activeOpacity={0.8}>
                        <Text style={styles.itemTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                      </TouchableOpacity>

                      {item.location && (
                        <View style={styles.itemLocRow}>
                          <MapPin size={12} color="#94a3b8" />
                          <Text style={styles.itemLocText} numberOfLines={1}>
                            {item.location}
                          </Text>
                        </View>
                      )}

                      {/* Direct Book Now Button */}
                      <TouchableOpacity
                        style={styles.bookNowBtn}
                        onPress={() => handleBookNow(item)}
                        activeOpacity={0.85}
                      >
                        <Ticket size={14} color="#ffffff" />
                        <Text style={styles.bookNowBtnText}>Book Now</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Advanced Filter Modal */}
      <AdvancedFilterModal
        visible={isFilterModalOpen}
        filters={filters}
        totalMatches={filteredItems.length}
        onClose={() => setIsFilterModalOpen(false)}
        onApply={(updated) => setFilters(updated)}
        onReset={() => setFilters(DEFAULT_FILTERS)}
      />

      {/* Review Booking / Payment Modal */}
      <PaymentModal
        visible={!!checkoutItem}
        item={checkoutItem}
        onClose={() => setCheckoutItem(null)}
        onSuccess={() => {
          setCheckoutItem(null);
        }}
      />

      {/* Sidebar Drawer */}
      <SidebarDrawer
        visible={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenWallet={() => setWalletOpen(true)}
      />

      {/* Wallet Modal */}
      <WalletModal
        visible={isWalletOpen}
        onClose={() => setWalletOpen(false)}
        balance={2450}
      />
      </View>
    </SwipeTabContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    height: 72,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    zIndex: 25,
  },
  menuBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#e11d48',
    letterSpacing: -0.5,
  },
  avatarBorder: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
  },
  avatar: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  scrollContent: {
    flexGrow: 1,
  },

  // Search & Filter Header
  searchSection: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  pageSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 1,
  },
  advancedFilterTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  advancedFilterTriggerActive: {
    backgroundColor: '#e11d48',
    borderColor: '#e11d48',
  },
  advancedFilterTriggerText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#e11d48',
  },
  advancedFilterTriggerTextActive: {
    color: '#ffffff',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  clearSearchBtn: {
    padding: 6,
  },
  filterChipsRow: {
    gap: 8,
    paddingVertical: 2,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  filterChipTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  activeSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  summaryPill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  summaryPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  clearAllBtnSecondary: {
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  clearAllBtnTextSecondary: {
    fontSize: 11,
    fontWeight: '800',
    color: '#e11d48',
  },

  // Bento Grid
  gridContainer: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0f172a',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  gridItemLarge: {
    width: '100%',
    height: 160,
  },
  gridItemSmall: {
    width: (width - 44) / 2,
    height: (width - 44) / 2,
  },
  gridImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gridGradient: {
    ...(StyleSheet.absoluteFill as any),
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  gridContent: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    right: 14,
  },
  gridType: {
    fontSize: 9,
    fontWeight: '900',
    color: '#fda4af',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  gridTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  gridCount: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },

  // Results & Celebration Cards
  resultsContainer: {
    paddingHorizontal: 16,
    marginTop: 10,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  resultsCountBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  emptyResultsBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  emptyResultsTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#334155',
    marginTop: 12,
  },
  emptyResultsSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 240,
  },
  resetFiltersBtn: {
    marginTop: 14,
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  resetFiltersBtnText: {
    color: '#e11d48',
    fontSize: 12,
    fontWeight: '800',
  },
  clearAllBtn: {
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearAllBtnText: {
    color: '#e11d48',
    fontSize: 11,
    fontWeight: '800',
  },
  cardsGrid: {
    gap: 14,
  },
  celebrationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardCover: {
    width: '100%',
    height: 180,
    position: 'relative',
    backgroundColor: '#f1f5f9',
  },
  cardImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardCoverOverlay: {
    ...(StyleSheet.absoluteFill as any),
    backgroundColor: 'rgba(15, 23, 42, 0.15)',
  },
  cardLikeBtn: {
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
  cardRatingPill: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardRatingText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0f172a',
  },
  cardDetails: {
    padding: 16,
  },
  cardTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  typeTag: {
    backgroundColor: '#fff1f2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeTagText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#e11d48',
    textTransform: 'uppercase',
  },
  cardPriceText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0f172a',
  },
  itemTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  itemLocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  itemLocText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    flex: 1,
  },
  bookNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e11d48',
    paddingVertical: 11,
    borderRadius: 14,
    gap: 6,
    shadowColor: '#e11d48',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  bookNowBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
});
