import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  BackHandler,
  TextInput,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  MapPin,
  Plus,
  Trash2,
  CheckCircle2,
  Building2,
  Phone,
  User,
  Check,
} from 'lucide-react-native';
import RoomDatabase, { RoomAddress } from '../services/roomDatabase';

export default function AddressesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [addresses, setAddresses] = useState<RoomAddress[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  // Form State
  const [label, setLabel] = useState('Home Celebration');
  const [recipientName, setRecipientName] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('Patna, Bihar');
  const [pincode, setPincode] = useState('800026');

  useEffect(() => {
    const backSub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (router.canGoBack()) router.back();
      else router.replace('/(tabs)/profile');
      return true;
    });

    loadAddresses();
    return () => backSub.remove();
  }, []);

  const loadAddresses = async () => {
    const list = await RoomDatabase.getAddresses();
    setAddresses(list);
  };

  const handleSave = async () => {
    if (!recipientName.trim()) {
      Alert.alert('Required', 'Please enter host or recipient name.');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Required', 'Please enter a contact phone number.');
      return;
    }
    if (!street.trim()) {
      Alert.alert('Required', 'Please enter the street address or venue name.');
      return;
    }

    await RoomDatabase.saveAddress({
      label: label || 'Celebration Venue',
      recipientName: recipientName.trim(),
      phone: phone.trim(),
      street: street.trim(),
      city: city.trim() || 'Patna',
      pincode: pincode.trim() || '800001',
    });

    setModalVisible(false);
    setRecipientName('');
    setPhone('');
    setStreet('');
    loadAddresses();
    Alert.alert('Address Saved 🎉', 'Celebration location saved to your profile.');
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Address', 'Are you sure you want to remove this celebration location?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await RoomDatabase.deleteAddress(id);
          loadAddresses();
        },
      },
    ]);
  };

  const handleSetDefault = async (id: string) => {
    await RoomDatabase.setDefaultAddress(id);
    loadAddresses();
  };

  return (
    <View style={styles.container}>
      {/* Top Bar */}
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
        <Text style={styles.headerTitle}>Celebration Locations</Text>
        <TouchableOpacity
          style={styles.addTopBtn}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <Plus size={18} color="#e11d48" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 60 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introBlock}>
          <Text style={styles.introTitle}>Saved Celebration & Event Venues</Text>
          <Text style={styles.introSub}>
            Manage saved addresses for catering drop-offs, event decor setups, and venue coordinators.
          </Text>
        </View>

        <View style={styles.listContainer}>
          {addresses.map((addr) => (
            <View key={addr.id} style={styles.addressCard}>
              <View style={styles.cardTopRow}>
                <View style={styles.labelBadge}>
                  <Building2 size={13} color="#e11d48" />
                  <Text style={styles.labelText}>{addr.label}</Text>
                </View>
                {addr.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Check size={11} color="#059669" />
                    <Text style={styles.defaultText}>PRIMARY</Text>
                  </View>
                )}
              </View>

              <Text style={styles.recipientName}>{addr.recipientName}</Text>
              <Text style={styles.addressStreet}>{addr.street}</Text>
              <Text style={styles.addressCity}>
                {addr.city} - {addr.pincode}
              </Text>
              <Text style={styles.phoneText}>📞 {addr.phone}</Text>

              <View style={styles.cardActionsRow}>
                {!addr.isDefault && (
                  <TouchableOpacity
                    style={styles.setDefaultBtn}
                    onPress={() => handleSetDefault(addr.id)}
                  >
                    <Text style={styles.setDefaultText}>Set as Primary</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(addr.id)}
                >
                  <Trash2 size={15} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <TouchableOpacity
            style={styles.addNewCardBtn}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.85}
          >
            <Plus size={20} color="#e11d48" />
            <Text style={styles.addNewCardText}>Add New Celebration Address</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Add Address Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalTopRow}>
              <Text style={styles.modalTitle}>New Celebration Location</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={{ fontSize: 18, color: '#94a3b8', fontWeight: 'bold' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              <Text style={styles.inputLabel}>Location Type</Text>
              <View style={styles.typeChipsRow}>
                {['Home Celebration', 'Banquet / Lawn', 'Farmhouse', 'Office'].map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeChip, label === t && styles.typeChipActive]}
                    onPress={() => setLabel(t)}
                  >
                    <Text style={[styles.typeChipText, label === t && styles.typeChipTextActive]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Host / Recipient Name</Text>
              <TextInput
                style={styles.inputField}
                placeholder="e.g. Ramesh Kumar"
                placeholderTextColor="#94a3b8"
                value={recipientName}
                onChangeText={setRecipientName}
              />

              <Text style={styles.inputLabel}>Contact Phone</Text>
              <TextInput
                style={styles.inputField}
                placeholder="e.g. +91 98765 43210"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />

              <Text style={styles.inputLabel}>Street Address / Venue Details</Text>
              <TextInput
                style={styles.inputField}
                placeholder="e.g. Near Gandhi Maidan, Exhibition Road"
                placeholderTextColor="#94a3b8"
                value={street}
                onChangeText={setStreet}
              />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 2 }}>
                  <Text style={styles.inputLabel}>City</Text>
                  <TextInput
                    style={styles.inputField}
                    placeholder="e.g. Patna, Bihar"
                    placeholderTextColor="#94a3b8"
                    value={city}
                    onChangeText={setCity}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Pincode</Text>
                  <TextInput
                    style={styles.inputField}
                    placeholder="800001"
                    placeholderTextColor="#94a3b8"
                    keyboardType="number-pad"
                    value={pincode}
                    onChangeText={setPincode}
                  />
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
              <Text style={styles.saveBtnText}>Save Celebration Address</Text>
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
  addTopBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fff1f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  introBlock: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  introTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0f172a',
  },
  introSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    lineHeight: 17,
  },
  listContainer: {
    paddingHorizontal: 16,
    marginTop: 14,
  },
  addressCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  labelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff1f2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  labelText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#e11d48',
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  defaultText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
  },
  recipientName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  addressStreet: {
    fontSize: 12,
    color: '#475569',
    marginTop: 3,
  },
  addressCity: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 1,
  },
  phoneText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 6,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  setDefaultBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  setDefaultText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  deleteBtn: {
    padding: 6,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
  },
  addNewCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#fecdd3',
    borderStyle: 'dashed',
    borderRadius: 18,
    paddingVertical: 16,
    marginTop: 6,
  },
  addNewCardText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#e11d48',
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
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0f172a',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    marginTop: 10,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  typeChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  typeChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
  },
  typeChipActive: {
    backgroundColor: '#ffe4e6',
    borderWidth: 1,
    borderColor: '#f43f5e',
  },
  typeChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  typeChipTextActive: {
    color: '#e11d48',
    fontWeight: '800',
  },
  inputField: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a',
  },
  saveBtn: {
    backgroundColor: '#e11d48',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  saveBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },
});
