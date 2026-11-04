import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
  TextInput,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import {
  ChevronDown,
  ShieldCheck,
  Check,
  Calendar,
  Ticket,
  MapPin,
  Clock,
  User,
  Phone,
  Plus,
  Minus,
  Sparkles,
  QrCode,
  Wallet,
  LogIn,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import RazorpayCheckout from 'react-native-razorpay';
import RoomDatabase from '../services/roomDatabase';
import { bookSectionItem } from '../services/adminSections';
import { createRazorpayOrder, verifyRazorpayPayment, getUserWallet } from '../services/api';

const RAZORPAY_KEY = process.env.EXPO_PUBLIC_RAZORPAY_KEY || 'rzp_live_SjBHhCXWmZhVK6';

interface PaymentModalProps {
  visible: boolean;
  item: any;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function PaymentModal({ visible, item, onClose, onSuccess }: PaymentModalProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedMethod, setSelectedMethod] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [paying, setPaying] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWallet, setUseWallet] = useState(false);
  const celebrationScale = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (confirmedBooking) {
      celebrationScale.setValue(0.3);
      Animated.spring(celebrationScale, {
        toValue: 1,
        friction: 4,
        tension: 50,
        useNativeDriver: true,
      }).start();
    }
  }, [confirmedBooking]);

  useEffect(() => {
    if (item && visible) {
      setQuantity(1);
      setConfirmedBooking(null);
      // Default to first available date or tomorrow
      if (Array.isArray(item.availableDates) && item.availableDates.length > 0) {
        setSelectedDate(item.availableDates[0]);
      } else {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setSelectedDate(tomorrow.toISOString().split('T')[0]);
      }

      // Check auth status & fetch wallet balance
      RoomDatabase.isAuthenticated().then((authed) => {
        setIsLoggedIn(authed);
      });

      RoomDatabase.getWalletBalance().then((bal) => {
        setWalletBalance(bal);
        if (bal > 0) {
          setUseWallet(true); // Auto-apply wallet perks
        }
      });

      // Pre-fill user profile if logged in
      RoomDatabase.getUserSession().then((session) => {
        if (session) {
          if (session.name) setGuestName(session.name);
          if (session.phone) setGuestPhone(session.phone);
        }
      });
    }
  }, [item, visible]);

  if (!item) return null;

  const isTicket = item.itemType === 'TICKET' || item.type?.toLowerCase().includes('ticket') || item.type?.toLowerCase().includes('pass');
  const basePriceNum = typeof item.price === 'number' 
    ? item.price 
    : (parseInt(String(item.price).replace(/\D/g, ''), 10) || 499);

  const bookingDays = item.bookingDays || 1;
  const guestCount = item.guestCount || item.capacity || 100;
  const subtotal = item.calculatedSubtotal !== undefined
    ? item.calculatedSubtotal
    : (isTicket ? basePriceNum * quantity : basePriceNum * bookingDays);
  // All pricing determined by admin configuration - no arbitrary/fake discounts
  const maxWalletApplicable = Math.min(walletBalance, subtotal);
  const walletDiscount = useWallet ? maxWalletApplicable : 0;
  const total = Math.max(0, subtotal - walletDiscount);

  const availableDateList = Array.isArray(item.availableDates) && item.availableDates.length > 0
    ? item.availableDates
    : [selectedDate];

  const handlePay = async () => {
    // 1. Auth Guard Check
    const authed = await RoomDatabase.isAuthenticated();
    if (!authed) {
      Alert.alert(
        'Login Required',
        'Please log in or create an account to book your celebration pass.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Log In Now',
            onPress: () => {
              onClose();
              router.push('/login');
            },
          },
        ]
      );
      return;
    }

    if (!guestName.trim()) {
      Alert.alert('Required', 'Please enter your name for the booking ticket.');
      return;
    }
    if (!guestPhone.trim()) {
      Alert.alert('Required', 'Please enter your phone number to receive digital pass SMS & WhatsApp.');
      return;
    }

    setPaying(true);
    try {
      let bookingResult: any = null;

      // A pass exists only after the server creates the booking.
      if (!item.id || item.id.startsWith('mock_')) throw new Error('This item is not available for secure booking.');
      bookingResult = await bookSectionItem(item.id, {
        bookingDate: selectedDate,
        quantity,
        userName: guestName.trim(),
        userPhone: guestPhone.trim(),
        notes: isTicket ? 'Mobile Ticket Pass' : 'Mobile Reservation Booking',
        walletDiscount: useWallet ? walletDiscount : 0,
      });
      const confirmedServerId = bookingResult?.data?.id || bookingResult?.id;
      if (!confirmedServerId) {
        throw new Error(bookingResult?.error || 'The booking could not be created on the server.');
      }

      // 3. Razorpay Order Creation & Native Checkout
      let paymentId = '';
      let orderId = '';
      let signature = '';

      if (total > 0) {
        const razorpayOrder = await createRazorpayOrder(
          total,
          `hl_sec_${Date.now()}`,
          { sectionBookingId: confirmedServerId, purpose: 'SECTION' }
        );
        orderId = razorpayOrder.id;

        // Trigger Razorpay Checkout (Native and Web)
        try {
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
              const userSession = await RoomDatabase.getUserSession();
              await new Promise((resolve) => {
                const rzp = new (window as any).Razorpay({
                  description: item.title || 'Celebration Booking',
                  image: 'https://happylokam.com/favicon.png',
                  currency: 'INR',
                  key: RAZORPAY_KEY,
                  amount: Math.round(total * 100),
                  name: 'happylokam Celebrations',
                  order_id: orderId.startsWith('order_') && orderId.length > 15 ? orderId : undefined,
                  prefill: {
                    email: 'rishikeshjha1710@gmail.com',
                    contact: '9570729077',
                    name: guestName.trim() || 'HappyLokam Guest',
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
            const userSession = await RoomDatabase.getUserSession();
            const rzpOptions = {
              description: item.title || 'Celebration Booking',
              image: 'https://happylokam.com/favicon.png',
              currency: 'INR',
              key: RAZORPAY_KEY,
              amount: Math.round(total * 100), // in paise
              name: 'happylokam Celebrations',
              order_id: orderId,
              prefill: {
                email: 'rishikeshjha1710@gmail.com',
                contact: '9570729077',
                name: guestName.trim() || 'HappyLokam Guest',
              },
              theme: { color: '#e11d48' },
            };
            const rzpRes: any = await RazorpayCheckout.open(rzpOptions);
            if (rzpRes?.razorpay_payment_id) {
              paymentId = rzpRes.razorpay_payment_id;
              orderId = rzpRes.razorpay_order_id || orderId;
              signature = rzpRes.razorpay_signature || signature;
            }
          }
        } catch (rzpErr: any) {
          // If user manually closed/cancelled the Razorpay popup, abort payment
          if (rzpErr?.code === 0 || rzpErr?.description?.toLowerCase().includes('cancel')) {
            setPaying(false);
            return;
          }
          throw rzpErr;
        }
      }

      const confirmedTicketCode = bookingResult?.data?.ticketCode || bookingResult?.ticketCode;

      if (total > 0 && (!paymentId || !orderId || !signature)) throw new Error('Payment was not completed.');

      await verifyRazorpayPayment({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
        sectionBookingId: confirmedServerId,
        amount: total,
      });

      // 4. Store single verified pass in local RoomDatabase
      const ticketId = confirmedTicketCode || confirmedServerId;
      const localBooking = {
        id: confirmedServerId || ('hlc_' + Date.now()),
        title: item.title || 'Celebration Booking',
        category: isTicket ? 'Ticket Pass' : (item.type || item.itemType || 'Reservation'),
        date: selectedDate,
        amount: total,
        status: 'CONFIRMED' as const,
        tierName: isTicket ? 'Ticket Pass' : 'Confirmed Booking',
        ticketsCount: quantity,
        qrCode: ticketId,
        serverVerified: true,
        createdAt: new Date().toISOString(),
      };
      await RoomDatabase.saveBooking(localBooking);

      // 5. Deduct Wallet Balance if applied and record ledger transaction
      if (useWallet && walletDiscount > 0) {
        await RoomDatabase.deductWalletBalance(walletDiscount);
        await RoomDatabase.addWalletTransaction({
          title: `Celebration Booking: ${item.title || 'Pass'}`,
          amount: walletDiscount,
          type: 'debit',
          date: new Date().toISOString(),
          category: 'Booking Payment',
          referenceId: confirmedServerId || `hlc_${Date.now()}`,
          notes: `Applied on ${item.title}`,
        });
        setWalletBalance((prev) => Math.max(0, prev - walletDiscount));
      }

      // 6. Deep sync the exact new wallet balance from server into RoomDatabase
      try {
        const freshWallet = await getUserWallet();
        if (typeof freshWallet?.walletBalance === 'number') {
          await RoomDatabase.setWalletBalance(freshWallet.walletBalance);
          setWalletBalance(freshWallet.walletBalance);
        }
      } catch (err) {
        console.warn('Failed to refresh wallet post-payment:', err);
      }
      await RoomDatabase.addNotification({
        id: 'notif_bkg_' + Date.now(),
        title: `Booking Confirmed: ${localBooking.title} 🎉`,
        message: `Your celebration ${isTicket ? 'digital ticket' : 'reservation'} is confirmed for ${selectedDate}. Pass Code: ${ticketId}. Total paid: ₹${total.toLocaleString('en-IN')}.`,
        sentAt: new Date().toISOString(),
        isRead: false,
      });
      setConfirmedBooking({ ...localBooking, ticketCode: ticketId });

      if (onSuccess) onSuccess();
    } catch (e: any) {
      console.warn('Booking save error:', e);
      Alert.alert('Booking Notice', e?.message || 'Your booking could not be completed. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  const paymentMethods = [
    { title: 'UPI / QR Code (Google Pay, PhonePe, Paytm)', fast: true },
    { title: 'Credit / Debit Card', fast: false },
    { title: 'Net Banking', fast: false },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <ChevronDown size={22} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isTicket ? 'Book Ticket Pass' : 'Review & Reserve'}</Text>
          <View style={styles.closeBtnPlaceholder} />
        </View>

        {/* Confirmation Screen if Booked */}
        {confirmedBooking ? (
          <ScrollView
            contentContainerStyle={[styles.scrollContent, { alignItems: 'center', paddingTop: 30 }]}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View style={[styles.successIconCircle, { transform: [{ scale: celebrationScale }] }]}>
              <Check size={36} color="#10b981" strokeWidth={3} />
            </Animated.View>

            <Text style={styles.successTitle}>Booking Confirmed! 🎉</Text>
            <Text style={styles.successSubtitle}>
              Your {isTicket ? 'ticket pass' : 'reservation'} has been secured and verified.
            </Text>

            {/* Ticket Card */}
            <View style={styles.ticketCard}>
              <View style={styles.ticketTopRow}>
                <View style={styles.ticketBadge}>
                  {isTicket ? <Ticket size={12} color="#e11d48" /> : <Calendar size={12} color="#e11d48" />}
                  <Text style={styles.ticketBadgeText}>{isTicket ? 'DIGITAL TICKET' : 'BOOKING PASS'}</Text>
                </View>
                <Text style={styles.ticketCode}>{confirmedBooking.ticketCode}</Text>
              </View>

              <Text style={styles.ticketItemTitle}>{confirmedBooking.title}</Text>
              
              <View style={styles.ticketInfoGrid}>
                <View>
                  <Text style={styles.ticketInfoLabel}>DATE</Text>
                  <Text style={styles.ticketInfoVal}>{confirmedBooking.date}</Text>
                </View>
                <View>
                  <Text style={styles.ticketInfoLabel}>{isTicket ? 'TICKETS' : 'SLOTS'}</Text>
                  <Text style={styles.ticketInfoVal}>{confirmedBooking.ticketsCount}</Text>
                </View>
                <View>
                  <Text style={styles.ticketInfoLabel}>AMOUNT PAID</Text>
                  <Text style={[styles.ticketInfoVal, { color: '#10b981' }]}>₹{confirmedBooking.amount}</Text>
                </View>
              </View>

              <View style={styles.qrBox}>
                <QrCode size={110} color="#0f172a" />
                <Text style={styles.qrPrompt}>Scan at gate / venue for instant check-in</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => {
                onClose();
                router.replace('/(tabs)/bookings');
              }}
              activeOpacity={0.88}
            >
              <Text style={styles.doneBtnText}>View in My Bookings</Text>
            </TouchableOpacity>
          </ScrollView>
        ) : (
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: 110 + Math.max(insets.bottom, 16) },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Item Summary */}
            <View style={styles.itemCard}>
              <Image
                source={{
                  uri: item.image || item.imageUrl || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80',
                }}
                style={styles.itemImage}
              />
              <View style={styles.itemDetails}>
                <View style={styles.typeBadgeRow}>
                  <View
                    style={[
                      styles.typeBadge,
                      { backgroundColor: isTicket ? '#fef3c7' : '#e0e7ff' },
                    ]}
                  >
                    {isTicket ? <Ticket size={11} color="#d97706" /> : <Calendar size={11} color="#4338ca" />}
                    <Text
                      style={[
                        styles.typeBadgeText,
                        { color: isTicket ? '#b45309' : '#3730a3' },
                      ]}
                    >
                      {isTicket ? 'TICKET PASS' : 'BOOKING'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.itemTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                {item.location && (
                  <View style={styles.locationRow}>
                    <MapPin size={11} color="#94a3b8" />
                    <Text style={styles.locationText} numberOfLines={1}>{item.location}</Text>
                  </View>
                )}
                <Text style={styles.itemPrice}>
                  ₹{basePriceNum.toLocaleString('en-IN')}{' '}
                  <Text style={styles.itemPriceUnit}>/ {item.priceUnit || (isTicket ? 'ticket' : 'booking')}</Text>
                </Text>
              </View>
            </View>

            {/* 1. Available Dates Selection */}
            <Text style={styles.sectionTitle}>Select Available Date</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.datesScroll}>
              {availableDateList.map((dateStr: string) => {
                const isSelected = selectedDate === dateStr;
                return (
                  <TouchableOpacity
                    key={dateStr}
                    style={[styles.dateChip, isSelected && styles.dateChipSelected]}
                    onPress={() => setSelectedDate(dateStr)}
                    activeOpacity={0.8}
                  >
                    <Calendar size={13} color={isSelected ? '#ffffff' : '#475569'} />
                    <Text style={[styles.dateChipText, isSelected && styles.dateChipTextSelected]}>
                      {dateStr}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* 2. Quantity Counter for Tickets / Schedule Summary for Services */}
            {isTicket ? (
              <View style={styles.qtyCard}>
                <View>
                  <Text style={styles.qtyLabel}>Number of Digital Passes</Text>
                  <Text style={styles.qtySub}>Instant digital verification upon booking</Text>
                </View>
                <View style={styles.counterRow}>
                  <TouchableOpacity
                    style={styles.counterBtn}
                    onPress={() => setQuantity(Math.max(1, quantity - 1))}
                    activeOpacity={0.7}
                  >
                    <Minus size={15} color="#0f172a" />
                  </TouchableOpacity>
                  <Text style={styles.counterNum}>{quantity}</Text>
                  <TouchableOpacity
                    style={styles.counterBtn}
                    onPress={() => setQuantity(quantity + 1)}
                    activeOpacity={0.7}
                  >
                    <Plus size={15} color="#0f172a" />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.qtyCard}>
                <View>
                  <Text style={styles.qtyLabel}>Celebration Booking Schedule</Text>
                  <Text style={styles.qtySub}>
                    {bookingDays} Day(s) • {guestCount} Guests to Feed / Accommodate
                  </Text>
                </View>
              </View>
            )}

            {/* 3. Guest Details */}
            <Text style={styles.sectionTitle}>Guest Information</Text>
            <View style={styles.inputCard}>
              <View style={styles.inputRow}>
                <User size={16} color="#94a3b8" />
                <TextInput
                  style={styles.textInput}
                  placeholder="Full Name (for ticket pass)"
                  placeholderTextColor="#94a3b8"
                  value={guestName}
                  onChangeText={setGuestName}
                />
              </View>
              <View style={styles.inputDivider} />
              <View style={styles.inputRow}>
                <Phone size={16} color="#94a3b8" />
                <TextInput
                  style={styles.textInput}
                  placeholder="10-digit Phone Number"
                  placeholderTextColor="#94a3b8"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={guestPhone}
                  onChangeText={setGuestPhone}
                />
              </View>
            </View>

            {/* 4. Bill Details */}
            <Text style={styles.sectionTitle}>Bill Breakdown</Text>
            <View style={styles.billCard}>
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>
                  {isTicket
                    ? `Ticket Pass (₹${basePriceNum} × ${quantity})`
                    : `Celebration Service (${bookingDays} Day(s) • ${guestCount} Guests)`}
                </Text>
                <Text style={styles.billValue}>₹{subtotal.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Taxes & Fees</Text>
                <Text style={[styles.billValue, { color: '#059669' }]}>Included</Text>
              </View>
              {useWallet && walletDiscount > 0 && (
                <View style={styles.billRow}>
                  <Text style={[styles.discountLabel, { color: '#059669', fontWeight: '700' }]}>
                    Wallet Balance Applied
                  </Text>
                  <Text style={[styles.discountValue, { color: '#059669', fontWeight: '700' }]}>
                    -₹{walletDiscount}
                  </Text>
                </View>
              )}
              <View style={styles.divider} />
              <View style={[styles.billRow, { alignItems: 'center' }]}>
                <Text style={styles.totalLabel}>Total Payable</Text>
                <Text style={styles.totalValue}>₹{total.toLocaleString('en-IN')}</Text>
              </View>
            </View>

            {/* Wallet Perks Toggle Card */}
            {walletBalance > 0 && (
              <TouchableOpacity
                style={{
                  backgroundColor: useWallet ? '#ecfdf5' : '#ffffff',
                  borderWidth: 1.5,
                  borderColor: useWallet ? '#10b981' : '#e2e8f0',
                  borderRadius: 14,
                  padding: 14,
                  marginBottom: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
                onPress={() => setUseWallet(!useWallet)}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                  <View
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      backgroundColor: useWallet ? '#d1fae5' : '#f1f5f9',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Wallet size={20} color={useWallet ? '#059669' : '#64748b'} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a' }}>
                      Use happylokam Wallet Balance
                    </Text>
                    <Text style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                      Available: ₹{walletBalance.toLocaleString('en-IN')} (Save ₹{maxWalletApplicable})
                    </Text>
                  </View>
                </View>
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    borderWidth: 2,
                    borderColor: useWallet ? '#10b981' : '#94a3b8',
                    backgroundColor: useWallet ? '#10b981' : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {useWallet && <Check size={14} color="#ffffff" strokeWidth={3} />}
                </View>
              </TouchableOpacity>
            )}

            {/* Guest / Auth Banner if not logged in */}
            {!isLoggedIn && (
              <View
                style={{
                  backgroundColor: '#fff1f2',
                  borderWidth: 1,
                  borderColor: '#fecdd3',
                  borderRadius: 14,
                  padding: 14,
                  marginBottom: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#be123c' }}>
                    Login required to book
                  </Text>
                  <Text style={{ fontSize: 12, color: '#e11d48', marginTop: 2 }}>
                    Log in to unlock your wallet cash and receive verified digital entry passes.
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    onClose();
                    router.push('/login');
                  }}
                  style={{
                    backgroundColor: '#e11d48',
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <LogIn size={14} color="#ffffff" />
                  <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '700' }}>Log In</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 5. Payment Methods */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, marginLeft: 4, marginRight: 4 }}>
              <Text style={[styles.sectionTitle, { marginBottom: 0, marginLeft: 0 }]}>Pay With</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <ShieldCheck size={13} color="#059669" />
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#059669' }}>
                  100% Verified Secure
                </Text>
              </View>
            </View>
            <View style={styles.methodsContainer}>
              {paymentMethods.map((method, i) => {
                const isSelected = selectedMethod === i;
                return (
                  <TouchableOpacity
                    key={method.title}
                    style={[styles.methodCard, isSelected && styles.methodCardSelected]}
                    onPress={() => setSelectedMethod(i)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                      {isSelected && <Check size={12} color="#ffffff" strokeWidth={3} />}
                    </View>
                    <Text style={styles.methodTitle}>{method.title}</Text>
                    {method.fast && (
                      <View style={styles.fastBadge}>
                        <Text style={styles.fastBadgeText}>FAST</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Razorpay Trust Seal */}
            <View
              style={{
                marginTop: 14,
                padding: 12,
                borderRadius: 12,
                backgroundColor: '#f1f5f9',
                borderWidth: 1,
                borderColor: '#e2e8f0',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <ShieldCheck size={18} color="#e11d48" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#0f172a' }}>
                  256-Bit SSL Encrypted Secure Gateway
                </Text>
                <Text style={{ fontSize: 10, color: '#64748b', marginTop: 1 }}>
                  Zero convenience fee • UPI, Cards & NetBanking • Instant QR digital pass
                </Text>
              </View>
            </View>
          </ScrollView>
        )}

        {/* Bottom Action Footer */}
        {!confirmedBooking && (
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.footerPriceCol}>
              <Text style={styles.footerPriceLabel}>Total Amount</Text>
              <Text style={styles.footerPriceVal}>₹{total.toLocaleString('en-IN')}</Text>
            </View>
            <TouchableOpacity
              style={styles.payBtn}
              onPress={handlePay}
              disabled={paying}
              activeOpacity={0.9}
            >
              {paying ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <ShieldCheck size={18} color="#ffffff" />
                  <Text style={styles.payBtnText}>
                    {total > 0
                      ? `Pay ₹${total.toLocaleString('en-IN')} Securely`
                      : 'Confirm with Wallet Balance'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
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
    height: Platform.OS === 'ios' ? 96 : 72,
    paddingTop: Platform.OS === 'ios' ? 36 : 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    elevation: 3,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  closeBtnPlaceholder: {
    width: 38,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  scrollContent: {
    padding: 20,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  itemImage: {
    width: 85,
    height: 85,
    borderRadius: 14,
    marginRight: 14,
    backgroundColor: '#e2e8f0',
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  typeBadgeRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 4,
  },
  locationText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '900',
    color: '#e11d48',
  },
  itemPriceUnit: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 4,
  },
  datesScroll: {
    marginBottom: 20,
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 8,
  },
  dateChipSelected: {
    backgroundColor: '#e11d48',
    borderColor: '#e11d48',
  },
  dateChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  dateChipTextSelected: {
    color: '#ffffff',
  },
  qtyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  qtyLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  qtySub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  counterBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  counterNum: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
    minWidth: 20,
    textAlign: 'center',
  },
  inputCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '600',
  },
  inputDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  billCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  billLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  billValue: {
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '700',
  },
  discountLabel: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
  },
  discountValue: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#e11d48',
  },
  methodsContainer: {
    gap: 8,
    marginBottom: 20,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  methodCardSelected: {
    borderColor: '#e11d48',
    backgroundColor: '#fff1f2',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioCircleSelected: {
    backgroundColor: '#e11d48',
    borderColor: '#e11d48',
  },
  methodTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  fastBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  fastBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#15803d',
  },
  footer: {
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
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 8,
  },
  footerPriceCol: {},
  footerPriceLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  footerPriceVal: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
  },
  payBtn: {
    backgroundColor: '#e11d48',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    elevation: 4,
  },
  payBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  // Success confirmation styles
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#10b981',
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 4,
  },
  successSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 280,
  },
  ticketCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 24,
    elevation: 4,
  },
  ticketTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ticketBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffe4e6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ticketBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#e11d48',
  },
  ticketCode: {
    fontSize: 12,
    fontWeight: '800',
    color: '#e11d48',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  ticketItemTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 16,
  },
  ticketInfoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
    paddingVertical: 12,
    marginBottom: 16,
  },
  ticketInfoLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 2,
  },
  ticketInfoVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  qrBox: {
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  qrPrompt: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 8,
  },
  doneBtn: {
    width: '100%',
    backgroundColor: '#0f172a',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  doneBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
});
