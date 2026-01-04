# Shufti

## Overview

Shufti is a GPS-guided audio tour platform focused on Oman. The production codebase is Flutter, built locally in Xcode. Replit serves as the code editing and Git sync environment.

## User Preferences

- Preferred communication style: Simple, everyday language
- Color theme: White background with lime green (#7CB342) and orange (#FF7043) accents
- UX priority: Discovery-first experience with full-screen swipeable tour cards
- Payment: "Coming Soon" placeholder for MVP (free downloads)
- Architecture: Flutter-only (no SolidJS or Expo in production)

## Current Status

The Flutter app has a working UI with hardcoded tour data:
- 3 sample Oman tours: Muttrah Souk (8 stops), Nizwa Fort (6 stops), Wadi Shab (5 stops)
- Swipeable Explore screen with full-screen tour cards
- Tour Details screen with expandable map preview and download/play buttons
- My Tours screen showing downloaded tours
- Bottom tab navigation (Discover / My Tours)
- State management via TourState ChangeNotifier singleton

## System Architecture

### Flutter App Structure

```
app/lib/main.dart          # App entry point (uses ShuftiApp)
lib/src/
├── models/
│   └── sample_tours.dart  # Hardcoded tour data + TourState singleton
├── screens/shufti/
│   ├── shufti_app.dart    # Main app with bottom tabs
│   ├── explore_screen.dart # Swipeable tour discovery cards
│   ├── tour_details_screen.dart # Tour info + download/play
│   └── my_tours_screen.dart # Downloaded tours list
```

### Key Colors

- Primary (Lime Green): #7CB342
- Accent (Orange): #FF7043
- Background: White

### Screen Flow

```
ExploreScreen → TourDetailsScreen → Download → My Tours Tab
```

### State Management

TourState (ChangeNotifier singleton) manages:
- Tour data (hardcoded sample tours)
- Download state (isDownloaded flag per tour)
- Notifies listeners when downloads complete

## Building the App

Pull from GitHub and open in Xcode:
```bash
git pull origin main
cd app
flutter pub get
open ios/Runner.xcworkspace
# Build and run on device
```

## Recent Changes

- 2026-01-04: Created Shufti Flutter UI with hardcoded Oman tour data
- Fixed state sync between tabs using ChangeNotifier pattern
- Replaced TourForge server-based loading with self-contained UI

## Legacy Code (Not in Production)

The following directories contain legacy code that is NOT used in production:
- `player/` - Expo/React Native (abandoned)
- SolidJS web app code - For reference only

The production app is Flutter-only, using files in `lib/src/screens/shufti/`.
