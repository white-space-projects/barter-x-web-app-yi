/**
 * IP-based geolocation utility
 * Uses free IP geolocation APIs to detect user's city and country
 * Works for all 197 countries, maps to supported regions
 */

import { findClosestCountry, isCountryCodeSupported, getCountryByCode } from "./countries-data";

export type GeoLocation = {
  city: string;
  country: string;
  countryCode: string;
  isSupported: boolean; // Whether the country is in our supported list
};

// Cache the location to avoid repeated API calls
let cachedLocation: GeoLocation | null = null;

/**
 * Detects user's location based on their IP address
 * Uses multiple free IP geolocation APIs with fallbacks
 * Works for any of the 197 countries worldwide
 */
export async function detectLocationFromIP(): Promise<GeoLocation | null> {
  // Return cached location if available
  if (cachedLocation) {
    return cachedLocation;
  }

  let rawCity = "";
  let rawCountry = "";
  let rawCountryCode = "";

  // Try multiple APIs for best accuracy
  const apis = [
    // Primary: ip-api.com (free, reliable, works globally)
    async () => {
      const response = await fetch("http://ip-api.com/json/?fields=city,country,countryCode", {
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.city && data.country) {
          return { city: data.city, country: data.country, countryCode: data.countryCode };
        }
      }
      return null;
    },
    // Fallback 1: ipapi.co (free tier: 1000 requests/day)
    async () => {
      const response = await fetch("https://ipapi.co/json/", {
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.city && data.country_name) {
          return { city: data.city, country: data.country_name, countryCode: data.country_code };
        }
      }
      return null;
    },
    // Fallback 2: ipinfo.io (free tier: 50000 requests/month)
    async () => {
      const response = await fetch("https://ipinfo.io/json", {
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.city && data.country) {
          // ipinfo returns country code, need to map to name
          return { city: data.city, country: data.country, countryCode: data.country };
        }
      }
      return null;
    },
  ];

  for (const api of apis) {
    try {
      const result = await api();
      if (result) {
        rawCity = result.city;
        rawCountry = result.country;
        rawCountryCode = result.countryCode;
        break;
      }
    } catch {
      // Try next API
    }
  }

  if (!rawCity && !rawCountry) {
    return null;
  }

  // Check if the detected country is in our supported list
  const isSupported = isCountryCodeSupported(rawCountryCode);
  
  // Try to find the closest matching supported country
  let finalCountry = rawCountry;
  let finalCountryCode = rawCountryCode;
  
  if (isSupported) {
    // Get the standardized country name from our data
    const countryData = getCountryByCode(rawCountryCode);
    if (countryData) {
      finalCountry = countryData.name;
      finalCountryCode = countryData.code;
    }
  } else {
    // Country not supported, try to find closest match
    const closestMatch = findClosestCountry(rawCountry);
    if (closestMatch) {
      finalCountry = closestMatch.name;
      finalCountryCode = closestMatch.code;
    }
  }

  cachedLocation = {
    city: rawCity,
    country: finalCountry,
    countryCode: finalCountryCode,
    isSupported: isCountryCodeSupported(finalCountryCode),
  };

  return cachedLocation;
}

/**
 * Checks if the current device is an Apple device (iOS, iPadOS, macOS)
 */
export function isAppleDevice(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }

  const userAgent = navigator.userAgent.toLowerCase();
  const platform = (navigator.platform || "").toLowerCase();
  
  // Check for iOS devices
  const isIOS = /iphone|ipad|ipod/.test(userAgent) || 
    (platform === "macintel" && navigator.maxTouchPoints > 1); // iPad with iPadOS
  
  // Check for macOS
  const isMac = platform.includes("mac") || /macintosh|mac os x/.test(userAgent);
  
  return isIOS || isMac;
}

/**
 * Clear cached location (useful for testing or when user changes location)
 */
export function clearLocationCache() {
  cachedLocation = null;
}
