import { cookies } from "next/headers"
import { SignJWT, jwtVerify } from "jose"

// Backend API base URL
export const API_BASE_URL = "https://api-dev.project-b.app/api/v1"

// Session configuration
const SESSION_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || "your-secret-key-min-32-chars-long!!"
)
const SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours

// User session data structure
export interface UserSession {
  id: number
  user_id: string
  email: string
  name: string
  access_token: string,
  region: String
}

// Create a session token with user data
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

// Verify a session token
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

// Set session cookie
export async function setSessionCookie(user: UserSession): Promise<void> {
  const token = await createSessionToken(user)
  const cookieStore = await cookies()
  const isProduction = process.env.NODE_ENV === 'production';

  cookieStore.set("session", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: SESSION_DURATION / 1000,
    path: "/",
  })
}

// Get current session
export async function getSession(): Promise<UserSession | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("session")?.value

  if (!token) {
    return null
  }

  return verifySessionToken(token)
}

// Clear session cookie
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete("session")
}

// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Generate a unique device ID
export function generateDeviceId(): string {
  return crypto.randomUUID()
}

// Get user's timezone/region
export function getDefaultRegion(): string {
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return userTimeZone;
}
