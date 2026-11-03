import React, { useState, useEffect } from 'react';
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
  FolderPlus,
  Ticket,
} from 'lucide-react-native';
import {
  AdminCustomSection,
  AdminCustomCategory,
  AdminSectionItem,
  PRESET_CELEBRATION_IMAGES,
  saveAdminCustomSection,
  deleteAdminCustomSection,
  deleteAdminSectionItem,
  saveAdminCustomCategory,
  deleteAdminCustomCategory,
  saveAdminSectionItem,
  getAdminCustomCategories,
  saveAdminHeroSlide,
  deleteAdminHeroSlide,
  getAdminHeroSlides,
} from '../services/adminSections';
import OtaSync from '../services/otaSync';

interface AdminSectionModalProps {
  visible: boolean;
  sections: AdminCustomSection[];
  onClose: () => void;
  onSectionsUpdated: (sections: AdminCustomSection[]) => void;
  onCategoriesUpdated?: (categories: AdminCustomCategory[]) => void;
  onHeroSlidesUpdated?: (heroSlides: any[]) => void;
}

export default function AdminSectionModal({
  visible,
  sections,
  onClose,
  onSectionsUpdated,
  onCategoriesUpdated,
  onHeroSlidesUpdated,
}: AdminSectionModalProps) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'create-section' | 'create-category' | 'create-banner' | 'create-item' | 'manage'>('create-section');

  // Categories list
  const [categories, setCategories] = useState<AdminCustomCategory[]>([]);
  // Hero slides list
  const [heroSlides, setHeroSlides] = useState<any[]>([]);

  // Section Form States
  const [secTitle, setSecTitle] = useState('');
  const [secSubtitle, setSecSubtitle] = useState('');
  const [secTag, setSecTag] = useState('');

  // Category Form States
  const [catName, setCatName] = useState('');
  const [catTag, setCatTag] = useState('');
  const [catImage, setCatImage] = useState(PRESET_CELEBRATION_IMAGES[0].url);
  const [customCatImageUrl, setCustomCatImageUrl] = useState('');

  // Item Form States
  const [itemTargetType, setItemTargetType] = useState<'section' | 'category'>('section');
  const [targetId, setTargetId] = useState<string>('');
  const [itemTitle, setItemTitle] = useState('');
  const [itemLocation, setItemLocation] = useState('');
  const [itemMapUrl, setItemMapUrl] = useState('');
  const [itemPrice, setItemPrice] = useState('₹1.2L');
  const [itemType, setItemType] = useState('Premium Venue');
  const [itemBookingType, setItemBookingType] = useState<'TICKET' | 'BOOKING'>('BOOKING');
  const [availableDates, setAvailableDates] = useState('Today, Tomorrow, This Weekend');
  const [itemRating, setItemRating] = useState('4.9');
  const [itemTags, setItemTags] = useState('Mandap, Lawn, Valet');
  const [selectedImage, setSelectedImage] = useState(PRESET_CELEBRATION_IMAGES[0].url);
  const [customImageUrl, setCustomImageUrl] = useState('');

  // Hero Banner Form States
  const [bannerTitle1, setBannerTitle1] = useState('Happy Birthday Grand Celebrations');
  const [bannerTitle2, setBannerTitle2] = useState('Live party decor, gourmet cake & DJ fun');
  const [bannerBadge, setBannerBadge] = useState('happylokam Special');
  const [bannerDesc, setBannerDesc] = useState('Book handcrafted birthday celebration passes & themes');
  const [bannerCtaText, setBannerCtaText] = useState('Explore Birthday Themes');
  const [bannerCtaLink, setBannerCtaLink] = useState('/explore?category=Birthday Themes');
  const [bannerImage, setBannerImage] = useState(PRESET_CELEBRATION_IMAGES[0].url);
  const [customBannerImageUrl, setCustomBannerImageUrl] = useState('');

  useEffect(() => {
    if (visible) {
      getAdminCustomCategories().then((cats) => {
        setCategories(cats || []);
        if (cats && cats.length > 0 && !targetId) {
          setTargetId(cats[0].id);
        }
      }).catch(() => {});
      if (sections && sections.length > 0 && !targetId) {
        setTargetId(sections[0].id);
      }
      getAdminHeroSlides().then((slides) => {
        setHeroSlides(slides || []);
      }).catch(() => {});
    }
  }, [visible, sections]);

  // Save New Hero Banner
  const handleSaveBanner = async () => {
    if (!bannerTitle1.trim()) {
      Alert.alert('Banner Title Required', 'Please enter a main title for this hero banner.');
      return;
    }
    const finalImage = customBannerImageUrl.trim() || bannerImage;
    if (!finalImage) {
      Alert.alert('Banner Image Required', 'Please select or provide an image URL for the banner.');
      return;
    }

    try {
      const updated = await saveAdminHeroSlide({
        image: finalImage,
        title1: bannerTitle1.trim(),
        title2: bannerTitle2.trim(),
        badge: bannerBadge.trim() || 'happylokam Special',
        desc: bannerDesc.trim(),
        ctaText: bannerCtaText.trim() || 'Explore Celebration',
        ctaLink: bannerCtaLink.trim() || '/explore',
      });
      setHeroSlides(updated);
      if (onHeroSlidesUpdated) onHeroSlidesUpdated(updated);
      OtaSync.triggerSync();
      Alert.alert('Hero Banner Posted! 🚀', 'Your hero banner is now live in the home screen carousel.');
      setBannerTitle1('');
      setBannerTitle2('');
      setCustomBannerImageUrl('');
      setActiveTab('manage');
    } catch {
      Alert.alert('Error', 'Failed to publish hero banner. Please try again.');
    }
  };

  // Delete Hero Slide
  const handleDeleteHeroSlide = async (slideId: string, title: string) => {
    Alert.alert('Delete Banner', `Are you sure you want to remove "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updated = await deleteAdminHeroSlide(slideId);
          setHeroSlides(updated);
          if (onHeroSlidesUpdated) onHeroSlidesUpdated(updated);
          OtaSync.triggerSync();
        },
      },
    ]);
  };

  // Save New Section (with initial item)
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
      mapUrl: itemMapUrl.trim() || undefined,
      type: itemType.trim() || 'Featured',
      itemType: itemBookingType,
      price: parseFloat(itemPrice.replace(/[^\d.]/g, '')) || 50000,
      priceUnit: itemPrice.trim() || '₹50,000',
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
      Alert.alert('Section Created! 🎉', `"${secTitle}" is now live on the Home screen.`);
      setSecTitle('');
      setSecSubtitle('');
      setSecTag('');
      setItemTitle('');
      setItemLocation('');
      setCustomImageUrl('');
      setActiveTab('manage');
    } catch {
      Alert.alert('Error', 'Failed to save section. Please try again.');
    }
  };

  // Save New Category
  const handleSaveCategory = async () => {
    if (!catName.trim()) {
      Alert.alert('Category Name Required', 'Please enter a name for the new celebration category.');
      return;
    }

    const finalCatImage = customCatImageUrl.trim() || catImage;
    const newCategory: AdminCustomCategory = {
      id: `cat_${Date.now()}`,
      name: catName.trim(),
      image: finalCatImage,
      tag: catTag.trim() || 'Trending',
      createdAt: new Date().toISOString(),
      items: [],
    };

    try {
      const updated = await saveAdminCustomCategory(newCategory);
      setCategories(updated);
      if (onCategoriesUpdated) onCategoriesUpdated(updated);
      Alert.alert('Category Created! 🎂', `"${catName}" is now available in Explore & Home.`);
      setCatName('');
      setCatTag('');
      setCustomCatImageUrl('');
      setActiveTab('manage');
    } catch {
      Alert.alert('Error', 'Failed to save category. Please try again.');
    }
  };

  // Save Item to existing Section or Category
  const handleSaveItem = async () => {
    if (!itemTitle.trim()) {
      Alert.alert('Item Title Required', 'Please enter a title for this celebration item.');
      return;
    }
    if (!targetId) {
      Alert.alert('Target Required', `Please select a ${itemTargetType} to attach this item to.`);
      return;
    }

    const finalImage = customImageUrl.trim() || selectedImage;
    const newItem: AdminSectionItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sectionId: itemTargetType === 'section' ? targetId : undefined,
      categoryId: itemTargetType === 'category' ? targetId : undefined,
      title: itemTitle.trim(),
      location: itemLocation.trim() || 'Pan-India',
      mapUrl: itemMapUrl.trim() || undefined,
      type: itemType.trim() || 'Featured',
      itemType: itemBookingType,
      price: parseFloat(itemPrice.replace(/[^\d.]/g, '')) || 50000,
      priceUnit: itemPrice.trim() || '₹50,000',
      availableDates: availableDates.split(',').map((d) => d.trim()).filter(Boolean),
      totalSlots: 100,
      bookedSlots: 0,
      rating: parseFloat(itemRating) || 4.9,
      reviews: Math.floor(Math.random() * 80) + 40,
      image: finalImage,
      tags: itemTags ? itemTags.split(',').map((t) => t.trim()).filter(Boolean) : ['Verified'],
    };

    try {
      const result = await saveAdminSectionItem(newItem, {
        sectionId: itemTargetType === 'section' ? targetId : undefined,
        categoryId: itemTargetType === 'category' ? targetId : undefined,
      });
      onSectionsUpdated(result.sections);
      setCategories(result.categories);
      if (onCategoriesUpdated) onCategoriesUpdated(result.categories);
      Alert.alert('Item Added! ✨', `"${itemTitle}" has been added successfully.`);
      setItemTitle('');
      setItemLocation('');
      setCustomImageUrl('');
      setActiveTab('manage');
    } catch {
      Alert.alert('Error', 'Failed to add item. Please try again.');
    }
  };

  // Delete Section
  const handleDeleteSection = async (sectionId: string, title: string) => {
    Alert.alert('Delete Section', `Are you sure you want to remove "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updated = await deleteAdminCustomSection(sectionId);
          onSectionsUpdated(updated);
        },
      },
    ]);
  };

  // Delete Category
  const handleDeleteCategory = async (categoryId: string, name: string) => {
    Alert.alert('Delete Category', `Are you sure you want to remove "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updated = await deleteAdminCustomCategory(categoryId);
          setCategories(updated);
          if (onCategoriesUpdated) onCategoriesUpdated(updated);
        },
      },
    ]);
  };

  // Delete Item
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
                <Text style={styles.adminBadgeText}>HAPPY LOKAM SUPPORT</Text>
              </View>
            </View>
            <Text style={styles.headerTitle}>Curated Sections & Themes</Text>
            <Text style={styles.headerSubtitle}>Add new dynamic sections, categories & items</Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <X size={20} color="#64748b" />
          </TouchableOpacity>
        </View>

        {/* Tab Switcher */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabSwitcher}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'create-section' && styles.tabButtonActive]}
            onPress={() => setActiveTab('create-section')}
            activeOpacity={0.8}
          >
            <Layers size={15} color={activeTab === 'create-section' ? '#e11d48' : '#64748b'} />
            <Text style={[styles.tabButtonText, activeTab === 'create-section' && styles.tabButtonTextActive]}>
              + Section
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'create-category' && styles.tabButtonActive]}
            onPress={() => setActiveTab('create-category')}
            activeOpacity={0.8}
          >
            <FolderPlus size={15} color={activeTab === 'create-category' ? '#e11d48' : '#64748b'} />
            <Text style={[styles.tabButtonText, activeTab === 'create-category' && styles.tabButtonTextActive]}>
              + Category
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'create-item' && styles.tabButtonActive]}
            onPress={() => setActiveTab('create-item')}
            activeOpacity={0.8}
          >
            <Ticket size={15} color={activeTab === 'create-item' ? '#e11d48' : '#64748b'} />
            <Text style={[styles.tabButtonText, activeTab === 'create-item' && styles.tabButtonTextActive]}>
              + Item
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'create-banner' && styles.tabButtonActive]}
            onPress={() => setActiveTab('create-banner')}
            activeOpacity={0.8}
          >
            <ImageIcon size={15} color={activeTab === 'create-banner' ? '#e11d48' : '#64748b'} />
            <Text style={[styles.tabButtonText, activeTab === 'create-banner' && styles.tabButtonTextActive]}>
              + Banner
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'manage' && styles.tabButtonActive]}
            onPress={() => setActiveTab('manage')}
            activeOpacity={0.8}
          >
            <Sparkles size={15} color={activeTab === 'manage' ? '#e11d48' : '#64748b'} />
            <Text style={[styles.tabButtonText, activeTab === 'manage' && styles.tabButtonTextActive]}>
              Manage ({sections.length + categories.length + heroSlides.length})
            </Text>
          </TouchableOpacity>
        </ScrollView>

        <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* TAB 1: CREATE SECTION */}
          {activeTab === 'create-section' && (
            <View style={styles.formContainer}>
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
                      placeholder="e.g. Patna, Bihar"
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

                <Text style={styles.inputLabel}>Google Maps Direction Link (Optional)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="https://maps.app.goo.gl/... or Google Maps URL"
                  placeholderTextColor="#94a3b8"
                  value={itemMapUrl}
                  onChangeText={setItemMapUrl}
                />

                {/* Booking Type Selector */}
                <Text style={styles.inputLabel}>Admission / Reservation Type</Text>
                <View style={styles.typeSelectorRow}>
                  <TouchableOpacity
                    style={[styles.typePill, itemBookingType === 'BOOKING' && styles.typePillActive]}
                    onPress={() => setItemBookingType('BOOKING')}
                  >
                    <Text style={[styles.typePillText, itemBookingType === 'BOOKING' && styles.typePillTextActive]}>
                      🗓️ Reservation
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.typePill, itemBookingType === 'TICKET' && styles.typePillActive]}
                    onPress={() => setItemBookingType('TICKET')}
                  >
                    <Text style={[styles.typePillText, itemBookingType === 'TICKET' && styles.typePillTextActive]}>
                      🎟️ Digital Gate Pass
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Preset Image Picker */}
                <Text style={styles.inputLabel}>Select Cover Image</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
                  {PRESET_CELEBRATION_IMAGES.map((img) => {
                    const isSelected = selectedImage === img.url && !customImageUrl;
                    return (
                      <TouchableOpacity
                        key={img.label}
                        onPress={() => {
                          setSelectedImage(img.url);
                          setCustomImageUrl('');
                        }}
                        style={[styles.imageThumbWrap, isSelected && styles.imageThumbSelected]}
                      >
                        <Image source={{ uri: img.url }} style={styles.imageThumb} />
                        <Text style={styles.imageThumbLabel}>{img.label}</Text>
                        {isSelected && (
                          <View style={styles.selectedCheck}>
                            <Check size={12} color="#ffffff" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <Text style={styles.inputLabel}>Or Enter Custom Image URL</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="https://images.unsplash.com/..."
                  placeholderTextColor="#94a3b8"
                  value={customImageUrl}
                  onChangeText={setCustomImageUrl}
                />
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={handleSaveSection} activeOpacity={0.88}>
                <Sparkles size={18} color="#ffffff" />
                <Text style={styles.submitBtnText}>Publish Section to Home</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* TAB 2: CREATE CATEGORY */}
          {activeTab === 'create-category' && (
            <View style={styles.formContainer}>
              <View style={styles.cardSection}>
                <Text style={styles.sectionHeaderLabel}>NEW CELEBRATION CATEGORY</Text>
                <Text style={styles.inputLabel}>Category Name *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Baby Shower, Wedding Themes, Office Events"
                  placeholderTextColor="#94a3b8"
                  value={catName}
                  onChangeText={setCatName}
                />

                <Text style={styles.inputLabel}>Category Badge / Tag</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. VIP, Trending, Special Offer"
                  placeholderTextColor="#94a3b8"
                  value={catTag}
                  onChangeText={setCatTag}
                />

                <Text style={styles.inputLabel}>Select Category Cover Image</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
                  {PRESET_CELEBRATION_IMAGES.map((img) => {
                    const isSelected = catImage === img.url && !customCatImageUrl;
                    return (
                      <TouchableOpacity
                        key={img.label}
                        onPress={() => {
                          setCatImage(img.url);
                          setCustomCatImageUrl('');
                        }}
                        style={[styles.imageThumbWrap, isSelected && styles.imageThumbSelected]}
                      >
                        <Image source={{ uri: img.url }} style={styles.imageThumb} />
                        <Text style={styles.imageThumbLabel}>{img.label}</Text>
                        {isSelected && (
                          <View style={styles.selectedCheck}>
                            <Check size={12} color="#ffffff" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <Text style={styles.inputLabel}>Or Enter Custom Category Image URL</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="https://images.unsplash.com/..."
                  placeholderTextColor="#94a3b8"
                  value={customCatImageUrl}
                  onChangeText={setCustomCatImageUrl}
                />
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={handleSaveCategory} activeOpacity={0.88}>
                <FolderPlus size={18} color="#ffffff" />
                <Text style={styles.submitBtnText}>Publish Category</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* TAB 3: CREATE ITEM */}
          {activeTab === 'create-item' && (
            <View style={styles.formContainer}>
              <View style={styles.cardSection}>
                <Text style={styles.sectionHeaderLabel}>TARGET DESTINATION</Text>
                <View style={styles.typeSelectorRow}>
                  <TouchableOpacity
                    style={[styles.typePill, itemTargetType === 'section' && styles.typePillActive]}
                    onPress={() => {
                      setItemTargetType('section');
                      if (sections.length > 0) setTargetId(sections[0].id);
                    }}
                  >
                    <Text style={[styles.typePillText, itemTargetType === 'section' && styles.typePillTextActive]}>
                      To Section ({sections.length})
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.typePill, itemTargetType === 'category' && styles.typePillActive]}
                    onPress={() => {
                      setItemTargetType('category');
                      if (categories.length > 0) setTargetId(categories[0].id);
                    }}
                  >
                    <Text style={[styles.typePillText, itemTargetType === 'category' && styles.typePillTextActive]}>
                      To Category ({categories.length})
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.inputLabel}>Select Destination Name</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
                  {(itemTargetType === 'section' ? sections : categories).map((dest: any) => {
                    const isSelected = targetId === dest.id;
                    return (
                      <TouchableOpacity
                        key={dest.id}
                        style={[styles.destChip, isSelected && styles.destChipActive]}
                        onPress={() => setTargetId(dest.id)}
                      >
                        <Text style={[styles.destChipText, isSelected && styles.destChipTextActive]}>
                          {dest.title || dest.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.cardSection}>
                <Text style={styles.sectionHeaderLabel}>ITEM DETAILS</Text>
                <Text style={styles.inputLabel}>Item Title *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Royal Rajwada Mandap Set, Desi Ghee Feasts"
                  placeholderTextColor="#94a3b8"
                  value={itemTitle}
                  onChangeText={setItemTitle}
                />

                <View style={styles.rowInputs}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.inputLabel}>Location</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. Patna, Bihar"
                      placeholderTextColor="#94a3b8"
                      value={itemLocation}
                      onChangeText={setItemLocation}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.inputLabel}>Price *</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. ₹45,000"
                      placeholderTextColor="#94a3b8"
                      value={itemPrice}
                      onChangeText={setItemPrice}
                    />
                  </View>
                </View>

                <Text style={styles.inputLabel}>Google Maps Direction Link (Optional)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="https://maps.app.goo.gl/... or Google Maps URL"
                  placeholderTextColor="#94a3b8"
                  value={itemMapUrl}
                  onChangeText={setItemMapUrl}
                />

                <Text style={styles.inputLabel}>Tags / Amenities (comma separated)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Royal Decor, Live Music, AC Banquet"
                  placeholderTextColor="#94a3b8"
                  value={itemTags}
                  onChangeText={setItemTags}
                />

                <Text style={styles.inputLabel}>Cover Image</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
                  {PRESET_CELEBRATION_IMAGES.map((img) => {
                    const isSelected = selectedImage === img.url && !customImageUrl;
                    return (
                      <TouchableOpacity
                        key={img.label}
                        onPress={() => {
                          setSelectedImage(img.url);
                          setCustomImageUrl('');
                        }}
                        style={[styles.imageThumbWrap, isSelected && styles.imageThumbSelected]}
                      >
                        <Image source={{ uri: img.url }} style={styles.imageThumb} />
                        <Text style={styles.imageThumbLabel}>{img.label}</Text>
                        {isSelected && (
                          <View style={styles.selectedCheck}>
                            <Check size={12} color="#ffffff" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={handleSaveItem} activeOpacity={0.88}>
                <Plus size={18} color="#ffffff" />
                <Text style={styles.submitBtnText}>Add Item</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* TAB 3: CREATE HERO BANNER */}
          {activeTab === 'create-banner' && (
            <View style={styles.formContainer}>
              <View style={styles.cardSection}>
                <Text style={styles.sectionHeaderLabel}>1. HERO BANNER COPY & BADGES</Text>
                
                <Text style={styles.inputLabel}>Main Headline / Title 1 *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Happy Birthday Grand Celebrations"
                  placeholderTextColor="#94a3b8"
                  value={bannerTitle1}
                  onChangeText={setBannerTitle1}
                />

                <Text style={styles.inputLabel}>Secondary Title / Highlight</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Royal Vivah & Rose-Petal Varmala"
                  placeholderTextColor="#94a3b8"
                  value={bannerTitle2}
                  onChangeText={setBannerTitle2}
                />

                <View style={styles.rowInputs}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.inputLabel}>Badge Tag</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. happylokam Special"
                      placeholderTextColor="#94a3b8"
                      value={bannerBadge}
                      onChangeText={setBannerBadge}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.inputLabel}>Button CTA Text</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. Explore Now"
                      placeholderTextColor="#94a3b8"
                      value={bannerCtaText}
                      onChangeText={setBannerCtaText}
                    />
                  </View>
                </View>

                <Text style={styles.inputLabel}>Banner Description / Subtitle</Text>
                <TextInput
                  style={[styles.textInput, { height: 60 }]}
                  placeholder="e.g. Curated birthday themes, live confetti, luxury mandaps & digital passes"
                  placeholderTextColor="#94a3b8"
                  multiline
                  value={bannerDesc}
                  onChangeText={setBannerDesc}
                />

                <Text style={styles.inputLabel}>CTA Navigation Link</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. /explore?category=Birthday Themes"
                  placeholderTextColor="#94a3b8"
                  value={bannerCtaLink}
                  onChangeText={setBannerCtaLink}
                />
              </View>

              <View style={styles.cardSection}>
                <Text style={styles.sectionHeaderLabel}>2. HERO BANNER IMAGE</Text>
                <Text style={styles.inputLabel}>Select High-Impact Celebration Cover</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
                  {PRESET_CELEBRATION_IMAGES.map((img) => {
                    const isSelected = bannerImage === img.url && !customBannerImageUrl;
                    return (
                      <TouchableOpacity
                        key={img.label}
                        onPress={() => {
                          setBannerImage(img.url);
                          setCustomBannerImageUrl('');
                        }}
                        style={[styles.imageThumbWrap, isSelected && styles.imageThumbSelected]}
                      >
                        <Image source={{ uri: img.url }} style={styles.imageThumb} />
                        <Text style={styles.imageThumbLabel}>{img.label}</Text>
                        {isSelected && (
                          <View style={styles.selectedCheck}>
                            <Check size={12} color="#ffffff" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <Text style={[styles.inputLabel, { marginTop: 14 }]}>Or Enter Custom Image URL</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="https://images.unsplash.com/... or https://api.happylokam.com/uploads/..."
                  placeholderTextColor="#94a3b8"
                  value={customBannerImageUrl}
                  onChangeText={setCustomBannerImageUrl}
                />
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={handleSaveBanner} activeOpacity={0.88}>
                <Sparkles size={18} color="#ffffff" />
                <Text style={styles.submitBtnText}>Post Hero Banner 🚀</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* TAB 4: MANAGE TAB */}
          {activeTab === 'manage' && (
            <View style={styles.manageContainer}>
              {/* Hero Banners List */}
              <Text style={styles.sectionHeaderLabel}>ACTIVE HERO BANNERS ({heroSlides.length})</Text>
              {heroSlides.map((slide) => (
                <View key={slide.id || slide.title} style={styles.manageSectionCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Image source={{ uri: slide.image }} style={styles.manageItemImg} />
                    <View style={{ flex: 1, marginHorizontal: 12 }}>
                      <Text style={styles.manageSecTitle} numberOfLines={1}>{slide.title || slide.title1}</Text>
                      <Text style={styles.manageSecSub} numberOfLines={1}>{slide.badge || 'Banner'} • {slide.subtitle || slide.desc}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteHeroSlide(slide.id, slide.title || slide.title1)}
                      style={styles.deleteSecBtn}
                    >
                      <Trash2 size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {/* Sections List */}
              <Text style={[styles.sectionHeaderLabel, { marginTop: 20 }]}>ACTIVE SECTIONS ({sections.length})</Text>
              {sections.map((sec) => (
                <View key={sec.id} style={styles.manageSectionCard}>
                  <View style={styles.manageSectionHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.manageSecTitle}>{sec.title}</Text>
                      <Text style={styles.manageSecSub}>{sec.subtitle || 'Custom Dynamic Section'}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteSection(sec.id, sec.title)}
                      style={styles.deleteSecBtn}
                    >
                      <Trash2 size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>

                  {/* Items count */}
                  <Text style={styles.secItemsCountLabel}>ITEMS ({sec.items?.length || 0}):</Text>
                  {(sec.items || []).map((it) => (
                    <View key={it.id} style={styles.manageItemRow}>
                      <Image source={{ uri: it.image }} style={styles.manageItemImg} />
                      <View style={{ flex: 1, marginHorizontal: 10 }}>
                        <Text style={styles.manageItemTitle} numberOfLines={1}>{it.title}</Text>
                        <Text style={styles.manageItemSub} numberOfLines={1}>
                          <MapPin size={10} color="#94a3b8" /> {it.location} • ₹{it.price}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleDeleteItem(sec.id, it.id)}
                        style={styles.deleteItemBtn}
                      >
                        <Trash2 size={14} color="#94a3b8" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ))}

              {/* Categories List */}
              <Text style={[styles.sectionHeaderLabel, { marginTop: 20 }]}>
                ACTIVE CATEGORIES ({categories.length})
              </Text>
              {categories.map((cat) => (
                <View key={cat.id} style={styles.manageCategoryRow}>
                  <Image source={{ uri: cat.image }} style={styles.manageCatImg} />
                  <View style={{ flex: 1, marginHorizontal: 12 }}>
                    <Text style={styles.manageCatName}>{cat.name}</Text>
                    <Text style={styles.manageCatSub}>{cat.tag || 'Category'}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeleteCategory(cat.id, cat.name)}
                    style={styles.deleteSecBtn}
                  >
                    <Trash2 size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
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
    fontSize: 20,
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
    gap: 8,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
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
    fontSize: 12,
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
    marginTop: 10,
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
  },
  rowInputs: {
    flexDirection: 'row',
    marginTop: 4,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  typePill: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
  },
  typePillActive: {
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3',
  },
  typePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  typePillTextActive: {
    color: '#e11d48',
  },
  destChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  destChipActive: {
    backgroundColor: '#e11d48',
    borderColor: '#e11d48',
  },
  destChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  destChipTextActive: {
    color: '#ffffff',
  },
  imageScroll: {
    marginTop: 8,
    flexDirection: 'row',
  },
  imageThumbWrap: {
    marginRight: 10,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  imageThumbSelected: {
    borderColor: '#e11d48',
  },
  imageThumb: {
    width: 80,
    height: 60,
    borderRadius: 10,
  },
  imageThumbLabel: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    fontSize: 9,
    fontWeight: '800',
    color: '#ffffff',
    backgroundColor: 'rgba(0,0,0,0.5)',
    textAlign: 'center',
    borderRadius: 4,
    paddingVertical: 1,
  },
  selectedCheck: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#e11d48',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#e11d48',
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#e11d48',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 8,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  manageContainer: {
    gap: 14,
  },
  manageSectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  manageSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  manageSecTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  manageSecSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  deleteSecBtn: {
    padding: 8,
    backgroundColor: '#fee2e2',
    borderRadius: 10,
  },
  secItemsCountLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    marginBottom: 8,
  },
  manageItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  manageItemImg: {
    width: 38,
    height: 38,
    borderRadius: 8,
  },
  manageItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  manageItemSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  deleteItemBtn: {
    padding: 6,
  },
  manageCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  manageCatImg: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  manageCatName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  manageCatSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
});
