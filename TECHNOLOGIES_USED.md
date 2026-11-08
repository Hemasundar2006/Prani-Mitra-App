# Prani Mitra Technologies

## Mobile application

- Expo SDK 58
- React Native
- TypeScript
- Expo Router
- NativeWind and React Native styles
- Expo Audio for microphone capture and audio playback
- Expo File System for temporary audio files
- Expo Sharing for downloadable recordings
- Expo Notifications for daily 8:00 AM reminders
- Expo Location for nearby verified support contacts
- Expo Secure Store for login-token storage
- AsyncStorage for local profile, language, and conversation state

## Artificial intelligence

- Gnani Prisma Speech-to-Text for English, Hindi, and Telugu audio
- Gemini Live for real-time voice interaction
- Gemini reasoning for farming guidance and follow-up questions
- Gemini for transcript summaries, urgency detection, and immediate actions
- Gnani Timbre Text-to-Speech for spoken responses and notifications

## Backend

- Node.js backend
- REST APIs for authentication, analysis, history, and support contacts
- WebSocket communication for live voice sessions
- JWT authentication
- Database persistence for users, recordings, analyses, and verified contacts
- CORS support for the Expo web client

## Native capabilities

- Microphone recording
- PCM16 mono 16 kHz audio processing
- Audio playback
- Location permission for nearby services
- Android and iOS notifications
- Direct phone dialing for verified contacts
- Recording download and sharing

## Build and deployment

- EAS Build
- Android APK distribution
- Preview and production build profiles
- Render-compatible backend deployment
- Environment-based configuration

## Testing and quality

- TypeScript type checking
- Expo ESLint
- Realtime voice protocol tests
- Hindi and Telugu localization coverage tests
- Manual APK testing on a physical Android device

## Security

- Provider API keys remain on the backend.
- Login tokens are stored securely on supported devices.
- The Expo app receives only public URLs and temporary session tokens.
- Verified support contacts are returned from the backend database.
- The app does not invent emergency phone numbers.
