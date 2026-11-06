# Gemini Live direct client setup

The Expo app connects directly to Gemini Live for microphone audio and model responses. The backend must not proxy audio, transcripts, generated speech, or conversation turns. It only authenticates the signed-in user and mints a short-lived Gemini Live ephemeral token.

## Token endpoint

Implement `POST /api/assistant/live-token` on the existing backend.

Request headers:

```http
Authorization: Bearer <PraniMitra login JWT>
Content-Type: application/json
```

Request JSON:

```json
{
  "purpose": "gemini-live",
  "model": "gemini-3.8-live"
}
```

Requirements:

- Validate the existing PraniMitra JWT and derive the user ID from it; do not trust a client-supplied user ID.
- Use the server-only `GEMINI_API_KEY` to create a Gemini Live ephemeral token with one use, a short `expireTime` (about 30 minutes), and a short `newSessionExpireTime` (about 60 seconds).
- Restrict the token to `models/gemini-3.8-live` and audio response modality when supported by the token constraints.
- Return `{ "token": "<token.name>", "expiresAt": "<ISO timestamp>" }` with HTTP 200. Never return or log the permanent Gemini API key.
- Rate-limit token creation per authenticated user and return clear 401/429/503 errors.
- Do not proxy or store audio, transcripts, answers, or conversations. Do not use Gnani in this flow.

Environment variable:

```env
GEMINI_API_KEY=<server-only Gemini key>
AUTH_JWT_SECRET=<same HS256 secret used by the login backend>
```

## Direct Gemini connection used by Expo

The app fetches the ephemeral token from `EXPO_PUBLIC_GEMINI_TOKEN_URL`, then opens Gemini's constrained Live WebSocket directly:

```text
wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained?access_token=<ephemeral-token>
```

The app sends a setup message with `models/gemini-3.8-live`, audio response modality, input/output transcriptions, and the selected language/service instruction. It streams raw PCM16 little-endian mono audio at 16 kHz and handles Gemini's direct `serverContent` events, including transcripts, generated 24 kHz PCM audio, interruptions, and `turnComplete`.

Configure Expo:

```env
EXPO_PUBLIC_GEMINI_TOKEN_URL=https://prani-mitra-backend1.onrender.com/api/assistant/live-token
```

Deploy the token endpoint before testing the app. Audio and model responses then travel between Expo and Gemini, not through the Prani Mitra backend.

Official references:

- https://ai.google.dev/gemini-api/docs/live-api/ephemeral-tokens
- https://ai.google.dev/gemini-api/docs/live-api/get-started-websocket
- https://ai.google.dev/api/live
