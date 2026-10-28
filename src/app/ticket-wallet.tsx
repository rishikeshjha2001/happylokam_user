import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Ticket,
  QrCode,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  Share2,
  CheckCircle2,
  Info,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import RoomDatabase from '../services/roomDatabase';
import ComingSoonPlaceholder from '../components/ComingSoonPlaceholder';

interface TicketPass {
  id: string;
  eventName: string;
  venueName: string;
  passType: string;
  date: string;
  time: string;
  guests: number;
  qrPayload: string;
  status: 'VALID' | 'USED' | 'EXPIRED';
}

export default function TicketWalletScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');
  const [passes, setPasses] = useState<TicketPass[]>([]);

  useEffect(() => {
    loadPasses();
  }, []);

  const loadPasses = async () => {
    try {
      const bookings = await RoomDatabase.getBookings();
      // Filter bookings that are tickets/passes
      const ticketBookings = bookings
        .filter((b: any) => b.serverVerified === true && (b.category?.toLowerCase().includes('ticket') || b.category?.toLowerCase().includes('pass')))
        .map((b: any) => ({
          id: b.id,
          eventName: b.title,
          venueName: b.location || 'Venue details available in booking',
          passType: b.tierName || 'Ticket Pass',
          date: b.date,
          time: '6:30 PM Onwards',
          guests: b.ticketsCount || 1,
          qrPayload: b.qrCode || `HL-TKT:${b.id}`,
          status: 'VALID' as const,
        }));

      setPasses(ticketBookings);
    } catch {
      setPasses([]);
    }
  };

  const handleShareTicket = async (p: TicketPass) => {
    try {
      await Share.share({
        message: `🎟️ My happylokam Pass: ${p.eventName}\nVenue: ${p.venueName}\nPass Code: ${p.id}\nDownload happylokam app for gate entry access!`,
      });
    } catch (e) {
      console.warn(e);
    }
  };

  const activePasses = passes.filter((p) => p.status === 'VALID');

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
          <Text style={styles.headerTitle}>digital pass wallet</Text>
          <Text style={styles.headerSubtitle}>Instant QR code entry for your bookings</Text>
        </View>
        <View style={styles.ticketBadge}>
          <QrCode size={18} color="#e11d48" />
        </View>
      </View>

      {/* Segment Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'active' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('active')}
          activeOpacity={0.8}
        >
          <Text style={[styles.segmentText, activeTab === 'active' && styles.segmentTextActive]}>
            active passes ({activePasses.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'past' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('past')}
          activeOpacity={0.8}
        >
          <Text style={[styles.segmentText, activeTab === 'past' && styles.segmentTextActive]}>
            past & expired
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'active' && activePasses.length > 0 ? (
          <View style={styles.passList}>
            {activePasses.map((pass) => (
              <View key={pass.id} style={styles.ticketCard}>
                <View style={styles.ticketHeader}>
                  <View style={styles.statusPill}>
                    <CheckCircle2 size={12} color="#10b981" />
                    <Text style={styles.statusText}>verified valid</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.shareBtn}
                    onPress={() => handleShareTicket(pass)}
                    activeOpacity={0.7}
                  >
                    <Share2 size={15} color="#64748b" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.eventName}>{pass.eventName.toLowerCase()}</Text>
                <Text style={styles.venueName}>{pass.venueName}</Text>

                {/* QR Code Container */}
                <View style={styles.qrContainer}>
                  <View style={styles.qrBorder}>
                    <QRCode value={pass.qrPayload} size={150} color="#0f172a" />
                  </View>
                  <Text style={styles.ticketIdCode}>PASS ID: {pass.id}</Text>
                  <Text style={styles.scanNotice}>Show this QR code at the entrance turnstile</Text>
                </View>

                {/* Details Breakdown */}
                <View style={styles.detailsGrid}>
                  <View style={styles.detailCol}>
                    <Text style={styles.detailLabel}>DATE</Text>
                    <View style={styles.detailValRow}>
                      <Calendar size={12} color="#0f172a" />
                      <Text style={styles.detailVal}>{pass.date}</Text>
                    </View>
                  </View>
                  <View style={styles.detailCol}>
                    <Text style={styles.detailLabel}>GUESTS</Text>
                    <Text style={styles.detailVal}>{pass.guests} Attendees</Text>
                  </View>
                  <View style={styles.detailCol}>
                    <Text style={styles.detailLabel}>TIER</Text>
                    <Text style={styles.detailVal}>{pass.passType}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <ComingSoonPlaceholder
            title="no active passes right now!"
            subtitle="upcoming 2026 dandiya nights, new year galas and loksafari safari passes will appear here automatically after booking."
            onExploreLive={() => router.push('/(tabs)/loksafari')}
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
  ticketBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#fff1f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    padding: 12,
    paddingHorizontal: 20,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 10,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  segmentBtnActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'lowercase',
  },
  segmentTextActive: {
    color: '#ffffff',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  passList: {
    gap: 18,
  },
  ticketCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
    textTransform: 'lowercase',
  },
  shareBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 3,
  },
  venueName: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 16,
  },
  qrContainer: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  qrBorder: {
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    marginBottom: 10,
  },
  ticketIdCode: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: 1,
  },
  scanNotice: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 14,
  },
  detailCol: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    marginBottom: 3,
  },
  detailValRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
});
