# Prani Mitra assistant API

This is the assistant handler and farming reference copied from `prani-mitra-demo2`. It handles text replies, voice transcription, speech playback, and conversation summaries at `POST /api/assistant`. It also issues short-lived Gemini Live tokens at `POST /api/assistant/live-token`; the app connects directly to Gemini for live audio. API keys stay on this server and must never be placed in an `EXPO_PUBLIC_` variable or the mobile app.

1. Copy `.env.example` to `.env` here. Set `GEMINI_API_KEY` for Gemini replies and live token issuance. Set `AUTH_JWT_SECRET` to the same HS256 signing secret used by the main login backend, so the token endpoint can authenticate the app user. Set `GNANI_API_KEY` only if the legacy REST speech routes are used. Keep all secrets on this server only.
2. On Node 20 or newer, run `node --env-file=.env server.mjs` from this folder.
3. Set `EXPO_PUBLIC_ASSISTANT_URL` for the Expo app to `http://<your-computer-LAN-IP>:3000/api/assistant` on a physical phone. Android emulator can use `http://10.0.2.2:3000/api/assistant`; iOS simulator and web can use `http://localhost:3000/api/assistant`. Restart Expo after changing the variable.
4. For a deployed app, deploy this `assistant-service` Node service or route both `/api/assistant` and `/api/assistant/live-token` to its handler. Set `GEMINI_API_KEY` and `AUTH_JWT_SECRET` on the host. Set `EXPO_PUBLIC_GEMINI_TOKEN_URL` in the Expo environment to `https://<your-host>/api/assistant/live-token`. Configure `ASSISTANT_ALLOWED_ORIGINS` for production web origins. Local development accepts localhost preview ports.

Restrict access and add rate limits before exposing a paid AI service publicly.
