// Body / fit profile vocabulary, shared by the profile form, the AI stylist,
// and the photo-analysis route.

export const BODY_SHAPES = [
  "Hourglass",
  "Pear / triangle",
  "Apple / round",
  "Rectangle",
  "Inverted triangle",
  "Not sure",
] as const;

export const FIT_PREFERENCES = [
  "Fitted",
  "Relaxed",
  "Structured / tailored",
  "Flowy",
  "Mix depending on piece",
] as const;

// Areas users commonly want to emphasize or de-emphasize.
export const BODY_AREAS = [
  "Waist",
  "Shoulders",
  "Arms",
  "Bust / chest",
  "Stomach",
  "Hips",
  "Thighs",
  "Calves",
  "Legs (length)",
  "Back",
] as const;

export interface PhotoAnalysis {
  body_shape?: string;
  proportions?: string;
  coloring?: string;
  palette?: string[];
  silhouettes?: string[];
  summary?: string;
}

export interface StyleProfile {
  user_id: string;
  height_cm: number | null;
  body_shape: string | null;
  proportions: string | null;
  fit_preference: string | null;
  flatter: string[];
  downplay: string[];
  sizes: Record<string, string>;
  avoid_colors: string[];
  notes: string | null;
  photo_path: string | null;
  photo_analysis: PhotoAnalysis | null;
  updated_at?: string;
}

// Build a compact, neutral "fit brief" for the stylist's system prompt.
// Returns null when the profile has nothing useful to say.
export function buildFitBrief(p: StyleProfile | null): string | null {
  if (!p) return null;
  const lines: string[] = [];
  if (p.height_cm) lines.push(`Height: ${p.height_cm} cm`);
  if (p.body_shape && p.body_shape !== "Not sure")
    lines.push(`Body shape: ${p.body_shape}`);
  if (p.proportions) lines.push(`Proportions: ${p.proportions}`);
  if (p.fit_preference) lines.push(`Preferred fit: ${p.fit_preference}`);
  if (p.flatter.length) lines.push(`Wants to emphasize: ${p.flatter.join(", ")}`);
  if (p.downplay.length)
    lines.push(`Wants to de-emphasize: ${p.downplay.join(", ")}`);
  if (p.avoid_colors.length)
    lines.push(`Colors to avoid: ${p.avoid_colors.join(", ")}`);
  if (p.notes) lines.push(`Notes: ${p.notes}`);
  if (p.photo_analysis?.summary)
    lines.push(`Photo analysis: ${p.photo_analysis.summary}`);
  if (p.photo_analysis?.silhouettes?.length)
    lines.push(
      `Suggested silhouettes: ${p.photo_analysis.silhouettes.join(", ")}`,
    );

  return lines.length ? lines.join("\n") : null;
}
