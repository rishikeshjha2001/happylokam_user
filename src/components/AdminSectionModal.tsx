import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Plus,
  Trash2,
  Sparkles,
  Layers,
  Image as ImageIcon,
  Tag,
  MapPin,
  Check,
  ChevronDown,
} from 'lucide-react-native';
import {
  AdminCustomSection,
  AdminSectionItem,
  PRESET_CELEBRATION_IMAGES,
  saveAdminCustomSection,
  deleteAdminCustomSection,
  deleteAdminSectionItem,
} from '../services/adminSections';

interface AdminSectionModalProps {
  visible: boolean;
  sections: AdminCustomSection[];
  onClose: () => void;
  onSectionsUpdated: (sections: AdminCustomSection[]) => void;
}

export default function AdminSectionModal({
  visible,
  sections,
  onClose,
  onSectionsUpdated,
}: AdminSectionModalProps) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');

  // Form states for creating a new section with an initial item
  const [secTitle, setSecTitle] = useState('');
  const [secSubtitle, setSecSubtitle] = useState('');
  const [secTag, setSecTag] = useState('');

  // Item states
  const [itemTitle, setItemTitle] = useState('');
  const [itemLocation, setItemLocation] = useState('');
  const [itemPrice, setItemPrice] = useState('₹1.2L');
  const [itemType, setItemType] = useState('Premium Venue');
  const [itemBookingType, setItemBookingType] = useState<'TICKET' | 'BOOKING'>('BOOKING');
  const [availableDates, setAvailableDates] = useState('Today, Tomorrow, This Weekend');
  const [itemRating, setItemRating] = useState('4.9');
  const [itemTags, setItemTags] = useState('Mandap, Lawn, Valet');
  const [selectedImage, setSelectedImage] = useState(PRESET_CELEBRATION_IMAGES[0].url);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [showImagePicker, setShowImagePicker] = useState(false);

  const handleSaveSection = async () => {
    if (!secTitle.trim()) {
      Alert.alert('Section Title Required', 'Please enter a name for the new section.');
      return;
    }
    if (!itemTitle.trim()) {
      Alert.alert('Item Title Required', 'Please provide at least one celebration item in this section.');
      return;
    }

    const finalImage = customImageUrl.trim() || selectedImage;
    const newItem: AdminSectionItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: itemTitle.trim(),
      location: itemLocation.trim() || 'Pan-India',
      type: itemType.trim() || 'Featured',
      itemType: itemBookingType,
      price: itemPrice.trim() || '₹50,000',
      availableDates: availableDates.split(',').map((d) => d.trim()).filter(Boolean),
      totalSlots: 100,
      bookedSlots: 0,
      rating: parseFloat(itemRating) || 4.9,
      reviews: Math.floor(Math.random() * 80) + 40,
      image: finalImage,
      tags: itemTags ? itemTags.split(',').map((t) => t.trim()).filter(Boolean) : ['Verified'],
    };

    const newSection: AdminCustomSection = {
      id: `sec_${Date.now()}`,
      title: secTitle.trim(),
      subtitle: secSubtitle.trim() || 'Handpicked premium celebration experiences',
      tag: secTag.trim() || 'Special',
      createdAt: new Date().toISOString(),
      items: [newItem],
    };

    try {
      const updated = await saveAdminCustomSection(newSection);
      onSectionsUpdated(updated);
      Alert.alert('Section Created!', `"${secTitle}" is now live on the Home screen.`);
      // Reset form
      setSecTitle('');
      setSecSubtitle('');
      setSecTag('');
      setItemTitle('');
      setItemLocation('');
      setCustomImageUrl('');
      setActiveTab('manage');
    } catch (err) {
      Alert.alert('Error', 'Failed to save section. Please try again.');
    }
  };

  const handleDeleteSection = async (sectionId: string, title: string) => {
    Alert.alert(
      'Delete Section',
      `Are you sure you want to remove "${title}" from Home?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updated = await deleteAdminCustomSection(sectionId);
            onSectionsUpdated(updated);
          },
        },
      ]
    );
  };

  const handleDeleteItem = async (sectionId: string, itemId: string) => {
    const updated = await deleteAdminSectionItem(sectionId, itemId);
    onSectionsUpdated(updated);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: Math.max(insets.top, 20), paddingBottom: Math.max(insets.bottom, 16) }]}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <View style={styles.badgeRow}>
              <View style={styles.adminBadge}>
                <Sparkles size={12} color="#ffffff" />
                <Text style={styles.adminBadgeText}>ADMIN CONTROL</Text>
              </View>
            </View>
            <Text style={styles.headerTitle}>Section Manager</Text>
            <Text style={styles.headerSubtitle}>Add new dynamic sections & items to Home</Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <X size={20} color="#64748b" />
          </TouchableOpacity>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabSwitcher}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'create' && styles.tabButtonActive]}
            onPress={() => setActiveTab('create')}
            activeOpacity={0.8}
          >
            <Plus size={16} color={activeTab === 'create' ? '#e11d48' : '#64748b'} />
            <Text style={[styles.tabButtonText, activeTab === 'create' && styles.tabButtonTextActive]}>
              Add New Section
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'manage' && styles.tabButtonActive]}
            onPress={() => setActiveTab('manage')}
            activeOpacity={0.8}
          >
            <Layers size={16} color={activeTab === 'manage' ? '#e11d48' : '#64748b'} />
            <Text style={[styles.tabButtonText, activeTab === 'manage' && styles.tabButtonTextActive]}>
              Live Sections ({sections.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content Body */}
        <ScrollView
          style={styles.scrollBody}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {activeTab === 'create' ? (
            <View style={styles.formContainer}>
              {/* Section Details Group */}
              <View style={styles.cardSection}>
                <Text style={styles.sectionHeaderLabel}>1. SECTION HEADER DETAILS</Text>
                
                <Text style={styles.inputLabel}>Section Title *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Royal Heritage Retreats, Trending DJ Nights"
                  placeholderTextColor="#94a3b8"
                  value={secTitle}
                  onChangeText={setSecTitle}
                />

                <Text style={styles.inputLabel}>Section Subtitle / Tagline</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Grand palaces & luxury celebration estates"
                  placeholderTextColor="#94a3b8"
                  value={secSubtitle}
                  onChangeText={setSecSubtitle}
                />

                <Text style={styles.inputLabel}>Section Tag / Category Badge</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Heritage Luxe, Trending, DJ & Beats"
                  placeholderTextColor="#94a3b8"
                  value={secTag}
                  onChangeText={setSecTag}
                />
              </View>

              {/* First Item in Section */}
              <View style={styles.cardSection}>
                <Text style={styles.sectionHeaderLabel}>2. ADD FIRST CELEBRATION ITEM</Text>

                <Text style={styles.inputLabel}>Item Title *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Taj Aravali Resort, Soul & Strings Band"
                  placeholderTextColor="#94a3b8"
                  value={itemTitle}
                  onChangeText={setItemTitle}
                />

                <View style={styles.rowInputs}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.inputLabel}>Location / City</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. Udaipur, RJ"
                      placeholderTextColor="#94a3b8"
                      value={itemLocation}
                      onChangeText={setItemLocation}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.inputLabel}>Price Tag *</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. ₹2.5L, ₹65,000"
                      placeholderTextColor="#94a3b8"
                      value={itemPrice}
                      onChangeText={setItemPrice}
                    />
                  </View>
                </View>

                <View style={styles.rowInputs}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.inputLabel}>Type Pill</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. Palace Resort, Live Band"
                      placeholderTextColor="#94a3b8"
                      value={itemType}
                      onChangeText={setItemType}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.inputLabel}>Rating</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="4.9"
                      placeholderTextColor="#94a3b8"
                      value={itemRating}
                      onChangeText={setItemRating}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <Text style={styles.inputLabel}>Tags / Amenities (comma separated)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Lake View, Grand Ballroom, Valet"
                  placeholderTextColor="#94a3b8"
                  value={itemTags}
                  onChangeText={setItemTags}
                />

                {/* Image Picker */}
                <Text style={styles.inputLabel}>Celebration Cover Image</Text>
                <View style={styles.imagePreviewRow}>
                  <Image source={{ uri: customImageUrl.trim() || selectedImage }} style={styles.currentPreviewImg} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <TouchableOpacity
                      style={styles.selectPresetBtn}
                      onPress={() => setShowImagePicker(!showImagePicker)}
                      activeOpacity={0.8}
                    >
                      <ImageIcon size={16} color="#e11d48" />
                      <Text style={styles.selectPresetBtnText}>
                        {showImagePicker ? 'Close Gallery' : 'Pick High-Res Photo'}
                      </Text>
                      <ChevronDown size={14} color="#e11d48" />
                    </TouchableOpacity>
                    <TextInput
                      style={[styles.textInput, { marginTop: 8, fontSize: 12, paddingVertical: 8 }]}
                      placeholder="Or paste custom image URL..."
                      placeholderTextColor="#94a3b8"
                      value={customImageUrl}
                      onChangeText={setCustomImageUrl}
                    />
                  </View>
                </View>

                {showImagePicker && (
                  <View style={styles.presetGalleryBox}>
                    <Text style={styles.galleryHeading}>Select from Curated Gallery:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galleryScroll}>
                      {PRESET_CELEBRATION_IMAGES.map((img, idx) => {
                        const isPicked = selectedImage === img.url && !customImageUrl;
                        return (
                          <TouchableOpacity
                            key={idx}
                            style={[styles.presetThumb, isPicked && styles.presetThumbActive]}
                            onPress={() => {
                              setSelectedImage(img.url);
                              setCustomImageUrl('');
                            }}
                            activeOpacity={0.8}
                          >
                            <Image source={{ uri: img.url }} style={styles.presetImg} />
                            {isPicked && (
                              <View style={styles.pickedCheckMark}>
                                <Check size={14} color="#ffffff" strokeWidth={3} />
                              </View>
                            )}
                            <Text style={styles.presetLabel} numberOfLines={1}>{img.label}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Publish Button */}
              <TouchableOpacity
                style={styles.publishBtn}
                onPress={handleSaveSection}
                activeOpacity={0.85}
              >
                <Sparkles size={18} color="#ffffff" />
                <Text style={styles.publishBtnText}>Publish Section to Home</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.manageContainer}>
              {sections.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Layers size={40} color="#cbd5e1" />
                  <Text style={styles.emptyTitle}>No Custom Sections Yet</Text>
                  <Text style={styles.emptySub}>Create your first custom section to display it live on the Home screen.</Text>
                </View>
              ) : (
                sections.map((sec) => (
                  <View key={sec.id} style={styles.manageSectionCard}>
                    <View style={styles.manageSectionHeader}>
                      <View style={{ flex: 1 }}>
                        {sec.tag && (
                          <View style={styles.secTagPill}>
                            <Tag size={10} color="#e11d48" />
                            <Text style={styles.secTagPillText}>{sec.tag}</Text>
                          </View>
                        )}
                        <Text style={styles.manageSecTitle}>{sec.title}</Text>
                        <Text style={styles.manageSecSub}>{sec.subtitle}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.deleteSecBtn}
                        onPress={() => handleDeleteSection(sec.id, sec.title)}
                        activeOpacity={0.7}
                      >
                        <Trash2 size={16} color="#ef4444" />
                      </TouchableOpacity>
                    </View>

                    {/* Section Items */}
                    <Text style={styles.secItemsCountLabel}>ITEMS IN THIS SECTION ({sec.items.length}):</Text>
                    {sec.items.map((it) => (
                      <View key={it.id} style={styles.manageItemRow}>
                        <Image source={{ uri: it.image }} style={styles.manageItemImg} />
                        <View style={{ flex: 1, marginHorizontal: 10 }}>
                          <Text style={styles.manageItemTitle} numberOfLines={1}>{it.title}</Text>
                          <Text style={styles.manageItemSub} numberOfLines={1}>
                            <MapPin size={10} color="#94a3b8" /> {it.location} • <Text style={{ color: '#e11d48', fontWeight: '800' }}>{it.price}</Text>
                          </Text>
                        </View>
                        {sec.items.length > 1 && (
                          <TouchableOpacity
                            onPress={() => handleDeleteItem(sec.id, it.id)}
                            style={styles.deleteItemBtn}
                            activeOpacity={0.7}
                          >
                            <Trash2 size={14} color="#94a3b8" />
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                  </View>
                ))
              )}
            </View>
          )}
        </ScrollView>
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
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e11d48',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  adminBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 12,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3',
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  tabButtonTextActive: {
    color: '#e11d48',
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  formContainer: {
    gap: 16,
  },
  cardSection: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionHeaderLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#94a3b8',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 8,
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  rowInputs: {
    flexDirection: 'row',
  },
  imagePreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  currentPreviewImg: {
    width: 80,
    height: 80,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
  },
  selectPresetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  selectPresetBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#e11d48',
    flex: 1,
  },
  presetGalleryBox: {
    marginTop: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  galleryHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    marginBottom: 8,
  },
  galleryScroll: {
    flexDirection: 'row',
  },
  presetThumb: {
    width: 100,
    marginRight: 10,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  presetThumbActive: {
    borderColor: '#e11d48',
  },
  presetImg: {
    width: '100%',
    height: 64,
    resizeMode: 'cover',
  },
  pickedCheckMark: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#e11d48',
    borderRadius: 10,
    padding: 2,
  },
  presetLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#475569',
    padding: 4,
  },
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e11d48',
    paddingVertical: 16,
    borderRadius: 18,
    gap: 8,
    shadowColor: '#e11d48',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 6,
    marginTop: 8,
  },
  publishBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  manageContainer: {
    gap: 14,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#334155',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 240,
  },
  manageSectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  manageSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  secTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff1f2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  secTagPillText: {
    color: '#e11d48',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  manageSecTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0f172a',
  },
  manageSecSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 1,
  },
  deleteSecBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secItemsCountLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#94a3b8',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  manageItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  manageItemImg: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  manageItemTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  manageItemSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
  },
  deleteItemBtn: {
    padding: 6,
  },
});
