# Shufti

## Overview

Shufti is a GPS-guided audio tour platform. It consists of two main components:

1. **Shufti Builder** (Web Editor) - A SolidJS-based single-page application for creating and managing tour projects, including tours, waypoints, points of interest, and associated media assets (images, audio)
2. **Shufti App** (Mobile Player) - A Flutter-based mobile application (in the `app/` directory) that serves as the GPS-guided tour player for Android and iOS

The web editor allows users to create tour projects with interactive maps, manage routes with stops and control points, upload media assets, and export project bundles as zip files that can be hosted on web servers for consumption by the mobile app.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture (Web Editor)

- **Framework**: SolidJS with TypeScript
- **Routing**: @solidjs/router using hash-based routing
- **Build Tool**: Vite with vite-plugin-solid
- **Styling**: CSS Modules for component-scoped styles

**Key architectural patterns:**
- Context-based state management using SolidJS contexts (`ProjectContext`, `TourContext`, `MapContext`)
- Resource-based async data fetching with `createResource`
- Component composition with lazy loading for code splitting (e.g., `TourEditor`)

**Main page structure:**
- `Home` - Project listing and creation
- `ProjectEditor` - Project-level editing with nested routes for tours, assets, and management
- `TourEditor` - Interactive map-based tour editing with waypoints and routes

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

- **Library**: MapLibre GL JS for interactive mapping
- **Tile Provider**: MapTiler for base map tiles
- **Routing**: OpenStreetMap Valhalla API for route calculation between waypoints
- **Geospatial**: @turf/circle for geographic calculations, custom polyline encoding

### Project Export/Import

- **Export Format**: Zip bundles containing:
  - `shufti.json` - Project data
  - `index.html` / `index.js` - Self-contained loader for web hosting
  - Asset files named by their SHA-256 hash
- **Import**: Supports loading from zip files or URLs with cross-origin messaging for asset retrieval

### Mobile App (Flutter)

- Located in `app/` directory
- Uses MapLibre for maps with TomTom satellite imagery
- Consumes project bundles exported from the web editor

## External Dependencies

### Third-Party Services

| Service | Purpose |
|---------|---------|
| MapTiler | Base map tiles for the web editor |
| OpenStreetMap Valhalla | Route calculation between tour waypoints |
| TomTom | Satellite imagery for mobile app (requires API key in `app/assets/tomtom.txt`) |

### Key NPM Dependencies

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

### Build Dependencies

| Package | Purpose |
|---------|---------|
| vite | Development server and bundler |
| esbuild | Bundling the export script (`src/bundle/index.ts`) |
| typescript | Type checking |
| eslint | Code linting |
