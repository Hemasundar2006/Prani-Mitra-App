# Prani Mitra mobile app

Expo SDK 58 and Expo Router app for farming and animal care support. The entry screen uses the supplied Prani Mitra logo and farmer illustration, with a fixed Get Started button and English, Hindi, and Telugu selection. After sign-in, Home, Services, Ask Mitra, History, and Profile are available from the bottom navigation.

## Run

```bash
npm install
npm run start
npm run lint
node node_modules/typescript/bin/tsc --noEmit
```

The app calls `https://prani-mitra-backend1.onrender.com/api` by default. To point at a development backend, set `EXPO_PUBLIC_API_URL` to an address reachable from the device, including `/api`. `localhost` on a physical phone refers to the phone itself. Rebuild the native app to see changes to the native splash image or the SecureStore module.

## Connected features

- Password login, MSG91 OTP login, registration, and password recovery.
- Profile updates and secure native token storage.
- Account usage, weather, call history, call requests, plans, FAQs, and contact form.
- Live voice conversation connects to Gemini Live directly from the app after the authenticated backend issues a short-lived token. The app captures and displays transcripts, plays Gemini audio, and can download the recorded microphone audio.
- Animal health, farming, nutrition, government schemes, and general question contexts are selected in the live voice screen.
- Direct phone dialer and email support actions. Plan inquiries go to the in-app support form; payment checkout is not connected to a mobile payment SDK.

## Production configuration

The `testing` and `production` EAS profiles point the app to the deployed API and `/api/assistant/live-token`. Confirm those URLs match the backend you intend to ship. The backend must deploy that authenticated token endpoint and keep `GEMINI_API_KEY` server-side; never add Gemini or Gnani provider keys to Expo variables.

Add these public MSG91 widget values to both the EAS `preview` and `production` environments in Expo project settings: `EXPO_PUBLIC_MSG91_WIDGET_ID` and `EXPO_PUBLIC_MSG91_TOKEN_AUTH`. They are bundled into the app because the MSG91 widget is called from the client. Do not store provider API keys there. The backend separately needs the correct Render environment variables for live token provisioning.

Live recording needs microphone permission only. The `expo-audio` config plugin declares Android `RECORD_AUDIO` and iOS `NSMicrophoneUsageDescription`; background recording and playback stay disabled. Audio files use the app cache and the system share sheet, so no storage permission is required.

Expo production variables are selected by `build.production.environment` in `eas.json`. Set the same MSG91 values in the `preview` environment if you use the internal testing APK. Rebuild after changing environment variables or native permissions. A release build cannot be validated in Expo Go alone.

## Checks

Run `npm test`, `npm run lint`, and `npx tsc --noEmit`. Verify a production build on a physical Android and iOS device with production EAS variables, a deployed token endpoint, and microphone permission granted. Token issuance and live Gemini response still require a real signed-in account and reachable backend/provider credentials.
