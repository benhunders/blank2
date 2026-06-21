import "server-only";
import type { TryOnCategory, TryOnProvider } from "./types";

// FASHN virtual try-on adapter. Predict-then-poll: POST /v1/run -> { id },
// then GET /v1/status/{id} until "completed". Docs:
// https://docs.fashn.ai/api-reference/tryon-v1-6

const BASE = "https://api.fashn.ai/v1";
const MODEL = process.env.FASHN_MODEL ?? "tryon-v1.6";

interface StatusResponse {
  id: string;
  status: "starting" | "in_queue" | "processing" | "completed" | "failed";
  output: string[] | null;
  error: string | null;
}

function headers() {
  return {
    Authorization: `Bearer ${process.env.FASHN_API_KEY}`,
    "Content-Type": "application/json",
  };
}

async function runTryOn(
  modelImageUrl: string,
  garmentImageUrl: string,
  category: TryOnCategory,
): Promise<string> {
  const runRes = await fetch(`${BASE}/run`, {
    method: "POST",
    headers: headers(),
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

  for (let i = 0; i < 25; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const statusRes = await fetch(`${BASE}/status/${id}`, { headers: headers() });
    if (!statusRes.ok) continue;
    const data = (await statusRes.json()) as StatusResponse;
    if (data.status === "completed" && data.output?.[0]) return data.output[0];
    if (data.status === "failed") throw new Error(data.error ?? "FASHN failed.");
  }
  throw new Error("FASHN try-on timed out.");
}

export const fashnProvider: TryOnProvider = { id: "fashn", runTryOn };
