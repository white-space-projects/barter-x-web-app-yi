import { NextResponse } from "next/server"
import {  setSessionCookie, isValidEmail, generateDeviceId, getDefaultRegion } from "@/lib/auth"

export async function POST(request: Request) {

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

  try {
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


    // Prepare payload for backend
    const payload = {
      email: normalizedEmail,
      name: name.trim(),
      otp,
      device_id: device_id || generateDeviceId(),
      region: region || getDefaultRegion(),
    }

    // Call backend API to verify OTP
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

    // Set session cookie with user data from backend
    await setSessionCookie({
      id: data.user.id,
      user_id: data.user.user_id,
      email: data.user.email,
      name: name.trim(),
      access_token: data.access_token,
      region: data.user.profile.region
    })

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
    console.error("Verify OTP error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    )
  }
}
