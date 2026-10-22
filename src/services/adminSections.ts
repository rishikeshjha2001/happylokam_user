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
          title: res.data?.item?.title || 'Celebration Booking',
          category: res.data?.item?.itemType || 'Custom Section',
          date: payload.bookingDate,
          amount: res.data?.totalAmount || 0,
          status: 'CONFIRMED',
          ticketsCount: payload.quantity || 1,
          createdAt: new Date().toISOString(),
          qrCode: res.data?.ticketCode || 'HL-TCK-PASS',
          serverVerified: true,
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

export const PRESET_CELEBRATION_IMAGES = [
  { label: 'Mandap', title: 'Mandap', url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Heritage', title: 'Heritage', url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Glasshouse', title: 'Glasshouse', url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80' },
  { label: 'Birthday', title: 'Birthday', url: 'https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Dandiya', title: 'Dandiya', url: 'https://images.unsplash.com/photo-1604928141064-207cea6f571f?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Suites', title: 'Suites', url: 'https://images.unsplash.com/photo-1522413452208-99663e031df3?auto=format&fit=crop&w=800&q=80' },
];

export async function saveAdminCustomSection(section: AdminCustomSection): Promise<AdminCustomSection[]> {
  try {
    await apiClient.post('/sections', section);
  } catch (err) {
    console.warn('saveAdminCustomSection backend error:', err);
  }
  const current = await getAdminCustomSections();
  const existingIdx = current.findIndex((s) => s.id === section.id);
  let updated: AdminCustomSection[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = section;
  } else {
    updated = [section, ...current];
  }
  await AsyncStorage.setItem(SECTIONS_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export async function deleteAdminCustomSection(sectionId: string): Promise<AdminCustomSection[]> {
  try {
    await apiClient.delete(`/sections/${sectionId}`);
  } catch (err) {
    console.warn('deleteAdminCustomSection backend error:', err);
  }
  const current = await getAdminCustomSections();
  const updated = current.filter((s) => s.id !== sectionId);
  await AsyncStorage.setItem(SECTIONS_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export async function deleteAdminSectionItem(sectionId: string, itemId: string): Promise<AdminCustomSection[]> {
  try {
    await apiClient.delete(`/sections/items/${itemId}`);
  } catch (err) {
    console.warn('deleteAdminSectionItem backend error:', err);
  }
  const current = await getAdminCustomSections();
  const updated = current.map((s) => {
    if (s.id === sectionId) {
      return { ...s, items: (s.items || []).filter((i) => i.id !== itemId) };
    }
    return s;
  });
  await AsyncStorage.setItem(SECTIONS_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

