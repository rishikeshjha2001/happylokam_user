import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './api';
import RoomDatabase from './roomDatabase';

export interface AdminSectionItem {
  id: string;
  sectionId?: string;
  categoryId?: string;
  title: string;
  subtitle?: string;
  badge?: string;
  cornerTag?: string;
  tag?: string;
  location?: string;
  type?: string;
  itemType: 'TICKET' | 'BOOKING';
  price: number;
  priceUnit?: string;
  availableDates?: string[];
  availableTimes?: string[];
  features?: string[];
  totalSlots?: number;
  capacity?: number;
  bookedSlots?: number;
  rating: number;
  reviews?: number;
  image: string;
  tags?: string[];
  description?: string;
  section?: {
    id: string;
    title: string;
    subtitle?: string;
  };
  category?: {
    id: string;
    name: string;
    image: string;
  };
}

export interface AdminCustomSection {
  id: string;
  title: string;
  subtitle?: string;
  tag?: string;
  order?: number;
  createdAt: string;
  items: AdminSectionItem[];
}

export interface AdminCustomCategory {
  id: string;
  name: string;
  image: string;
  tag?: string;
  order?: number;
  createdAt: string;
  items: AdminSectionItem[];
}

const SECTIONS_STORAGE_KEY = '@happylokam_admin_custom_sections_v4';
const CATEGORIES_STORAGE_KEY = '@happylokam_admin_custom_categories_v4';

/**
 * Fetch Custom Sections from real backend API
 */
export async function getAdminCustomSections(): Promise<AdminCustomSection[]> {
  try {
    const res = await apiClient.get('/sections');
    if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
      await AsyncStorage.setItem(SECTIONS_STORAGE_KEY, JSON.stringify(res.data));
      return res.data;
    }
  } catch (err) {
    console.warn('[AdminSections] Backend fetch error, loading cache:', err);
  }

  try {
    const raw = await AsyncStorage.getItem(SECTIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}

  return [];
}

/**
 * Fetch Custom Categories from real backend API
 */
export async function getAdminCustomCategories(): Promise<AdminCustomCategory[]> {
  try {
    const res = await apiClient.get('/categories');
    if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
      await AsyncStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(res.data));
      return res.data;
    }
  } catch (err) {
    console.warn('[AdminCategories] Backend fetch error, loading cache:', err);
  }

  try {
    const raw = await AsyncStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}

  return [];
}

/**
 * Fetch single Item by ID with full detail specs
 */
export async function getAdminSectionItemById(itemId: string): Promise<AdminSectionItem | null> {
  try {
    const res = await apiClient.get(`/sections/items/${itemId}`);
    if (res?.success && res.data) {
      return res.data;
    }
  } catch (err) {
    console.warn('[AdminSections] Backend item fetch fallback to cache:', err);
  }

  const sections = await getAdminCustomSections();
  for (const s of sections) {
    const found = s.items?.find((i) => i.id === itemId);
    if (found) {
      return {
        ...found,
        section: { id: s.id, title: s.title, subtitle: s.subtitle },
      };
    }
  }

  const categories = await getAdminCustomCategories();
  for (const c of categories) {
    const found = c.items?.find((i) => i.id === itemId);
    if (found) {
      return {
        ...found,
        category: { id: c.id, name: c.name, image: c.image },
      };
    }
  }

  return null;
}

/**
 * Book an item with Date, Time, User details
 */
export async function bookSectionItem(
  itemId: string,
  payload: {
    bookingDate: string;
    bookingTime?: string;
    quantity?: number;
    userName: string;
    userPhone: string;
    userEmail?: string;
    notes?: string;
  }
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const res = await apiClient.post(`/sections/items/${itemId}/book`, payload);
    if (res?.success) {
      // Also save booking locally in RoomDatabase for offline/instant access
      try {
        await RoomDatabase.saveBooking({
          id: res.data?.id || `bkg_${Date.now()}`,
          venueId: itemId,
          venueName: res.data?.item?.title || 'Celebration Booking',
          date: payload.bookingDate,
          time: payload.bookingTime || 'Standard Slot',
          guests: payload.quantity || 1,
          totalPrice: res.data?.totalAmount || 0,
          status: 'CONFIRMED',
          createdAt: new Date().toISOString(),
          ticketCode: res.data?.ticketCode || 'HL-TCK-PASS',
          qrCode: res.data?.ticketCode || 'HL-TCK-PASS',
          image: res.data?.item?.image || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
          location: res.data?.item?.location || 'Patna, Bihar',
          guestName: payload.userName,
          guestPhone: payload.userPhone,
        });
      } catch (err) {
        console.warn('Failed to cache booking locally:', err);
      }
      return { success: true, data: res.data };
    }
    return { success: false, error: res?.error || 'Booking failed' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network request failed' };
  }
}
