// Browser-side image downscaling. The background remover outputs cut-outs at
// the ORIGINAL camera resolution — a phone photo becomes a 5-15MB alpha PNG,
// which makes every grid painfully slow. Everything we store gets downscaled
// here first; nothing in the app renders larger than ~1024px.

export interface EncodedImage {
  blob: Blob;
  ext: "webp" | "png";
  contentType: string;
}

// Downscale a transparent cut-out, PRESERVING alpha. Prefers WebP (~5-10x
// smaller than PNG); browsers without WebP encoding fall back to PNG.
export async function downscaleCutout(
  blob: Blob,
  maxDim = 1024,
): Promise<EncodedImage> {
  const bitmap = await createImageBitmap(blob);
  try {
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable.");
    ctx.drawImage(bitmap, 0, 0, w, h); // no background fill — keep alpha

    const encode = (type: string, quality?: number) =>
      new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), type, quality),
      );

    const webp = await encode("image/webp", 0.85);
    if (webp && webp.type === "image/webp") {
      return { blob: webp, ext: "webp", contentType: "image/webp" };
    }
    const png = await encode("image/png");
    if (!png) throw new Error("Image encode failed.");
    return { blob: png, ext: "png", contentType: "image/png" };
  } finally {
    bitmap.close();
  }
}

// Downscale an opaque photo (or flatten a cut-out) to JPEG. Used for AI
// analysis uploads and stored originals/person photos.

export async function downscaleImage(
  blob: Blob,
  maxDim = 768,
  background = "#ffffff",
): Promise<Blob> {
  const bitmap = await createImageBitmap(blob);
  try {
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable.");
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bitmap, 0, 0, w, h);

    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Image encode failed."))),
        "image/jpeg",
        0.85,
      ),
    );
  } finally {
    bitmap.close();
  }
}
