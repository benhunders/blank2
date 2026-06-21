import "server-only";

// Minimal server-side client for the FASHN virtual try-on API.
// Predict-then-poll: POST /v1/run -> { id }, then GET /v1/status/{id} until
// the prediction is "completed" (returns output image URLs) or "failed".
// Docs: https://docs.fashn.ai/api-reference/tryon-v1-6

const BASE = "https://api.fashn.ai/v1";
const MODEL = process.env.FASHN_MODEL ?? "tryon-v1.6";

export type TryOnCategory = "auto" | "tops" | "bottoms" | "one-pieces";

// Map our wardrobe categories to FASHN garment categories. Returns null for
// items that virtual try-on can't place (shoes, bags, accessories).
export function tryOnCategory(category: string): TryOnCategory | null {
  switch (category) {
    case "tops":
    case "outerwear":
      return "tops";
    case "bottoms":
      return "bottoms";
    case "dresses":
      return "one-pieces";
    default:
      return null;
  }
}

interface StatusResponse {
  id: string;
  status: "starting" | "in_queue" | "processing" | "completed" | "failed";
  output: string[] | null;
  error: string | null;
}

function authHeaders() {
  const key = process.env.FASHN_API_KEY;
  if (!key) throw new Error("FASHN_API_KEY is not configured.");
  return { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
}

// Run one try-on (person + a single garment) and return the output image URL.
export async function runTryOn(
  modelImageUrl: string,
  garmentImageUrl: string,
  category: TryOnCategory = "auto",
): Promise<string> {
  const runRes = await fetch(`${BASE}/run`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      model_name: MODEL,
      inputs: {
        model_image: modelImageUrl,
        garment_image: garmentImageUrl,
        category,
      },
    }),
  });
  if (!runRes.ok) {
    throw new Error(`FASHN run failed (${runRes.status}): ${await runRes.text()}`);
  }
  const { id } = (await runRes.json()) as { id: string };

  // Poll for completion (~up to 50s).
  for (let i = 0; i < 25; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const statusRes = await fetch(`${BASE}/status/${id}`, {
      headers: authHeaders(),
    });
    if (!statusRes.ok) continue;
    const data = (await statusRes.json()) as StatusResponse;
    if (data.status === "completed" && data.output?.[0]) return data.output[0];
    if (data.status === "failed") {
      throw new Error(data.error ?? "FASHN try-on failed.");
    }
  }
  throw new Error("FASHN try-on timed out.");
}
