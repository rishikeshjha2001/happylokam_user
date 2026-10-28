import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
  TextInput,
  ActivityIndicator,
  Alert,
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
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  Sparkles,
  Info,
  Check,
  X,
  Lock,
} from 'lucide-react-native';
import RoomDatabase, { RoomWalletTransaction } from '../services/roomDatabase';

interface WalletModalProps {
  visible: boolean;
  onClose: () => void;
  balance?: number;
}

export default function WalletModal({ visible, onClose, balance: initialBalance }: WalletModalProps) {
  const [balance, setBalance] = useState<number>(initialBalance || 0);
  const [transactions, setTransactions] = useState<RoomWalletTransaction[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'CREDITS' | 'DEBITS'>('ALL');
  const [loading, setLoading] = useState(false);

  // Info Modal State
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    if (visible) {
      loadWalletData();
    }
  }, [visible]);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      const [currBal, txList] = await Promise.all([
        RoomDatabase.getWalletBalance(),
        RoomDatabase.getWalletTransactions(),
      ]);
      setBalance(currBal);
      setTransactions(txList);
    } catch (e) {
      console.warn('loadWalletData error:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((t) => {
    if (filter === 'CREDITS') return t.type === 'credit';
    if (filter === 'DEBITS') return t.type === 'debit';
    return true;
  });

  const quickActions = [
    {
      icon: Scan,
      label: 'Scan & Pay',
      color: '#4f46e5',
      bg: '#e0e7ff',
      onPress: () => Alert.alert('Scan & Pay', 'Present or scan celebration merchant QR at partner venues to pay directly from your balance.'),
    },
    {
      icon: RefreshCcw,
      label: 'Auto Apply',
      color: '#059669',
      bg: '#d1fae5',
      onPress: () => Alert.alert('Auto Apply', 'Your wallet balance is automatically applied at checkout to give you instant discounts on wedding and celebration passes.'),
    },
    {
      icon: Gift,
      label: 'Rewards',
      color: '#e11d48',
      bg: '#ffe4e6',
      onPress: () => Alert.alert('Celebration Rewards', 'Earn promotional cashback and referral rewards credited directly into your wallet on verified bookings.'),
    },
    {
      icon: Tag,
      label: 'Vouchers',
      color: '#d97706',
      bg: '#fef3c7',
      onPress: () => Alert.alert('Promo Vouchers', 'Use code CELEBRATE50 or LOKAMVIP at checkout for additional instant savings.'),
    },
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
          <TouchableOpacity
            style={styles.historyBtn}
            onPress={() => setShowInfo(true)}
            activeOpacity={0.7}
          >
            <Info size={20} color="#64748b" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Balance Card */}
          <View style={styles.balanceCard}>
            <View style={styles.ambientGlow1} />
            <View style={styles.ambientGlow2} />

            <View style={styles.cardHeaderRow}>
              <View style={styles.secureTag}>
                <ShieldCheck size={14} color="#34d399" />
                <Text style={styles.secureTagText}>VIRTUAL CELEBRATION BALANCE</Text>
              </View>
              <View style={styles.activePill}>
                <Text style={styles.activePillText}>NON-WITHDRAWABLE</Text>
              </View>
            </View>

            <Text style={styles.balanceAmount}>₹{balance.toLocaleString('en-IN')}</Text>
            <Text style={styles.bonusText}>
              Virtual credits credited by Admin • Auto-applied at checkout for instant booking discount
            </Text>

            <View style={styles.btnRow}>
              <TouchableOpacity
                style={styles.transferBtn}
                onPress={() => setShowInfo(true)}
                activeOpacity={0.85}
              >
                <Info size={18} color="#ffffff" />
                <Text style={styles.transferText}>How Wallet Credits Work</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Actions Grid */}
          <Text style={styles.sectionHeader}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.label}
                style={styles.actionItem}
                onPress={action.onPress}
                activeOpacity={0.8}
              >
                <View style={[styles.actionIconBox, { backgroundColor: action.bg }]}>
                  <action.icon size={22} color={action.color} />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Transactions Header & Filter Tabs */}
          <View style={styles.activityHeaderRow}>
            <Text style={styles.sectionHeader}>Recent Activity</Text>
            <Text style={styles.txCountBadge}>
              {filteredTransactions.length} {filteredTransactions.length === 1 ? 'Record' : 'Records'}
            </Text>
          </View>

          {/* Filter Pills */}
          <View style={styles.filterBar}>
            {(['ALL', 'CREDITS', 'DEBITS'] as const).map((tab) => {
              const active = filter === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => setFilter(tab)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                    {tab === 'ALL' ? 'All Activity' : tab === 'CREDITS' ? 'Credits (+)' : 'Debits (-)'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Transactions List */}
          {loading ? (
            <View style={styles.loaderCenter}>
              <ActivityIndicator size="small" color="#e11d48" />
              <Text style={styles.loaderText}>Loading wallet activity...</Text>
            </View>
          ) : filteredTransactions.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconCircle}>
                <Wallet size={32} color="#94a3b8" />
              </View>
              <Text style={styles.emptyTitle}>No Transactions Found</Text>
              <Text style={styles.emptySub}>
                {filter === 'CREDITS'
                  ? 'No wallet credit entries found yet. Admin-issued promotional credits and cashbacks will appear here.'
                  : filter === 'DEBITS'
                  ? 'No wallet debits recorded. Your celebration payments made via wallet will appear here.'
                  : 'Your celebration cashback rewards, refunds, and booking debits will appear here with full date and amount breakdown.'}
              </Text>
              <View style={styles.adminNoticeBadge}>
                <ShieldCheck size={16} color="#059669" />
                <Text style={styles.adminNoticeText}>Only happylokam Admin can credit wallet balances</Text>
              </View>
            </View>
          ) : (
            <View style={styles.txList}>
              {filteredTransactions.map((tx) => {
                const isCredit = tx.type === 'credit';
                return (
                  <View key={tx.id} style={styles.txItem}>
                    <View
                      style={[
                        styles.txIconBox,
                        { backgroundColor: isCredit ? '#d1fae5' : '#f1f5f9' },
                      ]}
                    >
                      {isCredit ? (
                        <ArrowDownLeft size={20} color="#059669" />
                      ) : (
                        <ArrowUpRight size={20} color="#475569" />
                      )}
                    </View>
                    <View style={styles.txInfo}>
                      <Text style={styles.txTitle}>{tx.title}</Text>
                      <Text style={styles.txDate}>
                        {tx.formattedDate || new Date(tx.date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </Text>
                      {tx.category ? (
                        <Text style={styles.txCategoryTag}>{tx.category}</Text>
                      ) : null}
                    </View>
                    <Text
                      style={[
                        styles.txAmount,
                        isCredit ? styles.txCredit : styles.txDebit,
                      ]}
                    >
                      {isCredit ? `+₹${tx.amount.toLocaleString('en-IN')}` : `-₹${tx.amount.toLocaleString('en-IN')}`}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* Info & Transfer Modal */}
        <Modal
          visible={showInfo}
          animationType="fade"
          transparent
          onRequestClose={() => setShowInfo(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.addMoneyCard}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>happylokam Wallet Guide</Text>
                <TouchableOpacity onPress={() => setShowInfo(false)} style={styles.modalCloseBtn}>
                  <X size={18} color="#64748b" />
                </TouchableOpacity>
              </View>

              <View style={styles.infoList}>
                <View style={styles.infoItem}>
                  <ShieldCheck size={20} color="#059669" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoHeading}>Admin-Credited Virtual Balance</Text>
                    <Text style={styles.infoDesc}>
                      Your wallet holds virtual celebration credits issued exclusively by happylokam admin for bookings, cashback rewards, and special promotions. Users cannot manually top up funds.
                    </Text>
                  </View>
                </View>

                <View style={styles.infoItem}>
                  <Sparkles size={20} color="#e11d48" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoHeading}>Auto-Applied at Checkout</Text>
                    <Text style={styles.infoDesc}>
                      Your available balance is automatically selected to reduce the payable price on all celebration passes and packages.
                    </Text>
                  </View>
                </View>

                <View style={styles.infoItem}>
                  <Lock size={20} color="#d97706" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoHeading}>Non-Withdrawable Policy</Text>
                    <Text style={styles.infoDesc}>
                      Wallet money is virtual celebration credits and cannot be withdrawn or transferred to bank accounts. It stays securely in your wallet for all your future celebrations.
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.doneInfoBtn}
                onPress={() => setShowInfo(false)}
                activeOpacity={0.88}
              >
                <Text style={styles.doneInfoBtnText}>Got it</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  balanceCard: {
    backgroundColor: '#0f172a',
    borderRadius: 32,
    padding: 24,
    marginBottom: 28,
    overflow: 'hidden',
    position: 'relative',
    elevation: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
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
  },
  secureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  secureTagText: {
    color: '#34d399',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  activePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activePillText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  balanceAmount: {
    fontSize: 44,
    fontWeight: '900',
    color: '#ffffff',
    marginVertical: 14,
    letterSpacing: -1,
  },
  bonusText: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 24,
    fontWeight: '500',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  addMoneyBtn: {
    flex: 1,
    height: 48,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addMoneyText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  transferBtn: {
    flex: 1,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  transferText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  actionItem: {
    alignItems: 'center',
    width: '22%',
  },
  actionIconBox: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
  },
  activityHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  txCountBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  filterBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  loaderCenter: {
    alignItems: 'center',
    paddingVertical: 30,
    gap: 8,
  },
  loaderText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 8,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
    maxWidth: 280,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#e11d48',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyAddBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  txList: {
    gap: 10,
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  txIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  txInfo: {
    flex: 1,
  },
  txTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2,
  },
  txDate: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  txCategoryTag: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '700',
    marginTop: 2,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '900',
  },
  txCredit: {
    color: '#059669',
  },
  txDebit: {
    color: '#0f172a',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  addMoneyCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 22,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalSub: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 18,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 16,
  },
  currencySymbol: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0f172a',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 26,
    fontWeight: '900',
    color: '#0f172a',
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 22,
  },
  presetChip: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  presetChipActive: {
    backgroundColor: '#e11d48',
    borderColor: '#e11d48',
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
  },
  presetChipTextActive: {
    color: '#ffffff',
  },
  confirmTopupBtn: {
    backgroundColor: '#e11d48',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
  },
  confirmTopupText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  infoList: {
    gap: 16,
    marginBottom: 20,
  },
  infoItem: {
    flexDirection: 'row',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2,
  },
  infoDesc: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
  },
  doneInfoBtn: {
    backgroundColor: '#0f172a',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  doneInfoBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  adminNoticeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    marginTop: 14,
  },
  adminNoticeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065f46',
  },
});
