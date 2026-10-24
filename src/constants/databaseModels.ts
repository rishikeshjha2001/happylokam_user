/**
 * Master Database Models & Seed Data for HappyLokam Celebration OS
 * Corresponds 1-to-1 with PostgreSQL database tables:
 * - HeroSlide (Hero Banners)
 * - Venue (Premium Venues)
 * - UpcomingEvent (Celebration Packages & Gate Passes)
 * - LokSafariPackage (Curated Expeditions)
 */

export interface DbHeroSlide {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  badge: string;
  gradient: string;
  ctaText?: string;
  ctaLink?: string;
}

export interface DbVenue {
  id: string;
  title: string;
  name?: string;
  location: string;
  price: string;
  rating: number;
  reviews?: number;
  image: string;
  type: string;
  city?: string;
  amenities?: string[];
}

export interface DbPackage {
  id: string;
  title: string;
  tags: string[];
  price: string;
  rating: number;
  image: string;
  type: string;
  location?: string;
  time?: string;
  availableDates?: string;
  ticketTiers?: Record<string, number>;
}

export interface DbLokSafariItem {
  id: string;
  title: string;
  duration: string;
  price: string;
  difficulty: 'Easy' | 'Moderate' | 'Challenging' | 'Hard';
  rating: number;
  highlights: string[];
  image: string;
  type: string;
  location?: string;
}

export interface DbCategory {
  id: string;
  title: string;
  type: string;
  count: string;
  image: string;
  size: 'large' | 'small';
}

// 1. Hero Slides (Synchronized with HeroSlide table)
export const DB_HERO_SLIDES: DbHeroSlide[] = [
  {
    id: 'hero_vedic_vivah',
    title: 'Traditional Vedic Vivah & Sacred Mandaps',
    subtitle: 'Certified Vedic Pandits, Sacred Havan & Bespoke Mandaps',
    image: 'hero_vedic_vivah',
    badge: 'ROYAL VEDIC CELEBRATION',
    gradient: 'from-amber-600 to-rose-700',
    ctaText: 'Explore Weddings',
    ctaLink: '/(tabs)/explore?category=Weddings',
  },
  {
    id: 'hero_corporate_events',
    title: 'The Secret Behind Memorable Corporate Events',
    subtitle: 'Executive Summits, Luxury Banquets & 5-Star Gourmet Buffets',
    image: 'hero_corporate_events',
    badge: 'EXECUTIVE GATHERINGS',
    gradient: 'from-slate-900 to-amber-900',
    ctaText: 'Discover Packages',
    ctaLink: '/(tabs)/explore?category=Packages',
  },
  {
    id: 'hero_birthday_throne',
    title: 'Grand Royal Birthday & Fiesta Themes',
    subtitle: 'Golden Royal Thrones, Balloon Arches & Live Magicians',
    image: 'hero_birthday_throne',
    badge: 'ROYAL BIRTHDAYS',
    gradient: 'from-pink-600 to-purple-800',
    ctaText: 'Book Birthday Theme',
    ctaLink: '/(tabs)/explore?category=Birthdays',
  },
  {
    id: 'hero_wedding_rings',
    title: 'Luxury Destination Weddings & Lakeside Palaces',
    subtitle: 'Sunset Lake Views, 200+ Valet Parking & Grand Entries',
    image: 'hero_wedding_rings',
    badge: 'DESTINATION PALACES',
    gradient: 'from-rose-500 to-amber-700',
    ctaText: 'View Palaces',
    ctaLink: '/(tabs)/explore?category=Weddings',
  },
];

// 2. Premium Venues (Synchronized with Venue & PartnerService tables)
export const DB_VENUES: DbVenue[] = [];

// 3. Curated Packages & Events (Synchronized with UpcomingEvent table)
export const DB_PACKAGES: DbPackage[] = [];

// 4. LokSafari Curated Expeditions (Synchronized with LokSafariPackage table)
export const DB_LOKSAFARI_ITEMS: DbLokSafariItem[] = [];

// 5. Explore Categories Grid (Synchronized with Categories in Database & Curated Celebration Themes)
export const DB_CATEGORIES: DbCategory[] = [
  {
    id: 'cat_weddings',
    title: 'Weddings',
    type: 'Weddings',
    count: '',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
    size: 'large',
  },
  {
    id: 'cat_wedding_themes',
    title: 'Wedding Themes',
    type: 'Wedding Themes',
    count: '',
    image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=800&q=80',
    size: 'large',
  },
  {
    id: 'cat_wedding_offers',
    title: 'Wedding Offers',
    type: 'Wedding Offers',
    count: '',
    image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80',
    size: 'small',
  },
  {
    id: 'cat_birthday_themes',
    title: 'Birthday Themes',
    type: 'Birthday Themes',
    count: '',
    image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=800&q=80',
    size: 'small',
  },
  {
    id: 'cat_birthdays',
    title: 'Birthdays',
    type: 'Birthdays',
    count: '',
    image: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=800&q=80',
    size: 'small',
  },
  {
    id: 'cat_catering',
    title: 'Catering',
    type: 'Catering',
    count: '',
    image: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=80',
    size: 'large',
  },
  {
    id: 'cat_baby_shower',
    title: 'Baby Shower',
    type: 'Baby Shower',
    count: '',
    image: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=800&q=80',
    size: 'small',
  },
  {
    id: 'cat_engagements',
    title: 'Engagements',
    type: 'Engagements',
    count: '',
    image: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=800&q=80',
    size: 'small',
  },
  {
    id: 'cat_office_events',
    title: 'Office Events',
    type: 'Office Events',
    count: '',
    image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
    size: 'large',
  },
  {
    id: 'cat_haldi_decor',
    title: 'Decor',
    type: 'Decor',
    count: '',
    image: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=800&q=80',
    size: 'small',
  },
  {
    id: 'cat_pandit',
    title: 'Pandit',
    type: 'Pandit',
    count: '',
    image: 'https://images.unsplash.com/photo-1604928141064-207cea6f571f?auto=format&fit=crop&w=800&q=80',
    size: 'small',
  },
  {
    id: 'cat_photography',
    title: 'Photography',
    type: 'Photography',
    count: '',
    image: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=800&q=80',
    size: 'small',
  },
  {
    id: 'cat_venues',
    title: 'Venues',
    type: 'Venues',
    count: '',
    image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80',
    size: 'large',
  },
  {
    id: 'cat_loksafari',
    title: 'LokSafari',
    type: 'LokSafari',
    count: '',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    size: 'small',
  },
];


