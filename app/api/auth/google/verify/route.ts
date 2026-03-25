import { NextResponse } from "next/server"
import {  setSessionCookie} from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const { id_token , region , device_id } = await request.json()
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;
    
    // Call backend API to send OTP
    const response = await fetch(`${API_BASE_URL}/auth/google`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
                              "id_token": id_token, 
                              "device_id" : device_id,
                              "region" : region 
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || data.error || "Failed to authenticate through google auth." },
        { status: response.status }
      )
    }


    // Set session cookie with user data from backend
    await setSessionCookie({
      id: data.user.id,
      user_id: data.user.user_id,
      email: data.user.email,
      name: data.user?.name?.trim(),
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
        name: data.user?.name?.trim(),
        region: data.user.profile.region,
      },
    })
  } catch (error) {
    console.error("Google auth error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    )
  }
}
