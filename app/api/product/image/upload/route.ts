import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth"

export async function POST(req: NextRequest) {
   const formData = await req.formData();
   const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;
    const session:any = await getSession()
    if(!session){
        return new Response(JSON.stringify([]), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } 
    console.log(formData)
    // Forward to your backend
    const backendRes = await fetch(`${API_BASE_URL}/product/image/upload`, {
        method: "POST",
        headers: {
        "Authorization": `Bearer ${session.access_token}`,
        },
        credentials: "include",
        body: formData
    });

    const text = await backendRes.text(); 
    console.log(text)

    return new NextResponse(text, {
        status: backendRes.status,
        headers: {
            "Content-Type": backendRes.headers.get("content-type") || "application/json",
        },
    });
}