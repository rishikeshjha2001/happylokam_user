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
    id: 'hero_birthday_party',
    title: 'Happy Birthday Grand Celebrations',
    subtitle: 'Confetti, live themes, gourmet cakes & unforgettable fun',
    image: 'https://api.happylokam.com/uploads/birthday_hero.jpg',
    badge: 'Happylokam Special',
    gradient: 'from-amber-500 to-rose-600',
    ctaText: 'Explore Birthday Themes',
    ctaLink: '/explore?category=Birthday Themes',
  },
  {
    id: 'hero_wedding_varmala',
    title: 'Royal Indian Wedding Varmala',
    subtitle: 'Palace decor, grand rose-petal shower & cinematic mandaps',
    image: 'https://api.happylokam.com/uploads/wedding_hero.jpg',
    badge: 'Royal Vivah',
    gradient: 'from-rose-600 to-red-800',
    ctaText: 'Explore Wedding Themes',
    ctaLink: '/explore?category=Wedding Themes',
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
    count: '120+ Venues & Sets',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
    size: 'large',
  },
  {
    id: 'cat_wedding_themes',
    title: 'Wedding Themes',
    type: 'Wedding Themes',
    count: '45+ Royal Mandaps',
    image: 'https://api.happylokam.com/uploads/wedding_hero.jpg',
    size: 'large',
  },
  {
    id: 'cat_wedding_offers',
    title: 'Wedding Offers',
    type: 'Wedding Offers',
    count: 'VIP Deals & Cashbacks',
    image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80',
    size: 'small',
  },
  {
    id: 'cat_birthday_themes',
    title: 'Birthday Themes',
    type: 'Birthday Themes',
    count: '60+ Party Setups',
    image: 'https://api.happylokam.com/uploads/birthday_hero.jpg',
    size: 'large',
  },
  {
    id: 'cat_birthdays',
    title: 'Birthdays',
    type: 'Birthdays',
    count: '80+ Packages',
    image: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=800&q=80',
    size: 'small',
  },
  {
    id: 'cat_catering',
    title: 'Catering',
    type: 'Catering',
    count: '35+ Pure Feasts',
    image: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=80',
    size: 'large',
  },
  {
    id: 'cat_baby_shower',
    title: 'Baby Shower',
    type: 'Baby Shower',
    count: '25+ Pastel Themes',
    image: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=800&q=80',
    size: 'small',
  },
  {
    id: 'cat_engagements',
    title: 'Engagements',
    type: 'Engagements',
    count: '40+ Roka Setups',
    image: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=800&q=80',
    size: 'small',
  },
  {
    id: 'cat_office_events',
    title: 'Office Events',
    type: 'Office Events',
    count: '30+ Corporate Galas',
    image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
    size: 'large',
  },
  {
    id: 'cat_haldi_decor',
    title: 'Decor',
    type: 'Decor',
    count: '55+ Marigold Stages',
    image: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=800&q=80',
    size: 'small',
  },
  {
    id: 'cat_pandit',
    title: 'Pandit',
    type: 'Pandit',
    count: '20+ Vedic Acharyas',
    image: 'https://images.unsplash.com/photo-1604928141064-207cea6f571f?auto=format&fit=crop&w=800&q=80',
    size: 'small',
  },
  {
    id: 'cat_photography',
    title: 'Photography',
    type: 'Photography',
    count: '50+ Drone Crews',
    image: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=800&q=80',
    size: 'small',
  },
  {
    id: 'cat_venues',
    title: 'Venues',
    type: 'Venues',
    count: '90+ Luxury Lawns',
    image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80',
    size: 'large',
  },
  {
    id: 'cat_loksafari',
    title: 'LokSafari',
    type: 'LokSafari',
    count: '15+ Curated Tours',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    size: 'small',
  },
];


