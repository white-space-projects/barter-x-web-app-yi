/**
 * #API#Login#OTP#Send# - Send OTP API Route
 * Endpoint: POST /api/send-otp
 * Tags: #API#Login#OTP#RequestPayload#, #API#Login#OTP#ResponsePayload#
 *       #Logging#Login#OTP#, #Error#Login#OTP#, #Trace#Login#CorrelationId#
 */
import { NextResponse } from "next/server"
import { isValidEmail } from "@/lib/auth"

// #API#Login#OTP#Send# - POST /api/send-otp
export async function POST(request: Request) {
  // #Trace#Login#CorrelationId# - TODO: Extract/generate correlation ID
  // const correlationId = request.headers.get('X-Correlation-ID') || generateCorrelationId();
  // #Logging#Login#OTP#SendRequest# - TODO: Log incoming request
  
  try {
    // #API#Login#OTP#RequestPayload# - Request body: { email: string }
    const { email } = await request.json()
    // #API#Login#BackendURL# - Backend API base URL
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;
    

    // #Login#OTP#Validation#EmailRequired# - Validate email is provided
    if (!email || typeof email !== "string") {
      // #Error#Login#OTP#ValidationFailed# - Email missing
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    // #Login#OTP#Validation#EmailNormalize# - Normalize email
    const normalizedEmail = email.trim().toLowerCase()
    console.log("TLS:", process.env.NODE_TLS_REJECT_UNAUTHORIZED);

    // #Login#OTP#Validation#EmailFormat# - Validate email format
    if (!isValidEmail(normalizedEmail)) {
      // #Error#Login#OTP#InvalidEmail# - Invalid email format
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      )
    }

    // #API#Login#OTP#BackendCall# - Call Laravel backend API to send OTP
    // #API#Login#OTP#BackendRequestPayload# - Request: { email: string }
    const response = await fetch(`${API_BASE_URL}/otp/send`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json",
        // #Trace#Login#CorrelationId# - TODO: Forward correlation ID
        // "X-Correlation-ID": correlationId,
      },
      body: JSON.stringify({ email: normalizedEmail }),
    })

    // #API#Login#OTP#BackendResponsePayload# - Parse backend response
    const data = await response.json()

    // #Error#Login#OTP#BackendError# - Handle backend error response
    if (!response.ok) {
      // #Logging#Login#OTP#BackendError# - TODO: Log backend error
      return NextResponse.json(
        { error: data.message || data.error || "Failed to send OTP" },
        { status: response.status }
      )
    }

    // #API#Login#OTP#ResponsePayload# - Response: { success: true, message: string }
    // #Logging#Login#OTP#SendSuccess# - TODO: Log successful OTP send
    // #Analytics#Login#OTP#SendSuccess# - TODO: Track OTP send success
    return NextResponse.json({
      success: true,
      message: data.message || "OTP sent successfully",
    })
  } catch (error) {
    // #Error#Login#OTP#UnexpectedError# - Handle unexpected errors
    // #Logging#Login#OTP#UnexpectedError# - Log unexpected error
    console.error("Send OTP error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    )
  }
}
