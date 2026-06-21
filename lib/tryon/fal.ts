import "server-only";
import type { TryOnProvider } from "./types";

// Kling Kolors virtual try-on via the fal.ai queue API.
// POST the job, poll status_url until COMPLETED, then read response_url.
// https://fal.ai/models/fal-ai/kling/v1-5/kolors-virtual-try-on
// Note: Kling takes a single garment and no category (ignored); the route
// handles top+bottom by layering sequentially.

const ENDPOINT =
  "https://queue.fal.run/fal-ai/kling/v1-5/kolors-virtual-try-on";

function headers() {
  return {
    Authorization: `Key ${process.env.FAL_KEY}`,
    "Content-Type": "application/json",
  };
}

interface QueueResponse {
  request_id: string;
  status_url: string;
  response_url: string;
}

async function runTryOn(
  modelImageUrl: string,
  garmentImageUrl: string,
): Promise<string> {
  const submit = await fetch(ENDPOINT, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      human_image_url: modelImageUrl,
      garment_image_url: garmentImageUrl,
    }),
  });
  if (!submit.ok) {
    throw new Error(`fal run failed (${submit.status}): ${await submit.text()}`);
  }
  const { status_url, response_url } = (await submit.json()) as QueueResponse;

  for (let i = 0; i < 25; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const statusRes = await fetch(status_url, { headers: headers() });
    if (!statusRes.ok) continue;
    const data = (await statusRes.json()) as { status: string };
    if (data.status === "COMPLETED") break;
    if (i === 24) throw new Error("fal try-on timed out.");
  }

  const result = await fetch(response_url, { headers: headers() });
  if (!result.ok) {
    throw new Error(`fal result failed (${result.status}).`);
  }
  const data = (await result.json()) as { image?: { url?: string } };
  if (!data.image?.url) throw new Error("fal returned no image.");
  return data.image.url;
}

export const falProvider: TryOnProvider = {
  id: "fal",
  runTryOn: (model, garment) => runTryOn(model, garment),
};
