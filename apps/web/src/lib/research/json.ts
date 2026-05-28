export function parseJsonObjectFromModelText(text: string) {
  const trimmed = text.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    // Try common model-output wrappers below.
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) {
    try {
      return JSON.parse(fenced[1]);
    } catch {
      // Continue to brace extraction.
    }
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
  }

  throw new Error("Gemini response did not contain valid JSON.");
}

export function safeString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function safeNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return clampScore(value);
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return clampScore(parsed);
  }
  return null;
}

export function safeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => typeof item === "string").map((item) => item.trim()).filter(Boolean);
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}
