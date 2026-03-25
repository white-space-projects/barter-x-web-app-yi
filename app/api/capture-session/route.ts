/**
 * Capture Session API
 * 
 * This API handles cross-device image sync for the QR code capture flow.
 * 
 * BACKEND INTEGRATION NOTES FOR MINIO:
 * =====================================
 * Replace the in-memory `sessions` Map with your MinIO/S3 storage:
 * 
 * 1. Store session metadata in your database (PostgreSQL, etc.)
 * 2. Store actual images in MinIO bucket with path: `capture-sessions/{sessionId}/{imageId}.jpg`
 * 3. Use presigned URLs for direct uploads from mobile
 * 
 * Example MinIO integration:
 * ```
 * import { Client } from 'minio';
 * 
 * const minioClient = new Client({
 *   endPoint: process.env.MINIO_ENDPOINT,
 *   port: 9000,
 *   useSSL: false,
 *   accessKey: process.env.MINIO_ACCESS_KEY,
 *   secretKey: process.env.MINIO_SECRET_KEY,
 * });
 * 
 * // Upload image
 * await minioClient.putObject('capture-sessions', `${sessionId}/${imageId}.jpg`, imageBuffer);
 * 
 * // Get presigned URL for upload (better for mobile)
 * const uploadUrl = await minioClient.presignedPutObject('capture-sessions', `${sessionId}/${imageId}.jpg`, 60 * 15);
 * ```
 */

import { NextRequest, NextResponse } from "next/server";

// Types for the API
type CapturedImage = {
  imageId: string;
  url: string; // Base64 data URL or MinIO URL
  timestamp: number;
};

type CaptureSession = {
  sessionId: string;
  images: CapturedImage[];
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
};

// In-memory storage for demo - REPLACE WITH DATABASE + MINIO IN PRODUCTION
const sessions = new Map<string, CaptureSession>();

// Clean up expired sessions periodically
function cleanupExpiredSessions() {
  const now = Date.now();
  for (const [sessionId, session] of sessions.entries()) {
    if (session.expiresAt < now) {
      sessions.delete(sessionId);
    }
  }
}

// GET: Retrieve session images (called by desktop to poll for updates)
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("sessionId");
  const since = request.nextUrl.searchParams.get("since"); // Timestamp for incremental updates
  
  if (!sessionId) {
    return NextResponse.json({ error: "Session ID required" }, { status: 400 });
  }
  
  cleanupExpiredSessions();
  
  const session = sessions.get(sessionId);
  
  if (!session) {
    // Session doesn't exist yet - that's OK, mobile will create it
    return NextResponse.json({ 
      sessionId,
      images: [],
      updatedAt: 0,
    });
  }
  
  // If 'since' is provided, only return images newer than that timestamp
  let images = session.images;
  if (since) {
    const sinceTimestamp = parseInt(since, 10);
    images = session.images.filter(img => img.timestamp > sinceTimestamp);
  }
  
  return NextResponse.json({
    sessionId,
    images,
    updatedAt: session.updatedAt,
    totalImages: session.images.length,
  });
}

// POST: Add images to session (called by mobile after capture)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, images } = body as { 
      sessionId: string; 
      images: Array<{ imageId: string; url: string }>;
    };
    
    if (!sessionId || !images || !Array.isArray(images)) {
      return NextResponse.json(
        { error: "Session ID and images array required" }, 
        { status: 400 }
      );
    }
    
    cleanupExpiredSessions();
    
    const now = Date.now();
    const expiresAt = now + 30 * 60 * 1000; // 30 minutes
    
    // Get or create session
    let session = sessions.get(sessionId);
    if (!session) {
      session = {
        sessionId,
        images: [],
        createdAt: now,
        updatedAt: now,
        expiresAt,
      };
    }
    
    // Add new images with timestamps
    const newImages: CapturedImage[] = images.map(img => ({
      imageId: img.imageId,
      url: img.url,
      timestamp: now,
    }));
    
    // Merge with existing images (avoid duplicates by imageId)
    const existingIds = new Set(session.images.map(img => img.imageId));
    for (const img of newImages) {
      if (!existingIds.has(img.imageId)) {
        session.images.push(img);
      }
    }
    
    session.updatedAt = now;
    session.expiresAt = expiresAt; // Extend expiry
    sessions.set(sessionId, session);
    
    /**
     * MINIO INTEGRATION POINT:
     * Instead of storing base64 in memory, upload to MinIO:
     * 
     * for (const img of images) {
     *   const buffer = Buffer.from(img.url.split(',')[1], 'base64');
     *   await minioClient.putObject(
     *     'capture-sessions', 
     *     `${sessionId}/${img.imageId}.jpg`, 
     *     buffer
     *   );
     * }
     * 
     * Then store only the MinIO paths in your database.
     */
    
    return NextResponse.json({
      success: true,
      sessionId,
      totalImages: session.images.length,
      updatedAt: session.updatedAt,
    });
  } catch (error) {
    console.error("Error saving capture session:", error);
    return NextResponse.json(
      { error: "Failed to save images" }, 
      { status: 500 }
    );
  }
}

// DELETE: Clear session (optional cleanup)
export async function DELETE(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("sessionId");
  
  if (!sessionId) {
    return NextResponse.json({ error: "Session ID required" }, { status: 400 });
  }
  
  sessions.delete(sessionId);
  
  return NextResponse.json({ success: true });
}
