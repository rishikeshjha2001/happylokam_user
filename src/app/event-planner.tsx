import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Linking,
  BackHandler,
  Image,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Calculator,
  Users,
  Sparkles,
  Building2,
  UtensilsCrossed,
  Palette,
  Camera,
  Music,
  ArrowRight,
  ShieldCheck,
  Send,
  CheckCircle2,
  Bookmark,
  Share2,
  Lightbulb,
  Star,
  MapPin,
  Check,
  ChevronRight,
  Trash2,
  FolderHeart,
  X,
} from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  CELEBRATION_THEMES,
  CelebrationTheme,
} from '../constants/eventPlannerThemes';
import RoomDatabase, { SavedEventPlan } from '../services/roomDatabase';
import { getAdminCustomSections, AdminSectionItem } from '../services/adminSections';
import { MASTER_CELEBRATION_EVENTS } from '../constants/celebrationEvents';

const { width } = Dimensions.get('window');

const QUICK_GUEST_PRESETS = [75, 150, 300, 500, 800, 1200];
const DESTINATION_CITIES = ['Patna', 'Ranchi', 'Varanasi', 'Bodh Gaya', 'Kolkata', 'Lucknow', 'Jaipur'];

export default function EventPlannerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // 1. Core Selection State
  const [selectedThemeId, setSelectedThemeId] = useState<string>('vedic-vivah');
  const [selectedCity, setSelectedCity] = useState<string>('Patna');
  const [guestCount, setGuestCount] = useState<number>(350);

  // 2. Fine-Tuning State
  const [selectedFoodId, setSelectedFoodId] = useState<string>('deluxe-regal-buffet');
  const [selectedDecorId, setSelectedDecorId] = useState<string>('decor-premium');
  const [selectedMediaId, setSelectedMediaId] = useState<string>('media-cinematic');

  // 3. Live Matching Packages State
  const [matchingItems, setMatchingItems] = useState<AdminSectionItem[]>([]);
  const [loadingPackages, setLoadingPackages] = useState<boolean>(true);

  // 4. Saved Plans Modal State
  const [savedPlans, setSavedPlans] = useState<SavedEventPlan[]>([]);
  const [savedModalVisible, setSavedModalVisible] = useState<boolean>(false);

  // Hardware Back Handler
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        router.back();
        return true;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => sub.remove();
    }, [])
  );

  // Current Theme Config
  const currentTheme: CelebrationTheme = useMemo(() => {
    return CELEBRATION_THEMES.find((t) => t.id === selectedThemeId) || CELEBRATION_THEMES[0];
  }, [selectedThemeId]);

  // When theme changes, initialize default sub-options
  useEffect(() => {
    if (currentTheme) {
      if (currentTheme.foodOptions.length > 1) {
        setSelectedFoodId(currentTheme.foodOptions[1].id);
      } else if (currentTheme.foodOptions.length > 0) {
        setSelectedFoodId(currentTheme.foodOptions[0].id);
      }
      if (currentTheme.decorLevels.length > 1) {
        setSelectedDecorId(currentTheme.decorLevels[1].id);
      } else if (currentTheme.decorLevels.length > 0) {
        setSelectedDecorId(currentTheme.decorLevels[0].id);
      }
      if (currentTheme.mediaTiers.length > 1) {
        setSelectedMediaId(currentTheme.mediaTiers[1].id);
      } else if (currentTheme.mediaTiers.length > 0) {
        setSelectedMediaId(currentTheme.mediaTiers[0].id);
      }
    }
  }, [selectedThemeId]);

  // Load Saved Plans on mount
  const refreshSavedPlans = useCallback(async () => {
    try {
      const plans = await RoomDatabase.getSavedEventPlans();
      setSavedPlans(plans);
    } catch {}
  }, []);

  useEffect(() => {
    refreshSavedPlans();
  }, [refreshSavedPlans]);

  // Fetch Live Matching Catalog Packages
  useEffect(() => {
    let isMounted = true;
    async function loadCatalog() {
      setLoadingPackages(true);
      try {
        const sections = await getAdminCustomSections();
        const allItems: AdminSectionItem[] = [];
        sections.forEach((s) => {
          if (Array.isArray(s.items)) {
            allItems.push(...s.items);
          }
        });

        // Filter items by category/theme keywords or city
        const themeKeywords = [
          currentTheme.category,
          currentTheme.id.split('-')[0],
          'wedding',
          'banquet',
          'hall',
          'celebration',
          'venue',
        ];

        const matched = allItems.filter((item) => {
          const itemText = `${item.title} ${item.subtitle || ''} ${item.location || ''} ${item.type || ''}`.toLowerCase();
          const matchesKeyword = themeKeywords.some((k) => itemText.includes(k.toLowerCase()));
          const matchesCity = !item.location || item.location.toLowerCase().includes(selectedCity.toLowerCase());
          return matchesKeyword || matchesCity;
        });

        if (isMounted) {
          if (matched.length > 0) {
            setMatchingItems(matched.slice(0, 4));
          } else if (allItems.length > 0) {
            setMatchingItems(allItems.slice(0, 4));
          } else {
            // Fallback to celebration events converted to items
            const fallbackList: AdminSectionItem[] = MASTER_CELEBRATION_EVENTS.slice(0, 4).map((e) => ({
              id: e.id,
              title: e.title,
              subtitle: e.description,
              image: e.image || 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
              price: typeof e.price === 'string' ? (parseInt(e.price.replace(/\D/g, ''), 10) || 1499) : 1499,
              rating: e.rating || 5,
              location: e.location,
              itemType: 'BOOKING',
              availableDates: [e.date],
            }));
            setMatchingItems(fallbackList);
          }
        }
      } catch {
        if (isMounted) setMatchingItems([]);
      } finally {
        if (isMounted) setLoadingPackages(false);
      }
    }
    loadCatalog();
    return () => {
      isMounted = false;
    };
  }, [currentTheme, selectedCity]);

  // Calculations across the 5 Pillars
  const calculations = useMemo(() => {
    const food = currentTheme.foodOptions.find((f) => f.id === selectedFoodId) || currentTheme.foodOptions[0];
    const decor = currentTheme.decorLevels.find((d) => d.id === selectedDecorId) || currentTheme.decorLevels[0];
    const media = currentTheme.mediaTiers.find((m) => m.id === selectedMediaId) || currentTheme.mediaTiers[0];

    const plateRate = food?.ratePerPlate || 950;
    const cateringCost = plateRate * guestCount;

    // Venue scales mildly with capacity threshold
    const capacityFactor = guestCount > 500 ? 1.35 : guestCount > 250 ? 1.15 : 1.0;
    const venueCost = Math.round(currentTheme.baseVenueRate * capacityFactor);

    const decorCost = decor?.cost || 85000;
    const mediaCost = media?.cost || 45000;

    const subtotal = cateringCost + venueCost + decorCost + mediaCost;
    const bufferCost = Math.round(subtotal * 0.05); // 5% Contingency Buffer
    const grandTotal = subtotal + bufferCost;

    // Percentages
    const cateringPct = Math.round((cateringCost / grandTotal) * 100);
    const venuePct = Math.round((venueCost / grandTotal) * 100);
    const decorPct = Math.round((decorCost / grandTotal) * 100);
    const mediaPct = Math.round((mediaCost / grandTotal) * 100);
    const bufferPct = Math.max(1, 100 - (cateringPct + venuePct + decorPct + mediaPct));

    return {
      plateRate,
      cateringCost,
      venueCost,
      decorCost,
      mediaCost,
      bufferCost,
      grandTotal,
      percentages: {
        catering: cateringPct,
        venue: venuePct,
        decor: decorPct,
        media: mediaPct,
        buffer: bufferPct,
      },
      selectedFood: food,
      selectedDecor: decor,
      selectedMedia: media,
    };
  }, [currentTheme, selectedFoodId, selectedDecorId, selectedMediaId, guestCount]);

  // Save Plan Action
  const handleSavePlan = async () => {
    try {
      const newPlan: SavedEventPlan = {
        id: 'plan_' + Date.now(),
        themeId: currentTheme.id,
        themeName: currentTheme.name,
        city: selectedCity,
        guestCount,
        totalBudget: calculations.grandTotal,
        foodOptionId: selectedFoodId,
        foodOptionLabel: calculations.selectedFood?.label || 'Custom Menu',
        decorLevelId: selectedDecorId,
        decorLevelLabel: calculations.selectedDecor?.label || 'Custom Decor',
        mediaTierId: selectedMediaId,
        mediaTierLabel: calculations.selectedMedia?.label || 'Custom Media',
        breakdown: {
          catering: calculations.cateringCost,
          venue: calculations.venueCost,
          decor: calculations.decorCost,
          media: calculations.mediaCost,
          buffer: calculations.bufferCost,
        },
        createdAt: new Date().toISOString(),
      };

      await RoomDatabase.saveEventPlan(newPlan);
      await refreshSavedPlans();
      Alert.alert(
        'Plan Saved to Profile! 📁',
        `Your "${currentTheme.name}" celebration blueprint (₹${calculations.grandTotal.toLocaleString('en-IN')}) has been saved. Access it anytime from your profile.`
      );
    } catch {
      Alert.alert('Save Notice', 'Could not save event plan. Please try again.');
    }
  };

  // Delete Plan Action
  const handleDeletePlan = async (id: string) => {
    await RoomDatabase.deleteSavedEventPlan(id);
    await refreshSavedPlans();
  };

  // Load Saved Plan
  const handleLoadPlan = (plan: SavedEventPlan) => {
    setSelectedThemeId(plan.themeId);
    setSelectedCity(plan.city);
    setGuestCount(plan.guestCount);
    setSelectedFoodId(plan.foodOptionId);
    setSelectedDecorId(plan.decorLevelId);
    setSelectedMediaId(plan.mediaTierId);
    setSavedModalVisible(false);
    Alert.alert('Blueprint Loaded! ✨', `Restored "${plan.themeName}" for ${plan.guestCount} guests.`);
  };

  // WhatsApp Share Action
  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `🎊 *happylokam AI Celebration & Wedding Blueprint*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `👑 *Theme:* ${currentTheme.name}\n` +
      `📍 *Destination:* ${selectedCity}\n` +
      `👥 *Guests:* ${guestCount} attendees\n` +
      `💰 *Estimated Budget:* ₹${calculations.grandTotal.toLocaleString('en-IN')}\n\n` +
      `*5-Pillar Cost Breakdown:*\n` +
      `🍽️ *Catering (${calculations.percentages.catering}%):* ₹${calculations.cateringCost.toLocaleString('en-IN')} (${guestCount} plates @ ₹${calculations.plateRate})\n` +
      `   └ _${calculations.selectedFood?.label}_\n` +
      `🏛️ *Venue & Lawns (${calculations.percentages.venue}%):* ₹${calculations.venueCost.toLocaleString('en-IN')}\n` +
      `🎨 *Decor & Stage (${calculations.percentages.decor}%):* ₹${calculations.decorCost.toLocaleString('en-IN')}\n` +
      `   └ _${calculations.selectedDecor?.label}_\n` +
      `📸 *Photo, Video & DJ (${calculations.percentages.media}%):* ₹${calculations.mediaCost.toLocaleString('en-IN')}\n` +
      `   └ _${calculations.selectedMedia?.label}_\n` +
      `🛡️ *Contingency Buffer (5%):* ₹${calculations.bufferCost.toLocaleString('en-IN')}\n\n` +
      `✨ *Plan your celebration on happylokam:*\n` +
      `https://happylokam.com/event-planner`
    );

    Linking.openURL(`https://wa.me/?text=${text}`).catch(() => {
      Alert.alert('Share', 'Please ensure WhatsApp is installed on your device.');
    });
  };

  // Consult Concierge Action
  const handleConsultConcierge = () => {
    const msg = encodeURIComponent(
      `Hello happylokam Concierge! I just planned a ${currentTheme.name} for ${guestCount} guests in ${selectedCity} with an estimated budget of ₹${calculations.grandTotal.toLocaleString('en-IN')}. Please assign an expert event planner to assist with vendor bookings.`
    );
    Linking.openURL(`https://wa.me/918969255561?text=${msg}`).catch(() => {
      Linking.openURL('tel:+918969255561');
    });
  };

  // Direct Booking Action
  const handleBookCuratedPackage = (item: AdminSectionItem) => {
    router.push({
      pathname: '/item-detail',
      params: {
        id: item.id,
        title: item.title,
        subtitle: item.subtitle || `${currentTheme.name} Curated Package`,
        price: String(item.price || calculations.plateRate),
        image: item.image,
        guestCount: String(guestCount),
        platesCount: String(guestCount),
      },
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color="#0f172a" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Sparkles size={16} color="#e11d48" />
            <Text style={styles.headerTitle}>AI Event Budget Planner</Text>
          </View>
          <Text style={styles.headerSubtitle}>Real-time financial modeling & curated themes</Text>
        </View>

        {savedPlans.length > 0 && (
          <TouchableOpacity
            style={styles.savedBadgeBtn}
            onPress={() => setSavedModalVisible(true)}
            activeOpacity={0.8}
          >
            <FolderHeart size={16} color="#e11d48" />
            <Text style={styles.savedBadgeText}>{savedPlans.length}</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 60 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Destination City Bar */}
        <View style={styles.citySwitcherBar}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 }}>
            <MapPin size={14} color="#e11d48" />
            <Text style={styles.sectionLabel}>Select Destination City</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {DESTINATION_CITIES.map((c) => {
              const active = selectedCity.toLowerCase() === c.toLowerCase();
              return (
                <TouchableOpacity
                  key={c}
                  style={[styles.cityChip, active && styles.cityChipActive]}
                  onPress={() => setSelectedCity(c)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.cityChipText, active && styles.cityChipTextActive]}>
                    {c}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 1. Theme Carousel */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionHeading}>1. Curated Celebration Theme</Text>
            <Text style={styles.sectionSub}>Select a signature style</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.themesCarousel}
          >
            {CELEBRATION_THEMES.map((theme) => {
              const isSelected = selectedThemeId === theme.id;
              return (
                <TouchableOpacity
                  key={theme.id}
                  style={[styles.themeCard, isSelected && styles.themeCardSelected]}
                  onPress={() => setSelectedThemeId(theme.id)}
                  activeOpacity={0.88}
                >
                  <View style={styles.themeImageWrap}>
                    <Image source={{ uri: theme.image }} style={styles.themeImage} />
                    <View style={styles.themeGradientOverlay} />
                    <View style={styles.themeBadge}>
                      <Text style={styles.themeBadgeText}>{theme.badge}</Text>
                    </View>
                    {isSelected && (
                      <View style={styles.selectedTickBadge}>
                        <Check size={14} color="#ffffff" strokeWidth={3} />
                      </View>
                    )}
                  </View>
                  <View style={styles.themeContent}>
                    <Text style={styles.themeName} numberOfLines={1}>{theme.name}</Text>
                    <Text style={styles.themeTagline} numberOfLines={2}>{theme.tagline}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Selected Theme Highlight Banner */}
        <View style={[styles.themeHighlightBanner, { borderColor: currentTheme.color + '40' }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.highlightTitle, { color: currentTheme.color }]}>
              {currentTheme.name}
            </Text>
            <Text style={styles.highlightDesc}>{currentTheme.description}</Text>
            <View style={styles.inclusionsList}>
              {currentTheme.recommendedInclusions.slice(0, 3).map((inc, i) => (
                <View key={i} style={styles.incRow}>
                  <CheckCircle2 size={13} color={currentTheme.color} />
                  <Text style={styles.incText}>{inc}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* 2. Guest Count & Attendance */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionHeading}>2. Expected Guest Attendance</Text>
            <Text style={styles.guestHighlight}>{guestCount} Guests</Text>
          </View>

          {/* Quick Preset Chips */}
          <View style={styles.presetRow}>
            {QUICK_GUEST_PRESETS.map((p) => {
              const active = guestCount === p;
              return (
                <TouchableOpacity
                  key={p}
                  style={[styles.presetChip, active && styles.presetChipActive]}
                  onPress={() => setGuestCount(p)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.presetText, active && styles.presetTextActive]}>
                    {p}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Stepper Control */}
          <View style={styles.stepperContainer}>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => setGuestCount((g) => Math.max(25, g - 25))}
              activeOpacity={0.7}
            >
              <Text style={styles.stepBtnText}>-25</Text>
            </TouchableOpacity>

            <View style={styles.guestInputWrap}>
              <Users size={16} color="#64748b" />
              <TextInput
                style={styles.guestInput}
                value={String(guestCount)}
                keyboardType="numeric"
                onChangeText={(txt) => {
                  const n = parseInt(txt, 10);
                  if (!isNaN(n)) setGuestCount(Math.min(10000, Math.max(1, n)));
                  else if (txt === '') setGuestCount(0);
                }}
              />
              <Text style={styles.guestInputSuffix}>Attendees</Text>
            </View>

            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => setGuestCount((g) => Math.min(10000, g + 25))}
              activeOpacity={0.7}
            >
              <Text style={styles.stepBtnText}>+25</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. Interactive Component Fine-Tuning */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>3. Fine-Tune Components & Services</Text>

          {/* A. Food Menu Tier */}
          <View style={styles.customizerBlock}>
            <View style={styles.customizerHeader}>
              <UtensilsCrossed size={16} color="#e11d48" />
              <Text style={styles.customizerTitle}>Catering & Food Menu Tier</Text>
            </View>
            <View style={{ gap: 8 }}>
              {currentTheme.foodOptions.map((opt) => {
                const isSelected = selectedFoodId === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                    onPress={() => setSelectedFoodId(opt.id)}
                    activeOpacity={0.8}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.optionName, isSelected && styles.optionNameSelected]}>
                          {opt.label}
                        </Text>
                        {opt.badge && (
                          <View style={styles.miniBadge}>
                            <Text style={styles.miniBadgeText}>{opt.badge}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.optionDesc}>{opt.description}</Text>
                    </View>
                    <View style={styles.ratePill}>
                      <Text style={styles.ratePillText}>₹{opt.ratePerPlate}/plate</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* B. Stage & Theme Decor Production */}
          <View style={styles.customizerBlock}>
            <View style={styles.customizerHeader}>
              <Palette size={16} color="#8b5cf6" />
              <Text style={styles.customizerTitle}>Stage & Theme Decor Production</Text>
            </View>
            <View style={{ gap: 8 }}>
              {currentTheme.decorLevels.map((dec) => {
                const isSelected = selectedDecorId === dec.id;
                return (
                  <TouchableOpacity
                    key={dec.id}
                    style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                    onPress={() => setSelectedDecorId(dec.id)}
                    activeOpacity={0.8}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.optionName, isSelected && styles.optionNameSelected]}>
                          {dec.label}
                        </Text>
                        {dec.badge && (
                          <View style={styles.miniBadge}>
                            <Text style={styles.miniBadgeText}>{dec.badge}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.optionDesc}>{dec.description}</Text>
                    </View>
                    <View style={styles.ratePill}>
                      <Text style={styles.ratePillText}>₹{dec.cost.toLocaleString('en-IN')}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* C. Photography, Drone & Video */}
          <View style={styles.customizerBlock}>
            <View style={styles.customizerHeader}>
              <Camera size={16} color="#0284c7" />
              <Text style={styles.customizerTitle}>Cinematography & Photography</Text>
            </View>
            <View style={{ gap: 8 }}>
              {currentTheme.mediaTiers.map((med) => {
                const isSelected = selectedMediaId === med.id;
                return (
                  <TouchableOpacity
                    key={med.id}
                    style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                    onPress={() => setSelectedMediaId(med.id)}
                    activeOpacity={0.8}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.optionName, isSelected && styles.optionNameSelected]}>
                          {med.label}
                        </Text>
                        {med.badge && (
                          <View style={styles.miniBadge}>
                            <Text style={styles.miniBadgeText}>{med.badge}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.optionDesc}>{med.description}</Text>
                    </View>
                    <View style={styles.ratePill}>
                      <Text style={styles.ratePillText}>₹{med.cost.toLocaleString('en-IN')}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* 4. Comprehensive 5-Pillar Budget Breakdown Card */}
        <View style={styles.breakdownCard}>
          <View style={styles.breakdownHeader}>
            <View>
              <Text style={styles.bdTitle}>Total Estimated Budget</Text>
              <Text style={styles.bdSubtitle}>happylokam dynamic market intelligence</Text>
            </View>
            <View style={styles.grandTotalWrap}>
              <Text style={styles.grandTotalText}>
                ₹{calculations.grandTotal.toLocaleString('en-IN')}
              </Text>
              <Text style={styles.perGuestEstimate}>
                ≈ ₹{Math.round(calculations.grandTotal / (guestCount || 1)).toLocaleString('en-IN')} / guest
              </Text>
            </View>
          </View>

          {/* Visual Percentage Allocation Bar */}
          <View style={styles.allocationBarContainer}>
            <View style={[styles.barSlice, { flex: calculations.percentages.catering, backgroundColor: '#e11d48' }]} />
            <View style={[styles.barSlice, { flex: calculations.percentages.venue, backgroundColor: '#0284c7' }]} />
            <View style={[styles.barSlice, { flex: calculations.percentages.decor, backgroundColor: '#8b5cf6' }]} />
            <View style={[styles.barSlice, { flex: calculations.percentages.media, backgroundColor: '#f59e0b' }]} />
            <View style={[styles.barSlice, { flex: calculations.percentages.buffer, backgroundColor: '#10b981' }]} />
          </View>

          <View style={styles.legendRow}>
            <Text style={[styles.legendItem, { color: '#e11d48' }]}>● Food {calculations.percentages.catering}%</Text>
            <Text style={[styles.legendItem, { color: '#0284c7' }]}>● Venue {calculations.percentages.venue}%</Text>
            <Text style={[styles.legendItem, { color: '#8b5cf6' }]}>● Decor {calculations.percentages.decor}%</Text>
            <Text style={[styles.legendItem, { color: '#f59e0b' }]}>● Media {calculations.percentages.media}%</Text>
            <Text style={[styles.legendItem, { color: '#10b981' }]}>● Buffer {calculations.percentages.buffer}%</Text>
          </View>

          <View style={styles.lineDivider} />

          {/* Itemized Lines */}
          <View style={styles.bdRow}>
            <View style={styles.bdLabelBox}>
              <UtensilsCrossed size={16} color="#e11d48" />
              <View>
                <Text style={styles.bdItemName}>
                  Catering & Live Stalls ({guestCount} × ₹{calculations.plateRate})
                </Text>
                <Text style={styles.bdItemSub}>{calculations.selectedFood?.label}</Text>
              </View>
            </View>
            <Text style={styles.bdItemVal}>
              ₹{calculations.cateringCost.toLocaleString('en-IN')}
            </Text>
          </View>

          <View style={styles.bdRow}>
            <View style={styles.bdLabelBox}>
              <Building2 size={16} color="#0284c7" />
              <View>
                <Text style={styles.bdItemName}>Venue & Lawns Rental</Text>
                <Text style={styles.bdItemSub}>{selectedCity} market benchmark</Text>
              </View>
            </View>
            <Text style={styles.bdItemVal}>
              ₹{calculations.venueCost.toLocaleString('en-IN')}
            </Text>
          </View>

          <View style={styles.bdRow}>
            <View style={styles.bdLabelBox}>
              <Palette size={16} color="#8b5cf6" />
              <View>
                <Text style={styles.bdItemName}>Stage, Mandap & Theme Decor</Text>
                <Text style={styles.bdItemSub}>{calculations.selectedDecor?.label}</Text>
              </View>
            </View>
            <Text style={styles.bdItemVal}>
              ₹{calculations.decorCost.toLocaleString('en-IN')}
            </Text>
          </View>

          <View style={styles.bdRow}>
            <View style={styles.bdLabelBox}>
              <Music size={16} color="#f59e0b" />
              <View>
                <Text style={styles.bdItemName}>Photography, Cinematography & AV</Text>
                <Text style={styles.bdItemSub}>{calculations.selectedMedia?.label}</Text>
              </View>
            </View>
            <Text style={styles.bdItemVal}>
              ₹{calculations.mediaCost.toLocaleString('en-IN')}
            </Text>
          </View>

          <View style={styles.bdRow}>
            <View style={styles.bdLabelBox}>
              <ShieldCheck size={16} color="#10b981" />
              <View>
                <Text style={styles.bdItemName}>Contingency & Service Buffer (5%)</Text>
                <Text style={styles.bdItemSub}>Emergency guests, permits & staff tips</Text>
              </View>
            </View>
            <Text style={styles.bdItemVal}>
              ₹{calculations.bufferCost.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        {/* 5. AI Smart Savings & Optimization Advisor */}
        <View style={styles.advisorCard}>
          <View style={styles.advisorHeader}>
            <View style={styles.advisorIconWrap}>
              <Lightbulb size={20} color="#f59e0b" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.advisorTitle}>AI Cost Optimizer & Advice</Text>
              <Text style={styles.advisorSub}>Smart hacks to maximize your celebration budget</Text>
            </View>
          </View>

          <View style={styles.advisorTipsList}>
            {currentTheme.aiTips.map((tip, idx) => (
              <View key={idx} style={styles.tipRow}>
                <View style={styles.tipDot} />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Save & Share Action Bar */}
        <View style={styles.saveShareBar}>
          <TouchableOpacity
            style={styles.savePlanBtn}
            onPress={handleSavePlan}
            activeOpacity={0.8}
          >
            <Bookmark size={16} color="#0f172a" />
            <Text style={styles.savePlanBtnText}>Save Plan to Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sharePlanBtn}
            onPress={handleShareWhatsApp}
            activeOpacity={0.8}
          >
            <Share2 size={16} color="#ffffff" />
            <Text style={styles.sharePlanBtnText}>Share on WhatsApp</Text>
          </TouchableOpacity>
        </View>

        {/* 6. Live Matching Packages from happylokam Platform */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionHeading}>4. Matching Verified Packages</Text>
            <Text style={styles.sectionSub}>Ready to reserve on happylokam</Text>
          </View>

          {matchingItems.length > 0 ? (
            <View style={{ gap: 12 }}>
              {matchingItems.map((pkg) => (
                <View key={pkg.id} style={styles.packageCard}>
                  <Image source={{ uri: pkg.image }} style={styles.packageImage} />
                  <View style={styles.packageContent}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={styles.packageTitle} numberOfLines={1}>{pkg.title}</Text>
                      <View style={styles.ratingBadge}>
                        <Star size={11} color="#f59e0b" fill="#f59e0b" />
                        <Text style={styles.ratingText}>{pkg.rating || 5.0}</Text>
                      </View>
                    </View>
                    <Text style={styles.packageLocation} numberOfLines={1}>
                      {pkg.location || `${selectedCity}, Bihar`}
                    </Text>
                    <Text style={styles.packagePrice}>
                      ₹{(pkg.price || calculations.plateRate).toLocaleString('en-IN')}
                      <Text style={styles.packagePriceUnit}> / pass or plate</Text>
                    </Text>

                    <TouchableOpacity
                      style={styles.bookCuratedBtn}
                      onPress={() => handleBookCuratedPackage(pkg)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.bookCuratedBtnText}>Book Curated Theme Package</Text>
                      <ArrowRight size={14} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyPackagesCard}>
              <Building2 size={28} color="#94a3b8" />
              <Text style={styles.emptyPackagesText}>
                Custom celebration packages available in {selectedCity}.
              </Text>
            </View>
          )}
        </View>

        {/* Dedicated Concierge Consultation */}
        <View style={styles.conciergeCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.conciergeTitle}>Need Custom Negotiation & Booking?</Text>
            <Text style={styles.conciergeSub}>
              Our dedicated wedding concierge verifies venues, locks partner dates, and coordinates catering contracts.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.conciergeWhatsAppBtn}
            onPress={handleConsultConcierge}
            activeOpacity={0.85}
          >
            <Send size={15} color="#ffffff" />
            <Text style={styles.conciergeWhatsAppText}>Chat on WhatsApp</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Saved Blueprints Modal */}
      <Modal
        visible={savedModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSavedModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <FolderHeart size={20} color="#e11d48" />
                <Text style={styles.modalTitle}>My Saved Event Plans</Text>
              </View>
              <TouchableOpacity
                onPress={() => setSavedModalVisible(false)}
                style={styles.closeBtn}
              >
                <X size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              {savedPlans.map((plan) => (
                <View key={plan.id} style={styles.savedPlanRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.savedPlanTitle}>{plan.themeName}</Text>
                    <Text style={styles.savedPlanSub}>
                      {plan.city} • {plan.guestCount} Guests • {new Date(plan.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    </Text>
                    <Text style={styles.savedPlanAmount}>
                      ₹{plan.totalBudget.toLocaleString('en-IN')}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <TouchableOpacity
                      style={styles.loadPlanBtn}
                      onPress={() => handleLoadPlan(plan)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.loadPlanBtnText}>Load</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deletePlanBtn}
                      onPress={() => handleDeletePlan(plan.id)}
                      activeOpacity={0.8}
                    >
                      <Trash2 size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  savedBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffe4e6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecdd3',
  },
  savedBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#e11d48',
  },
  scrollContent: {
    padding: 16,
  },
  citySwitcherBar: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  cityChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cityChipActive: {
    backgroundColor: '#e11d48',
    borderColor: '#e11d48',
  },
  cityChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  cityChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitleRow: {
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  sectionSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  themesCarousel: {
    gap: 12,
    paddingVertical: 4,
  },
  themeCard: {
    width: width * 0.65,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  themeCardSelected: {
    borderColor: '#e11d48',
    shadowOpacity: 0.15,
    shadowColor: '#e11d48',
  },
  themeImageWrap: {
    height: 120,
    width: '100%',
    position: 'relative',
  },
  themeImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  themeGradientOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  themeBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  themeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  selectedTickBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e11d48',
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeContent: {
    padding: 12,
  },
  themeName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  themeTagline: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 15,
  },
  themeHighlightBanner: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 20,
  },
  highlightTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  highlightDesc: {
    fontSize: 12,
    color: '#475569',
    marginTop: 4,
    lineHeight: 17,
  },
  inclusionsList: {
    marginTop: 8,
    gap: 4,
  },
  incRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  incText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
  },
  guestHighlight: {
    fontSize: 12,
    fontWeight: '800',
    color: '#e11d48',
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  presetChipActive: {
    backgroundColor: '#e11d48',
    borderColor: '#e11d48',
  },
  presetText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  presetTextActive: {
    color: '#ffffff',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 6,
  },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  guestInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  guestInput: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
    textAlign: 'center',
    minWidth: 60,
  },
  guestInputSuffix: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  customizerBlock: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  customizerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  customizerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 8,
  },
  optionCardSelected: {
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3',
  },
  optionName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
  },
  optionNameSelected: {
    color: '#e11d48',
  },
  optionDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 14,
  },
  miniBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  miniBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#475569',
  },
  ratePill: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  ratePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0f172a',
  },
  breakdownCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#fecdd3',
    marginBottom: 20,
    shadowColor: '#e11d48',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bdTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  bdSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  grandTotalWrap: {
    alignItems: 'flex-end',
  },
  grandTotalText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#e11d48',
  },
  perGuestEstimate: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
    marginTop: 1,
  },
  allocationBarContainer: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  barSlice: {
    height: '100%',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  legendItem: {
    fontSize: 10,
    fontWeight: '700',
  },
  lineDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 10,
  },
  bdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  bdLabelBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  bdItemName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  bdItemSub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 1,
  },
  bdItemVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  advisorCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#fef3c7',
    padding: 14,
    marginBottom: 20,
  },
  advisorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  advisorIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  advisorTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400e',
  },
  advisorSub: {
    fontSize: 11,
    color: '#b45309',
    marginTop: 1,
  },
  advisorTipsList: {
    gap: 8,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  tipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#d97706',
    marginTop: 5,
  },
  tipText: {
    flex: 1,
    fontSize: 11,
    color: '#78350f',
    lineHeight: 16,
  },
  saveShareBar: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  savePlanBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  savePlanBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  sharePlanBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#059669',
    borderRadius: 14,
    paddingVertical: 12,
  },
  sharePlanBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  packageCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    flexDirection: 'row',
    padding: 10,
    gap: 10,
  },
  packageImage: {
    width: 90,
    height: 90,
    borderRadius: 12,
  },
  packageContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  packageTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    flex: 1,
    marginRight: 6,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#fffbeb',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#b45309',
  },
  packageLocation: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  packagePrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#e11d48',
    marginTop: 2,
  },
  packagePriceUnit: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
  },
  bookCuratedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#e11d48',
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 6,
  },
  bookCuratedBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  emptyPackagesCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyPackagesText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
  },
  conciergeCard: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'column',
    gap: 12,
    marginTop: 6,
    marginBottom: 20,
  },
  conciergeTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  conciergeSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
    lineHeight: 16,
  },
  conciergeWhatsAppBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#25d366',
    paddingVertical: 10,
    borderRadius: 12,
  },
  conciergeWhatsAppText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  closeBtn: {
    padding: 4,
  },
  savedPlanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  savedPlanTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  savedPlanSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  savedPlanAmount: {
    fontSize: 13,
    fontWeight: '900',
    color: '#e11d48',
    marginTop: 2,
  },
  loadPlanBtn: {
    backgroundColor: '#e11d48',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  loadPlanBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  deletePlanBtn: {
    padding: 6,
  },
});
