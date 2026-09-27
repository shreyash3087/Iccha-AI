/**
 * POST /api/token
 *
 * Mints a short-lived LiveKit access token for a user to join a room.
 *
 * Security model:
 *   - LIVEKIT_API_KEY and LIVEKIT_API_SECRET live ONLY on the server (no
 *     NEXT_PUBLIC_ prefix). They are never sent to the browser.
 *   - The browser receives only the signed JWT token, which expires in 15
 *     minutes and is scoped to a single room.
 *   - The agent is dispatched via an AgentDispatch embedded in the token, so
 *     the browser never needs to know about agent routing directly.
 *
 * Request body: { roomName: string, participantName: string }
 * Response:     { token: string } | { error: string }
 */

import {
  AccessToken,
  AgentDispatchClient,
  RoomAgentDispatch,
  RoomConfiguration,
} from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";

// ── Environment validation ─────────────────────────────────────────────────
//
// Fail fast at request time with a clear message rather than a cryptic error
// deep in the LiveKit SDK if credentials are missing.

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Check your .env.local file.`
    );
  }
  return value;
}

// ── Token generation ───────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { roomName, participantName, language = "hi-en", sessionId } = await req.json();

    // Validate inputs
    if (!roomName || typeof roomName !== "string") {
      return NextResponse.json(
        { error: "roomName is required and must be a string" },
        { status: 400 }
      );
    }
    if (!participantName || typeof participantName !== "string") {
      return NextResponse.json(
        { error: "participantName is required and must be a string" },
        { status: 400 }
      );
    }

    const apiKey = getRequiredEnv("LIVEKIT_API_KEY");
    const apiSecret = getRequiredEnv("LIVEKIT_API_SECRET");
    const agentName =
      process.env.NEXT_PUBLIC_AGENT_NAME ?? "iccha-agent";

    // Build the access token
    // metadata field is per-participant — the Python worker can read it
    // from ctx.room.local_participant.metadata when the session starts.
    const token = new AccessToken(apiKey, apiSecret, {
      identity: participantName,
      // Token expires in 15 minutes — enough for a full onboarding session
      ttl: "15m",
      metadata: JSON.stringify({
        agentName,
        language,
        sessionId: sessionId ?? null,
        createdAt: new Date().toISOString(),
      }),
    });

    // Grant room access
    token.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,       // User publishes their mic track
      canSubscribe: true,     // User receives the agent's audio track
      canPublishData: true,   // Required for LiveKit data channels
    });

    // Embed agent dispatch in token so LiveKit Cloud automatically pulls the agent in
    token.roomConfig = new RoomConfiguration({
      agents: [
        new RoomAgentDispatch({
          agentName,
          metadata: JSON.stringify({ participantName }),
        }),
      ],
    });

    // Also explicitly create dispatch via AgentDispatchClient to guarantee assignment
    try {
      const rawUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL ?? "";
      const host = rawUrl.replace("wss://", "https://").replace("ws://", "http://");
      if (host) {
        const dispatchClient = new AgentDispatchClient(host, apiKey, apiSecret);
        await dispatchClient.createDispatch(roomName, agentName, {
          metadata: JSON.stringify({ participantName }),
        });
      }
    } catch (dispatchErr) {
      // Non-fatal if roomConfig handles it
      console.warn("[Token API] Explicit dispatch notice:", dispatchErr);
    }

    const jwt = await token.toJwt();

    return NextResponse.json({ token: jwt });
  } catch (error) {
    console.error("[/api/token] Error:", error);

    const message =
      error instanceof Error ? error.message : "Internal server error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Only POST is supported — return 405 for anything else
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
