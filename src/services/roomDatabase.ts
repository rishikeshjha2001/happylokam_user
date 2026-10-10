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
  token: string;
  lastLogin: number;
}

const STORAGE_KEYS = {
  EVENTS: '@happylokam_room_events',
  VENUES: '@happylokam_room_venues',
  BOOKINGS: '@happylokam_room_bookings',
  USER: '@happylokam_room_user',
  TOKEN: 'token',
  LOCATION: '@happylokam_room_location',
};

export const RoomDatabase = {
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
  }
};

export default RoomDatabase;
