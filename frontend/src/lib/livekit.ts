/**
 * Client-side LiveKit helpers.
 *
 * This module handles token fetching from our secure /api/token endpoint.
 * The browser never sees LiveKit credentials — only the short-lived JWT.
 */

import { v4 as uuidv4 } from "uuid";

export interface TokenResponse {
  token: string;
  error?: never;
}

export interface TokenError {
  token?: never;
  error: string;
}

/**
 * Fetch a short-lived LiveKit access token from our backend API.
 *
 * Generates a unique room name per session (so each shopkeeper gets their
 * own isolated room). The participant identity is also unique per session.
 *
 * @returns { token, roomName } on success
 * @throws  Error with a user-facing message on failure
 */
export async function fetchToken(): Promise<{
  token: string;
  roomName: string;
}> {
  // Each session gets a fresh unique room — no cross-talk between users
  const roomName = `iccha-room-${uuidv4()}`;
  const participantName = `shopkeeper-${uuidv4().slice(0, 8)}`;

  const res = await fetch("/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomName, participantName }),
  });

  const data: TokenResponse | TokenError = await res.json();

  if (!res.ok || data.error) {
    throw new Error(
      data.error ?? `Token request failed with status ${res.status}`
    );
  }

  return { token: data.token as string, roomName };
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
