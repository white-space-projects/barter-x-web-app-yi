import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth"; // your session helper

const BASE = process.env.API_BASE_URL;

export async function GET(req:NextRequest) {
  try {
    const session: any = await getSession();
     const { searchParams } = new URL(req.url);
      const country = searchParams.get("country");
      console.log(country)

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const res = await fetch(`${BASE}/countries/${country}/cities`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    const data = await res.json();

    return NextResponse.json(data, { status: res.status });

  } catch (error) {
    console.error("Cities list API error:", error);

    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}