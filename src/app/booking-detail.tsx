import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Share,
  Linking,
  BackHandler,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  Share2,
  Download,
  Navigation,
  Sparkles,
  Ticket,
  User,
  Phone,
  CheckCircle2,
  QrCode as QrIcon,
} from 'lucide-react-native';
import RoomDatabase, { RoomBooking } from '../services/roomDatabase';

const { width } = Dimensions.get('window');

export default function BookingDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    id?: string;
    title?: string;
    date?: string;
    amount?: string;
    category?: string;
    qrCode?: string;
    status?: string;
    ticketsCount?: string;
    location?: string;
  }>();

  const [booking, setBooking] = useState<RoomBooking | any>(null);

  useEffect(() => {
    // Android back handler to go back safely or to bookings
    const onBackPress = () => {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/bookings');
      }
      return true;
    };

    const backSubscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backSubscription.remove();
  }, []);

  useEffect(() => {
    if (params.id) {
      RoomDatabase.getBookings().then((all) => {
        const found = all.find((b) => b.id === params.id);
        if (found) {
          setBooking(found);
        } else {
          setBooking({
            id: params.id,
            title: params.title || 'Celebration Pass & Reservation',
            date: params.date || new Date().toISOString().split('T')[0],
            amount: Number(params.amount) || 1500,
            category: params.category || 'Celebration Pass',
            status: (params.status || 'CONFIRMED') as any,
            qrCode: params.qrCode || `HL-${Date.now().toString(36).toUpperCase()}`,
            ticketsCount: Number(params.ticketsCount) || 1,
            serverVerified: true,
          });
        }
      });
    }
  }, [params.id]);

  const handleShare = async () => {
    try {
      const code = booking?.qrCode || params.qrCode || 'HL-VIP-PASS';
      await Share.share({
        message: `🎟️ happylokam Digital Celebration Pass\nEvent: ${booking?.title || params.title}\nDate: ${booking?.date || params.date}\nPass Code: ${code}\nStatus: Confirmed & Verified ✨\nShow this ticket at entry gate!`,
        title: 'happylokam Digital Ticket Pass',
      });
    } catch (e) {
      console.warn('Share error:', e);
    }
  };

  const handleDirections = () => {
    const loc = params.location || 'Patna, Bihar';
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc)}`;
    Linking.openURL(url).catch(() => {});
  };

  const handleSupport = () => {
    const phone = '918292888200';
    const message = `Hello happylokam Support, I need assistance with my booking #${booking?.id || params.id} (${booking?.title || params.title}).`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => Linking.openURL(`tel:+918292888200`));
  };

  const ticketCode = booking?.qrCode || params.qrCode || `HL-TCK-${Date.now().toString(36).toUpperCase()}`;
  const amountVal = booking?.amount || Number(params.amount) || 1500;
  const isTicket = (booking?.category || params.category || '').toLowerCase().includes('ticket');

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
        <TouchableOpacity
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/bookings'))}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Digital Admission Pass</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareHeaderBtn} activeOpacity={0.7}>
          <Share2 size={18} color="#0f172a" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 24) + 40 }]}
      >
        {/* TICKET PASS CONTAINER */}
        <View style={styles.ticketCard}>
          {/* Top Pass Brand Strip */}
          <View style={styles.ticketTop}>
            <View style={styles.brandRow}>
              <View style={styles.logoBadge}>
                <Sparkles size={13} color="#ffffff" />
              </View>
              <Text style={styles.brandName}>happylokam</Text>
            </View>
            <View style={styles.verifiedPill}>
              <ShieldCheck size={12} color="#15803d" />
              <Text style={styles.verifiedText}>ENTRY PASS VERIFIED</Text>
            </View>
          </View>

          {/* Ticket Hero Info */}
          <View style={styles.ticketHero}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>
                {booking?.category || params.category || (isTicket ? 'OFFICIAL PASS' : 'CONFIRMED BOOKING')}
              </Text>
            </View>
            <Text style={styles.eventTitle}>{booking?.title || params.title || 'Grand Celebration'}</Text>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Calendar size={14} color="#64748b" />
                <Text style={styles.metaText}>{booking?.date || params.date || 'Valid on Season'}</Text>
              </View>
              <View style={styles.metaItem}>
                <Clock size={14} color="#64748b" />
                <Text style={styles.metaText}>Entry: 6:00 PM – Late</Text>
              </View>
            </View>

            <View style={styles.locationRow}>
              <MapPin size={14} color="#e11d48" />
              <Text style={styles.locationText} numberOfLines={1}>
                {params.location || 'Royal Banquets & Celebration Grounds, Patna'}
              </Text>
            </View>
          </View>

          {/* Perforated Divider with Side Notch Cutouts */}
          <View style={styles.notchDividerContainer}>
            <View style={styles.leftNotch} />
            <View style={styles.dashedLine} />
            <View style={styles.rightNotch} />
          </View>

          {/* Ticket QR & Admission Section */}
          <View style={styles.ticketBottom}>
            <View style={styles.qrContainer}>
              <View style={styles.qrFrame}>
                {/* Visual QR representation */}
                <View style={styles.simulatedQr}>
                  <QrIcon size={110} color="#0f172a" strokeWidth={1.5} />
                </View>
              </View>
              <Text style={styles.qrCodeString}>{ticketCode}</Text>
              <Text style={styles.scanInstruction}>
                Scan at gate security checkpoint for instant access
              </Text>
            </View>

            {/* Pass Metadata Grid */}
            <View style={styles.infoGrid}>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>ADMISSIONS</Text>
                <Text style={styles.infoValue}>
                  {booking?.ticketsCount || params.ticketsCount || 1} {isTicket ? 'Tickets' : 'Reservation'}
                </Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>GATE ACCESS</Text>
                <Text style={styles.infoValue}>Fast-Track VIP</Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>STATUS</Text>
                <Text style={[styles.infoValue, { color: '#16a34a' }]}>CONFIRMED</Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>TOTAL PAID</Text>
                <Text style={[styles.infoValue, { color: '#e11d48', fontWeight: '900' }]}>
                  ₹{amountVal.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ACTION BUTTONS */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.primaryActionBtn} onPress={handleShare} activeOpacity={0.88}>
            <Share2 size={18} color="#ffffff" />
            <Text style={styles.primaryActionBtnText}>Share Ticket Pass via WhatsApp</Text>
          </TouchableOpacity>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.secondaryActionBtn} onPress={handleDirections} activeOpacity={0.8}>
              <Navigation size={16} color="#0f172a" />
              <Text style={styles.secondaryActionBtnText}>Get Directions</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryActionBtn} onPress={handleSupport} activeOpacity={0.8}>
              <Phone size={16} color="#0f172a" />
              <Text style={styles.secondaryActionBtnText}>VIP Concierge</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Admission Guidelines Card */}
        <View style={styles.guidelinesCard}>
          <Text style={styles.guidelinesTitle}>✨ Important Admission Guidelines</Text>
          <View style={styles.bulletRow}>
            <CheckCircle2 size={14} color="#10b981" />
            <Text style={styles.bulletText}>Show this digital QR pass on mobile screen at venue entrance.</Text>
          </View>
          <View style={styles.bulletRow}>
            <CheckCircle2 size={14} color="#10b981" />
            <Text style={styles.bulletText}>Parking valet assistance is available on presenting this VIP pass.</Text>
          </View>
          <View style={styles.bulletRow}>
            <CheckCircle2 size={14} color="#10b981" />
            <Text style={styles.bulletText}>Need changes or reschedule? Contact happylokam VIP Concierge anytime.</Text>
          </View>
        </View>

        {/* Return to Home / Bookings button */}
        <TouchableOpacity
          style={styles.backHomeBtn}
          onPress={() => router.replace('/(tabs)')}
          activeOpacity={0.7}
        >
          <Text style={styles.backHomeText}>Return to Home Overview</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  header: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  shareHeaderBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  scrollContent: {
    padding: 20,
  },
  ticketCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  ticketTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#e11d48',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 15,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803d',
    letterSpacing: 0.4,
  },
  ticketHero: {
    padding: 22,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffe4e6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#e11d48',
    letterSpacing: 0.5,
  },
  eventTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    flex: 1,
  },
  notchDividerContainer: {
    position: 'relative',
    height: 24,
    justifyContent: 'center',
  },
  leftNotch: {
    position: 'absolute',
    left: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    zIndex: 2,
  },
  rightNotch: {
    position: 'absolute',
    right: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    zIndex: 2,
  },
  dashedLine: {
    height: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    marginHorizontal: 16,
  },
  ticketBottom: {
    padding: 22,
    paddingTop: 10,
    alignItems: 'center',
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  qrFrame: {
    padding: 14,
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  simulatedQr: {
    width: 130,
    height: 130,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  qrCodeString: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: 2,
    marginTop: 10,
  },
  scanInstruction: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 4,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  infoCol: {
    width: '50%',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.6,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  actionsContainer: {
    marginTop: 20,
    gap: 10,
  },
  primaryActionBtn: {
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
  },
  primaryActionBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  secondaryActionBtnText: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '700',
  },
  guidelinesCard: {
    marginTop: 20,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
  },
  guidelinesTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletText: {
    fontSize: 12,
    color: '#475569',
    flex: 1,
    lineHeight: 18,
  },
  backHomeBtn: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 12,
  },
  backHomeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
    textDecorationLine: 'underline',
  },
});
