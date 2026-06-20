// Thin wrapper around @imgly/background-removal so the (large) WASM/ONNX
// assets are only loaded when the user actually removes a background.
// Runs entirely in the browser — no API key, no upload to a third party.

export type ProgressFn = (ratio: number) => void;

export async function removeImageBackground(
  file: Blob,
  onProgress?: ProgressFn,
): Promise<Blob> {
  const { removeBackground } = await import("@imgly/background-removal");

  return removeBackground(file, {
    output: { format: "image/png", quality: 0.9 },
    progress: (_key: string, current: number, total: number) => {
      if (onProgress && total > 0) onProgress(current / total);
    },
  });
}
