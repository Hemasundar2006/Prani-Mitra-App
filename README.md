# Prani Mitra

Prani Mitra is a multilingual mobile assistant for farmers. Farmers can speak naturally in English, Hindi, or Telugu and receive practical help about crops, animals, nutrition, government schemes, weather, and general questions.

The app provides a simple flow: choose a service, start a voice conversation, speak, listen to Mitra's answer, and end the call. After the call, the recording can be analyzed to create a summary, identify urgency, and suggest the next action.

## Main features

- English, Hindi, and Telugu interface and voice support.
- Call-style live voice screen branded as Prani Mitra.
- Live user transcript and assistant response display.
- Gemini-powered farming and animal-care answers.
- Post-call recording analysis with summary, urgency, and immediate action.
- Animal health, farming, nutrition, government schemes, and general question contexts.
- Verified nearby support contacts for urgent or warning cases.
- Recording download through the device share sheet.
- Analysis history screen.
- Daily 8:00 AM local-language reminder, including the farmer's name when available.
- Login, registration, OTP login, profile, history, and support flows.

## How the voice assistant works

```text
Farmer speaks -> Expo microphone -> Gemini Live transcript and answer
       -> app displays both sides of the conversation
End call -> backend uses Gnani Prisma + Gemini for post-call analysis
       -> app displays summary, urgency, action, and verified contacts
```

Gnani Prisma is used for recorded-audio speech-to-text analysis. Gemini is used for live conversation and reasoning. Gnani Timbre can be used by the backend when server-side text-to-speech is required. Provider secrets stay on the backend.

## Technology stack

- Expo SDK 58, React Native, TypeScript, and Expo Router.
- `expo-audio` for microphone capture and playback.
- `expo-location` for nearby-contact distance sorting.
- `expo-notifications` for daily reminders.
- `expo-secure-store` and AsyncStorage for session and local data.
- Gemini Live and Gemini reasoning for conversation and analysis.
- Gnani Prisma for recorded speech transcription; optional Gnani Timbre for server-side speech output.
- JWT-authenticated REST endpoints, WebSocket support, database persistence, and EAS Build.

## Project structure

```text
src/app/                  Expo Router screens
src/components/           Reusable UI components and modals
src/context/              Authentication, language, and app state
src/i18n/                 English, Hindi, and Telugu translations
src/services/             API, voice, notifications, storage, and audio helpers
assets/                   App icons, splash assets, and illustrations
docs/screenshots/         Selected product screenshots
PROJECT_DOCUMENTATION.md  Detailed project and hackathon documentation
TECHNOLOGIES_USED.md      Technology reference
```

## Run locally

Requirements: Node.js, npm, an Android/iOS device or emulator, and an Expo account for EAS builds.

```bash
npm install
npx expo start
```

For a physical device, use the QR code in the terminal or Expo DevTools. The device and computer must be able to reach the development server. A native development build is required for native modules that are not included in Expo Go.

## Environment variables

Create a local `.env` file and never commit it:

```ini
EXPO_PUBLIC_API_URL=https://prani-mitra-backend1.onrender.com/api
EXPO_PUBLIC_ASSISTANT_WS_URL=wss://prani-mitra-backend1.onrender.com/ws/assistant
EXPO_PUBLIC_MSG91_WIDGET_ID=your_widget_id
EXPO_PUBLIC_MSG91_TOKEN_AUTH=your_mobile_integration_token
```

Never put `GEMINI_API_KEY`, Gnani API keys, database credentials, JWT signing secrets, or Twilio credentials in `EXPO_PUBLIC_*` variables. Those belong in the backend deployment environment.

## Backend contract

The mobile app expects these authenticated backend routes:

- `POST /api/auth/login` and the other authentication routes.
- `POST /api/assistant/live-token` for a short-lived Gemini Live token.
- `POST /api/assistant/analyze-recording` for post-call analysis.
- `GET /api/assistant/recordings` for analysis history.
- `GET /api/support/nearby` for verified emergency and support contacts.

The live-token route must keep the Gemini key server-side and return a short-lived token only. The recording-analysis route must accept non-empty base64 PCM16 mono 16 kHz audio, normalize English, Hindi, and Telugu (including `తెలుగు` and `हिन्दी`), and return transcript, summary, urgency, action, and contacts. See [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md) for request and response examples.

Backend repository: [Prani Mitra Backend](https://github.com/Hemasundar2006/Prani-Mitra-Backend1)

## Permissions and release checks

The app requests microphone access for voice calls, location access when nearby contacts are needed, and notification access for daily reminders. These permissions are declared in `app.json` through Expo config plugins. Rebuild after changing permissions or native dependencies.

Before release, verify the production API and live-token endpoint, microphone capture, all three languages, post-call analysis, verified emergency contacts, local-time notifications, and safe logging without provider keys or private conversation text.

## Quality checks

```bash
npm test
npx tsc --noEmit
npx expo lint
npx expo-doctor
```

## Build an APK

```bash
npx eas-cli@latest build --platform android --profile preview
npx eas-cli@latest build --platform android --profile production-apk
```

The latest recorded EAS build is [Expo build 95d7760e](https://expo.dev/accounts/marothihemasundar03/projects/pranimitra/builds/95d7760e-9f28-43aa-8133-43e0882a608e).

## Demo flow

1. Select English, Hindi, or Telugu.
2. Sign in or register.
3. Choose Animal Health, Farming, Nutrition, Schemes, or General.
4. Tap Start conversation and allow microphone access.
5. Ask a question and watch the live conversation.
6. End the call to generate the recording analysis.
7. Review summary, urgency, action, and nearby verified contacts.
8. Open Analysis History or download the recording.

## Documentation and screenshots

- [Detailed project documentation](PROJECT_DOCUMENTATION.md)
- [Technologies used](TECHNOLOGIES_USED.md)
- [Product screenshots](docs/screenshots/)
- [Prani Mitra mobile repository](https://github.com/Hemasundar2006/Prani-Mitra-App)

## Safety

Prani Mitra provides guidance, not a replacement for a qualified veterinarian, agriculture officer, or emergency service. Recommendations should be verified locally when symptoms are severe. The app must never invent emergency phone numbers; contacts must come from verified backend records.
