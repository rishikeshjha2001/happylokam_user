import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
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
} from 'lucide-react-native';

const FAQS = [
  {
    q: 'How do I download and show my digital entry pass?',
    a: 'Once your reservation or ticket booking is confirmed via Razorpay, your ticket QR code appears instantly in your "My Bookings" tab. You can present this QR code at the venue gate for swift check-in.',
  },
  {
    q: 'How does the HappyLokam Celebration Wallet work?',
    a: 'Admin promotional cash, referral rewards, and booking cashbacks are added to your HappyLokam Wallet. At checkout, you can toggle "Apply Wallet Balance" to instantly reduce the total payable amount.',
  },
  {
    q: 'Can I customize wedding decoration themes and catering menus?',
    a: 'Yes! In the details screen of any wedding or birthday package, you can view the features included, select your event date and slot, and leave custom notes for our celebration coordinators.',
  },
  {
    q: 'What is the refund and cancellation policy?',
    a: 'Cancellations made 48 hours prior to the booked event date are eligible for full or partial wallet refunds according to vendor guidelines.',
  },
];

export default function HelpSupportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleCall = () => {
    Linking.openURL('tel:+919876543210').catch(() => {
      Alert.alert('Helpline', 'Call us at +91 98765 43210 (9 AM - 9 PM)');
    });
  };

  const handleWhatsApp = () => {
    Linking.openURL('https://wa.me/919876543210?text=Hello%20HappyLokam%20Support%2C%20I%20need%20help%20with%20my%20booking.').catch(() => {
      Alert.alert('WhatsApp Support', 'WhatsApp us at +91 98765 43210');
    });
  };

  const handleEmail = () => {
    Linking.openURL('mailto:support@happylokam.com?subject=Celebration%20Support%20Query').catch(() => {
      Alert.alert('Email Support', 'Write to support@happylokam.com');
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  content: {
    padding: 16,
  },
  supportBanner: {
    backgroundColor: '#fff1f2',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fecdd3',
    marginBottom: 16,
  },
  supportBannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#be123c',
  },
  supportBannerSub: {
    fontSize: 12,
    color: '#e11d48',
    marginTop: 2,
    lineHeight: 18,
  },
  contactRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  contactCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  contactIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  contactCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  contactCardSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  faqSectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
  },
  faqsList: {
    gap: 10,
  },
  faqCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
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
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
    paddingRight: 10,
  },
  faqAnswer: {
    fontSize: 13,
    color: '#475569',
    marginTop: 10,
    lineHeight: 20,
  },
});
