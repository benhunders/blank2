import "server-only";
import {
  PROVIDERS,
  PROVIDER_IDS,
  type TryOnProvider,
  type TryOnProviderId,
} from "./types";
import { fashnProvider } from "./fashn";
import { falProvider } from "./fal";

const REGISTRY: Record<TryOnProviderId, TryOnProvider> = {
  fashn: fashnProvider,
  fal: falProvider,
};

export function isConfigured(id: TryOnProviderId): boolean {
  return !!process.env[PROVIDERS[id].envKey];
}

export function configuredProviderIds(): TryOnProviderId[] {
  return PROVIDER_IDS.filter(isConfigured);
}

export function defaultProviderId(): TryOnProviderId {
  const env = process.env.TRYON_PROVIDER as TryOnProviderId | undefined;
  return env && PROVIDER_IDS.includes(env) ? env : "fashn";
}

// Resolve a provider: prefer the requested one (if valid + configured), then
// the env default, then any configured provider. Throws if none is configured.
export function getTryOnProvider(requested?: string): TryOnProvider {
  const candidates: TryOnProviderId[] = [];
  if (requested && PROVIDER_IDS.includes(requested as TryOnProviderId)) {
    candidates.push(requested as TryOnProviderId);
  }
  candidates.push(defaultProviderId());
  for (const id of candidates) {
    if (isConfigured(id)) return REGISTRY[id];
  }
  const fallback = configuredProviderIds()[0];
  if (fallback) return REGISTRY[fallback];
  throw new Error("No try-on provider is configured.");
}
