# Project Report: TourForge Branded MVP

## Core Components

### 1. Admin Builder (Internal Company Tool)
- **Role**: A web-based "studio" for creating, editing, and managing GPS audio tours.
- **Technology**: Built with **SolidJS** and **TypeScript**.
- **Key Features**:
  - Interactive map for placing stops and waypoints.
  - Media management (audio uploads, image association).
  - Project export to self-contained tour bundles.
  - Local persistence via IndexedDB for maximum reliability.

### 2. Player App (Customer-Facing)
- **Role**: The mobile application used by tourists to play the GPS-guided audio tours.
- **Technology**: Built with **Flutter**.
- **Key Features**:
  - Real-time GPS tracking and automatic audio triggering.
  - Satellite map views (TomTom integration).
  - Content loading via URL for dynamic tour updates.
  - Branded UI customizable for your company identity.

## Current Progress & Status

- **Repositories**: Both the `builder` and `baseline` repositories have been successfully imported and merged into this project.
- **Environment**: Configured to run on Replit using Flutter Web for rapid UI iteration.
- **Configuration**:
  - `app/assets/tomtom.txt` created as a placeholder for your API key.
  - `app/lib/main.dart` tagged with a TODO for your tour content URL.
- **Next Steps**: Resolving minor dependency version conflicts in the Flutter environment to ensure a smooth "one-click" run experience.
