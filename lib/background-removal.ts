// Thin wrapper around @imgly/background-removal so the (large) WASM/ONNX
// assets are only loaded when the user actually removes a background.
// Runs entirely in the browser — no API key, no upload to a third party.
//
// Speed: prefers the WebGPU backend when the browser supports it (a large
// speedup over WASM/CPU) and uses the half-precision isnet_fp16 model, which
// downloads and runs faster than the full model with near-identical quality.
// Falls back to CPU automatically if WebGPU init fails.

export type ProgressFn = (ratio: number) => void;

export async function removeImageBackground(
  file: Blob,
  onProgress?: ProgressFn,
): Promise<Blob> {
  const { removeBackground } = await import("@imgly/background-removal");

  const hasWebGPU =
    typeof navigator !== "undefined" && "gpu" in navigator;

  const base = {
    model: "isnet_fp16" as const,
    output: { format: "image/png" as const, quality: 0.8 },
    progress: (_key: string, current: number, total: number) => {
      if (onProgress && total > 0) onProgress(current / total);
    },
  };

  try {
    return await removeBackground(file, {
      ...base,
      device: hasWebGPU ? "gpu" : "cpu",
    });
  } catch (err) {
    // WebGPU can be present but fail to initialise on some devices/drivers —
    // retry once on CPU before giving up.
    if (hasWebGPU) {
      return removeBackground(file, { ...base, device: "cpu" });
    }
    throw err;
  }
}
