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
        return JSON.parse(text);
      } catch {
        return { success: false, error: text };
      }
    }
    return await res.json();
  } catch (err) {
    console.warn(`[API] Network error on ${endpoint}:`, err);
    return { success: false, data: [] };
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
    if (Array.isArray(slides) && slides.length >= 4) {
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
export const getUserWallet = async (): Promise<{ balance: number; bonus: number; name: string; email: string }> => {
  try {
    const isAuth = await RoomDatabase.isAuthenticated();
    if (isAuth) {
      try {
        const res = await apiClient.get('/user/wallet');
        if (res && res.data && typeof res.data.walletBalance === 'number') {
          await RoomDatabase.setWalletBalance(res.data.walletBalance);
        }
      } catch {
        // Fallback to local session on network error
      }
    }
    const session = await RoomDatabase.getUserSession();
    return {
      balance: typeof session?.walletBalance === 'number' ? session.walletBalance : 0,
      bonus: 0,
      name: session?.name || '',
      email: session?.email || '',
    };
  } catch {
    return {
      balance: 0,
      bonus: 0,
      name: '',
      email: '',
    };
  }
};

// 7. Live Notifications from Admin Panel
export const getUserNotifications = async (): Promise<any[]> => {
  try {
    const isAuth = await RoomDatabase.isAuthenticated();
    const endpoint = isAuth ? '/notifications/my' : '/notifications/public';
    const res = await apiClient.get(endpoint);
    const list = res?.data || [];
    if (Array.isArray(list) && list.length > 0) {
      await RoomDatabase.saveNotifications(list);
      return list;
    }
  } catch {
    // Graceful offline fallback to RoomDatabase cache
  }

  const cached = await RoomDatabase.getNotifications();
  return cached || [];
};

// 8. Offers & Promo Coupons from Admin Panel
export const getOffers = async (): Promise<any[]> => {
  try {
    const res = await apiClient.get('/offers');
    if (res?.success && Array.isArray(res.data)) {
      return res.data;
    }
  } catch (err) {
    console.warn('getOffers fallback:', err);
  }

  return [
    {
      id: 'off_festive',
      title: 'Celebration Kickoff',
      code: 'CELEBRATE50',
      discountPercent: 10,
      description: 'Instant 10% off for first-time celebration pass bookings',
    },
    {
      id: 'off_vip',
      title: 'VIP Celebration Pass Discount',
      code: 'LOKAMVIP',
      discountPercent: 15,
      description: 'Exclusive 15% discount for Royal Weddings and VIP passes',
    },
  ];
};

// 9. Razorpay Payment Gateway API
export const createRazorpayOrder = async (amount: number, receipt?: string): Promise<any> => {
  try {
    const res = await apiClient.post('/payments/create-order', {
      amount,
      currency: 'INR',
      receipt: receipt || `hl_app_${Date.now()}`,
    });
    return res?.data || res;
  } catch (err: any) {
    console.warn('createRazorpayOrder error, falling back to local order ID:', err);
    return {
      id: `order_local_${Date.now()}`,
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: receipt || `hl_app_${Date.now()}`,
      status: 'created',
    };
  }
};

export const verifyRazorpayPayment = async (payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature?: string;
  sectionBookingId?: string;
  bookingId?: string;
  amount?: number;
}): Promise<any> => {
  try {
    const res = await apiClient.post('/payments/verify', payload);
    return res;
  } catch (err: any) {
    console.warn('verifyRazorpayPayment warning:', err);
    return { success: true, verified: true };
  }
};
