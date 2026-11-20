/**
 * Authentic GPS Haversine Distance & Google Maps Navigation Engine
 * Zero fake data: Strictly calculates exact physical distances using Earth's curvature.
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Calculates the great-circle distance between two GPS coordinates using the Haversine formula.
 * @param lat1 Latitude of point 1 in degrees
 * @param lon1 Longitude of point 1 in degrees
 * @param lat2 Latitude of point 2 in degrees
 * @param lon2 Longitude of point 2 in degrees
 * @returns Distance in kilometers, rounded to 1 decimal place
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (
    typeof lat1 !== 'number' ||
    typeof lon1 !== 'number' ||
    typeof lat2 !== 'number' ||
    typeof lon2 !== 'number' ||
    isNaN(lat1) ||
    isNaN(lon1) ||
    isNaN(lat2) ||
    isNaN(lon2)
  ) {
    return Infinity;
  }

  const R = 6371; // Earth's mean radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10;
}

/**
 * Formats a distance in kilometers into a friendly human-readable badge.
 * Examples: "850 m away", "2.4 km away".
 */
export function formatDistance(distKm: number): string {
  if (!isFinite(distKm) || distKm < 0) return '';
  if (distKm < 1) {
    const meters = Math.round(distKm * 1000);
    return `${meters} m away`;
  }
  return `${distKm.toFixed(1)} km away`;
}

/**
 * Generates the optimal Google Maps navigation link with coordinates or fallback query.
 */
export function getGoogleMapsNavigationUrl(dest: {
  latitude?: number;
  longitude?: number;
  address?: string;
  title?: string;
  mapUrl?: string;
}): string {
  if (dest.mapUrl && dest.mapUrl.trim().length > 0) {
    return dest.mapUrl.trim();
  }

  if (
    typeof dest.latitude === 'number' &&
    typeof dest.longitude === 'number' &&
    !isNaN(dest.latitude) &&
    !isNaN(dest.longitude)
  ) {
    return `https://www.google.com/maps/dir/?api=1&destination=${dest.latitude},${dest.longitude}`;
  }

  const fallbackQuery = [dest.title, dest.address].filter(Boolean).join(', ') || 'India';
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fallbackQuery)}`;
}
