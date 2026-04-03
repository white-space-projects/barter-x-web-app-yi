/**
 * #API#Login#OTP#Verify# - Verify OTP API Route
 * Endpoint: POST /api/verify-otp
 * Tags: #API#Login#OTP#VerifyRequestPayload#, #API#Login#OTP#VerifyResponsePayload#
 *       #Auth#PAT#Generation#, #Auth#Session#Create#, #Auth#SupabaseMapping#
 *       #Logging#Login#OTP#, #Error#Login#OTP#, #Trace#Login#SessionId#
 */
import { NextResponse } from "next/server"
import {  setSessionCookie, isValidEmail, generateDeviceId, getDefaultRegion } from "@/lib/auth"

// #API#Login#OTP#Verify# - POST /api/verify-otp
export async function POST(request: Request) {
  // #Trace#Login#CorrelationId# - TODO: Extract/generate correlation ID
  // #Logging#Login#OTP#VerifyRequest# - TODO: Log incoming verify request
  
  // #API#Login#BackendURL# - Backend API base URL
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

  try {
    // #API#Login#OTP#VerifyRequestPayload# - Parse request body
    // Expected: { email, otp, name, device_id, region }
    const { email, otp, name, device_id, region } = await request.json()

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    if (!otp || typeof otp !== "string") {
      return NextResponse.json(
        { error: "OTP is required" },
        { status: 400 }
      )
    }

    // if (!name || typeof name !== "string" || name.trim().length === 0) {
    //   return NextResponse.json(
    //     { error: "Name is required" },
    //     { status: 400 }
    //   )
    // }

    const normalizedEmail = email.trim().toLowerCase()

    if (!isValidEmail(normalizedEmail)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      )
    }

    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { error: "OTP must be a 6-digit number" },
        { status: 400 }
      )
    }


    // #API#Login#OTP#BackendRequestPayload# - Prepare payload for backend
    const payload = {
      email: normalizedEmail,
      name: name.trim(),
      otp,
      device_id: device_id || generateDeviceId(), // #Trace#Login#DeviceId#
      region: region || getDefaultRegion(),
    }

    // #API#Login#OTP#BackendCall# - Call backend API to verify OTP
    const response = await fetch(`${API_BASE_URL}/otp/verify`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || data.error || "Verification failed" },
        { status: response.status }
      )
    }

    // #Auth#Session#Create# - Set session cookie with user data from backend
    // #Auth#PAT#Storage# - Store access token in session
    await setSessionCookie({
      id: data.user.id, // #Auth#SupabaseMapping#UserId#
      user_id: data.user.user_id, // #Auth#SupabaseMapping#UserId#
      email: data.user.email, // #Auth#SupabaseMapping#UserEmail#
      name: name.trim(), // #Auth#SupabaseMapping#UserName#
      access_token: data.access_token, // #Auth#PAT#Generation#
      region: data.user.profile.region // #Auth#SupabaseMapping#UserRegion#
    })

    // #API#Login#OTP#VerifyResponsePayload# - Success response
    // #Logging#Login#OTP#VerifySuccess# - TODO: Log successful verification
    // #Analytics#Login#OTP#VerifySuccess# - TODO: Track OTP verify success
    return NextResponse.json({
      success: true,
      message: data.message || "Authentication successful",
      access_token: data.access_token,
      user: {
        id: data.user.id,
        user_id: data.user.user_id,
        email: data.user.email,
        name: name.trim(),
        region: data.user.profile.region,
      },
    })
  } catch (error) {
    // #Error#Login#OTP#VerifyUnexpectedError# - Handle unexpected errors
    // #Logging#Login#OTP#VerifyError# - Log unexpected error
    console.error("Verify OTP error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    )
  }
}
