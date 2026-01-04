import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
  Image,
  ActivityIndicator,
} from 'react-native';
import { TourPreview } from '../types/tour';
import { getDownloadedTours } from '../services/tourLoader';

interface ExploreScreenProps {
  onSelectTour: (tour: TourPreview) => void;
}

const SAMPLE_TOURS: TourPreview[] = [
  {
    id: 'muttrah-souk',
    projectId: 'oman-tours',
    title: 'Muttrah Souk',
    description: 'Explore the ancient marketplace of Muttrah, one of the oldest souks in the Arab world. Walk through narrow lanes filled with frankincense, textiles, and traditional Omani crafts.',
    location: 'Muscat, Oman',
    imageUrl: null,
    stopCount: 8,
    duration: '1.5 hours',
    tourData: {
      type: 'walking',
      id: 'muttrah-souk',
      title: 'Muttrah Souk',
      desc: 'Explore the ancient marketplace of Muttrah',
      gallery: [],
      route: [],
      pois: [],
      path: '',
      links: {},
    },
    assets: {},
    baseUrl: '',
    isDownloaded: false,
  },
  {
    id: 'nizwa-fort',
    projectId: 'oman-tours',
    title: 'Nizwa Fort & Market',
    description: 'Discover the historic Nizwa Fort and its famous Friday goat market. Learn about Omani heritage and traditional trading practices.',
    location: 'Nizwa, Oman',
    imageUrl: null,
    stopCount: 6,
    duration: '2 hours',
    tourData: {
      type: 'walking',
      id: 'nizwa-fort',
      title: 'Nizwa Fort & Market',
      desc: 'Discover the historic Nizwa Fort',
      gallery: [],
      route: [],
      pois: [],
      path: '',
      links: {},
    },
    assets: {},
    baseUrl: '',
    isDownloaded: false,
  },
  {
    id: 'wadi-shab',
    projectId: 'oman-tours',
    title: 'Wadi Shab Adventure',
    description: 'Trek through the stunning Wadi Shab canyon with its crystal-clear pools and hidden waterfalls. An unforgettable nature experience.',
    location: 'Sur, Oman',
    imageUrl: null,
    stopCount: 5,
    duration: '3 hours',
    tourData: {
      type: 'walking',
      id: 'wadi-shab',
      title: 'Wadi Shab Adventure',
      desc: 'Trek through the stunning Wadi Shab canyon',
      gallery: [],
      route: [],
      pois: [],
      path: '',
      links: {},
    },
    assets: {},
    baseUrl: '',
    isDownloaded: false,
  },
];

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = 120;

export function ExploreScreen({ onSelectTour }: ExploreScreenProps) {
  const [tours, setTours] = useState<TourPreview[]>(SAMPLE_TOURS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const position = useRef(new Animated.ValueXY()).current;

  useEffect(() => {
    loadTours();
  }, []);

  const loadTours = async () => {
    try {
      const downloaded = await getDownloadedTours();
      const downloadedIds = new Set(downloaded.map(t => t.id));
      
      const updatedTours = SAMPLE_TOURS.map(tour => ({
        ...tour,
        isDownloaded: downloadedIds.has(tour.id),
      }));
      
      setTours(updatedTours);
    } catch (error) {
      console.warn('Error loading downloaded tours (expected in non-Expo env):', error);
      setTours(SAMPLE_TOURS);
    } finally {
      setLoading(false);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: 0 });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD && currentIndex > 0) {
          swipeCard('right');
        } else if (gesture.dx < -SWIPE_THRESHOLD && currentIndex < tours.length - 1) {
          swipeCard('left');
        } else {
          resetPosition();
        }
      },
    })
  ).current;

  const swipeCard = (direction: 'left' | 'right') => {
    const x = direction === 'right' ? SCREEN_WIDTH + 100 : -SCREEN_WIDTH - 100;
    Animated.timing(position, {
      toValue: { x, y: 0 },
      duration: 250,
      useNativeDriver: false,
    }).start(() => {
      if (direction === 'left') {
        setCurrentIndex(prev => Math.min(prev + 1, tours.length - 1));
      } else {
        setCurrentIndex(prev => Math.max(prev - 1, 0));
      }
      position.setValue({ x: 0, y: 0 });
    });
  };

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false,
    }).start();
  };

  const getCardStyle = () => {
    const rotate = position.x.interpolate({
      inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      outputRange: ['-10deg', '0deg', '10deg'],
    });

    return {
      transform: [
        { translateX: position.x },
        { rotate },
      ],
    };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7cb342" />
        <Text style={styles.loadingText}>Loading tours...</Text>
      </View>
    );
  }

  const currentTour = tours[currentIndex];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.brandLine}>
          <View style={styles.brandAccent} />
          <Text style={styles.brandName}>Shufti</Text>
        </View>
      </View>

      {tours.length > 1 && (
        <View style={styles.swipeHint}>
          <Text style={styles.swipeText}>Swipe to explore</Text>
        </View>
      )}

      <Animated.View
        style={[styles.card, getCardStyle()]}
        {...panResponder.panHandlers}
      >
        <View style={styles.cardBackground}>
          <View style={styles.cardOverlay}>
            <View style={styles.locationLine}>
              <View style={styles.locationDot} />
              <Text style={styles.locationText}>{currentTour.location}</Text>
            </View>

            <Text style={styles.tourTitle}>{currentTour.title}</Text>
            <Text style={styles.tourDescription}>{currentTour.description}</Text>

            <View style={styles.tourMeta}>
              <View style={styles.metaItem}>
                <Text style={styles.metaValue}>{currentTour.stopCount}</Text>
                <Text style={styles.metaLabel}>stops</Text>
              </View>
              <View style={styles.metaDivider} />
              <View style={styles.metaItem}>
                <Text style={styles.metaValue}>{currentTour.duration}</Text>
                <Text style={styles.metaLabel}>duration</Text>
              </View>
            </View>

            <View
              style={styles.exploreButton}
              onTouchEnd={() => onSelectTour(currentTour)}
            >
              <Text style={styles.exploreButtonText}>View Details</Text>
            </View>

            {currentTour.isDownloaded && (
              <View style={styles.downloadedBadge}>
                <Text style={styles.downloadedBadgeText}>Downloaded</Text>
              </View>
            )}
          </View>
        </View>
      </Animated.View>

      <View style={styles.pagination}>
        {tours.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              index === currentIndex && styles.paginationDotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  brandLine: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandAccent: {
    width: 4,
    height: 24,
    backgroundColor: '#7cb342',
    borderRadius: 2,
    marginRight: 12,
  },
  brandName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  swipeHint: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  swipeText: {
    fontSize: 14,
    color: '#888888',
  },
  card: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 100,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  cardBackground: {
    flex: 1,
    backgroundColor: '#1a3518',
  },
  cardOverlay: {
    flex: 1,
    padding: 24,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  locationLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
    color: '#ffffff',
    opacity: 0.9,
  },
  tourTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
  },
  tourDescription: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.85,
    lineHeight: 24,
    marginBottom: 24,
  },
  tourMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  metaItem: {
    alignItems: 'center',
  },
  metaValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
  },
  metaLabel: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.7,
  },
  metaDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 24,
  },
  exploreButton: {
    backgroundColor: '#7cb342',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  exploreButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  downloadedBadge: {
    position: 'absolute',
    top: 24,
    right: 24,
    backgroundColor: '#ff7043',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  downloadedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  pagination: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#cccccc',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#7cb342',
    width: 24,
  },
});
