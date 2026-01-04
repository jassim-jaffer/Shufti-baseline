import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { TourPreview, DownloadedTour, StopModel } from '../types/tour';
import { downloadTour, getDownloadedTours } from '../services/tourLoader';
import { decodePolyline } from '../utils/polyline';

interface TourDetailsScreenProps {
  preview: TourPreview;
  onBack: () => void;
  onDownloadComplete: (tour: DownloadedTour) => void;
  onPlay: (tour: DownloadedTour) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function TourDetailsScreen({ preview, onBack, onDownloadComplete, onPlay }: TourDetailsScreenProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloaded, setIsDownloaded] = useState(preview.isDownloaded);
  const [downloadedTour, setDownloadedTour] = useState<DownloadedTour | null>(null);
  const [mapExpanded, setMapExpanded] = useState(false);
  const mapRef = useRef<MapView>(null);

  const stops = preview.tourData.route.filter((w): w is StopModel => w.type === 'stop');
  const routePath = preview.tourData.path ? decodePolyline(preview.tourData.path) : [];

  useEffect(() => {
    checkIfDownloaded();
  }, []);

  const checkIfDownloaded = async () => {
    const tours = await getDownloadedTours();
    const found = tours.find(t => t.id === preview.id);
    if (found) {
      setIsDownloaded(true);
      setDownloadedTour(found);
    }
  };

  const getInitialRegion = () => {
    if (stops.length > 0) {
      const lats = stops.map(s => s.lat);
      const lngs = stops.map(s => s.lng);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      
      return {
        latitude: (minLat + maxLat) / 2,
        longitude: (minLng + maxLng) / 2,
        latitudeDelta: Math.max(0.02, (maxLat - minLat) * 1.5),
        longitudeDelta: Math.max(0.02, (maxLng - minLng) * 1.5),
      };
    }
    return {
      latitude: 23.5859,
      longitude: 58.4059,
      latitudeDelta: 0.5,
      longitudeDelta: 0.5,
    };
  };

  const handlePurchase = () => {
    Alert.alert(
      'Coming Soon',
      'Premium tours will be available for purchase soon! For now, enjoy this tour for free.',
      [{ text: 'OK' }]
    );
  };

  const handleDownload = async () => {
    if (!preview.baseUrl) {
      Alert.alert(
        'Demo Tour',
        'This is a demo tour. In the full version, you would download the complete audio experience.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      const tour = await downloadTour(preview.baseUrl, (progress) => {
        setDownloadProgress(progress);
      });
      setIsDownloaded(true);
      setDownloadedTour(tour);
      onDownloadComplete(tour);
    } catch (error) {
      Alert.alert('Download Failed', 'Unable to download tour. Please try again.');
      console.error('Download error:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePlay = () => {
    if (downloadedTour) {
      onPlay(downloadedTour);
    }
  };

  const toggleMapExpanded = () => {
    setMapExpanded(!mapExpanded);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{preview.title}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity 
          style={[styles.mapContainer, mapExpanded && styles.mapContainerExpanded]}
          onPress={toggleMapExpanded}
          activeOpacity={0.9}
        >
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_DEFAULT}
            initialRegion={getInitialRegion()}
            scrollEnabled={mapExpanded}
            zoomEnabled={mapExpanded}
            rotateEnabled={false}
            pitchEnabled={false}
          >
            {routePath.length > 0 && (
              <Polyline
                coordinates={routePath}
                strokeColor="#7cb342"
                strokeWidth={4}
              />
            )}
            {stops.map((stop, index) => (
              <Marker
                key={stop.id}
                coordinate={{ latitude: stop.lat, longitude: stop.lng }}
                title={stop.title}
                pinColor={index === 0 ? '#7cb342' : '#ff7043'}
              />
            ))}
          </MapView>
          <View style={styles.mapOverlay}>
            <Text style={styles.mapHint}>
              {mapExpanded ? 'Tap to minimize' : 'Tap to expand map'}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.tourInfo}>
          <View style={styles.locationRow}>
            <View style={styles.locationDot} />
            <Text style={styles.locationText}>{preview.location}</Text>
          </View>

          <Text style={styles.tourTitle}>{preview.title}</Text>
          <Text style={styles.tourDescription}>{preview.description}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{preview.stopCount}</Text>
              <Text style={styles.statLabel}>Stops</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{preview.duration}</Text>
              <Text style={styles.statLabel}>Duration</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>Free</Text>
              <Text style={styles.statLabel}>Price</Text>
            </View>
          </View>

          <View style={styles.stopsSection}>
            <Text style={styles.sectionTitle}>Tour Stops</Text>
            {stops.length > 0 ? (
              stops.map((stop, index) => (
                <View key={stop.id} style={styles.stopItem}>
                  <View style={styles.stopNumber}>
                    <Text style={styles.stopNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.stopInfo}>
                    <Text style={styles.stopTitle}>{stop.title}</Text>
                    {stop.desc && (
                      <Text style={styles.stopDesc} numberOfLines={2}>{stop.desc}</Text>
                    )}
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.noStopsText}>Tour stops will appear here</Text>
            )}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {!isDownloaded ? (
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.purchaseButton} onPress={handlePurchase}>
              <Text style={styles.purchaseButtonText}>$4.99</Text>
              <Text style={styles.purchaseSubtext}>Premium</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.downloadButton, isDownloading && styles.buttonDisabled]}
              onPress={handleDownload}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <View style={styles.downloadingContent}>
                  <ActivityIndicator color="#ffffff" size="small" />
                  <Text style={styles.downloadButtonText}>
                    {Math.round(downloadProgress * 100)}%
                  </Text>
                </View>
              ) : (
                <Text style={styles.downloadButtonText}>Get Free Tour</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.playButton} onPress={handlePlay}>
            <Text style={styles.playButtonText}>Start Tour</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    paddingVertical: 8,
    paddingRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#7cb342',
    fontWeight: '500',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 60,
  },
  content: {
    flex: 1,
  },
  mapContainer: {
    height: 200,
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  mapContainerExpanded: {
    height: 400,
  },
  map: {
    flex: 1,
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  mapHint: {
    fontSize: 12,
    color: '#ffffff',
  },
  tourInfo: {
    padding: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff7043',
    marginRight: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#666666',
  },
  tourTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  tourDescription: {
    fontSize: 16,
    color: '#444444',
    lineHeight: 24,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  statLabel: {
    fontSize: 12,
    color: '#888888',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#e0e0e0',
  },
  stopsSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  stopItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stopNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#7cb342',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stopNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  stopInfo: {
    flex: 1,
  },
  stopTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  stopDesc: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  noStopsText: {
    fontSize: 14,
    color: '#888888',
    fontStyle: 'italic',
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  purchaseButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  purchaseButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#888888',
    textDecorationLine: 'line-through',
  },
  purchaseSubtext: {
    fontSize: 12,
    color: '#888888',
  },
  downloadButton: {
    flex: 1,
    backgroundColor: '#7cb342',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  downloadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  playButton: {
    backgroundColor: '#ff7043',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  playButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
});
