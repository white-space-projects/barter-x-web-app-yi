import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"

export async function DELETE(request: Request) {

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;
  const session:any = await getSession()

  try {
    const { product_id } = await request.json()

    // Call backend API to verify OTP
    const response = await fetch(`${API_BASE_URL}/product/image/remove`, {
      method: "DELETE",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ product_id : product_id}),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || data.error || "Something went wrong !" },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      message: data.message || "Product image remove successfully"
    })

  } catch (error) {
    console.error("Remove product image error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    )
  }
}
