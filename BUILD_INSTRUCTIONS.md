# Shufti App - Build & Deployment Instructions

This document provides complete instructions for building and deploying the Shufti mobile app to iOS and Android devices.

## Project Overview

Shufti consists of two components:
1. **Shufti Builder** (Web Editor) - Create and manage tours in your browser
2. **Shufti App** (Mobile Player) - GPS-guided tour player for phones

---

## Part 1: Download the Project from Replit

### Method A: Export as ZIP (Recommended)
1. In Replit, click the three-dot menu (**...**) in the Files panel
2. Select **"Export as ZIP"**
3. Save the ZIP file to your Mac
4. Extract the ZIP to a folder (e.g., `~/Projects/shufti`)

### Method B: Using Git
If your project has Git enabled:
```bash
# Clone from your Replit Git URL
git clone <your-replit-git-url> ~/Projects/shufti
```

### Method C: Download Individual Files
1. Right-click on the `app` folder in Replit
2. Select **"Download"** to download as ZIP
3. Extract to your Mac

---

## Part 2: Prerequisites for iOS Development

### Required Software
- **macOS** (Sonoma 14.0 or later recommended)
- **Xcode 15+** (free from Mac App Store)
- **Flutter SDK** (3.24.0 or later)
- **CocoaPods** (for iOS dependencies)

### Install Flutter on Mac
```bash
# Download Flutter (or use Homebrew)
brew install flutter

# Verify installation
flutter doctor

# Accept Xcode licenses
sudo xcodebuild -license accept
```

### Install CocoaPods
```bash
sudo gem install cocoapods
```

---

## Part 3: Configure iOS Project

### Step 1: Navigate to the App Directory
```bash
cd ~/Projects/shufti/app
```

### Step 2: Get Flutter Dependencies
```bash
flutter pub get
```

### Step 3: Install iOS Dependencies
```bash
cd ios
pod install
cd ..
```

### Step 4: Open in Xcode
```bash
open ios/Runner.xcworkspace
```

**Important:** Always open `Runner.xcworkspace`, NOT `Runner.xcodeproj`

---

## Part 4: Configure Xcode Settings

### In Xcode, configure the following:

#### 1. Select Your Team (Apple Developer Account)
1. Click **Runner** in the left sidebar
2. Select the **Runner** target
3. Go to **Signing & Capabilities** tab
4. Under **Team**, select your Apple Developer account
   - If you don't have one, click "Add Account" to sign in with your Apple ID
5. Enable **"Automatically manage signing"**

#### 2. Set Bundle Identifier
1. In the same tab, find **Bundle Identifier**
2. Change it to something unique: `com.yourcompany.shufti`
   - Replace `yourcompany` with your company or name

#### 3. Verify Display Name
1. Go to the **General** tab
2. Confirm **Display Name** is "Shufti"

#### 4. Set Minimum iOS Version
1. In **General** tab, set **Minimum Deployments** to iOS 13.0 or higher

---

## Part 5: Configure Tour Content URL

Before building, you need to configure where the app downloads tour content from.

### Edit the Tour URL
1. Open `app/lib/main.dart`
2. Find the `baseUrl` configuration
3. Update it to point to your hosted tour bundle:

```dart
// Example: Point to your web server hosting the tour bundle
static const String baseUrl = 'https://yourdomain.com/tours/shufti.json';
```

**Note:** The tour bundle is created by exporting from Shufti Builder and hosting the ZIP contents on a web server.

---

## Part 6: Build and Run

### Run on iOS Simulator
```bash
cd ~/Projects/shufti/app
flutter run
```

### Run on Physical iPhone
1. Connect your iPhone via USB cable
2. Trust your computer on the iPhone (Settings > General > Device Management)
3. In Xcode, select your iPhone from the device dropdown (top left)
4. Click the **Play** button or press `Cmd+R`

### Build for Release
```bash
# Build release IPA for App Store
flutter build ipa

# The IPA will be at: build/ios/archive/Runner.ipa
```

---

## Part 7: Deploy to App Store

### Using Xcode
1. In Xcode: **Product > Archive**
2. Wait for the archive to complete
3. Click **Distribute App**
4. Select **App Store Connect**
5. Follow the prompts to upload

### Using Transporter App
1. Build the IPA: `flutter build ipa`
2. Download the Transporter app from the Mac App Store
3. Drag the IPA file into Transporter
4. Upload to App Store Connect

---

## Part 8: Android Build (Bonus)

### Build APK
```bash
cd ~/Projects/shufti/app
flutter build apk --release
```
The APK will be at: `build/app/outputs/flutter-apk/app-release.apk`

### Build App Bundle (for Play Store)
```bash
flutter build appbundle --release
```
The bundle will be at: `build/app/outputs/bundle/release/app-release.aab`

---

## Troubleshooting

### "No provisioning profiles found"
- Enable "Automatically manage signing" in Xcode
- Make sure you're signed into your Apple Developer account

### CocoaPods errors
```bash
cd ios
pod deintegrate
pod install --repo-update
```

### Build fails after Flutter upgrade
```bash
flutter clean
flutter pub get
cd ios && pod install --repo-update
```

### "Code signing" errors
- Verify your Bundle ID matches what's in App Store Connect
- Make sure your Apple Developer account has the required certificates

---

## File Structure Reference

```
app/
├── ios/
│   ├── Runner/
│   │   ├── Info.plist          # App configuration (name, permissions)
│   │   └── Assets.xcassets/    # App icons
│   ├── Runner.xcworkspace      # Open this in Xcode!
│   └── Podfile                 # iOS dependencies
├── lib/
│   └── main.dart               # Main app entry point
├── assets/
│   └── tomtom.txt              # TomTom API key (for satellite maps)
└── pubspec.yaml                # Flutter dependencies
```

---

## API Keys Required

### TomTom (for satellite imagery)
1. Create account at https://developer.tomtom.com
2. Get an API key
3. Add it to `app/assets/tomtom.txt`

---

## Need Help?

- Flutter documentation: https://docs.flutter.dev
- Xcode help: https://developer.apple.com/xcode
- App Store submission guide: https://developer.apple.com/app-store/submitting

---

## Version Info

- Shufti App version: 1.0.0
- Flutter SDK requirement: >=3.4.0
- Minimum iOS: 13.0
- Minimum Android: API 21 (Android 5.0)
