/**
 * #API#Login#Google#Verify# - Google Auth Verify API Route
 * Endpoint: POST /api/auth/google/verify
 * Tags: #API#Login#Google#RequestPayload#, #API#Login#Google#ResponsePayload#
 *       #Auth#PAT#Generation#, #Auth#Session#Create#, #Auth#SupabaseMapping#GoogleAuth#
 *       #Logging#Login#Google#, #Error#Login#Google#
 */
import { NextResponse } from "next/server"
import {  setSessionCookie} from "@/lib/auth"

// #API#Login#Google#Verify# - POST /api/auth/google/verify
export async function POST(request: Request) {
  // #Trace#Login#CorrelationId# - TODO: Extract/generate correlation ID
  // #Logging#Login#Google#VerifyRequest# - TODO: Log incoming request
  
  try {
    // #API#Login#Google#RequestPayload# - Request body: { id_token, device_id, region }
    const { id_token , region , device_id } = await request.json()
    // #API#Login#BackendURL# - Backend API base URL
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;
    
    // #API#Login#Google#BackendCall# - Call backend API to verify Google token
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


    // #Auth#Session#Create# - Set session cookie with user data from backend
    // #Auth#SupabaseMapping#GoogleAuth# - Map Google user data
    await setSessionCookie({
      id: data.user.id, // #Auth#SupabaseMapping#UserId#
      user_id: data.user.user_id, // #Auth#SupabaseMapping#UserId#
      email: data.user.email, // #Auth#SupabaseMapping#UserEmail#
      name: data.user?.name?.trim(), // #Auth#SupabaseMapping#UserName#
      access_token: data.access_token, // #Auth#PAT#Generation#
      region: data.user.profile.region // #Auth#SupabaseMapping#UserRegion#
    })

    // #API#Login#Google#ResponsePayload# - Success response
    // #Logging#Login#Google#VerifySuccess# - TODO: Log successful verification
    // #Analytics#Login#Google#Success# - TODO: Track Google auth success
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
    // #Error#Login#Google#UnexpectedError# - Handle unexpected errors
    // #Logging#Login#Google#Error# - Log unexpected error
    console.error("Google auth error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    )
  }
}
