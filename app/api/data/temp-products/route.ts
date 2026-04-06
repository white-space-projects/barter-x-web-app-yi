/**
 * Temp Products API Route
 * =======================
 * Handles custom product submissions that need admin review.
 * Returns duplicate suggestions to help admins match to existing products.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  createTempProduct,
  getTempProduct,
  getPendingTempProducts,
  updateTempProductStatus,
  findDuplicates,
} from "@/lib/db/repositories/temp-products";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tempProductId = searchParams.get("tempProductId");
    const pendingOnly = searchParams.get("pending") === "true";

    if (tempProductId) {
      const tempProduct = await getTempProduct(tempProductId);
      if (!tempProduct) {
        return NextResponse.json(
          { error: "Temp product not found" },
          { status: 404 }
        );
      }
      // Also get fresh duplicate suggestions
      const duplicates = await findDuplicates({
        brandName: tempProduct.brandName,
        modelName: tempProduct.modelName,
        title: tempProduct.title,
        barterTypeId: tempProduct.barterTypeId,
      });
      return NextResponse.json({ tempProduct, duplicates });
    }

    if (pendingOnly) {
      const tempProducts = await getPendingTempProducts();
      return NextResponse.json({ tempProducts });
    }

    return NextResponse.json(
      { error: "Please specify tempProductId or pending=true" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[API] Temp products fetch error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch temp products" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      barterTypeId,
      categoryId,
      subcategoryId,
      brandName,
      modelName,
      title,
      description,
    } = body;

    if (!userId || !barterTypeId || !title) {
      return NextResponse.json(
        { error: "Missing required fields: userId, barterTypeId, title" },
        { status: 400 }
      );
    }

    console.log("[v0] Creating temp product:", { userId, barterTypeId, title, brandName });

    const { tempProduct, duplicates } = await createTempProduct({
      createdByUserId: userId,
      barterTypeId,
      categoryId,
      subcategoryId,
      brandName,
      modelName,
      title,
      description,
    });

    console.log("[v0] Temp product created:", tempProduct.tempProductId, "duplicates found:", duplicates.length);

    return NextResponse.json({ tempProduct, duplicates }, { status: 201 });
  } catch (error) {
    console.error("[API] Temp product create error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create temp product" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { tempProductId, status, approvedProductId } = body;

    if (!tempProductId || !status) {
      return NextResponse.json(
        { error: "Missing required fields: tempProductId, status" },
        { status: 400 }
      );
    }

    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Status must be 'approved' or 'rejected'" },
        { status: 400 }
      );
    }

    const tempProduct = await updateTempProductStatus(
      tempProductId,
      status,
      approvedProductId
    );

    if (!tempProduct) {
      return NextResponse.json(
        { error: "Temp product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ tempProduct });
  } catch (error) {
    console.error("[API] Temp product update error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update temp product" },
      { status: 500 }
    );
  }
}
