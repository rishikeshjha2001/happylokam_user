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
export const DB_HERO_SLIDES: DbHeroSlide[] = [];

// 2. Premium Venues (Synchronized with Venue & PartnerService tables)
export const DB_VENUES: DbVenue[] = [];

// 3. Curated Packages & Events (Synchronized with UpcomingEvent table)
export const DB_PACKAGES: DbPackage[] = [];

// 4. LokSafari Curated Expeditions (Synchronized with LokSafariPackage table)
export const DB_LOKSAFARI_ITEMS: DbLokSafariItem[] = [];

// 5. Explore Categories Grid (Synchronized with Categories in Database)
export const DB_CATEGORIES: DbCategory[] = [];

