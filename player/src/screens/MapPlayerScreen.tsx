import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  AppState,
  AppStateStatus,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { DownloadedTour, StopModel, TourProgress } from '../types/tour';
import {
  requestLocationPermissions,
  getCurrentLocation,
  LocationState,
  findNearestStop,
} from '../services/locationService';
import {
  setupAudioMode,
  loadAudio,
  playAudio,
  pauseAudio,
  seekAudio,
  unloadAudio,
  setPlaybackStatusCallback,
  AudioState,
  getPlaybackPosition,
} from '../services/audioPlayer';
import { decodePolyline } from '../utils/polyline';

interface MapPlayerScreenProps {
  tour: DownloadedTour;
  onBack: () => void;
}

const PROGRESS_KEY = '@shufti_progress_';

export function MapPlayerScreen({ tour, onBack }: MapPlayerScreenProps) {
  const mapRef = useRef<MapView>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const appStateRef = useRef(AppState.currentState);

  const [location, setLocation] = useState<LocationState | null>(null);
  const [tourStarted, setTourStarted] = useState(false);
  const [progress, setProgress] = useState<TourProgress>({
    tourId: tour.id,
    currentStopIndex: -1,
    currentAudioPosition: 0,
    visitedStops: [],
    isPlaying: false,
    lastPlayedAt: '',
  });
  const [audioState, setAudioState] = useState<AudioState | null>(null);
  const [currentStop, setCurrentStop] = useState<StopModel | null>(null);

  const stops = tour.tourData.route.filter((w): w is StopModel => w.type === 'stop');
  const routePath = tour.tourData.path ? decodePolyline(tour.tourData.path) : [];

  useEffect(() => {
    setupAudioMode();
    loadSavedProgress();

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      saveProgress();
      unloadAudio();
      subscription.remove();
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    setPlaybackStatusCallback((status) => {
      if (status.isLoaded) {
        setAudioState({
          isLoaded: true,
          isPlaying: status.isPlaying,
          isBuffering: status.isBuffering,
          positionMillis: status.positionMillis,
          durationMillis: status.durationMillis ?? 0,
          didJustFinish: status.didJustFinish,
        });

        if (status.didJustFinish) {
          handleAudioFinished();
        }
      }
    });

    return () => setPlaybackStatusCallback(null);
  }, [currentStop]);

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (appStateRef.current.match(/active/) && nextAppState === 'background') {
      await saveProgress();
    }
    appStateRef.current = nextAppState;
  };

  const loadSavedProgress = async () => {
    try {
      const saved = await AsyncStorage.getItem(PROGRESS_KEY + tour.id);
      if (saved) {
        const savedProgress: TourProgress = JSON.parse(saved);
        setProgress(savedProgress);
        
        if (savedProgress.currentStopIndex >= 0 && savedProgress.currentStopIndex < stops.length) {
          const stop = stops[savedProgress.currentStopIndex];
          setCurrentStop(stop);
        }
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const saveProgress = async () => {
    try {
      const position = await getPlaybackPosition();
      const updatedProgress = {
        ...progress,
        currentAudioPosition: position,
        lastPlayedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(PROGRESS_KEY + tour.id, JSON.stringify(updatedProgress));
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const handleAudioFinished = useCallback(() => {
    if (currentStop) {
      setProgress(prev => ({
        ...prev,
        visitedStops: [...prev.visitedStops, currentStop.id],
        isPlaying: false,
        currentAudioPosition: 0,
      }));
    }
  }, [currentStop]);

  const startTour = async () => {
    const granted = await requestLocationPermissions();
    if (!granted) {
      Alert.alert(
        'Location Required',
        'Please enable location permissions to use GPS-triggered audio.'
      );
      return;
    }

    const initialLocation = await getCurrentLocation();
    if (initialLocation) {
      setLocation(initialLocation);
      mapRef.current?.animateToRegion({
        latitude: initialLocation.latitude,
        longitude: initialLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }

    locationSubscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 2000,
        distanceInterval: 5,
      },
      (loc) => {
        const newLocation: LocationState = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          accuracy: loc.coords.accuracy,
          heading: loc.coords.heading,
        };
        setLocation(newLocation);
        checkGeofences(newLocation);
      }
    );

    setTourStarted(true);

    if (progress.currentStopIndex >= 0 && currentStop && progress.currentAudioPosition > 0) {
      await resumeFromSavedPosition();
    }
  };

  const resumeFromSavedPosition = async () => {
    if (!currentStop?.narration) return;
    
    const assetInfo = tour.assets[currentStop.narration];
    if (!assetInfo) return;

    try {
      await loadAudio(tour.id, assetInfo.hash, tour.baseUrl, tour.isOffline);
      await seekAudio(progress.currentAudioPosition);
    } catch (error) {
      console.error('Error resuming audio:', error);
    }
  };

  const checkGeofences = useCallback(
    (loc: LocationState) => {
      if (!tourStarted) return;

      const visitedSet = new Set(progress.visitedStops);
      const nearestStop = findNearestStop(loc, stops, visitedSet);

      if (nearestStop && nearestStop.id !== currentStop?.id) {
        triggerStop(nearestStop);
      }
    },
    [tourStarted, progress.visitedStops, stops, currentStop]
  );

  const triggerStop = async (stop: StopModel) => {
    setCurrentStop(stop);
    const stopIndex = stops.findIndex(s => s.id === stop.id);
    
    setProgress(prev => ({
      ...prev,
      currentStopIndex: stopIndex,
      currentAudioPosition: 0,
    }));

    if (stop.narration) {
      const assetInfo = tour.assets[stop.narration];
      if (assetInfo) {
        try {
          await loadAudio(tour.id, assetInfo.hash, tour.baseUrl, tour.isOffline);
          await playAudio();
          setProgress(prev => ({
            ...prev,
            isPlaying: true,
            lastPlayedAt: new Date().toISOString(),
          }));
        } catch (error) {
          console.error('Error playing audio:', error);
        }
      }
    }
  };

  const handlePlayPause = async () => {
    if (audioState?.isPlaying) {
      await pauseAudio();
      await saveProgress();
      setProgress(prev => ({ ...prev, isPlaying: false }));
    } else {
      await playAudio();
      setProgress(prev => ({ ...prev, isPlaying: true }));
    }
  };

  const handlePrevStop = () => {
    const currentIndex = stops.findIndex(s => s.id === currentStop?.id);
    if (currentIndex > 0) {
      triggerStop(stops[currentIndex - 1]);
    }
  };

  const handleNextStop = () => {
    const currentIndex = stops.findIndex(s => s.id === currentStop?.id);
    if (currentIndex < stops.length - 1) {
      triggerStop(stops[currentIndex + 1]);
    }
  };

  const handleStopPress = (stop: StopModel) => {
    mapRef.current?.animateToRegion({
      latitude: stop.lat,
      longitude: stop.lng,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    });
  };

  const handleBack = async () => {
    await saveProgress();
    onBack();
  };

  const getInitialRegion = (): Region => {
    if (stops.length > 0) {
      const firstStop = stops[0];
      return {
        latitude: firstStop.lat,
        longitude: firstStop.lng,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
    }
    return {
      latitude: 23.5859,
      longitude: 58.4059,
      latitudeDelta: 0.5,
      longitudeDelta: 0.5,
    };
  };

  const formatTime = (millis: number): string => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={getInitialRegion()}
        showsUserLocation={tourStarted}
        showsMyLocationButton={false}
        followsUserLocation={tourStarted}
      >
        {routePath.length > 0 && (
          <Polyline
            coordinates={routePath}
            strokeColor="#7cb342"
            strokeWidth={4}
          />
        )}
        {stops.map((stop, index) => {
          const isVisited = progress.visitedStops.includes(stop.id);
          const isCurrent = currentStop?.id === stop.id;

          return (
            <Marker
              key={stop.id}
              coordinate={{ latitude: stop.lat, longitude: stop.lng }}
              title={stop.title}
              description={stop.desc}
              onPress={() => handleStopPress(stop)}
              pinColor={isCurrent ? '#7cb342' : isVisited ? '#888888' : '#ff7043'}
            />
          );
        })}
      </MapView>

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>Exit</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.tourTitle} numberOfLines={1}>
            {tour.title}
          </Text>
          <Text style={styles.tourProgress}>
            {progress.visitedStops.length} / {stops.length} stops completed
          </Text>
        </View>
      </View>

      {!tourStarted ? (
        <TouchableOpacity style={styles.startButton} onPress={startTour}>
          <Text style={styles.startButtonText}>
            {progress.currentStopIndex >= 0 ? 'Resume Tour' : 'Start Tour'}
          </Text>
        </TouchableOpacity>
      ) : currentStop ? (
        <View style={styles.playerControls}>
          <View style={styles.nowPlayingInfo}>
            <Text style={styles.nowPlayingLabel}>Now Playing</Text>
            <Text style={styles.nowPlayingTitle}>{currentStop.title}</Text>
            {audioState?.isLoaded && (
              <View style={styles.progressRow}>
                <Text style={styles.timeText}>
                  {formatTime(audioState.positionMillis)}
                </Text>
                <View style={styles.seekBar}>
                  <View
                    style={[
                      styles.seekProgress,
                      {
                        width: `${
                          audioState.durationMillis > 0
                            ? (audioState.positionMillis / audioState.durationMillis) * 100
                            : 0
                        }%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.timeText}>
                  {formatTime(audioState.durationMillis)}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.controlsRow}>
            <TouchableOpacity style={styles.skipButton} onPress={handlePrevStop}>
              <Text style={styles.skipButtonText}>Prev</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.playPauseButton} onPress={handlePlayPause}>
              <Text style={styles.playPauseText}>
                {audioState?.isPlaying ? 'Pause' : 'Play'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.skipButton} onPress={handleNextStop}>
              <Text style={styles.skipButtonText}>Next</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.walkingPrompt}>
          <Text style={styles.walkingText}>
            Walk towards the highlighted pin to hear the audio
          </Text>
        </View>
      )}

      <View style={styles.stopList}>
        <Text style={styles.stopListTitle}>Upcoming Stops</Text>
        {stops.slice(0, 4).map((stop, index) => {
          const isVisited = progress.visitedStops.includes(stop.id);
          const isCurrent = currentStop?.id === stop.id;
          return (
            <TouchableOpacity
              key={stop.id}
              style={styles.stopItem}
              onPress={() => handleStopPress(stop)}
            >
              <View
                style={[
                  styles.stopNumber,
                  isVisited && styles.stopNumberVisited,
                  isCurrent && styles.stopNumberCurrent,
                ]}
              >
                <Text style={styles.stopNumberText}>{index + 1}</Text>
              </View>
              <Text
                style={[styles.stopName, isVisited && styles.stopNameVisited]}
                numberOfLines={1}
              >
                {stop.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 12,
  },
  backButtonText: {
    color: '#666666',
    fontSize: 14,
    fontWeight: '500',
  },
  headerInfo: {
    flex: 1,
  },
  tourTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  tourProgress: {
    fontSize: 12,
    color: '#888888',
  },
  startButton: {
    position: 'absolute',
    bottom: 140,
    left: 20,
    right: 20,
    backgroundColor: '#7cb342',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  playerControls: {
    position: 'absolute',
    bottom: 140,
    left: 16,
    right: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
  },
  nowPlayingInfo: {
    marginBottom: 12,
  },
  nowPlayingLabel: {
    fontSize: 11,
    color: '#7cb342',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  nowPlayingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 4,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  timeText: {
    fontSize: 12,
    color: '#888888',
    width: 40,
  },
  seekBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#333333',
    borderRadius: 2,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  seekProgress: {
    height: '100%',
    backgroundColor: '#7cb342',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  skipButtonText: {
    color: '#888888',
    fontSize: 14,
    fontWeight: '500',
  },
  playPauseButton: {
    backgroundColor: '#7cb342',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
  },
  playPauseText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  walkingPrompt: {
    position: 'absolute',
    bottom: 140,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  walkingText: {
    color: '#666666',
    fontSize: 15,
    textAlign: 'center',
  },
  stopList: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    padding: 12,
  },
  stopListTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888888',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  stopNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ff7043',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  stopNumberVisited: {
    backgroundColor: '#cccccc',
  },
  stopNumberCurrent: {
    backgroundColor: '#7cb342',
  },
  stopNumberText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  stopName: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
  },
  stopNameVisited: {
    color: '#888888',
  },
});
