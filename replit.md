# Shufti

## Overview

Shufti is a GPS-guided audio tour platform focused on Oman. It consists of two main components:

1. **Shufti Web App** - A SolidJS-based web application with tour discovery (Explore page) and admin functionality for tour creators. Features full-screen swipeable tour cards with lime green (#7cb342) and orange (#ff7043) color theme on white background.
2. **Shufti Player** (Mobile App) - An Expo/React Native mobile application (in the `player/` directory) that serves as the GPS-guided tour player for Android and iOS. Built via Expo EAS cloud builds.

The web app allows users to discover tours through swipeable cards, while tour administrators can create tour projects with interactive maps, manage routes with stops and control points, upload media assets, and export project bundles as zip files.

## User Preferences

- Preferred communication style: Simple, everyday language
- Color theme: White background with lime green (#7cb342) and orange (#ff7043) accents
- UX priority: Discovery-first experience with full-screen swipeable tour cards
- Payment: "Coming Soon" placeholder for MVP (free downloads)

## System Architecture

### Web App (SolidJS)

- **Framework**: SolidJS with TypeScript
- **Routing**: @solidjs/router using hash-based routing
- **Build Tool**: Vite with vite-plugin-solid
- **Styling**: CSS Modules for component-scoped styles
- **Deployment**: Static deployment via serve-handler (dist/ folder)

**Key pages:**
- `/` - Explore page with swipeable tour cards (main user experience)
- `/profile` - User profile and settings
- `/bundles` - Downloaded tours for offline use
- `/admin` - Tour editor/admin panel for tour creators

**Key architectural patterns:**
- Context-based state management using SolidJS contexts (`ProjectContext`, `TourContext`, `MapContext`)
- Resource-based async data fetching with `createResource`
- Touch/swipe gesture handling for tour navigation

### Mobile App (Expo/React Native)

Located in `player/` directory. Built via Expo EAS (cloud builds - no local Xcode required).

**Screen Flow:**
```
ExploreScreen → TourDetailsScreen → Download → ActiveToursScreen → MapPlayerScreen
```

**Screens:**
- `ExploreScreen` - Swipeable tour discovery cards with sample tours
- `TourDetailsScreen` - Tour info, expandable map preview with pins/route, download CTA
- `ActiveToursScreen` - List of downloaded tours with progress tracking
- `MapPlayerScreen` - Full-screen map with GPS tracking, audio controls, stop highlighting

**Components:**
- `BottomTabs` - Navigation between Discover and My Tours tabs

**Services:**
- `tourLoader.ts` - Download tours, manage offline storage (expo-file-system + AsyncStorage)
- `audioPlayer.ts` - expo-av audio playback with background support, seek, pause/resume
- `locationService.ts` - GPS tracking, geofence detection for stop triggers

**Key Features:**
- GPS-guided audio playback with automatic triggering at waypoints
- Offline tour downloads with progress tracking
- Pause/resume persistence (saves stop index + audio position to AsyncStorage)
- Background audio capability for hands-free walking
- Map with route polyline, stop pins (color-coded: current/visited/upcoming)

**Data Types (player/src/types/tour.ts):**
- `TourPreview` - Tour card data for discovery
- `DownloadedTour` - Full tour with assets and offline status
- `TourProgress` - Playback state (currentStopIndex, audioPosition, visitedStops)

### Data Layer

- **Client Storage**: IndexedDB via the `idb` library for persistent browser storage
- **Data Validation**: Zod schemas for all data models (projects, tours, waypoints, assets)
- **Asset Management**: Content-addressed storage using SHA-256 hashes (via hash-wasm)

**Core data models:**
- `ProjectModel` - Contains tours and assets
- `TourModel` - Tour with route waypoints, POIs, and path
- `StopModel` / `ControlPointModel` - Waypoint types within tours
- Assets referenced by hash with metadata (type, hash)

### Map Integration

- **Library**: MapLibre GL JS (web), react-native-maps (mobile)
- **Tile Provider**: MapTiler for base map tiles
- **Routing**: OpenStreetMap Valhalla API for route calculation between waypoints
- **Geospatial**: @turf/circle for geographic calculations

### Project Export/Import

- **Export Format**: Zip bundles containing:
  - `shufti.json` - Project data
  - `index.html` / `index.js` - Self-contained loader for web hosting
  - Asset files named by their SHA-256 hash
- **Import**: Supports loading from zip files or URLs

## External Dependencies

### Third-Party Services

| Service | Purpose |
|---------|---------|
| MapTiler | Base map tiles for the web editor |
| OpenStreetMap Valhalla | Route calculation between tour waypoints |
| Expo EAS | Mobile app cloud builds |

### Key NPM Dependencies (Web)

| Package | Purpose |
|---------|---------|
| solid-js | UI framework |
| @solidjs/router | Client-side routing |
| maplibre-gl | Interactive maps |
| idb | IndexedDB wrapper for browser storage |
| jszip | Project bundle creation/extraction |
| zod | Runtime data validation |
| hash-wasm | SHA-256 hashing for content-addressed storage |
| @turf/circle | Geospatial calculations |

### Key NPM Dependencies (Mobile - player/)

| Package | Purpose |
|---------|---------|
| expo | React Native framework |
| expo-av | Audio playback with background support |
| expo-location | GPS tracking |
| expo-file-system | Offline file storage |
| react-native-maps | Map display |
| @react-native-async-storage/async-storage | Progress persistence |

### Build & Deploy

| Package | Purpose |
|---------|---------|
| vite | Development server and bundler |
| esbuild | Bundling the export script |
| typescript | Type checking |
| serve-handler | Production static file server |

## Building the Mobile App

```bash
cd player
npx eas-cli@latest login
npx eas-cli@latest build --profile preview --platform android
# or for iOS:
npx eas-cli@latest build --profile preview --platform ios
```
