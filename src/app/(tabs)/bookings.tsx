import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import {
  Menu,
  Ticket,
  Calendar,
  Clock,
  MapPin,
  ChevronRight,
  ShieldCheck,
  User,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import RoomDatabase, { RoomBooking } from '../../services/roomDatabase';
import SidebarDrawer from '../../components/SidebarDrawer';
import WalletModal from '../../components/WalletModal';

const { width } = Dimensions.get('window');

export default function BookingsTab() {
  const insets = useSafeAreaInsets();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [bookings, setBookings] = useState<RoomBooking[]>([]);
  const [filter, setFilter] = useState<'Active' | 'Past'>('Active');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isWalletOpen, setWalletOpen] = useState(false);

  useEffect(() => {
    RoomDatabase.isAuthenticated().then((authed) => {
      setIsAuthenticated(authed);
      if (authed) {
        RoomDatabase.getBookings().then(setBookings).catch(console.warn);
      }
    }).catch(() => setIsAuthenticated(false));
  }, []);

  const filteredBookings = bookings.filter((b) =>
    filter === 'Active' ? b.status !== 'CANCELLED' : b.status === 'CANCELLED'
  );

  const topHeaderPadding = Math.max(insets.top, 14);
  const bottomScrollPadding = 90 + Math.max(insets.bottom, 24);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Top Header */}
      <View style={[styles.header, { paddingTop: topHeaderPadding }]}>
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => setSidebarOpen(true)}
          activeOpacity={0.8}
        >
          <Menu size={20} color="#334155" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.brandTitle}>happylokam</Text>
        </View>

        <TouchableOpacity
          style={styles.avatarBorder}
          onPress={() => setSidebarOpen(true)}
          activeOpacity={0.8}
        >
          <View style={{ width: '100%', height: '100%', backgroundColor: '#fff1f2', alignItems: 'center', justifyContent: 'center' }}>
            <User size={18} color="#e11d48" />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomScrollPadding }]} showsVerticalScrollIndicator={false}>
        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>My Bookings</Text>
          <Text style={styles.pageSubtitle}>Verified celebration gate passes & QR admissions</Text>
        </View>

        {/* Segmented Control */}
        <View style={styles.segmentedTrack}>
          {(['Active', 'Past'] as const).map((status) => {
            const isActive = filter === status;
            return (
              <TouchableOpacity
                key={status}
                style={[styles.segmentBtn, isActive && styles.segmentBtnActive]}
                onPress={() => setFilter(status)}
                activeOpacity={0.8}
              >
                <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>
                  {status} Bookings ({bookings.filter((b) => (status === 'Active' ? b.status !== 'CANCELLED' : b.status === 'CANCELLED')).length})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Bookings List, Guest State or Empty State */}
        {!isAuthenticated ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconBox, { backgroundColor: '#ffe4e6' }]}>
              <User size={42} color="#e11d48" />
            </View>
            <Text style={styles.emptyTitle}>Sign in to view your bookings</Text>
            <Text style={styles.emptySubtitle}>
              Log in or create an account to view and access your celebration passes, QR admissions, and ticket details.
            </Text>

            <TouchableOpacity
              style={styles.bookNowBtn}
              onPress={() => router.push('/login')}
              activeOpacity={0.9}
            >
              <Text style={styles.bookNowText}>Sign In / Register</Text>
            </TouchableOpacity>
          </View>
        ) : filteredBookings.length > 0 ? (
          <View style={styles.bookingsList}>
            {filteredBookings.map((booking) => (
              <View key={booking.id} style={styles.bookingCard}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.bookingType}>{booking.category}</Text>
                    <Text style={styles.bookingTitle}>{booking.title}</Text>
                  </View>
                  <View style={styles.confirmedBadge}>
                    <ShieldCheck size={12} color="#15803d" />
                    <Text style={styles.confirmedText}>Confirmed</Text>
                  </View>
                </View>

                <View style={styles.cardDetails}>
                  <View style={styles.detailRow}>
                    <Calendar size={14} color="#64748b" style={{ marginRight: 6 }} />
                    <Text style={styles.detailText}>{booking.date}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Clock size={14} color="#64748b" style={{ marginRight: 6 }} />
                    <Text style={styles.detailText}>Entry Pass #{booking.id.slice(-6)}</Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.passAmount}>₹{booking.amount?.toLocaleString('en-IN')}</Text>
                  <TouchableOpacity
                    style={styles.viewPassBtn}
                    onPress={() => {}}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.viewPassText}>View Pass</Text>
                    <ChevronRight size={14} color="#e11d48" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBox}>
              <Ticket size={48} color="#94a3b8" />
            </View>
            <Text style={styles.emptyTitle}>No {filter} Bookings</Text>
            <Text style={styles.emptySubtitle}>
              Your upcoming celebrations and reserved gate passes will appear here.
            </Text>

            <TouchableOpacity
              style={styles.bookNowBtn}
              onPress={() => router.push('/(tabs)')}
              activeOpacity={0.9}
            >
              <Text style={styles.bookNowText}>Book Celebrations</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Sidebar Drawer */}
      <SidebarDrawer
        visible={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenWallet={() => setWalletOpen(true)}
      />

      {/* Wallet Modal */}
      <WalletModal
        visible={isWalletOpen}
        onClose={() => setWalletOpen(false)}
      />
    </View>
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
    borderBottomColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 30,
  },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#e11d48',
    letterSpacing: -0.6,
  },
  avatarBorder: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    paddingBottom: 96,
  },
  titleSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  segmentedTrack: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    padding: 4,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 14,
  },
  segmentBtnActive: {
    backgroundColor: '#0f172a', // Slate-900
  },
  segmentText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#64748b',
  },
  segmentTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  bookingsList: {
    paddingHorizontal: 20,
    gap: 16,
  },
  bookingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bookingType: {
    fontSize: 10,
    fontWeight: '900',
    color: '#e11d48',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  bookingTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0f172a',
  },
  confirmedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  confirmedText: {
    color: '#15803d',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  cardDetails: {
    gap: 6,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#475569',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  passAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  viewPassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewPassText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#e11d48',
  },
  emptyContainer: {
    paddingHorizontal: 32,
    paddingTop: 48,
    alignItems: 'center',
  },
  emptyIconBox: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  bookNowBtn: {
    backgroundColor: '#e11d48',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 20,
    shadowColor: '#e11d48',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  bookNowText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
});
