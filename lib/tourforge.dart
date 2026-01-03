library tourforge_baseline;

import 'dart:convert';
import 'dart:math';

import 'package:audio_session/audio_session.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter_displaymode/flutter_displaymode.dart';
import 'package:http/http.dart' as http;
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

import 'src/asset_garbage_collector.dart';
import 'src/config.dart';
import 'src/controllers/narration_playback.dart';
import 'src/download_manager.dart';
import 'src/screens/home.dart';
import 'src/help_viewed.dart';

export 'src/config.dart' show TourForgeConfig;
export 'src/location.dart' show requestGpsPermissions;
export 'src/screens/help_slides.dart';

Future<void> runTourForge({
  required TourForgeConfig config,
  Widget Function(BuildContext context, void Function() finish)? onboarding,
}) async {
  setTourForgeConfig(config);

  WidgetsFlutterBinding.ensureInitialized();
  if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
    FlutterDisplayMode.setHighRefreshRate();
  }

  Future<String> baseUrl = Future.value(tourForgeConfig.baseUrl);
  if (config.baseUrlIsIndirect) {
    baseUrl = Future.value(await _fetchBaseUrl(tourForgeConfig.baseUrl));
  }

  DownloadManager.instance = DownloadManager(
    getApplicationSupportDirectory().then((appSuppDir) {
      var base = p.join(appSuppDir.path, "tours");
      AssetGarbageCollector.base = base;
      return base;
    }),
    baseUrl,
  );

  final session = await AudioSession.instance;
  await session.configure(const AudioSessionConfiguration.speech());

  await NarrationPlaybackController.init();

  var onboarded = await HelpViewed.viewed("onboarding");
  runApp(_TourForgeApp(onboarded ? null : onboarding));
}

/// Tries really hard to fetch the baseUrl, repeatedly retrying forever if the
/// request fails.
Future<String> _fetchBaseUrl(String from) async {
  for (var i = 0;; i++) {
    try {
      var resp = await http.get(Uri.parse(from));
      if (resp.statusCode != 200) {
        if (kDebugMode) {
          print("Failed to fetch base URL from $from: HTTP ${resp.statusCode} response");
        }
        throw Exception("Failed to fetch base URL from indirect source");
      }
      var json = jsonDecode(resp.body);
      return json["baseUrl"];
    } catch (e) {
      if (kDebugMode) {
        print("Ignoring exception during fetchBaseUrl: $e");
      }
      // Wait 500ms, 1000ms, ... before trying again
      // Really crappy exponential backoff with no randomness
      // Unlike in download_manager.dart with a better impl
      await Future.delayed(Duration(milliseconds: 500 * pow(2, i).toInt()));
    }
  }
}

class _TourForgeApp extends StatelessWidget {
  const _TourForgeApp(this.onboarding, {Key? key}) : super(key: key);

  final Widget Function(BuildContext context, void Function() finish)?
      onboarding;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: tourForgeConfig.appName,
      theme: SchedulerBinding.instance.platformDispatcher.platformBrightness ==
              Brightness.dark
          ? tourForgeConfig.darkThemeData
          : tourForgeConfig.lightThemeData,
      builder: (context, child) {
        if (child != null) {
          return ScrollConfiguration(
            behavior: const _BouncingScrollBehavior(),
            child: child,
          );
        } else {
          return const SizedBox();
        }
      },
      home: Builder(
        builder: (context) => onboarding != null
            ? onboarding!(context, () => _finishOnboarding(context))
            : const Home(),
      ),
    );
  }

  void _finishOnboarding(BuildContext context) {
    HelpViewed.markViewed("onboarding");
    Navigator.of(context)
        .pushReplacement(MaterialPageRoute(builder: (context) => const Home()));
  }
}

class _BouncingScrollBehavior extends ScrollBehavior {
  const _BouncingScrollBehavior();

  @override
  ScrollPhysics getScrollPhysics(BuildContext context) {
    return const BouncingScrollPhysics();
  }
}
