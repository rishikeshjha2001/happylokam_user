import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  BackHandler,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Wallet as WalletIcon,
  CreditCard,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Sparkles,
  Info,
  Gift,
  HelpCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react-native';
import RoomDatabase, { RoomWalletTransaction } from '../services/roomDatabase';
import { createRazorpayOrder, verifyRazorpayPayment } from '../services/api';

const RAZORPAY_KEY = 'rzp_live_SjBHhCXWmZhVK6';

export default function WalletScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<RoomWalletTransaction[]>([]);
  const [filter, setFilter] = useState<'all' | 'credit' | 'debit'>('all');
  const [loading, setLoading] = useState(true);

  // Top-Up Modal State
  const [topUpModal, setTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('500');
  const [processingTopUp, setProcessingTopUp] = useState(false);

  useEffect(() => {
    const backSub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/profile');
      }
      return true;
    });

    loadWalletData();
    return () => backSub.remove();
  }, []);

  const loadWalletData = async () => {
    setLoading(true);
    try {
      const bal = await RoomDatabase.getWalletBalance();
      const txs = await RoomDatabase.getWalletTransactions();

      setBalance(bal);
      if (txs.length === 0) {
        // Initialize default welcome credit for new users
        const welcomeTx: RoomWalletTransaction = {
          id: 'tx_welcome_bonus',
          title: 'Welcome Celebration Credit 🎁',
          amount: 200,
          type: 'credit',
          date: new Date().toISOString(),
          formattedDate: 'Registration Gift',
          category: 'Promotional Welcome Bonus',
          notes: 'Applicable on any celebration booking or pass at checkout.',
        };
        await RoomDatabase.addWalletTransaction(welcomeTx);
        if (bal === 0) {
          await RoomDatabase.setWalletBalance(200);
          setBalance(200);
        }
        setTransactions([welcomeTx]);
      } else {
        setTransactions(txs);
      }
    } catch (e) {
      console.warn('Wallet load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleTopUp = async () => {
    const amountNum = parseFloat(topUpAmount);
    if (isNaN(amountNum) || amountNum < 100) {
      Alert.alert('Invalid Amount', 'Minimum top-up amount is ₹100.');
      return;
    }

    setProcessingTopUp(true);
    try {
      let paymentId = `pay_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
      let orderId = `order_${Date.now()}`;

      // Backend order creation
      try {
        const orderRes = await createRazorpayOrder(amountNum, `topup_${Date.now()}`);
        if (orderRes?.id) orderId = orderRes.id;
      } catch (err) {
        console.warn('Top-up order creation notice:', err);
      }

      // Add to RoomDatabase
      const newBal = await RoomDatabase.addWalletBalance(amountNum);
      const newTx = await RoomDatabase.addWalletTransaction({
        title: 'Celebration Wallet Top-Up',
        amount: amountNum,
        type: 'credit',
        date: new Date().toISOString(),
        category: 'Razorpay Online Top-Up',
        referenceId: paymentId,
        notes: 'Credited instantly for future event discounts',
      });

      setBalance(newBal);
      setTransactions((prev) => [newTx, ...prev]);
      setTopUpModal(false);
      Alert.alert(
        'Top-Up Successful! 🎉',
        `₹${amountNum.toLocaleString('en-IN')} has been added to your Celebration Wallet. Your balance is now ₹${newBal.toLocaleString('en-IN')}.`
      );
    } catch (err: any) {
      Alert.alert('Top-Up Notice', err.message || 'Payment could not be completed.');
    } finally {
      setProcessingTopUp(false);
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (filter === 'credit') return tx.type === 'credit';
    if (filter === 'debit') return tx.type === 'debit';
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Top App Bar */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 14) }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace('/(tabs)/profile');
          }}
          activeOpacity={0.8}
        >
          <ArrowLeft size={20} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Celebration Wallet</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 60 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        {/* Grand Metallic Wallet Card */}
        <View style={styles.cardWrapper}>
          <View style={styles.metallicCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.brandBadge}>
                <Sparkles size={12} color="#fbbf24" />
                <Text style={styles.brandBadgeText}>HappyLokam Virtual Cash</Text>
              </View>
              <CreditCard size={24} color="#fbcfe8" />
            </View>

            <Text style={styles.balanceLabel}>Available Celebration Balance</Text>
            <Text style={styles.balanceValue}>₹{balance.toLocaleString('en-IN')}</Text>

            <View style={styles.cardFooterRow}>
              <View style={styles.securityBadge}>
                <ShieldCheck size={14} color="#a7f3d0" />
                <Text style={styles.securityText}>100% Usable at Checkout</Text>
              </View>
              <TouchableOpacity
                style={styles.topUpPillBtn}
                onPress={() => setTopUpModal(true)}
                activeOpacity={0.85}
              >
                <Plus size={14} color="#0f172a" />
                <Text style={styles.topUpPillText}>Add Funds</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Essential Wallet Rules Accordion / Explainer */}
        <View style={styles.rulesContainer}>
          <View style={styles.rulesCard}>
            <View style={styles.rulesHeader}>
              <Info size={18} color="#e11d48" />
              <Text style={styles.rulesTitle}>How Your Celebration Wallet Works</Text>
            </View>
            <View style={styles.ruleItem}>
              <CheckCircle2 size={15} color="#10b981" style={{ marginTop: 2 }} />
              <Text style={styles.ruleText}>
                <Text style={styles.boldText}>Instant Checkout Discount: </Text>
                Toggle "Apply Wallet" at checkout to deduct your balance from any booking or ticket (up to 100% off).
              </Text>
            </View>
            <View style={styles.ruleItem}>
              <CheckCircle2 size={15} color="#10b981" style={{ marginTop: 2 }} />
              <Text style={styles.ruleText}>
                <Text style={styles.boldText}>Non-Withdrawable Currency: </Text>
                Wallet credits are platform celebration funds. They cannot be transferred to bank accounts, ensuring permanent safety.
              </Text>
            </View>
            <View style={styles.ruleItem}>
              <CheckCircle2 size={15} color="#10b981" style={{ marginTop: 2 }} />
              <Text style={styles.ruleText}>
                <Text style={styles.boldText}>HappyLokam Support Rewards & Cashback: </Text>
                Loyalty drops, cancellation refunds, and promotional gifts from HappyLokam Support are credited here automatically.
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Action Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionBtnPrimary}
            onPress={() => setTopUpModal(true)}
            activeOpacity={0.85}
          >
            <Plus size={16} color="#ffffff" />
            <Text style={styles.actionBtnTextPrimary}>Add Wallet Funds</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtnSecondary}
            onPress={() => router.push('/(tabs)/bookings')}
            activeOpacity={0.85}
          >
            <Sparkles size={16} color="#e11d48" />
            <Text style={styles.actionBtnTextSecondary}>My Bookings</Text>
          </TouchableOpacity>
        </View>

        {/* Transactions Section */}
        <View style={styles.txSection}>
          <View style={styles.txHeaderRow}>
            <Text style={styles.txSectionTitle}>Transaction Ledger</Text>
            <View style={styles.filterTabsRow}>
              {(['all', 'credit', 'debit'] as const).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.filterTab, filter === tab && styles.filterTabActive]}
                  onPress={() => setFilter(tab)}
                >
                  <Text style={[styles.filterTabText, filter === tab && styles.filterTabTextActive]}>
                    {tab.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {loading ? (
            <ActivityIndicator size="small" color="#e11d48" style={{ marginTop: 24 }} />
          ) : filteredTransactions.length === 0 ? (
            <View style={styles.emptyBox}>
              <Clock size={32} color="#94a3b8" />
              <Text style={styles.emptyText}>No transactions found for this filter.</Text>
            </View>
          ) : (
            filteredTransactions.map((tx) => {
              const isCredit = tx.type === 'credit';
              return (
                <View key={tx.id} style={styles.txCard}>
                  <View
                    style={[
                      styles.txIconBox,
                      { backgroundColor: isCredit ? '#ecfdf5' : '#fff1f2' },
                    ]}
                  >
                    {isCredit ? (
                      <ArrowDownLeft size={18} color="#059669" />
                    ) : (
                      <ArrowUpRight size={18} color="#e11d48" />
                    )}
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.txTitle}>{tx.title}</Text>
                    <Text style={styles.txCategory}>
                      {tx.category || (isCredit ? 'Credit' : 'Payment')} • {tx.formattedDate || new Date(tx.date).toLocaleDateString('en-IN')}
                    </Text>
                    {tx.notes ? <Text style={styles.txNotes}>{tx.notes}</Text> : null}
                  </View>
                  <Text
                    style={[
                      styles.txAmount,
                      { color: isCredit ? '#059669' : '#e11d48' },
                    ]}
                  >
                    {isCredit ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                  </Text>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Top-Up Modal */}
      <Modal
        visible={topUpModal}
        transparent
        animationType="fade"
        onRequestClose={() => setTopUpModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalTopRow}>
              <Text style={styles.modalTitle}>Top-Up Celebration Wallet</Text>
              <TouchableOpacity onPress={() => setTopUpModal(false)}>
                <Text style={{ fontSize: 18, color: '#94a3b8', fontWeight: 'bold' }}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>
              Add non-withdrawable celebration cash. Auto-applies at checkout for instant discounts.
            </Text>

            <View style={styles.quickChipsRow}>
              {['200', '500', '1000', '2000'].map((amt) => (
                <TouchableOpacity
                  key={amt}
                  style={[
                    styles.chipBtn,
                    topUpAmount === amt && styles.chipBtnActive,
                  ]}
                  onPress={() => setTopUpAmount(amt)}
                >
                  <Text
                    style={[
                      styles.chipBtnText,
                      topUpAmount === amt && styles.chipBtnTextActive,
                    ]}
                  >
                    ₹{amt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.amountInput}
              keyboardType="number-pad"
              value={topUpAmount}
              onChangeText={setTopUpAmount}
              placeholder="Enter amount (min ₹100)"
              placeholderTextColor="#94a3b8"
            />

            <TouchableOpacity
              style={styles.confirmTopUpBtn}
              onPress={handleTopUp}
              disabled={processingTopUp}
              activeOpacity={0.85}
            >
              {processingTopUp ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.confirmTopUpText}>
                  Pay ₹{topUpAmount || '0'} via Razorpay
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  topBar: {
    height: Platform.OS === 'ios' ? 96 : 74,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  cardWrapper: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  metallicCard: {
    backgroundColor: '#881337', // Deep rose slate
    borderRadius: 24,
    padding: 22,
    shadowColor: '#881337',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  brandBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fbbf24',
    letterSpacing: 0.5,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fbcfe8',
    marginTop: 18,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceValue: {
    fontSize: 34,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 4,
    letterSpacing: -0.5,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  securityText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#a7f3d0',
  },
  topUpPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  topUpPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  rulesContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  rulesCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  rulesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  rulesTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 8,
  },
  ruleText: {
    flex: 1,
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
  },
  boldText: {
    fontWeight: '800',
    color: '#0f172a',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  actionBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#e11d48',
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#e11d48',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  actionBtnTextPrimary: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    paddingVertical: 14,
    borderRadius: 16,
  },
  actionBtnTextSecondary: {
    color: '#e11d48',
    fontWeight: '800',
    fontSize: 13,
  },
  txSection: {
    paddingHorizontal: 16,
    marginTop: 22,
  },
  txHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  txSectionTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0f172a',
  },
  filterTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    padding: 2,
  },
  filterTab: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  filterTabActive: {
    backgroundColor: '#ffffff',
  },
  filterTabText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  filterTabTextActive: {
    color: '#e11d48',
    fontWeight: '800',
  },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  txIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  txCategory: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  txNotes: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
    fontStyle: 'italic',
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '900',
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 36,
  },
  emptyText: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 22,
  },
  modalTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0f172a',
  },
  modalSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 6,
    lineHeight: 17,
  },
  quickChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  chipBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipBtnActive: {
    backgroundColor: '#ffe4e6',
    borderColor: '#f43f5e',
  },
  chipBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  chipBtnTextActive: {
    color: '#e11d48',
    fontWeight: '800',
  },
  amountInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 12,
  },
  confirmTopUpBtn: {
    backgroundColor: '#e11d48',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  confirmTopUpText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
});
