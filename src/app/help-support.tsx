import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  BackHandler,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  Mail,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Clock,
  ShieldCheck,
  Send,
  MessageSquare,
  Sparkles,
  Bot,
  User,
  Trash2,
} from 'lucide-react-native';
import RoomDatabase, { RoomSupportMessage } from '../services/roomDatabase';
import { apiClient } from '../services/api';

const FAQS = [
  {
    q: 'How does the HappyLokam Celebration Wallet work?',
    a: 'Your wallet holds virtual celebration credits. When booking any pass, package, or event, you can toggle "Apply Wallet Balance" at checkout to instantly reduce your payable amount (up to 100% discount). Note that wallet credits are virtual celebration funds and cannot be withdrawn or transferred to bank accounts.',
  },
  {
    q: 'How do I download and show my digital entry pass?',
    a: 'Once your reservation or pass booking is confirmed via Razorpay, your ticket with a unique QR code is generated instantly in your "My Bookings" tab. Present this pass at the venue entrance for seamless digital gate verification.',
  },
  {
    q: 'Can I customize wedding decoration themes and catering menus?',
    a: 'Yes! Inside the details screen of any wedding or birthday package, you can explore available dates, time slots, and special inclusions. You can also specify custom food or theme requirements in the booking notes for our dedicated event coordinators.',
  },
  {
    q: 'What is the refund and cancellation policy?',
    a: 'Cancellations requested 48 hours prior to the booked event date are eligible for full or partial celebration wallet refunds based on venue policy.',
  },
];

const QUICK_CHIPS = [
  '🎟️ Where is my booking pass?',
  '💰 How does the wallet work?',
  '🍛 Can I customize catering & decor?',
  '💳 Payment & Razorpay help',
];

export default function HelpSupportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);

  const [activeTab, setActiveTab] = useState<'contact' | 'chat'>('contact');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Live Chat State
  const [messages, setMessages] = useState<RoomSupportMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
    return true;
  };

  useEffect(() => {
    const backSub = BackHandler.addEventListener('hardwareBackPress', handleGoBack);
    loadMessages();
    return () => backSub.remove();
  }, []);

  const loadMessages = async () => {
    const msgs = await RoomDatabase.getSupportMessages();
    setMessages(msgs);
  };

  const handleCall = () => {
    Linking.openURL('tel:+919876543210').catch(() => {
      Alert.alert('Phone Helpline', 'Our concierge desk is reachable at +91 98765 43210 (9 AM - 9 PM).');
    });
  };

  const handleWhatsApp = () => {
    Linking.openURL('https://wa.me/919876543210?text=Hello%20HappyLokam%20Support%2C%20I%20need%20assistance%20with%20my%20celebration%20booking.').catch(() => {
      Alert.alert('WhatsApp Helpline', 'WhatsApp our concierge directly at +91 98765 43210.');
    });
  };

  const handleEmail = () => {
    Linking.openURL('mailto:support@happylokam.com?subject=Celebration%20Support%20Query').catch(() => {
      Alert.alert('Email Support', 'Write to us at support@happylokam.com');
    });
  };

  const getAutoResponse = (query: string): string => {
    const q = query.toLowerCase();
    if (q.includes('wallet') || q.includes('balance') || q.includes('money') || q.includes('withdraw')) {
      return '💰 HappyLokam Wallet holds Virtual Celebration Cash. It automatically reduces the total bill when booking passes and celebration services at checkout. To prevent misuse, wallet credits are non-withdrawable to bank accounts and stay safely in your account for all future events.';
    }
    if (q.includes('ticket') || q.includes('pass') || q.includes('qr') || q.includes('where is')) {
      return '🎟️ Your confirmed passes are stored permanently in the "My Bookings" tab! Each pass includes a verified QR code, date, guest count, and Razorpay transaction receipt for gate entry.';
    }
    if (q.includes('catering') || q.includes('decor') || q.includes('food') || q.includes('customize')) {
      return '🍛 Absolutely! All verified celebration packages and themes can be tailored to your requirements. Choose your preferred package, select your date, and add your preferences in the booking notes. Our event concierge will finalize arrangements with you.';
    }
    if (q.includes('payment') || q.includes('razorpay') || q.includes('refund')) {
      return '💳 All payments are protected with 256-bit RBI-compliant Razorpay encryption. Eligible cancellations 48h before the event are credited back to your celebration wallet instantly.';
    }
    return `Thank you for reaching out! 🙏 Our celebration team has logged your inquiry: "${query}". You can also tap WhatsApp below for an instant conversation with our senior concierge specialist.`;
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query) return;

    setInputText('');
    const userMsg = await RoomDatabase.addSupportMessage({
      sender: 'user',
      text: query,
    });
    setMessages((prev) => [...prev, userMsg]);

    // Asynchronously dispatch dynamic support ticket to backend Admin Desk
    RoomDatabase.getUserSession()
      .then((session) => {
        const lowerQ = query.toLowerCase();
        let cat = 'GENERAL';
        if (lowerQ.includes('pass') || lowerQ.includes('ticket') || lowerQ.includes('booking') || lowerQ.includes('qr')) {
          cat = 'BOOKING_PASS';
        } else if (lowerQ.includes('payment') || lowerQ.includes('razorpay') || lowerQ.includes('refund') || lowerQ.includes('wallet')) {
          cat = 'PAYMENT_RAZORPAY';
        } else if (lowerQ.includes('catering') || lowerQ.includes('decor') || lowerQ.includes('food') || lowerQ.includes('theme')) {
          cat = 'CATERING_DECOR';
        } else if (lowerQ.includes('venue') || lowerQ.includes('lawn') || lowerQ.includes('hall')) {
          cat = 'VENUE_ACCESS';
        }

        apiClient.post('/support/create', {
          userName: session?.name || 'Mobile App User',
          userPhone: session?.phone || '9570729072',
          userEmail: session?.email || null,
          category: cat,
          subject: query.slice(0, 50),
          message: query,
          priority: lowerQ.includes('urgent') || lowerQ.includes('emergency') || lowerQ.includes('cancel') ? 'URGENT' : 'MEDIUM',
        }).catch((err) => console.warn('Support ticket sync notice:', err));
      })
      .catch(() => {});

    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // Simulated Concierge Typing Response
    setIsTyping(true);
    setTimeout(async () => {
      const replyText = getAutoResponse(query);
      const replyMsg = await RoomDatabase.addSupportMessage({
        sender: 'concierge',
        text: replyText,
        senderName: 'HappyLokam Concierge',
      });
      setIsTyping(false);
      setMessages((prev) => [...prev, replyMsg]);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 800);
  };

  const handleClearChat = () => {
    Alert.alert('Clear Chat', 'Do you want to reset your support chat history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          await RoomDatabase.clearSupportMessages();
          const msgs = await RoomDatabase.getSupportMessages();
          setMessages(msgs);
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={22} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        {activeTab === 'chat' ? (
          <TouchableOpacity onPress={handleClearChat} style={styles.clearBtn} activeOpacity={0.7}>
            <Trash2 size={18} color="#94a3b8" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {/* Tabs Switcher: Help Desk vs Live Chat */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'contact' && styles.tabItemActive]}
          onPress={() => setActiveTab('contact')}
          activeOpacity={0.8}
        >
          <Phone size={15} color={activeTab === 'contact' ? '#e11d48' : '#64748b'} />
          <Text style={[styles.tabText, activeTab === 'contact' && styles.tabTextActive]}>
            Concierge Desk & FAQs
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'chat' && styles.tabItemActive]}
          onPress={() => setActiveTab('chat')}
          activeOpacity={0.8}
        >
          <MessageSquare size={15} color={activeTab === 'chat' ? '#e11d48' : '#64748b'} />
          <Text style={[styles.tabText, activeTab === 'chat' && styles.tabTextActive]}>
            Live Support Chat
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'contact' ? (
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom, 24) + 40 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Support Banner */}
          <View style={styles.supportBanner}>
            <HelpCircle size={28} color="#e11d48" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.supportBannerTitle}>24/7 Dedicated Concierge</Text>
              <Text style={styles.supportBannerSub}>
                We are here to make your celebrations seamless, royal, and memorable.
              </Text>
            </View>
          </View>

          {/* Quick Contact Buttons */}
          <View style={styles.contactRow}>
            <TouchableOpacity style={styles.contactCard} onPress={handleWhatsApp} activeOpacity={0.85}>
              <View style={[styles.contactIconCircle, { backgroundColor: '#dcfce7' }]}>
                <MessageCircle size={22} color="#16a34a" />
              </View>
              <Text style={styles.contactCardTitle}>WhatsApp</Text>
              <Text style={styles.contactCardSub}>Instant Chat</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactCard} onPress={handleCall} activeOpacity={0.85}>
              <View style={[styles.contactIconCircle, { backgroundColor: '#eff6ff' }]}>
                <Phone size={22} color="#2563eb" />
              </View>
              <Text style={styles.contactCardTitle}>Call Us</Text>
              <Text style={styles.contactCardSub}>9 AM - 9 PM</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactCard} onPress={handleEmail} activeOpacity={0.85}>
              <View style={[styles.contactIconCircle, { backgroundColor: '#fdf2f8' }]}>
                <Mail size={22} color="#db2777" />
              </View>
              <Text style={styles.contactCardTitle}>Email</Text>
              <Text style={styles.contactCardSub}>Official Desk</Text>
            </TouchableOpacity>
          </View>

          {/* Start In-App Chat Action Card */}
          <TouchableOpacity
            style={styles.liveChatCard}
            onPress={() => setActiveTab('chat')}
            activeOpacity={0.88}
          >
            <View style={styles.liveChatIconBox}>
              <Bot size={24} color="#e11d48" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.liveChatTitle}>Message Support Assistant</Text>
              <Text style={styles.liveChatSub}>
                Chat in real-time about booking passes, wallet balances, and catering themes.
              </Text>
            </View>
            <View style={styles.liveChatActionBtn}>
              <Text style={styles.liveChatActionBtnText}>Start Chat</Text>
            </View>
          </TouchableOpacity>

          {/* FAQs Section */}
          <Text style={styles.faqSectionHeader}>Frequently Asked Questions</Text>
          <View style={styles.faqsList}>
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <View key={idx} style={styles.faqCard}>
                  <TouchableOpacity
                    style={styles.faqQuestionRow}
                    onPress={() => setOpenFaq(isOpen ? null : idx)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.faqQuestion}>{faq.q}</Text>
                    {isOpen ? <ChevronUp size={18} color="#64748b" /> : <ChevronDown size={18} color="#64748b" />}
                  </TouchableOpacity>
                  {isOpen && <Text style={styles.faqAnswer}>{faq.a}</Text>}
                </View>
              );
            })}
          </View>

          {/* Security & Support Guarantee */}
          <View style={styles.securitySealCard}>
            <ShieldCheck size={20} color="#059669" />
            <Text style={styles.securitySealText}>
              All transactions & communication are 256-bit encrypted under HappyLokam Escrow Protection.
            </Text>
          </View>
        </ScrollView>
      ) : (
        /* LIVE IN-APP CHAT VIEW */
        <View style={styles.chatContainer}>
          {/* Quick Topic Chips */}
          <View style={styles.chipsRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
              {QUICK_CHIPS.map((chip, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.chipButton}
                  onPress={() => handleSendMessage(chip.slice(3))}
                  activeOpacity={0.8}
                >
                  <Text style={styles.chipText}>{chip}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Chat Messages Feed */}
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.chatFeed}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((m) => {
              const isMe = m.sender === 'user';
              return (
                <View
                  key={m.id}
                  style={[styles.messageBubbleRow, isMe ? styles.myBubbleRow : styles.otherBubbleRow]}
                >
                  {!isMe && (
                    <View style={styles.avatarIconBox}>
                      <Bot size={16} color="#ffffff" />
                    </View>
                  )}
                  <View style={[styles.bubbleContent, isMe ? styles.myBubble : styles.otherBubble]}>
                    <Text style={[styles.senderName, isMe ? styles.mySenderName : styles.otherSenderName]}>
                      {m.senderName || (isMe ? 'You' : 'HappyLokam Concierge')}
                    </Text>
                    <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.otherMessageText]}>
                      {m.text}
                    </Text>
                    <Text style={[styles.messageTime, isMe ? styles.myMessageTime : styles.otherMessageTime]}>
                      {m.timestamp}
                    </Text>
                  </View>
                </View>
              );
            })}

            {isTyping && (
              <View style={[styles.messageBubbleRow, styles.otherBubbleRow]}>
                <View style={styles.avatarIconBox}>
                  <Bot size={16} color="#ffffff" />
                </View>
                <View style={[styles.bubbleContent, styles.otherBubble, { paddingVertical: 10 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <ActivityIndicator size="small" color="#e11d48" />
                    <Text style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic' }}>
                      HappyLokam Concierge is typing...
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Input Bar */}
          <View style={[styles.chatInputBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <TextInput
              style={styles.chatTextInput}
              placeholder="Ask about booking, wallet, catering..."
              placeholderTextColor="#94a3b8"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => handleSendMessage()}
              returnKeyType="send"
            />
            <TouchableOpacity
              style={[styles.sendButton, !inputText.trim() && { opacity: 0.5 }]}
              onPress={() => handleSendMessage()}
              disabled={!inputText.trim()}
              activeOpacity={0.8}
            >
              <Send size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    height: Platform.OS === 'ios' ? 96 : 74,
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
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  clearBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: '#e11d48',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#e11d48',
  },
  content: {
    padding: 20,
  },
  supportBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
  },
  supportBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#9f1239',
  },
  supportBannerSub: {
    fontSize: 12,
    color: '#be123c',
    marginTop: 2,
    lineHeight: 18,
  },
  contactRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  contactCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  contactIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  contactCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  contactCardSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  liveChatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#fecdd3',
    borderRadius: 18,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#e11d48',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  liveChatIconBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#ffe4e6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveChatTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  liveChatSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 3,
    lineHeight: 16,
  },
  liveChatActionBtn: {
    backgroundColor: '#e11d48',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    marginLeft: 6,
  },
  liveChatActionBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  faqSectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 12,
    marginLeft: 4,
  },
  faqsList: {
    gap: 10,
    marginBottom: 20,
  },
  faqCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
  },
  faqQuestionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    paddingRight: 10,
  },
  faqAnswer: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 19,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
  },
  securitySealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 14,
    padding: 14,
  },
  securitySealText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: '#065f46',
    lineHeight: 16,
  },

  /* Live Chat Styles */
  chatContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  chipsRow: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 10,
  },
  chipButton: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  chipText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  chatFeed: {
    padding: 16,
    paddingBottom: 24,
  },
  messageBubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 14,
    gap: 8,
  },
  myBubbleRow: {
    justifyContent: 'flex-end',
  },
  otherBubbleRow: {
    justifyContent: 'flex-start',
  },
  avatarIconBox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e11d48',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  bubbleContent: {
    maxWidth: '78%',
    borderRadius: 16,
    padding: 12,
  },
  myBubble: {
    backgroundColor: '#e11d48',
    borderBottomRightRadius: 2,
  },
  otherBubble: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderBottomLeftRadius: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  senderName: {
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  mySenderName: {
    color: '#fecdd3',
  },
  otherSenderName: {
    color: '#e11d48',
  },
  messageText: {
    fontSize: 13,
    lineHeight: 18,
  },
  myMessageText: {
    color: '#ffffff',
  },
  otherMessageText: {
    color: '#0f172a',
  },
  messageTime: {
    fontSize: 9,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  myMessageTime: {
    color: '#fecdd3',
  },
  otherMessageTime: {
    color: '#94a3b8',
  },
  chatInputBar: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chatTextInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#f1f5f9',
    borderRadius: 22,
    paddingHorizontal: 16,
    fontSize: 13,
    color: '#0f172a',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e11d48',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#e11d48',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
});
