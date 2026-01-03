import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT, Region } from 'react-native-maps';
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
  unloadAudio,
  setPlaybackStatusCallback,
  AudioState,
} from '../services/audioPlayer';
import { decodePolyline } from '../utils/polyline';

interface TourMapScreenProps {
  tour: DownloadedTour;
  onBack: () => void;
}

const OMAN_CENTER = {
  latitude: 23.5859,
  longitude: 58.4059,
  latitudeDelta: 0.5,
  longitudeDelta: 0.5,
};

export function TourMapScreen({ tour, onBack }: TourMapScreenProps) {
  const mapRef = useRef<MapView>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  const [location, setLocation] = useState<LocationState | null>(null);
  const [tourStarted, setTourStarted] = useState(false);
  const [progress, setProgress] = useState<TourProgress>({
    tourId: tour.id,
    currentStopIndex: -1,
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
    return () => {
      unloadAudio();
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

  const handleAudioFinished = useCallback(() => {
    if (currentStop) {
      setProgress((prev) => ({
        ...prev,
        visitedStops: [...prev.visitedStops, currentStop.id],
        isPlaying: false,
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

    if (stop.narration) {
      const assetInfo = tour.assets[stop.narration];
      if (assetInfo) {
        try {
          await loadAudio(tour.id, assetInfo.hash, tour.baseUrl, tour.isOffline);
          await playAudio();
          setProgress((prev) => ({
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
    } else {
      await playAudio();
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
    return OMAN_CENTER;
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
            strokeColor="#007AFF"
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
              pinColor={isCurrent ? '#007AFF' : isVisited ? '#4CAF50' : '#FF5722'}
            />
          );
        })}
      </MapView>

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.tourTitle} numberOfLines={1}>
            {tour.title}
          </Text>
          <Text style={styles.tourProgress}>
            {progress.visitedStops.length} / {stops.length} stops
          </Text>
        </View>
      </View>

      {!tourStarted ? (
        <TouchableOpacity style={styles.startButton} onPress={startTour}>
          <Text style={styles.startButtonText}>Start Tour</Text>
        </TouchableOpacity>
      ) : currentStop ? (
        <View style={styles.nowPlaying}>
          <View style={styles.nowPlayingInfo}>
            <Text style={styles.nowPlayingTitle}>{currentStop.title}</Text>
            <Text style={styles.nowPlayingDesc} numberOfLines={2}>
              {currentStop.desc}
            </Text>
          </View>
          <TouchableOpacity style={styles.playButton} onPress={handlePlayPause}>
            <Text style={styles.playButtonText}>
              {audioState?.isPlaying ? 'Pause' : 'Play'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.walkingPrompt}>
          <Text style={styles.walkingText}>
            Walk towards the next stop to hear the audio
          </Text>
        </View>
      )}

      <View style={styles.stopList}>
        <Text style={styles.stopListTitle}>Stops</Text>
        {stops.slice(0, 5).map((stop, index) => {
          const isVisited = progress.visitedStops.includes(stop.id);
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
                ]}
              >
                <Text style={styles.stopNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.stopName} numberOfLines={1}>
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
    marginRight: 12,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  headerInfo: {
    flex: 1,
  },
  tourTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  tourProgress: {
    fontSize: 12,
    color: '#666',
  },
  startButton: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  nowPlaying: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  nowPlayingInfo: {
    flex: 1,
    marginRight: 12,
  },
  nowPlayingTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  nowPlayingDesc: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 4,
  },
  playButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  playButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  walkingPrompt: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  walkingText: {
    color: '#666',
    fontSize: 14,
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
    color: '#666',
    marginBottom: 8,
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
    backgroundColor: '#FF5722',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  stopNumberVisited: {
    backgroundColor: '#4CAF50',
  },
  stopNumberText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  stopName: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
});
