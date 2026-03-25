import { NextResponse } from "next/server"
import {  getSession, isValidEmail, generateDeviceId, getDefaultRegion } from "@/lib/auth"


export async function POST(request: Request) {

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

  try {
    const session: any = await getSession();
    const { title, description, ref_product, pickup_address, offer_info } = await request.json()
    

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    
    if (!ref_product) {
      return NextResponse.json(
        { error: "Please choose a product to add offer" },
        { status: 400 }
      )
    }

    // Prepare payload for backend
    const payload = {
      title,
      description,
      ref_product,
      pickup_address,
      offer_info,
    }

    // Call backend API to verify OTP
    const response = await fetch(`${API_BASE_URL}/offer/create`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || data.error || "something went wrong" },
        { status: response.status }
      )
    }

    return NextResponse.json(data , {status : 200})
  } catch (error) {
    console.error("Create Offer error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    )
  }
}
