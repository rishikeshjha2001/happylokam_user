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
    id: 'hero-1',
    title: 'Summer Wedding Fiesta',
    subtitle: 'Flat 20% off on premium venues',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
    badge: 'Featured',
    gradient: 'from-rose-900/80 to-rose-500/40',
  },
  {
    id: 'hero-2',
    title: 'Royal Heritage Retreats',
    subtitle: 'Experience grandeur like never before',
    image: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80',
    badge: 'Trending',
    gradient: 'from-indigo-900/80 to-indigo-500/40',
  },
  {
    id: 'hero-3',
    title: 'Epic Birthday Bashes',
    subtitle: 'All-inclusive packages starting ₹25k',
    image: 'https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?auto=format&fit=crop&w=1200&q=80',
    badge: 'Popular',
    gradient: 'from-purple-900/80 to-pink-500/40',
  },
  {
    id: 'hero-4',
    title: 'Navratri Dandiya Raas 2026',
    subtitle: 'Gyan Bhawan Grand Arena VIP Passes',
    image: 'https://images.unsplash.com/photo-1604928141064-207cea6f571f?auto=format&fit=crop&w=1200&q=80',
    badge: 'Fast Filling',
    gradient: 'from-rose-950/85 to-rose-600/45',
  },
];

// 2. Premium Venues (Synchronized with Venue & PartnerService tables)
export const DB_VENUES: DbVenue[] = [
  {
    id: 'v1',
    title: 'The Glasshouse Oasis',
    name: 'The Glasshouse Oasis',
    location: 'South Mumbai & Lawns',
    price: '₹1.2L',
    rating: 4.9,
    reviews: 124,
    image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=600&q=80',
    type: 'Premium Venue',
    city: 'Mumbai',
    amenities: ['AC Banquet', 'Valet Parking', 'Lush Green Lawn', 'Bridal Suite'],
  },
  {
    id: 'v2',
    title: 'Taj Aravali Resort & Lawns',
    name: 'Taj Aravali Resort & Lawns',
    location: 'Udaipur & Royal Greens',
    price: '₹3.5L',
    rating: 4.8,
    reviews: 89,
    image: 'https://images.unsplash.com/photo-1542314831-c6a4d14d837e?auto=format&fit=crop&w=600&q=80',
    type: 'Resort',
    city: 'Udaipur',
    amenities: ['Heritage Architecture', 'Lake View', '5-Star Catering', 'Infinity Pool'],
  },
  {
    id: 'v3',
    title: 'Azure Beach Club & Deck',
    name: 'Azure Beach Club & Deck',
    location: 'North Goa Beachfront',
    price: '₹85K',
    rating: 4.7,
    reviews: 210,
    image: 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&w=600&q=80',
    type: 'Beachfront',
    city: 'Goa',
    amenities: ['Sunset Deck', 'DJ Line Array', 'Seafood Grill', 'Private Cabanas'],
  },
  {
    id: 'v4',
    title: 'Rajwada Imperial Palace',
    name: 'Rajwada Imperial Palace',
    location: 'Patna Heritage Corridor',
    price: '₹1.5L',
    rating: 5.0,
    reviews: 156,
    image: 'https://images.unsplash.com/photo-1519167758481-83f5244d23d7?auto=format&fit=crop&w=600&q=80',
    type: 'Royal Palace',
    city: 'Patna',
    amenities: ['50,000 sq.ft Lawn', 'AC Bridal Suite', '300+ Parking', 'Royal Mandap'],
  },
];

// 3. Curated Packages & Events (Synchronized with UpcomingEvent table)
export const DB_PACKAGES: DbPackage[] = [
  {
    id: 'p1',
    title: 'Silver Anniversary Luxe',
    tags: ['Decor', 'Dinner', 'Music'],
    price: '₹45,000',
    rating: 5.0,
    image: 'https://images.unsplash.com/photo-1522413452208-99663e031df3?auto=format&fit=crop&w=600&q=80',
    type: 'All-Inclusive',
    location: 'Private Terrace Suites',
    time: '7:00 PM – 11:30 PM',
    availableDates: 'Fri – Sun Weekly',
    ticketTiers: { single: 45000, couple: 45000 },
  },
  {
    id: 'p2',
    title: 'Enchanted Forest Kids Carnival',
    tags: ['Magic Show', 'Cake', 'Games'],
    price: '₹25,000',
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1562762294-82559b951c51?auto=format&fit=crop&w=600&q=80',
    type: 'Theme Party',
    location: 'Crystal Celebration Banquets',
    time: '4:00 PM – 8:00 PM',
    availableDates: 'Daily Bookings',
    ticketTiers: { single: 25000 },
  },
  {
    id: 'p3',
    title: 'Grand Navratri Dandiya Mahotsav',
    tags: ['Live Band', 'Garba Raas', 'Food Court'],
    price: '₹499',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1604928141064-207cea6f571f?auto=format&fit=crop&w=600&q=80',
    type: 'Dandiya Pass',
    location: 'Gyan Bhawan, Gandhi Maidan, Patna',
    time: '6:00 PM – 11:30 PM',
    availableDates: '11 Oct – 18 Oct 2026',
    ticketTiers: { single: 499, couple: 899, family4: 1699 },
  },
  {
    id: 'p4',
    title: 'Neon Electro DJ Bash & Club Night',
    tags: ['Laser Show', 'Top 50 DJs', 'Stag/Couple'],
    price: '₹799',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80',
    type: 'DJ Night',
    location: 'Club Euphoria, Bailey Road, Patna',
    time: '8:00 PM – 2:00 AM',
    availableDates: 'Every Saturday',
    ticketTiers: { single: 799, couple: 1399 },
  },
];

// 4. LokSafari Curated Expeditions (Synchronized with LokSafariPackage table)
export const DB_LOKSAFARI_ITEMS: DbLokSafariItem[] = [
  {
    id: 's1',
    title: 'The Great Serengeti Migration',
    duration: '7 Days / 6 Nights',
    price: '₹1,45,000',
    difficulty: 'Moderate',
    rating: 4.9,
    highlights: ['Hot Air Balloon', 'Big 5 Sighting', 'Luxury Camp'],
    image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1000&q=80',
    type: 'Wildlife Safari',
    location: 'Serengeti National Park',
  },
  {
    id: 's2',
    title: 'Amazon Deep Jungle Expedition',
    duration: '5 Days / 4 Nights',
    price: '₹85,000',
    difficulty: 'Hard',
    rating: 4.8,
    highlights: ['River Cruise', 'Tribal Visit', 'Night Safari'],
    image: 'https://images.unsplash.com/photo-1518182170546-076616fd4625?auto=format&fit=crop&w=1000&q=80',
    type: 'Rainforest',
    location: 'Amazon Basin',
  },
  {
    id: 's3',
    title: 'Northern Lights Glass Igloo',
    duration: '4 Days / 3 Nights',
    price: '₹2,10,000',
    difficulty: 'Easy',
    rating: 5.0,
    highlights: ['Aurora Viewing', 'Husky Sledding', 'Thermal Spa'],
    image: 'https://images.unsplash.com/photo-1531366936337-775928d00c3c?auto=format&fit=crop&w=1000&q=80',
    type: 'Arctic Retreat',
    location: 'Lapland, Finland',
  },
  {
    id: 's4',
    title: 'Valmiki Tiger Reserve Jungle Safari',
    duration: '3 Days / 2 Nights',
    price: '₹8,499',
    difficulty: 'Moderate',
    rating: 4.9,
    highlights: ['Royal Bengal Tiger', 'Gandak Boating', 'Eco Treehouse Stay'],
    image: 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?auto=format&fit=crop&w=1000&q=80',
    type: 'Wildlife Safari',
    location: 'West Champaran, Bihar',
  },
  {
    id: 's5',
    title: 'Rajgir Glass Skywalk & Nalanda Ruins',
    duration: '2 Days / 1 Night',
    price: '₹1,999',
    difficulty: 'Easy',
    rating: 5.0,
    highlights: ['Glass Skywalk Access', 'Nalanda UNESCO Tour', 'Ropeway Stupa Ride'],
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80',
    type: 'Heritage Safari',
    location: 'Rajgir & Nalanda, Bihar',
  },
];

// 5. Explore Categories Grid (Synchronized with Categories in Database)
export const DB_CATEGORIES: DbCategory[] = [
  {
    id: 'c1',
    title: 'Luxury Venues',
    type: 'Venues',
    count: '1,200+ Options',
    image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=600&q=80',
    size: 'large',
  },
  {
    id: 'c2',
    title: 'Candid Photography',
    type: 'Photography',
    count: '450+ Artists',
    image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=600&q=80',
    size: 'small',
  },
  {
    id: 'c3',
    title: 'Theme Decorators',
    type: 'Decor',
    count: '320+ Stylists',
    image: 'https://images.unsplash.com/photo-1530103862676-de8892b12fa7?auto=format&fit=crop&w=600&q=80',
    size: 'small',
  },
  {
    id: 'c4',
    title: 'Gourmet Catering',
    type: 'Catering',
    count: '150+ Menus',
    image: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=600&q=80',
    size: 'large',
  },
  {
    id: 'c5',
    title: 'Live Entertainment',
    type: 'Entertainment',
    count: '200+ Bands',
    image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=600&q=80',
    size: 'small',
  },
  {
    id: 'c6',
    title: 'Bridal Makeup',
    type: 'Makeup',
    count: '500+ Artists',
    image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=600&q=80',
    size: 'small',
  },
];
