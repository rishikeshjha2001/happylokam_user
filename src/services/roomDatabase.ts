/**
 * Room Database Service for Android
 * Implements Room-architecture offline persistence and local cache
 * for Events, Venues, Services, Bookings, and User Session.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TicketTiersMap {
  single: number;
  couple: number;
  family4: number;
  family6: number;
  group5: number;
  child: number;
}

export interface RoomEvent {
  id: string;
  title: string;
  description?: string;
  category: string;
  location: string;
  city?: string;
  date: string;
  price: string | number;
  ticketTiers?: TicketTiersMap;
  availableTickets?: number;
  image?: string;
  rating?: number;
  featured?: boolean;
  time?: string;
  availableDates?: string;
  scarcityTag?: string;
  typeTitle?: string;
  syncTimestamp: number;
}

export interface RoomVenue {
  id: string;
  title: string;
  category: string;
  location: string;
  price: string | number;
  rating?: number;
  image?: string;
  amenities?: string[];
  syncTimestamp: number;
}

export interface RoomBooking {
  id: string;
  title: string;
  category: string;
  date: string;
  amount: number;
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED';
  tierType?: string;
  tierName?: string;
  ticketsCount?: number;
  qrCode?: string;
  createdAt: string;
  /** Set only for a booking returned or accepted by the server. */
  serverVerified?: boolean;
}

export interface RoomUser {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  gender?: string;
  location?: string;
  token: string;
  referralCode?: string;
  walletBalance?: number;
  lastLogin: number;
}

export interface RoomWalletTransaction {
  id: string;
  title: string;
  amount: number;
  type: 'credit' | 'debit';
  date: string;
  formattedDate?: string;
  category?: string;
  referenceId?: string;
  notes?: string;
}

export interface RoomSupportMessage {
  id: string;
  sender: 'user' | 'concierge';
  text: string;
  timestamp: string;
  senderName?: string;
}

export interface RoomAddress {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  street: string;
  city: string;
  pincode: string;
  isDefault?: boolean;
}

const STORAGE_KEYS = {
  EVENTS: '@happylokam_room_events',
  VENUES: '@happylokam_room_venues',
  BOOKINGS: '@happylokam_room_bookings',
  USER: '@happylokam_room_user',
  TOKEN: 'token',
  LOCATION: '@happylokam_room_location',
  FAVORITES: '@happylokam_room_favorites',
  RATINGS: '@happylokam_room_ratings',
  NOTIFICATIONS: '@happylokam_room_notifications',
  WALLET_TRANSACTIONS: '@happylokam_room_wallet_transactions',
  SUPPORT_MESSAGES: '@happylokam_room_support_messages',
  ADDRESSES: '@happylokam_room_saved_addresses',
};

export const RoomDatabase = {
  // --- Favorites DAO ---
  async getFavorites(): Promise<any[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITES);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  async toggleFavorite(item: { id: string; title: string; image?: string; price?: string | number; location?: string; type?: string; cornerTag?: string; tag?: string }): Promise<boolean> {
    try {
      const favs = await this.getFavorites();
      const exists = favs.some((f) => f.id === item.id);
      let updated: any[];
      if (exists) {
        updated = favs.filter((f) => f.id !== item.id);
      } else {
        updated = [item, ...favs];
      }
      await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(updated));
      return !exists;
    } catch {
      return false;
    }
  },

  async isFavorite(id: string): Promise<boolean> {
    try {
      const favs = await this.getFavorites();
      return favs.some((f) => f.id === id);
    } catch {
      return false;
    }
  },

  // --- Ratings DAO ---
  async getRatings(): Promise<any[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.RATINGS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  async saveRating(ratingData: { itemId: string; rating: number; review: string; userName?: string; createdAt?: string }): Promise<void> {
    try {
      const current = await this.getRatings();
      const updated = [
        {
          ...ratingData,
          id: 'rate_' + Date.now(),
          createdAt: new Date().toISOString(),
        },
        ...current,
      ];
      await AsyncStorage.setItem(STORAGE_KEYS.RATINGS, JSON.stringify(updated));
    } catch (e) {
      console.warn('saveRating error:', e);
    }
  },

  // --- Notifications DAO ---
  async getNotifications(): Promise<any[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  async saveNotifications(list: any[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list));
    } catch (e) {
      console.warn('saveNotifications error:', e);
    }
  },

  async addNotification(notif: { id?: string; title: string; message: string; sentAt?: string; isRead?: boolean }): Promise<void> {
    try {
      const current = await this.getNotifications();
      const newNotif = {
        id: notif.id || 'notif_' + Date.now(),
        title: notif.title,
        message: notif.message,
        sentAt: notif.sentAt || new Date().toISOString(),
        isRead: notif.isRead || false,
      };
      await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([newNotif, ...current]));
    } catch (e) {
      console.warn('addNotification error:', e);
    }
  },

  // --- Location DAO ---
  async getLocation(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.LOCATION);
    } catch (error) {
      return null;
    }
  },

  async saveLocation(location: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LOCATION, location);
    } catch (e) {
      console.warn('RoomDatabase.saveLocation error:', e);
    }
  },
  // --- Events DAO ---
  async getEvents(): Promise<RoomEvent[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.EVENTS);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.warn('RoomDatabase.getEvents error:', e);
      return [];
    }
  },

  async saveEvents(events: RoomEvent[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
    } catch (e) {
      console.warn('RoomDatabase.saveEvents error:', e);
    }
  },

  // --- Venues DAO ---
  async getVenues(): Promise<RoomVenue[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.VENUES);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.warn('RoomDatabase.getVenues error:', e);
      return [];
    }
  },

  async saveVenues(venues: RoomVenue[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.VENUES, JSON.stringify(venues));
    } catch (e) {
      console.warn('RoomDatabase.saveVenues error:', e);
    }
  },

  // --- Bookings DAO ---
  async getBookings(): Promise<RoomBooking[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.BOOKINGS);
      const bookings: RoomBooking[] = raw ? JSON.parse(raw) : [];
      // Never display legacy client-created passes. A QR pass must have a
      // server booking behind it, otherwise it is not valid for entry.
      return bookings.filter((booking) => booking.serverVerified === true);
    } catch (e) {
      console.warn('RoomDatabase.getBookings error:', e);
      return [];
    }
  },

  async saveBooking(booking: RoomBooking): Promise<void> {
    try {
      const current = await this.getBookings();
      if (!booking.serverVerified) {
        throw new Error('Refusing to store an unverified booking pass');
      }
      const updated = [booking, ...current.filter(b => b.id !== booking.id)];
      await AsyncStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(updated));
    } catch (e) {
      console.warn('RoomDatabase.saveBooking error:', e);
    }
  },

  async clearBookings(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.BOOKINGS);
    } catch (e) {
      console.warn('RoomDatabase.clearBookings error:', e);
    }
  },

  async cancelBooking(bookingId: string): Promise<void> {
    try {
      const current = await this.getBookings();
      const updated = current.map(b => b.id === bookingId ? { ...b, status: 'CANCELLED' as const } : b);
      await AsyncStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(updated));
    } catch (e) {
      console.warn('RoomDatabase.cancelBooking error:', e);
    }
  },

  // --- User Session DAO ---
  async getUserSession(): Promise<RoomUser | null> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn('RoomDatabase.getUserSession error:', e);
      return null;
    }
  },

  async saveUserSession(user: RoomUser): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, user.token);
    } catch (e) {
      console.warn('RoomDatabase.saveUserSession error:', e);
    }
  },

  async clearUserSession(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER);
      await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
    } catch (e) {
      console.warn('RoomDatabase.clearUserSession error:', e);
    }
  },

  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      return !!token;
    } catch (error) {
      return false;
    }
  },

  // --- Wallet DAO ---
  async getWalletBalance(): Promise<number> {
    try {
      const user = await this.getUserSession();
      return typeof user?.walletBalance === 'number' ? user.walletBalance : 0;
    } catch {
      return 0;
    }
  },

  async deductWalletBalance(amount: number): Promise<number> {
    try {
      const user = await this.getUserSession();
      if (!user) return 0;
      const current = typeof user.walletBalance === 'number' ? user.walletBalance : 0;
      const updatedBalance = Math.max(0, current - amount);
      user.walletBalance = updatedBalance;
      await this.saveUserSession(user);
      return updatedBalance;
    } catch {
      return 0;
    }
  },

  async addWalletBalance(amount: number): Promise<number> {
    try {
      const user = await this.getUserSession();
      if (!user) return 0;
      const current = typeof user.walletBalance === 'number' ? user.walletBalance : 0;
      const updatedBalance = current + amount;
      user.walletBalance = updatedBalance;
      await this.saveUserSession(user);
      return updatedBalance;
    } catch {
      return 0;
    }
  },

  async setWalletBalance(amount: number): Promise<number> {
    try {
      const user = await this.getUserSession();
      if (!user) return 0;
      user.walletBalance = Math.max(0, amount);
      await this.saveUserSession(user);
      return user.walletBalance;
    } catch {
      return 0;
    }
  },

  // --- Wallet Transactions DAO ---
  async getWalletTransactions(): Promise<RoomWalletTransaction[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.WALLET_TRANSACTIONS);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.warn('RoomDatabase.getWalletTransactions error:', e);
      return [];
    }
  },

  async addWalletTransaction(tx: Omit<RoomWalletTransaction, 'id'> & { id?: string }): Promise<RoomWalletTransaction> {
    try {
      const current = await this.getWalletTransactions();
      const newTx: RoomWalletTransaction = {
        id: tx.id || `tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        title: tx.title,
        amount: tx.amount,
        type: tx.type,
        date: tx.date || new Date().toISOString(),
        formattedDate: tx.formattedDate || new Date().toLocaleString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }),
        category: tx.category || (tx.type === 'credit' ? 'Wallet Credit' : 'Payment Debit'),
        referenceId: tx.referenceId,
        notes: tx.notes,
      };

      const updated = [newTx, ...current];
      await AsyncStorage.setItem(STORAGE_KEYS.WALLET_TRANSACTIONS, JSON.stringify(updated));
      return newTx;
    } catch (e) {
      console.warn('RoomDatabase.addWalletTransaction error:', e);
      return {
        id: `tx_${Date.now()}`,
        title: tx.title,
        amount: tx.amount,
        type: tx.type,
        date: new Date().toISOString(),
      };
    }
  },

  async clearWalletTransactions(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.WALLET_TRANSACTIONS);
    } catch (e) {
      console.warn('RoomDatabase.clearWalletTransactions error:', e);
    }
  },

  // --- Support Chat Messages DAO ---
  async getSupportMessages(): Promise<RoomSupportMessage[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.SUPPORT_MESSAGES);
      if (!raw) {
        return [
          {
            id: 'msg_welcome',
            sender: 'concierge',
            text: 'Namaste! 🙏 Welcome to HappyLokam Celebration Concierge. How can we make your wedding, birthday, or party unforgettable today?',
            timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
            senderName: 'HappyLokam Concierge',
          },
        ];
      }
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  async addSupportMessage(msg: { sender: 'user' | 'concierge'; text: string; senderName?: string }): Promise<RoomSupportMessage> {
    try {
      const current = await this.getSupportMessages();
      const newMsg: RoomSupportMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        sender: msg.sender,
        text: msg.text,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
        senderName: msg.senderName || (msg.sender === 'user' ? 'You' : 'HappyLokam Concierge'),
      };
      const updated = [...current, newMsg];
      await AsyncStorage.setItem(STORAGE_KEYS.SUPPORT_MESSAGES, JSON.stringify(updated));
      return newMsg;
    } catch (e) {
      console.warn('RoomDatabase.addSupportMessage error:', e);
      return {
        id: `msg_${Date.now()}`,
        sender: msg.sender,
        text: msg.text,
        timestamp: 'Just now',
      };
    }
  },

  async clearSupportMessages(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.SUPPORT_MESSAGES);
    } catch (e) {
      console.warn('RoomDatabase.clearSupportMessages error:', e);
    }
  },

  // --- Saved Celebration Addresses DAO ---
  async getAddresses(): Promise<RoomAddress[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.ADDRESSES);
      if (!raw) {
        // Return default primary celebration address
        return [
          {
            id: 'addr_default_1',
            label: 'Home Celebration Address',
            recipientName: 'Celebration Host',
            phone: '+91 98765 43210',
            street: 'Kanti Factory Road, Kankarbagh',
            city: 'Patna, Bihar',
            pincode: '800026',
            isDefault: true,
          },
        ];
      }
      return JSON.parse(raw);
    } catch (e) {
      console.warn('RoomDatabase.getAddresses error:', e);
      return [];
    }
  },

  async saveAddress(addr: Omit<RoomAddress, 'id'> & { id?: string }): Promise<RoomAddress> {
    try {
      const current = await this.getAddresses();
      const newAddr: RoomAddress = {
        id: addr.id || `addr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        label: addr.label.trim(),
        recipientName: addr.recipientName.trim(),
        phone: addr.phone.trim(),
        street: addr.street.trim(),
        city: addr.city.trim(),
        pincode: addr.pincode.trim(),
        isDefault: addr.isDefault ?? (current.length === 0),
      };

      let updated = current.filter((a) => a.id !== newAddr.id);
      if (newAddr.isDefault) {
        updated = updated.map((a) => ({ ...a, isDefault: false }));
      }
      updated.unshift(newAddr);
      await AsyncStorage.setItem(STORAGE_KEYS.ADDRESSES, JSON.stringify(updated));
      return newAddr;
    } catch (e) {
      console.warn('RoomDatabase.saveAddress error:', e);
      return {
        id: `addr_${Date.now()}`,
        ...addr,
      };
    }
  },

  async deleteAddress(id: string): Promise<void> {
    try {
      const current = await this.getAddresses();
      const updated = current.filter((a) => a.id !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.ADDRESSES, JSON.stringify(updated));
    } catch (e) {
      console.warn('RoomDatabase.deleteAddress error:', e);
    }
  },

  async setDefaultAddress(id: string): Promise<void> {
    try {
      const current = await this.getAddresses();
      const updated = current.map((a) => ({
        ...a,
        isDefault: a.id === id,
      }));
      await AsyncStorage.setItem(STORAGE_KEYS.ADDRESSES, JSON.stringify(updated));
    } catch (e) {
      console.warn('RoomDatabase.setDefaultAddress error:', e);
    }
  }
};

export default RoomDatabase;
