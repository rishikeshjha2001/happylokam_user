import RoomDatabase from './roomDatabase';
import {
  DB_HERO_SLIDES,
  DB_VENUES,
  DB_PACKAGES,
  DB_LOKSAFARI_ITEMS,
  DB_CATEGORIES,
  DbHeroSlide,
  DbVenue,
  DbPackage,
  DbLokSafariItem,
  DbCategory,
} from '../constants/databaseModels';

export const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'https://happylokam.com/api/v1').replace(/\/$/, '');

async function fetchWithAuth(endpoint: string, options: RequestInit = {}): Promise<any> {
  const session = await RoomDatabase.getUserSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (session?.token) {
    headers.Authorization = `Bearer ${session.token}`;
  }

  try {
    const res = await fetch(`${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`, {
      ...options,
      headers,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      try {
        const parsed = JSON.parse(text);
        return { success: false, error: parsed.error || parsed.message || 'Request failed', ...parsed };
      } catch {
        return { success: false, error: text || `HTTP ${res.status} error` };
      }
    }
    return await res.json();
  } catch (err: any) {
    console.warn(`[API] Network error on ${endpoint}:`, err);
    return { success: false, error: err?.message || 'Network error. Please check your connection.', data: [] };
  }
}

export const apiClient = {
  get: (endpoint: string) => fetchWithAuth(endpoint, { method: 'GET' }),
  post: (endpoint: string, body: any) => fetchWithAuth(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint: string, body: any) => fetchWithAuth(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint: string) => fetchWithAuth(endpoint, { method: 'DELETE' }),
};

// 1. Fetch Hero Slides from Database
export const getHeroSlides = async (): Promise<DbHeroSlide[]> => {
  try {
    const data = await apiClient.get('/hero-slides');
    const slides = data?.data || data?.slides || [];
    if (Array.isArray(slides) && slides.length > 0) {
      return slides.map((s: any, idx: number) => ({
        id: s.id || `hero-${idx}`,
        title: s.title1 ? `${s.title1} ${s.title2 || ''}`.trim() : (s.title || 'Celebration Offer'),
        subtitle: s.desc || s.subtitle || 'Exclusive deals on grand celebrations',
        image: s.image || 'hero_vedic_vivah',
        badge: s.badge || 'Featured',
        gradient: s.gradient ? `from-${s.gradient}` : 'from-rose-500',
        ctaText: s.ctaText,
        ctaLink: s.ctaLink,
      }));
    }
    return DB_HERO_SLIDES;
  } catch (error) {
    console.warn('getHeroSlides error, returning curated celebration slides:', error);
    return DB_HERO_SLIDES;
  }
};

// 2. Fetch Venues from Database
export const getVenues = async (category = 'All'): Promise<DbVenue[]> => {
  try {
    const endpoint = category === 'All' ? '/listings' : `/listings?category=${encodeURIComponent(category)}`;
    const data = await apiClient.get(endpoint);
    const list = data?.data || data?.listings || data?.venues || [];
    if (Array.isArray(list) && list.length > 0) {
      return list.map((item: any, idx: number) => ({
        id: item.id || `venue-${idx}`,
        title: item.title || item.name || 'Premium Listing',
        name: item.name || item.title || 'Premium Listing',
        location: item.location || item.city || 'India',
        price: typeof item.price === 'number' ? `₹${item.price.toLocaleString('en-IN')}` : (item.price || 'Contact for price'),
        rating: item.rating || 4.9,
        reviews: item.reviews || 120,
        image: Array.isArray(item.images) && item.images[0]?.startsWith('http')
          ? item.images[0]
          : (typeof item.imageUrl === 'string' && item.imageUrl.startsWith('http') ? item.imageUrl : 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80'),
        type: item.type || item.category || 'Venue',
        city: item.city || 'India',
        amenities: item.features || [],
      }));
    }
    return [];
  } catch (error) {
    console.warn('getVenues error:', error);
    return [];
  }
};

// 3. Fetch Packages & Celebration Passes from Database
export const getPackages = async (): Promise<DbPackage[]> => {
  try {
    const data = await apiClient.get('/events');
    const events = data?.data || data?.events || [];
    if (Array.isArray(events) && events.length > 0) {
      return events.map((ev: any, idx: number) => ({
        id: ev.id || `pkg-${idx}`,
        title: ev.title || 'Celebration Pass',
        tags: Array.isArray(ev.features) && ev.features.length > 0 ? ev.features.slice(0, 3) : [],
        price: typeof ev.price === 'number' ? `₹${ev.price.toLocaleString('en-IN')}` : (ev.price || '₹499'),
        rating: ev.rating || 4.9,
        image: ev.imageUrl && ev.imageUrl.startsWith('http') ? ev.imageUrl : 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
        type: ev.category || 'Celebration Pass',
        location: ev.location,
        time: ev.time || '6:00 PM – 11:30 PM',
        availableDates: ev.availableDates || 'Active Season',
        ticketTiers: ev.ticketTiers,
      }));
    }
    return [];
  } catch (error) {
    console.warn('getPackages error:', error);
    return [];
  }
};

// 4. Fetch LokSafari Expeditions from Database
export const getLoksafari = async (): Promise<DbLokSafariItem[]> => {
  try {
    const data: any = await apiClient.get('/loksafari');
    const list = data?.data || data?.packages || data?.loksafaris || [];
    if (Array.isArray(list) && list.length > 0) {
      return list.map((pkg: any, idx: number) => ({
        id: pkg.id || `safari-${idx}`,
        title: pkg.title || 'LokSafari Tour',
        duration: pkg.duration || 'Full Day',
        price: typeof pkg.price === 'number' ? `₹${pkg.price.toLocaleString('en-IN')}` : (pkg.price || '₹1,499'),
        difficulty: (pkg.difficulty || 'Moderate') as any,
        rating: pkg.rating || 4.9,
        highlights: Array.isArray(pkg.highlights) ? pkg.highlights : [],
        image: pkg.imageUrl && pkg.imageUrl.startsWith('http') ? pkg.imageUrl : 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
        type: pkg.type || 'Eco Expedition',
        location: pkg.location,
      }));
    }
    return [];
  } catch (error) {
    console.warn('getLoksafari error:', error);
    return [];
  }
};

// 5. Categories
export const getCategories = async (): Promise<DbCategory[]> => {
  try {
    const data = await apiClient.get('/categories');
    const list = data?.data || [];
    if (Array.isArray(list) && list.length > 0) {
      const serverCats: DbCategory[] = list.map((c: any) => ({
        id: c.id,
        type: c.name,
        title: c.name,
        count: `${c.items?.length || 0} Options`,
        image: c.image || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
        size: 'large' as const,
      }));
      // Merge with default categories to make sure all celebration types are available
      const merged = [...serverCats];
      DB_CATEGORIES.forEach((defCat) => {
        if (!merged.some((m) => m.type.toLowerCase() === defCat.type.toLowerCase())) {
          merged.push(defCat);
        }
      });
      return merged;
    }
    return DB_CATEGORIES;
  } catch {
    return DB_CATEGORIES;
  }
};

// 6. User Profile & Wallet from Database
export const getUserWallet = async (): Promise<{ balance: number; walletBalance: number; bonus: number; name: string; email: string }> => {
  try {
    const isAuth = await RoomDatabase.isAuthenticated();
    if (isAuth) {
      try {
        const res = await apiClient.get('/user/wallet');
        if (res?.success && res.data && typeof res.data.walletBalance === 'number') {
          const bal = Number(res.data.walletBalance);
          await RoomDatabase.setWalletBalance(bal);
          const session = await RoomDatabase.getUserSession();
          return {
            balance: bal,
            walletBalance: bal,
            bonus: 0,
            name: session?.name || '',
            email: session?.email || '',
          };
        }
      } catch (err) {
        console.warn('getUserWallet server error:', err);
      }
    }
    const session = await RoomDatabase.getUserSession();
    const localBal = typeof session?.walletBalance === 'number' ? session.walletBalance : 0;
    return {
      balance: localBal,
      walletBalance: localBal,
      bonus: 0,
      name: session?.name || '',
      email: session?.email || '',
    };
  } catch {
    return {
      balance: 0,
      walletBalance: 0,
      bonus: 0,
      name: '',
      email: '',
    };
  }
};

// 6b. Get User Profile from Backend Server
export const getUserProfile = async (): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const isAuth = await RoomDatabase.isAuthenticated();
    if (!isAuth) return { success: false, error: 'Not authenticated' };
    const res = await apiClient.get('/user/profile');
    if (res?.success && res.data) {
      return { success: true, data: res.data };
    }
    return { success: false, error: res?.error || 'Failed to fetch user profile' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error fetching user profile' };
  }
};

// 6c. Update User Profile on Backend Server
export const updateUserProfile = async (profileData: {
  name?: string;
  phone?: string;
  gender?: string;
  profileImage?: string;
}): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const isAuth = await RoomDatabase.isAuthenticated();
    if (!isAuth) return { success: false, error: 'Not authenticated' };
    const res = await apiClient.put('/user/profile', profileData);
    if (res?.success && res.data) {
      return { success: true, data: res.data };
    }
    return { success: false, error: res?.error || 'Failed to update profile' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error updating user profile' };
  }
};

// 7. Live Notifications from Admin Panel
export const getUserNotifications = async (): Promise<any[]> => {
  try {
    const isAuth = await RoomDatabase.isAuthenticated();
    const endpoint = isAuth ? '/notifications/my' : '/notifications/public';
    const res = await apiClient.get(endpoint);
    const rawList = res?.data || [];
    if (Array.isArray(rawList)) {
      const list = rawList.map((item: any) => ({
        id: item.id || item.notificationId || String(Math.random()),
        title: item.title || item.notification?.title || 'Happy Lokam Notification',
        message: item.message || item.notification?.message || '',
        type: item.type || item.notification?.type || 'IN_APP',
        isRead: item.isRead ?? false,
        sentAt: item.sentAt || item.createdAt || item.notification?.createdAt || new Date().toISOString(),
      }));
      await RoomDatabase.saveNotifications(list);
      return list;
    }
  } catch (e) {
    console.warn('getUserNotifications error:', e);
  }

  const cached = await RoomDatabase.getNotifications();
  return cached || [];
};

// 7c. Change User Password
export const changeUserPassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    const res = await apiClient.post('/user/change-password', { currentPassword, newPassword });
    return res;
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to change password' };
  }
};

// 7d. Reset User Password (via phone or email)
export const resetUserPassword = async (phoneOrEmail: string, newPassword: string): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    const res = await apiClient.post('/auth/reset-password', { phoneOrEmail, newPassword });
    return res;
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to reset password' };
  }
};

// 8. Offers & Promo Coupons from Admin Panel
export const getOffers = async (): Promise<any[]> => {
  try {
    const res = await apiClient.get('/offers');
    if (res?.success && Array.isArray(res.data)) {
      return res.data;
    }
  } catch (err) {
    console.warn('getOffers error:', err);
  }

  return [];
};

// 9. Razorpay Payment Gateway API
export const createRazorpayOrder = async (
  amount: number,
  receipt?: string,
  options?: {
    bookingId?: string;
    sectionBookingId?: string;
    eventBookingId?: string;
    purpose?: string;
  }
): Promise<any> => {
  try {
    const res = await apiClient.post('/payments/create-order', {
      amount,
      currency: 'INR',
      receipt: receipt || `hl_app_${Date.now()}`,
      ...(options || {}),
    });
    const order = res?.data || res;
    if (!res?.success || !order?.id) throw new Error(res?.error || 'Unable to create secure payment order');
    return order;
  } catch (err: any) {
    console.warn('createRazorpayOrder error:', err);
    throw err;
  }
};

export const verifyRazorpayPayment = async (payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature?: string;
  sectionBookingId?: string;
  bookingId?: string;
  amount?: number;
  isWalletTopUp?: boolean;
  purpose?: string;
}): Promise<any> => {
  try {
    const res = await apiClient.post('/payments/verify', payload);
    if (!res?.success) throw new Error(res?.error || 'Payment verification failed');
    return res;
  } catch (err: any) {
    console.warn('verifyRazorpayPayment warning:', err);
    throw err;
  }
};
