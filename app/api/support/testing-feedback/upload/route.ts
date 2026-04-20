import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

/**
 * Upload endpoint for feedback images
 * 
 * Current behavior: Generates a MinIO-compatible storage path and stores the
 * image data temporarily. When MinIO is set up, this endpoint will be updated
 * to actually upload to MinIO.
 * 
 * For now, images are stored as base64 data URLs in a temporary location
 * and the storage path is returned for database storage.
 */

// Temporary in-memory storage for images until MinIO is set up
// In production, this would upload to MinIO and return the object path
const tempImageStore = new Map<string, { data: string; mimeType: string }>();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const userId = formData.get("userId") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF" },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB" },
        { status: 400 }
      );
    }

    // Generate MinIO-compatible storage path
    // Format: feedback/{userId or 'anonymous'}/{date}/{uuid}.{ext}
    const dateStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const fileId = uuidv4();
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const userFolder = userId || "anonymous";
    const storagePath = `feedback/${userFolder}/${dateStr}/${fileId}.${ext}`;

    // Convert file to base64 for temporary storage
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    // Store temporarily (will be replaced with MinIO upload)
    tempImageStore.set(storagePath, { data: dataUrl, mimeType: file.type });

    // Clean up old entries (keep only last 1000)
    if (tempImageStore.size > 1000) {
      const keys = Array.from(tempImageStore.keys());
      for (let i = 0; i < keys.length - 1000; i++) {
        tempImageStore.delete(keys[i]);
      }
    }

    return NextResponse.json({
      success: true,
      storagePath,
      originalFilename: file.name,
      fileSize: file.size,
      mimeType: file.type,
      // Include data URL for immediate preview (temporary until MinIO serves images)
      previewUrl: dataUrl,
    });

  } catch (error) {
    console.error("[API] Feedback image upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload image" },
      { status: 500 }
    );
  }
}

// GET - Retrieve a temporarily stored image by path (for preview)
// This will be replaced with MinIO direct URLs once set up
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");

    if (!path) {
      return NextResponse.json(
        { error: "Path required" },
        { status: 400 }
      );
    }

    const stored = tempImageStore.get(path);
    if (!stored) {
      return NextResponse.json(
        { error: "Image not found or expired" },
        { status: 404 }
      );
    }

    // Return the data URL
    return NextResponse.json({
      dataUrl: stored.data,
      mimeType: stored.mimeType,
    });

  } catch (error) {
    console.error("[API] Feedback image get error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get image" },
      { status: 500 }
    );
  }
}
