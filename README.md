## Shufti - GPS-Guided Audio Tours

Shufti is a complete platform for creating and delivering GPS-guided audio tours. It consists of two components:

### Components

1. **Shufti Builder** (Web Editor) - A browser-based tool for creating tours with interactive maps, waypoints, and media assets
2. **Shufti App** (Mobile Player) - A Flutter-based mobile app for playing GPS-triggered audio tours (located in `./app` directory)

### Configuration

- **TomTom API Key**: Satellite imagery requires a TomTom API key. Add your key to `app/assets/tomtom.txt`
- **Tour Content URL**: Update the `baseUrl` in `app/lib/main.dart` to point to your hosted tour content

### Development

The app runs on port 5000. To start:
```sh
cd app && flutter pub get && flutter run -d web-server --web-port 5000 --web-hostname 0.0.0.0 --release
```

### Architecture

- **Web Editor**: SolidJS/TypeScript with MapLibre GL for interactive mapping
- **Mobile App**: Flutter with flutter_map and just_audio for GPS-triggered playback
- **Data Storage**: IndexedDB for browser persistence, content-addressed assets using SHA-256 hashes
- **Export Format**: Zip bundles with JSON tour data and media assets for web hosting
