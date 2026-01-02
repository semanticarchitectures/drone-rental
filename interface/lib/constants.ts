/**
 * Application constants
 */

// Earth's radius in meters (for distance calculations)
export const EARTH_RADIUS_METERS = 6371000;

// Maximum coverage areas per provider
export const MAX_COVERAGE_AREAS = 3;

// Default pagination limits
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Default map center (New York City)
export const DEFAULT_MAP_CENTER: [number, number] = [40.7128, -74.0060];

// Default coverage radius in meters (5km)
export const DEFAULT_COVERAGE_RADIUS = 5000;

// Chain configuration
export const DEFAULT_CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN_ID 
  ? parseInt(process.env.NEXT_PUBLIC_CHAIN_ID) 
  : 31337; // Anvil default

// Rating constants
export const MIN_RATING = 1;
export const MAX_RATING = 5;

// Timeline constants (in days)
export const MIN_TIMELINE_DAYS = 1;
export const MAX_TIMELINE_DAYS = 365;


