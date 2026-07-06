// Browser-side image downscale for AI analysis uploads. Keeps requests small
// and fast — a 768px JPEG is plenty for garment classification. Transparent
// cut-outs are composited onto a background color (JPEG has no alpha).

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
