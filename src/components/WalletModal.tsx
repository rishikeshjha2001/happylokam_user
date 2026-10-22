import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import {
  ChevronLeft,
  History,
  ShieldCheck,
  Plus,
  Landmark,
  Scan,
  RefreshCcw,
  Gift,
  Tag,
  MapPin,
} from 'lucide-react-native';

interface WalletModalProps {
  visible: boolean;
  onClose: () => void;
  balance?: number;
}

export default function WalletModal({ visible, onClose, balance = 2450 }: WalletModalProps) {
  const quickActions = [
    { icon: Scan, label: 'Scan & Pay', color: '#4f46e5', bg: '#e0e7ff' },
    { icon: RefreshCcw, label: 'Auto Pay', color: '#059669', bg: '#d1fae5' },
    { icon: Gift, label: 'Gift Cards', color: '#e11d48', bg: '#ffe4e6' },
    { icon: Tag, label: 'Vouchers', color: '#d97706', bg: '#fef3c7' },
  ];

  const transactions = [
    { title: 'Celebration Cashback', date: 'Today, 2:45 PM', amount: '+₹150', type: 'credit', icon: Gift, color: '#059669', bg: '#d1fae5' },
    { title: 'Refund: Decor Booking', date: 'Yesterday, 11:20 AM', amount: '+₹1,500', type: 'credit', icon: RefreshCcw, color: '#059669', bg: '#d1fae5' },
    { title: 'Taj Aravali Venue', date: '12 Oct, 2026', amount: '-₹25,000', type: 'debit', icon: MapPin, color: '#475569', bg: '#f1f5f9' },
    { title: 'Wallet Top-up', date: '10 Oct, 2026', amount: '+₹750', type: 'credit', icon: Plus, color: '#059669', bg: '#d1fae5' },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn} activeOpacity={0.7}>
            <ChevronLeft size={22} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Wallet</Text>
          <TouchableOpacity style={styles.historyBtn} activeOpacity={0.7}>
            <History size={20} color="#64748b" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Premium Balance Card */}
          <View style={styles.balanceCard}>
            <View style={styles.ambientGlow1} />
            <View style={styles.ambientGlow2} />

            <View style={styles.cardHeaderRow}>
              <View style={styles.secureTag}>
                <ShieldCheck size={14} color="#34d399" />
                <Text style={styles.secureTagText}>Secure Balance</Text>
              </View>
              <View style={styles.activePill}>
                <Text style={styles.activePillText}>ACTIVE</Text>
              </View>
            </View>

            <Text style={styles.balanceAmount}>₹{balance.toLocaleString('en-IN')}</Text>
            <Text style={styles.bonusText}>
              Auto-applied at checkout for instant discounts
            </Text>

            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.addMoneyBtn} activeOpacity={0.85}>
                <Plus size={18} color="#0f172a" />
                <Text style={styles.addMoneyText}>Add Money</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.transferBtn} activeOpacity={0.85}>
                <Landmark size={18} color="#ffffff" />
                <Text style={styles.transferText}>Transfer</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Actions Grid */}
          <Text style={styles.sectionHeader}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity key={action.label} style={styles.actionItem} activeOpacity={0.8}>
                <View style={[styles.actionIconBox, { backgroundColor: action.bg }]}>
                  <action.icon size={22} color={action.color} />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Transactions Activity */}
          <View style={styles.activityHeaderRow}>
            <Text style={styles.sectionHeader}>Recent Activity</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.txList}>
            {transactions.map((tx, idx) => (
              <View key={idx} style={styles.txItem}>
                <View style={[styles.txIconBox, { backgroundColor: tx.bg }]}>
                  <tx.icon size={20} color={tx.color} />
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txTitle}>{tx.title}</Text>
                  <Text style={styles.txDate}>{tx.date}</Text>
                </View>
                <Text
                  style={[
                    styles.txAmount,
                    tx.type === 'credit' ? styles.txCredit : styles.txDebit,
                  ]}
                >
                  {tx.amount}
                </Text>
              </View>
            ))}
          </View>
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
    height: Platform.OS === 'ios' ? 96 : 72,
    paddingTop: Platform.OS === 'ios' ? 36 : 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 3,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  historyBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  balanceCard: {
    backgroundColor: '#0f172a', // Slate-900
    borderRadius: 32,
    padding: 24,
    marginBottom: 32,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 10,
  },
  ambientGlow1: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(244, 63, 94, 0.2)',
  },
  ambientGlow2: {
    position: 'absolute',
    bottom: -40,
    left: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  secureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  secureTagText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  activePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  activePillText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -1,
    marginBottom: 4,
  },
  bonusText: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 28,
  },
  bonusHighlight: {
    color: '#fb7185',
    fontWeight: '800',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  addMoneyBtn: {
    flex: 1,
    backgroundColor: '#ffffff',
    height: 48,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  addMoneyText: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '900',
  },
  transferBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  transferText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  actionItem: {
    alignItems: 'center',
    width: '23%',
  },
  actionIconBox: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    textAlign: 'center',
    lineHeight: 14,
  },
  activityHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    color: '#e11d48',
    fontSize: 12,
    fontWeight: '800',
  },
  txList: {
    gap: 12,
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  txIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  txInfo: {
    flex: 1,
  },
  txTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  txDate: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94a3b8',
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '900',
  },
  txCredit: {
    color: '#10b981',
  },
  txDebit: {
    color: '#0f172a',
  },
});
