/**
 * Client-side LiveKit helpers.
 *
 * This module handles token fetching from our secure /api/token endpoint.
 * The browser never sees LiveKit credentials — only the short-lived JWT.
 */


export interface TokenResponse {
  token: string;
  error?: never;
}

export interface TokenError {
  token?: never;
  error: string;
}

export type SupportedLanguage =
  | "hi"   // Hindi
  | "hi-en" // Hinglish (default)
  | "mr"   // Marathi
  | "ta"   // Tamil
  | "te"   // Telugu
  | "kn"   // Kannada
  | "gu"   // Gujarati
  | "pa"   // Punjabi
  | "bn"   // Bengali
  | "en";  // English

export const LANGUAGE_OPTIONS: { code: SupportedLanguage; name: string; native: string; tag: string }[] = [
  { code: "hi-en", name: "Hinglish",  native: "Hindi + English", tag: "HI+EN" },
  { code: "hi",    name: "Hindi",     native: "हिंदी",            tag: "HI" },
  { code: "mr",    name: "Marathi",   native: "मराठी",             tag: "MR" },
  { code: "ta",    name: "Tamil",     native: "தமிழ்",             tag: "TA" },
  { code: "te",    name: "Telugu",    native: "తెలుగు",             tag: "TE" },
  { code: "kn",    name: "Kannada",   native: "ಕನ್ನಡ",            tag: "KN" },
  { code: "gu",    name: "Gujarati",  native: "ગુજરાતી",            tag: "GU" },
  { code: "pa",    name: "Punjabi",   native: "ਪੰਜਾਬੀ",            tag: "PA" },
  { code: "bn",    name: "Bengali",   native: "বাংলা",             tag: "BN" },
  { code: "en",    name: "English",   native: "English",           tag: "EN" },
];

/**
 * Generate a short, URL-safe session ID (12 chars, alphanumeric).
 * Used as both the LiveKit room name suffix and the temp site slug.
 */
export function generateSessionId(): string {
  // 9 bytes → 12 base64url chars; strip non-alphanum
  const arr = new Uint8Array(9);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => b.toString(36).padStart(2, "0"))
    .join("")
    .slice(0, 12);
}

/**
 * Fetch a short-lived LiveKit access token from our backend API.
 *
 * Accepts an optional `sessionId` — if provided, the same ID is used as
 * the room name and site slug so the voice session and website are linked.
 *
 * @param language   The shopkeeper's preferred language (default: 'hi-en')
 * @param sessionId  Pre-generated session ID (generate with generateSessionId())
 * @returns { token, roomName, sessionId } on success
 * @throws  Error with a user-facing message on failure
 */
export async function fetchToken(
  language: SupportedLanguage = "hi-en",
  sessionId?: string
): Promise<{
  token: string;
  roomName: string;
  sessionId: string;
}> {
  const sid = sessionId ?? generateSessionId();
  // Room name is deterministic from session ID — makes debugging easy
  const roomName = `iccha-${sid}`;
  const participantName = `user-${sid.slice(0, 8)}`;

  const res = await fetch("/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomName, participantName, language, sessionId: sid }),
  });

  const data: TokenResponse | TokenError = await res.json();

  if (!res.ok || data.error) {
    throw new Error(
      data.error ?? `Token request failed with status ${res.status}`
    );
  }

  return { token: data.token as string, roomName, sessionId: sid };
}

/**
 * LiveKit SFU URL from environment.
 * This is safe to expose to the browser (no secret).
 */
export function getLiveKitUrl(): string {
  const url = process.env.NEXT_PUBLIC_LIVEKIT_URL;
  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_LIVEKIT_URL is not set. Check your .env.local file."
    );
  }
  return url;
}
