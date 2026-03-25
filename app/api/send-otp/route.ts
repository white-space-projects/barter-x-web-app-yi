import { NextResponse } from "next/server"
import { isValidEmail } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;
    

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    const normalizedEmail = email.trim().toLowerCase()
    console.log("TLS:", process.env.NODE_TLS_REJECT_UNAUTHORIZED);


    if (!isValidEmail(normalizedEmail)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      )
    }

    // Call backend API to send OTP
    const response = await fetch(`${API_BASE_URL}/otp/send`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({ email: normalizedEmail }),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || data.error || "Failed to send OTP" },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      message: data.message || "OTP sent successfully",
    })
  } catch (error) {
    console.error("Send OTP error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    )
  }
}
