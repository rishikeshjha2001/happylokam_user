import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
} from 'lucide-react-native';
import RoomDatabase from '../services/roomDatabase';
import { getAdminSectionItemById, AdminSectionItem } from '../services/adminSections';
import PaymentModal from '../components/PaymentModal';

const { width } = Dimensions.get('window');

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
  
  // Rating & Review State
  const [ratings, setRatings] = useState<any[]>([]);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [userStars, setUserStars] = useState(5);
  const [userReviewText, setUserReviewText] = useState('');

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
          setLoading(false);
          return;
        }
      }

      // Fallback from navigation query params
      const fallbackItem: any = {
        id: params.id || 'sec_item_1',
        title: params.title || 'Grand Celebration Experience',
        subtitle: params.subtitle || 'Exclusive celebration service package by HappyLokam',
        price: params.price ? (parseInt(params.price.replace(/\D/g, ''), 10) || 1499) : 1499,
        image: params.image || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
        cornerTag: params.cornerTag || 'SPECIAL',
        type: params.type || 'CELEBRATION',
        location: params.location || 'Verified Location',
        description: params.description || params.subtitle || 'Exclusive celebration service package curated with highest quality and satisfaction guarantee.',
        features: [
          'Dedicated Event Manager & On-Site Coordinator',
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

  const isTicket = item.itemType === 'TICKET' || item.type?.toLowerCase().includes('ticket');
  const basePriceNum = typeof item.price === 'number' 
    ? item.price 
    : (parseInt(String(item.price).replace(/\D/g, ''), 10) || 1499);

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
        {/* Hero Image Section */}
        <View style={styles.heroContainer}>
          <Image
            source={{
              uri: item.image || item.imageUrl || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
            }}
            style={styles.heroImage}
          />
          <View style={styles.heroOverlay} />

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

          {/* Type Pill */}
          <View style={styles.heroBottomRow}>
            <View style={styles.typePill}>
              {isTicket ? <Ticket size={12} color="#ffffff" /> : <Calendar size={12} color="#ffffff" />}
              <Text style={styles.typePillText}>{item.type || 'EXPERIENCE'}</Text>
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

          {/* Available Dates Selection */}
          {item.availableDates && item.availableDates.length > 0 && (
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>Available Dates</Text>
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
            </View>
          )}

          {/* Available Times Selection */}
          {item.availableTimes && item.availableTimes.length > 0 && (
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>Available Time Slots</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                {item.availableTimes.map((timeStr: string) => {
                  const isSelected = selectedTime === timeStr;
                  return (
                    <TouchableOpacity
                      key={timeStr}
                      style={[styles.timeChip, isSelected && styles.timeChipSelected]}
                      onPress={() => setSelectedTime(timeStr)}
                      activeOpacity={0.8}
                    >
                      <Clock size={13} color={isSelected ? '#ffffff' : '#64748b'} />
                      <Text style={[styles.timeChipText, isSelected && styles.timeChipTextSelected]}>
                        {timeStr}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Features Included */}
          {item.features && item.features.length > 0 && (
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>Features & Highlights</Text>
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
              <Text style={styles.guaranteeTitle}>HappyLokam Quality Assured</Text>
              <Text style={styles.guaranteeSub}>
                100% genuine vendors, verified backup teams, secure online payments via Razorpay, and instant digital check-in passes.
              </Text>
            </View>
          </View>

          {/* Ratings & Customer Reviews */}
          <View style={styles.sectionBlock}>
            <View style={styles.reviewHeaderRow}>
              <Text style={styles.sectionTitle}>Reviews & Ratings</Text>
              <TouchableOpacity
                style={styles.addReviewBtn}
                onPress={() => setRatingModalVisible(true)}
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
                  No reviews yet. Be the first to share your experience!
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
          <Text style={styles.footerPriceLabel}>Total Package</Text>
          <Text style={styles.footerPrice}>₹{basePriceNum.toLocaleString('en-IN')}</Text>
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
          item={item}
          onClose={() => setShowPayment(false)}
          onSuccess={() => {
            // refresh data
          }}
        />
      )}

      {/* Rating & Review Modal */}
      <Modal visible={ratingModalVisible} transparent animationType="fade" onRequestClose={() => setRatingModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.ratingModalCard}>
            <Text style={styles.ratingModalTitle}>Share Your Experience</Text>
            <Text style={styles.ratingModalSub}>How was your service or booking experience?</Text>

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
    marginBottom: 22,
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
  sectionBlock: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
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
});
