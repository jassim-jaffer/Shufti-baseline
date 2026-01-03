# Shufti Player

GPS-triggered audio tour player app for Oman. Built with Expo (React Native).

## Features

- **GPS Auto-Play**: Audio triggers automatically when you reach a tour stop
- **Offline Support**: Download tours and use them without internet
- **Heatmap Map**: See all tour stops on an interactive map centered on Oman
- **Background Audio**: Audio continues playing when app is minimized
- **Progress Tracking**: See which stops you've visited

## Setup

### Prerequisites

1. **Node.js 20+** installed on your computer
2. **Expo CLI**: `npm install -g expo-cli`
3. **EAS CLI**: `npm install -g eas-cli`
4. **Expo Account**: Create one at https://expo.dev

### For iOS builds:
- Apple Developer account ($99/year)
- App Store Connect access

### For Android builds:
- Google Play Developer account ($25 one-time)

## Installation

1. Download the `/player` folder to your computer

2. Install dependencies:
   ```bash
   cd player
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Scan the QR code with Expo Go app on your phone to test

## Building for App Stores

### Initial Setup

1. Log in to Expo:
   ```bash
   eas login
   ```

2. Configure your project:
   ```bash
   eas build:configure
   ```

3. Update `app.json`:
   - Replace `com.shufti.player` with your bundle identifier
   - Update the `eas.json` with your Apple ID and App Store Connect details

### Build for iOS

```bash
eas build --platform ios --profile production
```

This builds in the cloud - no Xcode required!

### Build for Android

```bash
eas build --platform android --profile production
```

### Submit to Stores

```bash
eas submit --platform ios
eas submit --platform android
```

## How It Works

1. **Create tours** using the Shufti Admin Panel (web or app)
2. **Export** the tour bundle as a zip file
3. **Host** the extracted bundle on any web server
4. **Add the URL** in the Shufti Player app
5. **Walk the tour** - audio plays automatically at each stop

## Project Structure

```
player/
├── App.tsx                 # Main app entry point
├── app.json                # Expo configuration
├── eas.json                # EAS Build configuration
├── package.json            # Dependencies
├── src/
│   ├── screens/
│   │   ├── HomeScreen.tsx      # Tour list
│   │   └── TourMapScreen.tsx   # Map & audio player
│   ├── services/
│   │   ├── tourLoader.ts       # Download & cache tours
│   │   ├── locationService.ts  # GPS tracking
│   │   └── audioPlayer.ts      # Audio playback
│   ├── types/
│   │   └── tour.ts             # TypeScript types
│   └── utils/
│       └── polyline.ts         # Route decoding
└── assets/                 # App icons and splash
```

## Customization

### Change Colors
Edit the colors in each screen file:
- Header background: `#1a1a2e`
- Primary button: `#007AFF`
- Visited stop: `#4CAF50`
- Unvisited stop: `#FF5722`

### Change Default Region
Edit `OMAN_CENTER` in `TourMapScreen.tsx`:
```typescript
const OMAN_CENTER = {
  latitude: 23.5859,
  longitude: 58.4059,
  latitudeDelta: 0.5,
  longitudeDelta: 0.5,
};
```

## Troubleshooting

### "Location permission denied"
Make sure to grant location access in your device settings.

### Audio not playing in background
On iOS, background audio should work automatically. On Android, check that the app has the necessary permissions.

### Tour not loading
Check that the tour URL is correct and the server allows CORS requests.
