import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Share,
  ActivityIndicator,
  Image,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Ticket,
  CalendarClock,
  MapPin,
  QrCode,
  Share2,
  Trash2,
  X,
  Sparkles,
  ShieldCheck,
  Crown,
  AlertCircle,
  LogIn,
  Layers,
  ChevronRight,
} from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { router } from 'expo-router';
import RoomDatabase, { RoomBooking, RoomUser } from '../../services/roomDatabase';
import CelebrationDialog, { DialogType } from '../../components/CelebrationDialog';
import CelebrationParticles from '../../components/CelebrationParticles';
import { API_BASE_URL } from '../../constants/api';

export default function BookingsScreen() {
  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'PAST'>('UPCOMING');
  const [bookings, setBookings] = useState<RoomBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<RoomUser | null>(null);

  // QR Pass Modal State
  const [selectedPass, setSelectedPass] = useState<RoomBooking | null>(null);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [qrFallback, setQrFallback] = useState(false);

  // Custom Celebration Dialog State
  const [dialogConfig, setDialogConfig] = useState<{
    visible: boolean;
    type: DialogType;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
  }>({
    visible: false,
    type: 'confirm',
    title: '',
    message: '',
    onConfirm: () => {},
  });

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const session = await RoomDatabase.getUserSession();
      setUser(session);

      // 1. Sync live bookings from Server if Authenticated
      if (session?.token) {
        const [venueRes, eventRes] = await Promise.all([
          fetch(`${API_BASE_URL}/bookings`, {
            headers: { Authorization: `Bearer ${session.token}` },
          }).catch(() => null),
          fetch(`${API_BASE_URL}/events/my/bookings`, {
            headers: { Authorization: `Bearer ${session.token}` },
          }).catch(() => null),
        ]);

        // Sync Venue Bookings
        if (venueRes && venueRes.ok) {
          const vData = await venueRes.json();
          if (vData.data && Array.isArray(vData.data)) {
            for (const b of vData.data) {
              await RoomDatabase.saveBooking({
                id: b.id,
                title: b.venue?.name || 'Celebration Event',
                category: b.venue?.category || 'Venue',
                date: new Date(b.date || b.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                }),
                amount: b.totalAmount || 0,
                status: b.status || 'CONFIRMED',
                qrCode: `HL-VENUE:${b.id}|${b.venue?.name || 'Booking'}`,
                ticketsCount: 1,
                createdAt: b.createdAt,
                serverVerified: true,
              });
            }
          }
        }

        // Sync Celebration Event Passes (Dandiya, Garba, etc.)
        if (eventRes && eventRes.ok) {
          const eData = await eventRes.json();
          if (eData.data && Array.isArray(eData.data)) {
            for (const eb of eData.data) {
              await RoomDatabase.saveBooking({
                id: eb.id,
                title: eb.event?.title || 'Celebration Pass',
                category: eb.event?.category || 'Dandiya',
                date: eb.event?.date
                  ? new Date(eb.event.date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : new Date(eb.createdAt).toLocaleDateString('en-IN'),
                amount: eb.totalAmount || 0,
                status: eb.status || 'CONFIRMED',
                qrCode: `HL-TKT:${eb.id}|${eb.eventId}|${eb.ticketsCount}x${eb.tierName || 'Pass'}`,
                tierType: eb.tierType || 'SINGLE',
                tierName: eb.tierName || 'Single Pass',
                ticketsCount: eb.ticketsCount || 1,
                createdAt: eb.createdAt,
                serverVerified: true,
              });
            }
          }
        }
      }

      // 2. Load Local Data (Room Database persistence)
      const saved = await RoomDatabase.getBookings();
      setBookings(saved || []);
    } catch (e) {
      console.warn('Error loading bookings:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenQr = (booking: RoomBooking) => {
    setSelectedPass(booking);
    setQrModalVisible(true);
  };

  const handleSharePass = async (booking: RoomBooking) => {
    try {
      await Share.share({
        title: `happylokam Premium Pass - ${booking.title}`,
        message: `Celebration Pass for ${booking.title}!\nBooking ID: #${booking.id}\nDate: ${booking.date}\nSecured with happylokam Celebration OS.`,
      });
    } catch {
      // Ignored
    }
  };

  const handleCancelPass = (booking: RoomBooking) => {
    setDialogConfig({
      visible: true,
      type: 'danger',
      title: 'Cancel Pass?',
      message: `Cancel pass for "${booking.title}"?`,
      confirmText: 'Yes, Cancel',
      cancelText: 'Keep Pass',
      onConfirm: async () => {
        setDialogConfig((prev) => ({ ...prev, visible: false }));
        await RoomDatabase.cancelBooking(booking.id);
        const updated = await RoomDatabase.getBookings();
        setBookings(updated);

        setTimeout(() => {
          setDialogConfig({
            visible: true,
            type: 'info',
            title: 'Pass Cancelled',
            message: `Pass #${booking.id} cancelled. Refund will be credited within 3-5 days.`,
            confirmText: 'OK',
            onConfirm: () => setDialogConfig((prev) => ({ ...prev, visible: false })),
          });
        }, 300);
      },
    });
  };

  const upcomingBookings = bookings.filter((b) => b.status === 'CONFIRMED');
  const pastBookings = bookings.filter((b) => b.status === 'CANCELLED');
  const displayedBookings = activeTab === 'UPCOMING' ? upcomingBookings : pastBookings;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#090b10" />

      {/* Ambient glowing aura background */}
      <View style={styles.glowAuraLeft} />
      <View style={styles.glowAuraRight} />

      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View>
            <View style={styles.titleBadge}>
              <Sparkles size={13} color="#f43f5e" />
              <Text style={styles.titleBadgeText}>PASS VAULT</Text>
            </View>
            <Text style={styles.title}>Your Passes</Text>
          </View>
          <View style={styles.passCountBadge}>
            <Text style={styles.passCountBadgeText}>{upcomingBookings.length} Active</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>Verified touchless QR passes & reservations</Text>
      </View>

      {/* Not Signed In Banner */}
      {!user && (
        <View style={styles.guestBannerCard}>
          <View style={styles.signInBannerLeft}>
            <View style={styles.signInIconBox}>
              <LogIn size={18} color="#ffffff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.signInBannerTitle}>Sign in to sync your celebration passes</Text>
              <Text style={styles.signInBannerSub}>View live passes booked from web or mobile</Text>
            </View>
          </View>
          <View style={styles.guestBannerActions}>
            <TouchableOpacity
              style={styles.guestSignInBtn}
              onPress={() => router.push('/login')}
              activeOpacity={0.88}
            >
              <LogIn size={13} color="#ffffff" />
              <Text style={styles.guestSignInText}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.guestSignUpBtn}
              onPress={() => router.push('/signup')}
              activeOpacity={0.88}
            >
              <Text style={styles.guestSignUpText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Tabs Switcher */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'UPCOMING' && styles.tabItemActive]}
          onPress={() => setActiveTab('UPCOMING')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'UPCOMING' && styles.tabTextActive]}>
            Active Passes ({upcomingBookings.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'PAST' && styles.tabItemActive]}
          onPress={() => setActiveTab('PAST')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'PAST' && styles.tabTextActive]}>
            History ({pastBookings.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingWrapper}>
            <ActivityIndicator size="large" color="#e11d48" />
            <Text style={styles.loadingText}>Syncing passes from Room...</Text>
          </View>
        ) : displayedBookings.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Ticket size={40} color="#e11d48" />
            </View>
            <Text style={styles.emptyTitle}>
              {activeTab === 'UPCOMING' ? 'No Active Passes Yet' : 'No Past Passes'}
            </Text>
            <Text style={styles.emptySub}>
              {activeTab === 'UPCOMING'
                ? 'Explore live Dandiya, Weddings, and Celebrations to secure verified passes.'
                : 'Completed or cancelled event passes will appear here.'}
            </Text>
            <TouchableOpacity
              style={styles.exploreBtn}
              onPress={() => router.push('/(tabs)/explore')}
              activeOpacity={0.85}
            >
              <Text style={styles.exploreBtnText}>Browse Celebrations</Text>
              <ChevronRight size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>
        ) : (
          displayedBookings.map((b) => (
            <View key={b.id} style={styles.passCard}>
              {/* Ticket Top Ribbon */}
              <View style={styles.passCardHeader}>
                <View
                  style={[
                    styles.statusBadge,
                    b.status === 'CONFIRMED' ? styles.statusBadgeActive : styles.statusBadgeCancelled,
                  ]}
                >
                  <Crown size={12} color="#ffffff" />
                  <Text style={styles.statusText}>
                    {b.status === 'CONFIRMED' ? 'VERIFIED PASS' : 'CANCELLED'}
                  </Text>
                </View>
                <Text style={styles.orderId}>#{b.id}</Text>
              </View>

              {/* Event Title */}
              <Text style={styles.eventTitle}>{b.title}</Text>

              {/* Tier and Quantity Badge */}
              <View style={styles.tierBadgeRow}>
                <View style={styles.tierPill}>
                  <Layers size={13} color="#f43f5e" />
                  <Text style={styles.tierPillText}>{b.tierName || 'Single Pass'}</Text>
                </View>
                <View style={styles.quantityPill}>
                  <Text style={styles.quantityPillText}>{b.ticketsCount || 1} Pass(es)</Text>
                </View>
              </View>

              {/* Info Rows */}
              <View style={styles.infoRow}>
                <CalendarClock size={15} color="#f43f5e" />
                <Text style={styles.infoText}>{b.date}</Text>
                <View style={styles.timeTag}>
                  <Text style={styles.timeTagText}>06:30 PM - 11:30 PM</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <MapPin size={15} color="#94a3b8" />
                <Text style={styles.infoText}>Gandhi Maidan Grand Arena, Patna</Text>
              </View>

              {/* Dashed Tear-Off Line */}
              <View style={styles.ticketDividerContainer}>
                <View style={styles.notchLeft} />
                <View style={styles.dashedLine} />
                <View style={styles.notchRight} />
              </View>

              {/* Ticket Footer */}
              <View style={styles.passFooter}>
                <View>
                  <Text style={styles.footerLabel}>Total Paid</Text>
                  <Text style={styles.footerValue}>₹{b.amount}</Text>
                </View>

                {b.status === 'CONFIRMED' ? (
                  <View style={styles.footerActions}>
                    <TouchableOpacity
                      style={styles.cancelActionBtn}
                      onPress={() => handleCancelPass(b)}
                      activeOpacity={0.8}
                    >
                      <Trash2 size={16} color="#ef4444" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.viewQrBtn}
                      onPress={() => handleOpenQr(b)}
                      activeOpacity={0.88}
                    >
                      <QrCode size={16} color="#ffffff" />
                      <Text style={styles.viewQrBtnText}>Show QR Pass</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.cancelledBadgeWrapper}>
                    <AlertCircle size={14} color="#94a3b8" />
                    <Text style={styles.cancelledText}>Pass Inactive</Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Hologram QR Gate Pass Modal */}
      <Modal
        visible={qrModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setQrModalVisible(false)}
      >
        <View style={styles.qrModalBackdrop}>
          <CelebrationParticles count={14} />

          <View style={styles.qrModalCard}>
            {/* Ticket Header Bar */}
            <View style={styles.qrModalTopBar}>
              <View style={styles.ticketBrandPill}>
                <Sparkles size={14} color="#f43f5e" />
                <Text style={styles.ticketBrandText}>happylokam</Text>
              </View>
              <View style={styles.ticketVerifiedPill}>
                <Text style={styles.ticketVerifiedText}>CONFIRMED</Text>
              </View>
              <TouchableOpacity onPress={() => setQrModalVisible(false)} style={styles.qrCloseBtn}>
                <X size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {selectedPass && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.qrModalBody}>
                <Text style={styles.qrEventTitle}>{selectedPass.title}</Text>
                
                {/* Meta details */}
                <View style={styles.qrDetailsGrid}>
                  <View style={styles.qrDetailRow}>
                    <CalendarClock size={15} color="#f43f5e" />
                    <Text style={styles.qrDetailText}>{selectedPass.date}</Text>
                    <View style={styles.timeTag}>
                      <Text style={styles.timeTagText}>06:30 PM - 11:30 PM</Text>
                    </View>
                  </View>
                  <View style={styles.qrDetailRow}>
                    <MapPin size={15} color="#94a3b8" />
                    <Text style={styles.qrDetailText}>Gandhi Maidan Grand Arena, Patna</Text>
                  </View>
                  <View style={styles.qrDetailRow}>
                    <Layers size={15} color="#f43f5e" />
                    <Text style={styles.qrDetailText}>
                      {selectedPass.tierName || 'Single Pass'} • {selectedPass.ticketsCount || 1} Pass(es)
                    </Text>
                  </View>
                </View>

                {/* Perforated Divider */}
                <View style={styles.modalTicketDivider}>
                  <View style={styles.modalNotchLeft} />
                  <View style={styles.dashedLine} />
                  <View style={styles.modalNotchRight} />
                </View>

                {/* Ticket Holder Section */}
                <View style={styles.ticketHolderSection}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.holderLabel}>TICKET HOLDER</Text>
                    <Text style={styles.holderName}>{user?.name || 'Guest User'}</Text>
                    <Text style={styles.holderPhone}>{user?.phone || 'Verified Customer'}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.holderLabel}>TOTAL PAID</Text>
                    <Text style={styles.holderPrice}>₹{selectedPass.amount}</Text>
                    <Text style={styles.ticketIdBadge}>ID: #{selectedPass.id}</Text>
                  </View>
                </View>

                {/* High-Contrast Dynamic Holographic QR Code Box */}
                <View style={styles.qrBox}>
                  <View style={styles.qrInnerFrame}>
                    {!qrFallback ? (
                      <QRCode
                        value={
                          selectedPass.qrCode ||
                          `HL-TKT:${selectedPass.id}|${selectedPass.title}|${selectedPass.date}`
                        }
                        size={160}
                        color="#090b10"
                        backgroundColor="#ffffff"
                        quietZone={8}
                        onError={() => setQrFallback(true)}
                      />
                    ) : (
                      <Image
                        source={{
                          uri: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                            selectedPass.qrCode ||
                              `HL-TKT:${selectedPass.id}|${selectedPass.title}|${selectedPass.date}`
                          )}`,
                        }}
                        style={{ width: 160, height: 160, borderRadius: 8 }}
                      />
                    )}
                  </View>
                  <View style={styles.scanLineGlow} />
                  <Text style={styles.qrCodeString}>GATE ID: HL-TKT-#{selectedPass.id}</Text>
                </View>

                <View style={styles.gateInstructions}>
                  <ShieldCheck size={16} color="#10b981" />
                  <Text style={styles.gateInstructionsText}>
                    Show this QR at Premium Gate 2 for instantaneous touchless check-in.
                  </Text>
                </View>

                {/* Share Button */}
                <TouchableOpacity
                  style={styles.sharePassBtn}
                  onPress={() => handleSharePass(selectedPass)}
                  activeOpacity={0.88}
                >
                  <Share2 size={16} color="#ffffff" />
                  <Text style={styles.sharePassBtnText}>Share / Save Pass</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Custom Designed Celebration Dialog */}
      <CelebrationDialog
        visible={dialogConfig.visible}
        type={dialogConfig.type}
        title={dialogConfig.title}
        message={dialogConfig.message}
        confirmText={dialogConfig.confirmText}
        cancelText={dialogConfig.cancelText}
        onConfirm={dialogConfig.onConfirm}
        onCancel={() => setDialogConfig((prev) => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090b10' },

  glowAuraLeft: {
    position: 'absolute',
    top: -50,
    left: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(225, 29, 72, 0.12)',
  },
  glowAuraRight: {
    position: 'absolute',
    top: 250,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
  },

  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 14 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  titleBadgeText: { color: '#f43f5e', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  title: { fontSize: 28, fontWeight: '900', color: '#ffffff' },
  passCountBadge: {
    backgroundColor: 'rgba(225, 29, 72, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.4)',
  },
  passCountBadgeText: { color: '#f43f5e', fontSize: 12, fontWeight: '800' },
  subtitle: { fontSize: 13, color: '#94a3b8', marginTop: 3, fontWeight: '500' },

  guestBannerCard: {
    backgroundColor: '#131722',
    marginHorizontal: 20,
    marginBottom: 14,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.3)',
    gap: 12,
  },
  signInBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  signInIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#e11d48',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInBannerTitle: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  signInBannerSub: { color: '#94a3b8', fontSize: 11, marginTop: 2 },
  guestBannerActions: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  guestSignInBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e11d48',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  guestSignInText: { color: '#ffffff', fontWeight: '800', fontSize: 12 },
  guestSignUpBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.3)',
  },
  guestSignUpText: { color: '#f43f5e', fontWeight: '800', fontSize: 12 },

  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#121622',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: '#1c2333',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabItemActive: {
    backgroundColor: '#e11d48',
    shadowColor: '#e11d48',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  tabText: { fontSize: 13, fontWeight: '700', color: '#94a3b8' },
  tabTextActive: { color: '#ffffff', fontWeight: '800' },

  content: { paddingHorizontal: 20 },
  loadingWrapper: { paddingVertical: 60, alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#94a3b8', fontSize: 14, fontWeight: '500' },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    backgroundColor: '#121622',
    borderRadius: 24,
    paddingHorizontal: 30,
    borderWidth: 1,
    borderColor: '#1c2333',
    marginTop: 10,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(225, 29, 72, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#ffffff' },
  emptySub: { fontSize: 13, color: '#94a3b8', textAlign: 'center', marginTop: 6, lineHeight: 18 },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#e11d48',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 20,
  },
  exploreBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 14 },

  passCard: {
    backgroundColor: '#121622',
    borderRadius: 24,
    padding: 20,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 4,
    overflow: 'hidden',
  },
  passCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeActive: { backgroundColor: '#10b981' },
  statusBadgeCancelled: { backgroundColor: '#64748b' },
  statusText: { color: '#ffffff', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  orderId: { color: '#94a3b8', fontSize: 13, fontWeight: '700' },

  eventTitle: { fontSize: 20, fontWeight: '800', color: '#ffffff', marginBottom: 10 },
  tierBadgeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(225, 29, 72, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.3)',
  },
  tierPillText: { color: '#f43f5e', fontSize: 11, fontWeight: '700' },
  quantityPill: {
    backgroundColor: '#1c2333',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  quantityPillText: { color: '#cbd5e1', fontSize: 11, fontWeight: '700' },

  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoText: { color: '#cbd5e1', marginLeft: 8, fontSize: 13, fontWeight: '500' },

  ticketDividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
    marginHorizontal: -20,
    position: 'relative',
  },
  notchLeft: {
    width: 16,
    height: 32,
    backgroundColor: '#090b10',
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: 'rgba(225, 29, 72, 0.25)',
  },
  dashedLine: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: '#252d3d',
    borderStyle: 'dashed',
    marginHorizontal: 8,
  },
  notchRight: {
    width: 16,
    height: 32,
    backgroundColor: '#090b10',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    borderWidth: 1,
    borderRightWidth: 0,
    borderColor: 'rgba(225, 29, 72, 0.25)',
  },

  passFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '600', marginBottom: 2 },
  footerValue: { fontSize: 20, fontWeight: '900', color: '#ffffff' },
  footerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cancelActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  viewQrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e11d48',
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 12,
    gap: 6,
    shadowColor: '#e11d48',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  viewQrBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 13 },
  cancelledBadgeWrapper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cancelledText: { fontSize: 13, color: '#94a3b8', fontWeight: '700' },

  timeTag: {
    backgroundColor: 'rgba(225, 29, 72, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.3)',
    marginLeft: 8,
  },
  timeTagText: { color: '#f43f5e', fontSize: 10, fontWeight: '700' },

  // QR Modal Styles
  qrModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 10, 0.94)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  qrModalCard: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: '#121622',
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.35)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 10,
    zIndex: 10,
  },
  qrModalTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  ticketBrandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(225, 29, 72, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.4)',
  },
  ticketBrandText: { fontSize: 12, fontWeight: '900', color: '#f43f5e', letterSpacing: 0.5 },
  ticketVerifiedPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  ticketVerifiedText: { fontSize: 10, fontWeight: '800', color: '#10b981', letterSpacing: 0.8 },
  qrCloseBtn: { padding: 6, backgroundColor: '#1c2333', borderRadius: 20 },

  qrModalBody: { alignItems: 'center', paddingBottom: 10 },
  qrEventTitle: { fontSize: 20, fontWeight: '900', color: '#ffffff', textAlign: 'center', marginBottom: 12 },

  qrDetailsGrid: {
    width: '100%',
    backgroundColor: '#090b10',
    borderRadius: 16,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  qrDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qrDetailText: { color: '#cbd5e1', fontSize: 12, fontWeight: '600', flexShrink: 1 },

  modalTicketDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 14,
    position: 'relative',
  },
  modalNotchLeft: {
    width: 14,
    height: 28,
    backgroundColor: '#05070a',
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: 'rgba(225, 29, 72, 0.3)',
    marginLeft: -21,
  },
  modalNotchRight: {
    width: 14,
    height: 28,
    backgroundColor: '#05070a',
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
    borderWidth: 1,
    borderRightWidth: 0,
    borderColor: 'rgba(225, 29, 72, 0.3)',
    marginRight: -21,
  },

  ticketHolderSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: '#090b10',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  holderLabel: { fontSize: 10, fontWeight: '700', color: '#94a3b8', letterSpacing: 0.8, marginBottom: 2 },
  holderName: { fontSize: 14, fontWeight: '800', color: '#ffffff' },
  holderPhone: { fontSize: 12, fontWeight: '500', color: '#94a3b8' },
  holderPrice: { fontSize: 18, fontWeight: '900', color: '#10b981' },
  ticketIdBadge: { fontSize: 10, fontWeight: '700', color: '#f43f5e', marginTop: 2 },

  qrBox: {
    backgroundColor: '#090b10',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#1c2333',
    marginBottom: 14,
    position: 'relative',
    width: '100%',
  },
  qrInnerFrame: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 14,
  },
  scanLineGlow: {
    height: 2,
    backgroundColor: '#e11d48',
    width: '80%',
    marginVertical: 10,
    borderRadius: 1,
  },
  qrCodeString: { fontSize: 11, fontWeight: '700', color: '#94a3b8', letterSpacing: 1 },

  gateInstructions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginBottom: 16,
    width: '100%',
  },
  gateInstructionsText: { flex: 1, fontSize: 12, color: '#34d399', fontWeight: '600' },

  sharePassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#e11d48',
    width: '100%',
    height: 48,
    borderRadius: 14,
  },
  sharePassBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
});
