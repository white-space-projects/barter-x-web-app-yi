/**
 * API Service Layer
 * =================
 * This file contains all API endpoint definitions and service functions.
 * Backend developers: Replace the mock implementations with actual API calls.
 * 
 * Base URL: Configure via environment variable NEXT_PUBLIC_API_BASE_URL
 */

// ---------------------------------------------------------------------------
// CONFIGURATION
// ---------------------------------------------------------------------------

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

// ---------------------------------------------------------------------------
// 1. AUTH ENDPOINTS (7 endpoints)
// ---------------------------------------------------------------------------

export interface GoogleAuthRequest {
  access_token?: string;
  device_id: string;
  expires_in?: number;
  id_token: string;
  refresh_token_expires_in?: number;
  region: string;
  scope?: string;
  token_type?: string;
  [property: string]: unknown;
}

export interface GoogleAuthResponse {
  user: {
    userId: string;
    name?: string;
    email: string;
    isAdmin?: boolean;
  };
  accessToken: string;
  refreshToken?: string;
}

export interface OtpSendRequest {
  email: string;
  deviceId?: string;
}

export interface OtpSendResponse {
  success: boolean;
  message: string;
  expiresIn?: number; // seconds until OTP expires
}

export interface OtpVerifyRequest {
  email: string;
  otp: string;
  deviceId?: string;
}

export interface OtpVerifyResponse {
  user: {
    userId: string;
    name?: string;
    email: string;
    isAdmin?: boolean;
    isProfileComplete?: boolean;
  };
  accessToken: string;
  refreshToken?: string;
}

export interface UserResponse {
  userId: string;
  name?: string;
  email: string;
  isAdmin?: boolean;
  isProfileComplete?: boolean;
  city?: string;
  country?: string;
  countryCode?: string;
}

export interface ProfileResponse {
  userId: string;
  fullName?: string;
  phone?: string;
  profileAddress?: {
    country?: string;
    city?: string;
    state?: string;
    zip?: string;
    addressLine1?: string;
    addressLine2?: string;
  };
  notificationPrefs?: {
    push?: boolean;
    email?: boolean;
    sms?: boolean;
  };
}

export interface ProfileSaveRequest {
  fullName: string;
  phone?: string;
  profileAddress: {
    country: string;
    city: string;
    state?: string;
    zip?: string;
    addressLine1?: string;
    addressLine2?: string;
  };
  notificationPrefs?: {
    push?: boolean;
    email?: boolean;
    sms?: boolean;
  };
}

export const AuthAPI = {
  /**
   * POST /auth/google
   * Authenticate with Google OAuth
   */
  googleAuth: async (data: GoogleAuthRequest): Promise<GoogleAuthResponse> => {
    // TODO: Replace with actual API call
    // const response = await fetch(`${API_BASE_URL}/auth/google`, {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(data),
    // });
    // if (!response.ok) throw new Error("Google auth failed");
    // return response.json();
    
    throw new Error("API not implemented - POST /auth/google");
  },

  /**
   * POST /otp/send
   * Send OTP to user's email
   */
  sendOtp: async (data: OtpSendRequest): Promise<OtpSendResponse> => {
    // TODO: Replace with actual API call
    // const response = await fetch(`${API_BASE_URL}/otp/send`, {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(data),
    // });
    // if (!response.ok) throw new Error("Failed to send OTP");
    // return response.json();
    
    // Mock implementation
    await new Promise((r) => setTimeout(r, 800));
    return { success: true, message: "OTP sent", expiresIn: 60 };
  },

  /**
   * POST /otp/verify
   * Verify OTP and authenticate user
   */
  verifyOtp: async (data: OtpVerifyRequest): Promise<OtpVerifyResponse> => {
    // TODO: Replace with actual API call
    // const response = await fetch(`${API_BASE_URL}/otp/verify`, {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(data),
    // });
    // if (!response.ok) throw new Error("OTP verification failed");
    // return response.json();
    
    throw new Error("API not implemented - POST /otp/verify");
  },

  /**
   * GET /user
   * Get current authenticated user
   */
  getUser: async (accessToken: string): Promise<UserResponse> => {
    // TODO: Replace with actual API call
    // const response = await fetch(`${API_BASE_URL}/user`, {
    //   headers: { Authorization: `Bearer ${accessToken}` },
    // });
    // if (!response.ok) throw new Error("Failed to get user");
    // return response.json();
    
    throw new Error("API not implemented - GET /user");
  },

  /**
   * POST /logout
   * Logout current user
   */
  logout: async (accessToken: string): Promise<void> => {
    // TODO: Replace with actual API call
    // await fetch(`${API_BASE_URL}/logout`, {
    //   method: "POST",
    //   headers: { Authorization: `Bearer ${accessToken}` },
    // });
    
    // Mock implementation - just clear local state
    return;
  },

  /**
   * GET /profile
   * Get user profile
   */
  getProfile: async (accessToken: string): Promise<ProfileResponse> => {
    // TODO: Replace with actual API call
    // const response = await fetch(`${API_BASE_URL}/profile`, {
    //   headers: { Authorization: `Bearer ${accessToken}` },
    // });
    // if (!response.ok) throw new Error("Failed to get profile");
    // return response.json();
    
    throw new Error("API not implemented - GET /profile");
  },

  /**
   * POST /profile/save
   * Save user profile
   */
  saveProfile: async (accessToken: string, data: ProfileSaveRequest): Promise<ProfileResponse> => {
    // TODO: Replace with actual API call
    // const response = await fetch(`${API_BASE_URL}/profile/save`, {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //     Authorization: `Bearer ${accessToken}`,
    //   },
    //   body: JSON.stringify(data),
    // });
    // if (!response.ok) throw new Error("Failed to save profile");
    // return response.json();
    
    throw new Error("API not implemented - POST /profile/save");
  },
};

// ---------------------------------------------------------------------------
// 2. GEO ENDPOINTS (4 endpoints)
// ---------------------------------------------------------------------------

export interface Country {
  id: number;
  name: string;
  code: string;
}

export interface State {
  id: number;
  name: string;
  countryId: number;
}

export interface City {
  id: number;
  name: string;
  countryId: number;
  stateId?: number;
}

export interface CityLookupRequest {
  query: string;
  countryId?: number;
}

export const GeoAPI = {
  /**
   * GET /countries
   * Get list of all supported countries
   */
  getCountries: async (): Promise<Country[]> => {
    // TODO: Replace with actual API call
    // const response = await fetch(`${API_BASE_URL}/countries`);
    // if (!response.ok) throw new Error("Failed to get countries");
    // return response.json();
    
    throw new Error("API not implemented - GET /countries");
  },

  /**
   * GET /countries/:countryId/states
   * Get states/provinces for a country
   */
  getStates: async (countryId: number): Promise<State[]> => {
    // TODO: Replace with actual API call
    // const response = await fetch(`${API_BASE_URL}/countries/${countryId}/states`);
    // if (!response.ok) throw new Error("Failed to get states");
    // return response.json();
    
    throw new Error("API not implemented - GET /countries/:countryId/states");
  },

  /**
   * GET /cities/lookup
   * Search for cities by name
   */
  lookupCities: async (data: CityLookupRequest): Promise<City[]> => {
    // TODO: Replace with actual API call
    // const params = new URLSearchParams({ query: data.query });
    // if (data.countryId) params.append("countryId", String(data.countryId));
    // const response = await fetch(`${API_BASE_URL}/cities/lookup?${params}`);
    // if (!response.ok) throw new Error("Failed to lookup cities");
    // return response.json();
    
    throw new Error("API not implemented - GET /cities/lookup");
  },

  /**
   * GET /countries/:countryId/cities
   * Get all cities for a country
   */
  getCities: async (countryId: number): Promise<City[]> => {
    // TODO: Replace with actual API call
    // const response = await fetch(`${API_BASE_URL}/countries/${countryId}/cities`);
    // if (!response.ok) throw new Error("Failed to get cities");
    // return response.json();
    
    throw new Error("API not implemented - GET /countries/:countryId/cities");
  },
};

// ---------------------------------------------------------------------------
// 3. PRODUCTS ENDPOINTS (2 endpoints)
// ---------------------------------------------------------------------------

export interface ProductListRequest {
  country: string;
  city: string;
  page?: number;
  limit?: number;
}

export interface Product {
  productId: string;
  name: string;
  brand: string;
  category: string;
  subcategory: string;
  imageUrl?: string;
  hasActiveOffers: boolean;
}

export interface ProductListResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
}

export const ProductsAPI = {
  /**
   * GET /products/list
   * 
   * IMPORTANT: This API should be triggered at the same time as login auth API.
   * 
   * For existing users: Use city & country from saved profile data
   * For new users: Use city & country auto-detected from IP address on login screen
   * 
   * NOTE: This API will be triggered again if user changes city/country in profile
   * and saves. In that case, show shimmer loader while products are re-fetching.
   * 
   * @param data.country - Country name or code
   * @param data.city - City name
   * @returns Products with active offers from the same city & country
   */
  getProducts: async (data: ProductListRequest): Promise<ProductListResponse> => {
    // TODO: Replace with actual API call
    // const params = new URLSearchParams({
    //   country: data.country,
    //   city: data.city,
    //   page: String(data.page || 1),
    //   limit: String(data.limit || 50),
    // });
    // const response = await fetch(`${API_BASE_URL}/products/list?${params}`);
    // if (!response.ok) throw new Error("Failed to get products");
    // return response.json();
    
    throw new Error("API not implemented - GET /products/list");
  },
};

// ---------------------------------------------------------------------------
// 4. SUPPORT/JIRA INTEGRATION (placeholder)
// ---------------------------------------------------------------------------

export interface LoginIssueReport {
  email: string;
  errorType: "google_auth" | "apple_auth" | "otp_send" | "otp_verify" | "network" | "system" | "other";
  errorMessage: string;
  userMessage: string;
  timestamp: string;
  deviceInfo?: {
    userAgent: string;
    platform: string;
    language: string;
  };
}

export interface JiraTicketResponse {
  ticketId: string;
  ticketUrl?: string;
  status: "created" | "pending" | "error";
}

export const SupportAPI = {
  /**
   * POST /support/login-issue
   * 
   * Reports a login issue and creates a Jira ticket.
   * 
   * JIRA INTEGRATION NOTE:
   * - Jira space is not yet set up
   * - This endpoint should create a ticket in Jira when available
   * - For now, store reports in database for manual review
   * - Future: Integrate with Jira API using jira-client or REST API
   * 
   * Jira ticket should include:
   * - Summary: "Login Issue: {errorType} - {email}"
   * - Description: User message + error details + device info
   * - Priority: Based on error type
   * - Labels: ["login-issue", errorType]
   */
  reportLoginIssue: async (data: LoginIssueReport): Promise<JiraTicketResponse> => {
    // TODO: Replace with actual API call when Jira is set up
    // const response = await fetch(`${API_BASE_URL}/support/login-issue`, {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(data),
    // });
    // if (!response.ok) throw new Error("Failed to report issue");
    // return response.json();
    
    // Mock implementation - log to console for now
    console.log("[Support] Login issue reported:", data);
    
    // Simulate ticket creation
    await new Promise((r) => setTimeout(r, 500));
    return {
      ticketId: `BTRX-${Date.now()}`,
      status: "pending",
    };
  },
};

// ---------------------------------------------------------------------------
// API ERROR HANDLING
// ---------------------------------------------------------------------------

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error
  );
}

// ---------------------------------------------------------------------------
// HTTP UTILITIES
// ---------------------------------------------------------------------------

export async function apiRequest<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      code: "UNKNOWN_ERROR",
      message: response.statusText,
    }));
    throw error;
  }

  return response.json();
}
