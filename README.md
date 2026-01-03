## TourForge Baseline Starter App

This project is a Flutter-based starter for building your own branded tour application. The app source code is located in the `./app` directory.

### Important Configuration Notes

- **TomTom API Key**: Satellite imagery requires a TomTom API key. Add your key to `app/assets/tomtom.txt`.
- **Development Environment**: On Replit, we use Flutter Web for fast UI iteration and content loading verification. Native iOS/Android builds and background-audio validation will be performed later on real devices or via CI/CD pipelines.

### Development

To start the development server, click the **Run** button or use:
```sh
cd app && flutter pub get && flutter run -d chrome --web-port 5000 --web-hostname 0.0.0.0
```
