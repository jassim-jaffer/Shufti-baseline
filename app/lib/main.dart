import 'package:flutter/material.dart';
import 'package:tourforge_baseline/tourforge.dart';

import '/theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await runTourForge(
    config: TourForgeConfig(
      appName: "Shufti",
      appDesc:
          '''Shufti is your GPS-guided audio tour companion. Discover amazing places with immersive audio experiences.''',
      // TODO: Replace with your tour content URL
      baseUrl: "https://tourforge.github.io/config/florence-navigator",
      baseUrlIsIndirect: true,
      lightThemeData: lightThemeData,
      darkThemeData: darkThemeData,
    ),
  );
}
