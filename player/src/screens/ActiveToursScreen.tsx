import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DownloadedTour, TourPreview, TourProgress, StopModel } from '../types/tour';
import { getDownloadedTours, deleteTour } from '../services/tourLoader';

interface ActiveToursScreenProps {
  onPlayTour: (tour: DownloadedTour) => void;
  onSelectTour: (preview: TourPreview) => void;
}

const PROGRESS_KEY = '@shufti_progress_';

export function ActiveToursScreen({ onPlayTour, onSelectTour }: ActiveToursScreenProps) {
  const [tours, setTours] = useState<DownloadedTour[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTours = useCallback(async () => {
    try {
      const downloadedTours = await getDownloadedTours();
      
      const toursWithProgress = await Promise.all(
        downloadedTours.map(async (tour) => {
          const progressData = await AsyncStorage.getItem(PROGRESS_KEY + tour.id);
          if (progressData) {
            tour.progress = JSON.parse(progressData);
          }
          return tour;
        })
      );
      
      setTours(toursWithProgress);
    } catch (error) {
      console.error('Error loading tours:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTours();
  }, [loadTours]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadTours();
  };

  const handleDeleteTour = (tour: DownloadedTour) => {
    Alert.alert(
      'Delete Tour',
      `Are you sure you want to delete "${tour.title}"? This will remove all downloaded content.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteTour(tour.id);
            await AsyncStorage.removeItem(PROGRESS_KEY + tour.id);
            setTours(prev => prev.filter(t => t.id !== tour.id));
          },
        },
      ]
    );
  };

  const getProgressPercent = (tour: DownloadedTour): number => {
    if (!tour.progress) return 0;
    const stops = tour.tourData.route.filter((w): w is StopModel => w.type === 'stop');
    if (stops.length === 0) return 0;
    return Math.round((tour.progress.visitedStops.length / stops.length) * 100);
  };

  const renderTourItem = ({ item }: { item: DownloadedTour }) => {
    const progressPercent = getProgressPercent(item);
    const stops = item.tourData.route.filter((w): w is StopModel => w.type === 'stop');
    const hasProgress = item.progress && item.progress.visitedStops.length > 0;

    return (
      <TouchableOpacity
        style={styles.tourCard}
        onPress={() => onPlayTour(item)}
        onLongPress={() => handleDeleteTour(item)}
      >
        <View style={styles.tourHeader}>
          <View style={styles.tourInfo}>
            <Text style={styles.tourTitle}>{item.title}</Text>
            <Text style={styles.tourProject}>{item.projectTitle || 'Oman'}</Text>
          </View>
          {item.isOffline && (
            <View style={styles.offlineBadge}>
              <Text style={styles.offlineBadgeText}>Offline</Text>
            </View>
          )}
        </View>

        <View style={styles.tourMeta}>
          <Text style={styles.metaText}>{stops.length} stops</Text>
          <View style={styles.metaDot} />
          <Text style={styles.metaText}>
            Downloaded {new Date(item.downloadedAt).toLocaleDateString()}
          </Text>
        </View>

        {hasProgress && (
          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
            </View>
            <Text style={styles.progressText}>{progressPercent}% complete</Text>
          </View>
        )}

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.playButton}
            onPress={() => onPlayTour(item)}
          >
            <Text style={styles.playButtonText}>
              {hasProgress ? 'Resume Tour' : 'Start Tour'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#7cb342" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Tours</Text>
        <Text style={styles.headerSubtitle}>
          {tours.length} tour{tours.length !== 1 ? 's' : ''} downloaded
        </Text>
      </View>

      {tours.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Text style={styles.emptyIconText}>M</Text>
          </View>
          <Text style={styles.emptyTitle}>No Tours Yet</Text>
          <Text style={styles.emptyText}>
            Discover and download tours to explore Oman with GPS-guided audio
          </Text>
        </View>
      ) : (
        <FlatList
          data={tours}
          renderItem={renderTourItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#7cb342"
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#888888',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  tourCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tourHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tourInfo: {
    flex: 1,
  },
  tourTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  tourProject: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  offlineBadge: {
    backgroundColor: '#7cb342',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
  },
  offlineBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  tourMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  metaText: {
    fontSize: 13,
    color: '#888888',
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#cccccc',
    marginHorizontal: 8,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ff7043',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#ff7043',
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
  },
  playButton: {
    flex: 1,
    backgroundColor: '#7cb342',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  playButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyIconText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#cccccc',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 22,
  },
});
