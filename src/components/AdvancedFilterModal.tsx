import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  SlidersHorizontal,
  Check,
  RotateCcw,
  Star,
  MapPin,
  Sparkles,
  Users,
} from 'lucide-react-native';

export interface FilterState {
  category: string;
  sortBy: 'featured' | 'price_low' | 'price_high' | 'rating';
  priceRange: string;
  minRating: number;
  city: string;
  capacity: string;
  amenities: string[];
}

export const DEFAULT_FILTERS: FilterState = {
  category: 'All',
  sortBy: 'featured',
  priceRange: 'all',
  minRating: 0,
  city: 'All',
  capacity: 'all',
  amenities: [],
};

interface AdvancedFilterModalProps {
  visible: boolean;
  filters: FilterState;
  totalMatches: number;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  onReset: () => void;
}

export default function AdvancedFilterModal({
  visible,
  filters: initialFilters,
  totalMatches,
  onClose,
  onApply,
  onReset,
}: AdvancedFilterModalProps) {
  const insets = useSafeAreaInsets();
  const [localFilters, setLocalFilters] = useState<FilterState>(initialFilters);

  // Sync when opened
  React.useEffect(() => {
    setLocalFilters(initialFilters);
  }, [initialFilters, visible]);

  const SORT_OPTIONS: { id: FilterState['sortBy']; label: string }[] = [
    { id: 'featured', label: '🔥 Featured & Trending' },
    { id: 'rating', label: '⭐ Highest Rated First' },
    { id: 'price_low', label: '💰 Price: Low to High' },
    { id: 'price_high', label: '👑 Luxury: High to Low' },
  ];

  const BUDGET_OPTIONS = [
    { id: 'all', label: 'All Budgets' },
    { id: 'under_50k', label: 'Under ₹50K' },
    { id: '50k_150k', label: '₹50K - ₹1.5L' },
    { id: '150k_300k', label: '₹1.5L - ₹3L' },
    { id: 'above_300k', label: '₹3L+ Luxury' },
  ];

  const RATING_OPTIONS = [
    { value: 0, label: 'Any Rating' },
    { value: 4.0, label: '4.0+ ★' },
    { value: 4.5, label: '4.5+ ★' },
    { value: 4.8, label: '4.8+ ★ (Luxe)' },
  ];

  const POPULAR_THEMES = [
    'All Locations',
    'Near Me',
    'Heritage & Royal',
    'Open Lawn / Garden',
    'Rooftop View',
    'Luxury Hall',
  ];

  const CAPACITY_OPTIONS = [
    { id: 'all', label: 'Any Size' },
    { id: 'small', label: '< 100 Guests' },
    { id: 'medium', label: '100 - 300 Guests' },
    { id: 'large', label: '300 - 800 Guests' },
    { id: 'mega', label: '800+ Guests' },
  ];

  const AMENITIES_LIST = [
    'Air Conditioned Banquet',
    'Open Lawn & Garden',
    'Swimming Pool',
    'DJ & Music Permitted',
    'Pure Veg Kitchen',
    'Valet Parking',
    'Bridal Suite',
    'Alcohol Permitted',
    'Lake / Sea View',
  ];

  const toggleAmenity = (name: string) => {
    setLocalFilters((prev) => {
      const exists = prev.amenities.includes(name);
      return {
        ...prev,
        amenities: exists
          ? prev.amenities.filter((a) => a !== name)
          : [...prev.amenities, name],
      };
    });
  };

  const activeFilterCount =
    (localFilters.category !== 'All' ? 1 : 0) +
    (localFilters.sortBy !== 'featured' ? 1 : 0) +
    (localFilters.priceRange !== 'all' ? 1 : 0) +
    (localFilters.minRating > 0 ? 1 : 0) +
    (localFilters.city !== 'All' ? 1 : 0) +
    (localFilters.capacity !== 'all' ? 1 : 0) +
    localFilters.amenities.length;

  const handleReset = () => {
    setLocalFilters(DEFAULT_FILTERS);
    onReset();
  };

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View
        style={[
          styles.container,
          {
            paddingTop: Math.max(insets.top, 20),
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={styles.filterIconBox}>
              <SlidersHorizontal size={18} color="#e11d48" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Advanced Filters</Text>
              <Text style={styles.headerSubtitle}>
                {activeFilterCount > 0
                  ? `${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} active`
                  : 'Customize celebration requirements'}
              </Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            {activeFilterCount > 0 && (
              <TouchableOpacity style={styles.resetBtn} onPress={handleReset} activeOpacity={0.7}>
                <RotateCcw size={14} color="#64748b" />
                <Text style={styles.resetBtnText}>Reset</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Scrollable Filters */}
        <ScrollView
          style={styles.scrollBody}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 1. Sort By */}
          <View style={styles.filterGroup}>
            <Text style={styles.groupTitle}>SORT BY</Text>
            <View style={styles.optionsWrap}>
              {SORT_OPTIONS.map((opt) => {
                const isSelected = localFilters.sortBy === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.pillOption, isSelected && styles.pillOptionActive]}
                    onPress={() => setLocalFilters({ ...localFilters, sortBy: opt.id })}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.pillOptionText, isSelected && styles.pillOptionTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 2. Budget / Price Range */}
          <View style={styles.filterGroup}>
            <Text style={styles.groupTitle}>BUDGET / PRICE RANGE</Text>
            <View style={styles.optionsWrap}>
              {BUDGET_OPTIONS.map((b) => {
                const isSelected = localFilters.priceRange === b.id;
                return (
                  <TouchableOpacity
                    key={b.id}
                    style={[styles.pillOption, isSelected && styles.pillOptionActive]}
                    onPress={() => setLocalFilters({ ...localFilters, priceRange: b.id })}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.pillOptionText, isSelected && styles.pillOptionTextActive]}>
                      {b.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 3. Minimum Star Rating */}
          <View style={styles.filterGroup}>
            <Text style={styles.groupTitle}>MINIMUM RATING</Text>
            <View style={styles.rowOptions}>
              {RATING_OPTIONS.map((r) => {
                const isSelected = localFilters.minRating === r.value;
                return (
                  <TouchableOpacity
                    key={r.value}
                    style={[styles.ratingPill, isSelected && styles.ratingPillActive]}
                    onPress={() => setLocalFilters({ ...localFilters, minRating: r.value })}
                    activeOpacity={0.8}
                  >
                    {r.value > 0 && <Star size={13} color={isSelected ? '#ffffff' : '#f59e0b'} fill={isSelected ? '#ffffff' : '#f59e0b'} />}
                    <Text style={[styles.ratingPillText, isSelected && styles.ratingPillTextActive]}>
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 4. Dynamic Location / Destination Search */}
          <View style={styles.filterGroup}>
            <View style={styles.groupTitleRow}>
              <Text style={styles.groupTitle}>TARGET DESTINATION / AREA</Text>
              <MapPin size={14} color="#e11d48" />
            </View>
            <View style={styles.locationInputContainer}>
              <TextInput
                style={styles.locationInputField}
                placeholder="Type any city, area, or landmark..."
                placeholderTextColor="#94a3b8"
                value={localFilters.city === 'All' ? '' : localFilters.city}
                onChangeText={(text) => {
                  setLocalFilters({ ...localFilters, city: text.trim() ? text : 'All' });
                }}
              />
              {localFilters.city !== 'All' && (
                <TouchableOpacity
                  onPress={() => setLocalFilters({ ...localFilters, city: 'All' })}
                  style={styles.clearLocationBtn}
                >
                  <X size={14} color="#64748b" />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.optionsWrap}>
              <TouchableOpacity
                style={[styles.pillOption, localFilters.city === 'All' && styles.pillOptionActive]}
                onPress={() => setLocalFilters({ ...localFilters, city: 'All' })}
                activeOpacity={0.8}
              >
                <Text style={[styles.pillOptionText, localFilters.city === 'All' && styles.pillOptionTextActive]}>
                  🌍 All Locations
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 5. Guest Capacity */}
          <View style={styles.filterGroup}>
            <View style={styles.groupTitleRow}>
              <Text style={styles.groupTitle}>GUEST CAPACITY</Text>
              <Users size={14} color="#64748b" />
            </View>
            <View style={styles.optionsWrap}>
              {CAPACITY_OPTIONS.map((cap) => {
                const isSelected = localFilters.capacity === cap.id;
                return (
                  <TouchableOpacity
                    key={cap.id}
                    style={[styles.pillOption, isSelected && styles.pillOptionActive]}
                    onPress={() => setLocalFilters({ ...localFilters, capacity: cap.id })}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.pillOptionText, isSelected && styles.pillOptionTextActive]}>
                      {cap.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 6. Celebration Amenities & Features */}
          <View style={styles.filterGroup}>
            <View style={styles.groupTitleRow}>
              <Text style={styles.groupTitle}>AMENITIES & PREFERENCES</Text>
              <Sparkles size={14} color="#e11d48" />
            </View>
            <View style={styles.amenitiesGrid}>
              {AMENITIES_LIST.map((am) => {
                const isChecked = localFilters.amenities.includes(am);
                return (
                  <TouchableOpacity
                    key={am}
                    style={[styles.amenityRow, isChecked && styles.amenityRowActive]}
                    onPress={() => toggleAmenity(am)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.checkbox, isChecked && styles.checkboxActive]}>
                      {isChecked && <Check size={12} color="#ffffff" strokeWidth={3} />}
                    </View>
                    <Text style={[styles.amenityText, isChecked && styles.amenityTextActive]}>
                      {am}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {/* Bottom Apply Action */}
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <TouchableOpacity style={styles.applyBtn} onPress={handleApply} activeOpacity={0.85}>
            <Text style={styles.applyBtnText}>
              Apply Filters {totalMatches > 0 ? `(${totalMatches} Found)` : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filterIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#fff1f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 22,
  },
  filterGroup: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  groupTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  groupTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#94a3b8',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  locationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 12,
    marginBottom: 10,
    height: 46,
  },
  locationInputField: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  clearLocationBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  optionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pillOption: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  pillOptionActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  pillOptionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  pillOptionTextActive: {
    color: '#ffffff',
  },
  rowOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 4,
  },
  ratingPillActive: {
    backgroundColor: '#e11d48',
    borderColor: '#e11d48',
  },
  ratingPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
  },
  ratingPillTextActive: {
    color: '#ffffff',
  },
  amenitiesGrid: {
    gap: 8,
  },
  amenityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 10,
  },
  amenityRowActive: {
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  checkboxActive: {
    backgroundColor: '#e11d48',
    borderColor: '#e11d48',
  },
  amenityText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    flex: 1,
  },
  amenityTextActive: {
    color: '#e11d48',
    fontWeight: '800',
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 8,
  },
  applyBtn: {
    backgroundColor: '#e11d48',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#e11d48',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  applyBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
});
