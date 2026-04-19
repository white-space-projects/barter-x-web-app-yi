/**
 * Image Compression Utility
 * ========================
 * Converts and compresses images to WebP format for efficient storage.
 * Used across the app for:
 * - Brand logos (backoffice)
 * - Product images (backoffice)
 * - Offer images (user uploads from app/mobile camera)
 */

export interface CompressedImage {
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
}

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1, default 0.85
  maxFileSizeKB?: number; // Will reduce quality iteratively to meet this target
}

/**
 * Compress an image file to WebP format
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Promise with compressed image data URL and metadata
 */
export async function compressImageToWebP(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressedImage> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.85,
    maxFileSizeKB,
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) {
        reject(new Error("Failed to read file"));
        return;
      }
      
      compressDataUrlToWebP(dataUrl, { maxWidth, maxHeight, quality, maxFileSizeKB })
        .then((result) => {
          resolve({
            ...result,
            originalSize: file.size,
          });
        })
        .catch(reject);
    };
    
    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Compress a data URL (base64) image to WebP format
 * @param dataUrl - The base64 data URL to compress
 * @param options - Compression options
 * @returns Promise with compressed image data URL and metadata
 */
export async function compressDataUrlToWebP(
  dataUrl: string,
  options: CompressionOptions = {}
): Promise<CompressedImage> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.85,
    maxFileSizeKB,
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      try {
        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
        
        // Create canvas and draw resized image
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to WebP with quality setting
        let currentQuality = quality;
        let compressedDataUrl = canvas.toDataURL("image/webp", currentQuality);
        
        // If maxFileSizeKB is set, iteratively reduce quality to meet target
        if (maxFileSizeKB) {
          const targetBytes = maxFileSizeKB * 1024;
          let attempts = 0;
          const maxAttempts = 10;
          
          while (getDataUrlSize(compressedDataUrl) > targetBytes && attempts < maxAttempts && currentQuality > 0.1) {
            currentQuality -= 0.1;
            compressedDataUrl = canvas.toDataURL("image/webp", currentQuality);
            attempts++;
          }
        }
        
        resolve({
          dataUrl: compressedDataUrl,
          originalSize: getDataUrlSize(dataUrl),
          compressedSize: getDataUrlSize(compressedDataUrl),
          width,
          height,
        });
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };
    
    img.src = dataUrl;
  });
}

/**
 * Get approximate size in bytes of a data URL
 */
function getDataUrlSize(dataUrl: string): number {
  // Remove the data URL prefix (e.g., "data:image/webp;base64,")
  const base64 = dataUrl.split(",")[1] || "";
  // Base64 encoding increases size by ~33%, so actual bytes ≈ base64Length * 3/4
  return Math.ceil((base64.length * 3) / 4);
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Check if browser supports WebP
 */
export function supportsWebP(): boolean {
  if (typeof document === "undefined") return false;
  
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  
  return canvas.toDataURL("image/webp").startsWith("data:image/webp");
}
