import React, { useState, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Linking,
  BackHandler,
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
} from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import ComingSoonPlaceholder from '../components/ComingSoonPlaceholder';

const EVENT_TYPES = [
  { id: 'wedding', label: 'royal wedding', basePlate: 1200, baseVenue: 150000, decorBase: 80000 },
  { id: 'birthday', label: 'birthday & milestone bash', basePlate: 550, baseVenue: 35000, decorBase: 25000 },
  { id: 'reception', label: 'banquet reception', basePlate: 950, baseVenue: 90000, decorBase: 50000 },
  { id: 'dandiya', label: 'dandiya / festival gala', basePlate: 450, baseVenue: 60000, decorBase: 40000 },
  { id: 'corporate', label: 'corporate conference', basePlate: 800, baseVenue: 50000, decorBase: 30000 },
  { id: 'safari', label: 'loksafari group camp', basePlate: 1500, baseVenue: 75000, decorBase: 25000 },
];

const BUDGET_TIERS = [
  { id: 'standard', label: 'standard', multiplier: 1.0 },
  { id: 'premium', label: 'premium gold', multiplier: 1.4 },
  { id: 'royal', label: 'royal luxury', multiplier: 2.1 },
];

const QUICK_GUEST_PRESETS = [100, 250, 500, 800, 1500];

export default function EventPlannerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [selectedEventType, setSelectedEventType] = useState('wedding');
  const [selectedTier, setSelectedTier] = useState('premium');
  const [guestCount, setGuestCount] = useState(350);
  const [selectedCity, setSelectedCity] = useState('patna');

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

  const isLiveCity = ['patna', 'ranchi', 'varanasi', 'bodh gaya'].includes(selectedCity.toLowerCase());

  const currentEventConfig = useMemo(() => {
    return EVENT_TYPES.find((e) => e.id === selectedEventType) || EVENT_TYPES[0];
  }, [selectedEventType]);

  const currentTierMultiplier = useMemo(() => {
    return BUDGET_TIERS.find((t) => t.id === selectedTier)?.multiplier || 1.0;
  }, [selectedTier]);

  const calculations = useMemo(() => {
    const plateRate = Math.round(currentEventConfig.basePlate * currentTierMultiplier);
    const cateringCost = plateRate * guestCount;
    const venueCost = Math.round(currentEventConfig.baseVenue * currentTierMultiplier);
    const decorCost = Math.round(currentEventConfig.decorBase * currentTierMultiplier);
    const photoSoundCost = Math.round(35000 * currentTierMultiplier);
    const bufferCost = Math.round((cateringCost + venueCost + decorCost + photoSoundCost) * 0.05);
    const grandTotal = cateringCost + venueCost + decorCost + photoSoundCost + bufferCost;

    return {
      plateRate,
      cateringCost,
      venueCost,
      decorCost,
      photoSoundCost,
      bufferCost,
      grandTotal,
    };
  }, [currentEventConfig, currentTierMultiplier, guestCount]);

  const handleConsultConcierge = () => {
    const msg = encodeURIComponent(
      `Hello happylokam Support, I used the Event Budget Calculator for a ${currentEventConfig.label} with ${guestCount} guests in ${selectedCity}. Estimated budget: ₹${calculations.grandTotal.toLocaleString('en-IN')}. Please help me book matching venues & caterers!`
    );
    Linking.openURL(`https://wa.me/918969255561?text=${msg}`).catch(() => {
      Linking.openURL('tel:+918969255561');
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color="#0f172a" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>ai event budget planner</Text>
          <Text style={styles.headerSubtitle}>Real-time estimation for your celebration</Text>
        </View>
        <View style={styles.calcBadge}>
          <Calculator size={18} color="#e11d48" />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* City Switcher Row */}
        <View style={styles.citySwitcherBar}>
          <Text style={styles.cityLabel}>Destination City:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {['patna', 'ranchi', 'varanasi', 'kolkata', 'lucknow'].map((c) => {
              const active = selectedCity.toLowerCase() === c;
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

        {isLiveCity ? (
          <>
            {/* Event Type Selector */}
            <View style={styles.section}>
              <Text style={styles.sectionHeading}>1. choose celebration type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.eventTypesRow}>
                {EVENT_TYPES.map((et) => {
                  const isSelected = selectedEventType === et.id;
                  return (
                    <TouchableOpacity
                      key={et.id}
                      style={[styles.eventTypeCard, isSelected && styles.eventTypeCardSelected]}
                      onPress={() => setSelectedEventType(et.id)}
                      activeOpacity={0.8}
                    >
                      <Sparkles size={16} color={isSelected ? '#e11d48' : '#64748b'} />
                      <Text style={[styles.eventTypeText, isSelected && styles.eventTypeTextSelected]}>
                        {et.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Guest Count Input & Steppers */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeading}>2. number of guests</Text>
                <Text style={styles.guestCountDisplay}>{guestCount} guests</Text>
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

              {/* Stepper & Numeric Input */}
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
                  <Text style={styles.guestInputSuffix}>Guests</Text>
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

            {/* Budget Tier */}
            <View style={styles.section}>
              <Text style={styles.sectionHeading}>3. select quality tier</Text>
              <View style={styles.tierRow}>
                {BUDGET_TIERS.map((tier) => {
                  const isSelected = selectedTier === tier.id;
                  return (
                    <TouchableOpacity
                      key={tier.id}
                      style={[styles.tierCard, isSelected && styles.tierCardSelected]}
                      onPress={() => setSelectedTier(tier.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.tierTitle, isSelected && styles.tierTitleSelected]}>
                        {tier.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Estimation Breakdown Card */}
            <View style={styles.breakdownCard}>
              <View style={styles.breakdownHeader}>
                <View>
                  <Text style={styles.bdTitle}>estimated celebration budget</Text>
                  <Text style={styles.bdSubtitle}>happylokam dynamic market rate</Text>
                </View>
                <View style={styles.grandTotalWrap}>
                  <Text style={styles.grandTotalText}>
                    ₹{calculations.grandTotal.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>

              <View style={styles.lineDivider} />

              {/* Itemized lines */}
              <View style={styles.bdRow}>
                <View style={styles.bdLabelBox}>
                  <UtensilsCrossed size={15} color="#e11d48" />
                  <Text style={styles.bdItemName}>
                    Catering ({guestCount} plates @ ₹{calculations.plateRate})
                  </Text>
                </View>
                <Text style={styles.bdItemVal}>
                  ₹{calculations.cateringCost.toLocaleString('en-IN')}
                </Text>
              </View>

              <View style={styles.bdRow}>
                <View style={styles.bdLabelBox}>
                  <Building2 size={15} color="#0284c7" />
                  <Text style={styles.bdItemName}>Venue & Lawns Rental</Text>
                </View>
                <Text style={styles.bdItemVal}>
                  ₹{calculations.venueCost.toLocaleString('en-IN')}
                </Text>
              </View>

              <View style={styles.bdRow}>
                <View style={styles.bdLabelBox}>
                  <Palette size={15} color="#8b5cf6" />
                  <Text style={styles.bdItemName}>Stage & Theme Decor</Text>
                </View>
                <Text style={styles.bdItemVal}>
                  ₹{calculations.decorCost.toLocaleString('en-IN')}
                </Text>
              </View>

              <View style={styles.bdRow}>
                <View style={styles.bdLabelBox}>
                  <Music size={15} color="#f59e0b" />
                  <Text style={styles.bdItemName}>DJ, Sound & Photography</Text>
                </View>
                <Text style={styles.bdItemVal}>
                  ₹{calculations.photoSoundCost.toLocaleString('en-IN')}
                </Text>
              </View>

              <View style={styles.bdRow}>
                <View style={styles.bdLabelBox}>
                  <ShieldCheck size={15} color="#10b981" />
                  <Text style={styles.bdItemName}>Buffer, Service & Taxes (5%)</Text>
                </View>
                <Text style={styles.bdItemVal}>
                  ₹{calculations.bufferCost.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actionWrap}>
              <TouchableOpacity
                style={styles.exploreBtn}
                onPress={() => router.push('/(tabs)/explore')}
                activeOpacity={0.85}
              >
                <Text style={styles.exploreBtnText}>browse matching venues in {selectedCity}</Text>
                <ArrowRight size={16} color="#ffffff" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.conciergeBtn}
                onPress={handleConsultConcierge}
                activeOpacity={0.85}
              >
                <Send size={15} color="#059669" />
                <Text style={styles.conciergeBtnText}>get customized quote on whatsapp</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <ComingSoonPlaceholder
            title={`event planner coming soon to ${selectedCity}!`}
            subtitle="our partner venues and verified caterers are currently expanding into this region. Request early access or chat with our concierge."
            city={selectedCity}
            onSelectCity={(c) => setSelectedCity(c)}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    textTransform: 'lowercase',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  calcBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#fff1f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  citySwitcherBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cityLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    marginRight: 8,
  },
  cityChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  cityChipActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  cityChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  cityChipTextActive: {
    color: '#ffffff',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    textTransform: 'lowercase',
    marginBottom: 8,
  },
  guestCountDisplay: {
    fontSize: 14,
    fontWeight: '900',
    color: '#e11d48',
  },
  eventTypesRow: {
    gap: 8,
  },
  eventTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  eventTypeCardSelected: {
    backgroundColor: '#fff1f2',
    borderColor: '#f43f5e',
  },
  eventTypeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  eventTypeTextSelected: {
    color: '#e11d48',
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  presetChip: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  presetChipActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  presetText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  presetTextActive: {
    color: '#ffffff',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepBtn: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
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
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    gap: 6,
    height: 42,
  },
  guestInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  guestInputSuffix: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  tierRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tierCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tierCardSelected: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  tierTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'lowercase',
  },
  tierTitleSelected: {
    color: '#ffffff',
  },
  breakdownCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 3,
    marginBottom: 20,
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bdTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    textTransform: 'lowercase',
  },
  bdSubtitle: {
    fontSize: 11,
    color: '#64748b',
  },
  grandTotalWrap: {
    alignItems: 'flex-end',
  },
  grandTotalText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#e11d48',
  },
  lineDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
  },
  bdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  bdLabelBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bdItemName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  bdItemVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  actionWrap: {
    gap: 10,
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e11d48',
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
  },
  exploreBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    textTransform: 'lowercase',
  },
  conciergeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ecfdf5',
    borderRadius: 14,
    paddingVertical: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  conciergeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
    textTransform: 'lowercase',
  },
});
