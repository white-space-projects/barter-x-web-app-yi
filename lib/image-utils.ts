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

/**
 * Remove background from image using canvas
 * Works best with images that have solid or near-solid backgrounds (white, light gray, etc.)
 * Uses a simple color-based approach suitable for logos and product images
 */
export async function removeBackground(
  dataUrl: string,
  options: {
    threshold?: number; // 0-255, pixels within this distance from corners are made transparent
    edgeSmooth?: number; // Smoothing radius for edge detection
  } = {}
): Promise<string> {
  const { threshold = 30, edgeSmooth = 2 } = options;
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }
        
        // Draw original image
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Sample background color from corners (average of all 4 corners)
        const sampleSize = 5;
        const corners = [
          { x: 0, y: 0 },
          { x: canvas.width - sampleSize, y: 0 },
          { x: 0, y: canvas.height - sampleSize },
          { x: canvas.width - sampleSize, y: canvas.height - sampleSize }
        ];
        
        let bgR = 0, bgG = 0, bgB = 0, samples = 0;
        
        for (const corner of corners) {
          for (let dy = 0; dy < sampleSize; dy++) {
            for (let dx = 0; dx < sampleSize; dx++) {
              const x = corner.x + dx;
              const y = corner.y + dy;
              const idx = (y * canvas.width + x) * 4;
              bgR += data[idx];
              bgG += data[idx + 1];
              bgB += data[idx + 2];
              samples++;
            }
          }
        }
        
        bgR = Math.round(bgR / samples);
        bgG = Math.round(bgG / samples);
        bgB = Math.round(bgB / samples);
        
        // Make pixels similar to background color transparent
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // Calculate color distance from background
          const distance = Math.sqrt(
            Math.pow(r - bgR, 2) +
            Math.pow(g - bgG, 2) +
            Math.pow(b - bgB, 2)
          );
          
          if (distance < threshold) {
            // Make transparent with smooth falloff
            const alpha = Math.min(255, Math.max(0, (distance / threshold) * 255));
            data[i + 3] = Math.round(alpha);
          }
        }
        
        // Apply edge smoothing if requested
        if (edgeSmooth > 0) {
          // Simple alpha edge smoothing pass
          const tempData = new Uint8ClampedArray(data);
          for (let y = edgeSmooth; y < canvas.height - edgeSmooth; y++) {
            for (let x = edgeSmooth; x < canvas.width - edgeSmooth; x++) {
              const idx = (y * canvas.width + x) * 4;
              let alphaSum = 0;
              let count = 0;
              
              for (let dy = -edgeSmooth; dy <= edgeSmooth; dy++) {
                for (let dx = -edgeSmooth; dx <= edgeSmooth; dx++) {
                  const nIdx = ((y + dy) * canvas.width + (x + dx)) * 4;
                  alphaSum += tempData[nIdx + 3];
                  count++;
                }
              }
              
              data[idx + 3] = Math.round(alphaSum / count);
            }
          }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Return as PNG to preserve transparency
        resolve(canvas.toDataURL("image/png"));
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
 * Process image for backoffice upload (logo or product)
 * Removes background and compresses to WebP with transparency support
 */
export async function processBackofficeImage(
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    removeBackground?: boolean;
  } = {}
): Promise<CompressedImage> {
  const {
    maxWidth = 512,
    maxHeight = 512,
    quality = 0.9,
    removeBackground: shouldRemoveBg = true,
  } = options;
  
  // First read the file
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
  
  // Remove background if requested
  let processedDataUrl = dataUrl;
  if (shouldRemoveBg) {
    try {
      processedDataUrl = await removeBackground(dataUrl);
    } catch (error) {
      console.warn("Background removal failed, using original:", error);
      // Continue with original if background removal fails
    }
  }
  
  // Compress to WebP (note: WebP supports transparency)
  return compressDataUrlToWebP(processedDataUrl, {
    maxWidth,
    maxHeight,
    quality,
  }).then(result => ({
    ...result,
    originalSize: file.size,
  }));
}
