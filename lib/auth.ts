/**
 * =============================================================================
 * AUTH LIBRARY - #Auth#Session#, #Auth#PAT#
 * =============================================================================
 * Core authentication utilities for session management.
 * 
 * TAGS:
 * - #Auth#Session#Create# - Session cookie creation
 * - #Auth#Session#Verify# - Session token verification
 * - #Auth#Session#Clear# - Session cookie deletion
 * - #Auth#PAT#Storage# - PAT/access_token handling
 * - #Auth#SupabaseMapping# - Supabase field mappings
 * - #Trace#Login#SessionId# - Session ID generation
 * =============================================================================
 */
import { cookies } from "next/headers"
import { SignJWT, jwtVerify } from "jose"

// #API#Login#BackendURL# - Backend API base URL
export const API_BASE_URL = "https://api-dev.project-b.app/api/v1"

// #Auth#Session#Config# - Session configuration
const SESSION_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || "your-secret-key-min-32-chars-long!!"
)
const SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours

// #Auth#SupabaseMapping#UserObject# - User session data structure
export interface UserSession {
  id: number // #Auth#SupabaseMapping#UserId#
  user_id: string // #Auth#SupabaseMapping#UserId#
  email: string // #Auth#SupabaseMapping#UserEmail#
  name: string // #Auth#SupabaseMapping#UserName#
  access_token: string // #Auth#PAT#Storage#
  region: String // #Auth#SupabaseMapping#UserRegion#
}

// #Auth#Session#TokenCreate# - Create a session token with user data
export async function createSessionToken(user: UserSession): Promise<string> {
  const token = await new SignJWT({ 
    id: user.id,
    user_id: user.user_id,
    email: user.email,
    name: user.name,
    access_token: user.access_token,
    region: user.region
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(SESSION_SECRET)

  return token
}

// #Auth#Session#Verify# - Verify a session token
export async function verifySessionToken(token: string): Promise<UserSession | null> {
  try {
    const { payload } = await jwtVerify(token, SESSION_SECRET)
    return {
      id: payload.id as number,
      user_id: payload.user_id as string,
      email: payload.email as string,
      name: payload.name as string,
      access_token: payload.access_token as string,
      region: payload.region as string,
    }
  } catch {
    return null
  }
}

// #Auth#Session#Create# - Set session cookie
export async function setSessionCookie(user: UserSession): Promise<void> {
  const token = await createSessionToken(user)
  const cookieStore = await cookies()

  // Use lax sameSite for better compatibility with preview environments
  // The cookie needs to work across the preview iframe
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: "lax",
    maxAge: SESSION_DURATION / 1000,
    path: "/",
  })
  
  console.log("[v0] Session cookie set for user:", user.user_id)
}

// #Auth#Session#Get# - Get current session
export async function getSession(): Promise<UserSession | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("session")?.value

  if (!token) {
    console.log("[v0] getSession: No session cookie found")
    return null
  }

  const session = await verifySessionToken(token)
  if (session) {
    console.log("[v0] getSession: Session verified for user:", session.user_id)
  } else {
    console.log("[v0] getSession: Session token invalid or expired")
  }
  return session
}

// #Auth#Session#Clear# - Clear session cookie
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete("session")
}

// #Login#Email#Validation# - Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// #Trace#Login#DeviceId# - Generate a unique device ID
export function generateDeviceId(): string {
  return crypto.randomUUID()
}

// Get user's timezone/region
export function getDefaultRegion(): string {
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return userTimeZone;
}
