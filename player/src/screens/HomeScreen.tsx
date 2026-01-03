import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { DownloadedTour } from '../types/tour';
import { getDownloadedTours, downloadTour, deleteTour } from '../services/tourLoader';

interface HomeScreenProps {
  onSelectTour: (tour: DownloadedTour) => void;
}

export function HomeScreen({ onSelectTour }: HomeScreenProps) {
  const [tours, setTours] = useState<DownloadedTour[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [tourUrl, setTourUrl] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const loadTours = useCallback(async () => {
    try {
      const downloadedTours = await getDownloadedTours();
      setTours(downloadedTours);
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

  const handleAddTour = async () => {
    if (!tourUrl.trim()) {
      Alert.alert('Error', 'Please enter a tour URL');
      return;
    }

    setDownloading(true);
    setDownloadProgress(0);

    try {
      const tour = await downloadTour(tourUrl.trim(), (progress) => {
        setDownloadProgress(progress);
      });
      setTours((prev) => [...prev.filter(t => t.id !== tour.id), tour]);
      setShowAddModal(false);
      setTourUrl('');
      Alert.alert('Success', `Downloaded "${tour.title}"`);
    } catch (error) {
      Alert.alert('Error', 'Failed to download tour. Please check the URL.');
      console.error('Download error:', error);
    } finally {
      setDownloading(false);
    }
  };

  const handleDeleteTour = (tour: DownloadedTour) => {
    Alert.alert(
      'Delete Tour',
      `Are you sure you want to delete "${tour.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteTour(tour.id);
            setTours((prev) => prev.filter((t) => t.id !== tour.id));
          },
        },
      ]
    );
  };

  const renderTourItem = ({ item }: { item: DownloadedTour }) => (
    <TouchableOpacity
      style={styles.tourCard}
      onPress={() => onSelectTour(item)}
      onLongPress={() => handleDeleteTour(item)}
    >
      <View style={styles.tourInfo}>
        <Text style={styles.tourTitle}>{item.title}</Text>
        <Text style={styles.tourProject}>{item.projectTitle}</Text>
        <View style={styles.tourMeta}>
          <Text style={styles.tourMetaText}>
            {item.tourData.route.filter(w => w.type === 'stop').length} stops
          </Text>
          {item.isOffline && (
            <View style={styles.offlineBadge}>
              <Text style={styles.offlineBadgeText}>Offline</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shufti</Text>
        <Text style={styles.headerSubtitle}>Audio Tours of Oman</Text>
      </View>

      {tours.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Tours Yet</Text>
          <Text style={styles.emptyText}>
            Add a tour URL to get started exploring Oman
          </Text>
        </View>
      ) : (
        <FlatList
          data={tours}
          renderItem={renderTourItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowAddModal(true)}
      >
        <Text style={styles.addButtonText}>+ Add Tour</Text>
      </TouchableOpacity>

      {showAddModal && (
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Tour</Text>
            <Text style={styles.modalLabel}>Enter tour URL:</Text>
            <TextInput
              style={styles.input}
              value={tourUrl}
              onChangeText={setTourUrl}
              placeholder="https://example.com/tour"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!downloading}
            />
            {downloading && (
              <View style={styles.progressContainer}>
                <View
                  style={[styles.progressBar, { width: `${downloadProgress * 100}%` }]}
                />
                <Text style={styles.progressText}>
                  Downloading... {Math.round(downloadProgress * 100)}%
                </Text>
              </View>
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowAddModal(false);
                  setTourUrl('');
                }}
                disabled={downloading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.downloadButton, downloading && styles.buttonDisabled]}
                onPress={handleAddTour}
                disabled={downloading}
              >
                {downloading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.downloadButtonText}>Download</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#1a1a2e',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#aaa',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
  },
  tourCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tourInfo: {
    flex: 1,
  },
  tourTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  tourProject: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  tourMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  tourMetaText: {
    fontSize: 12,
    color: '#888',
  },
  offlineBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  offlineBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  addButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    left: 20,
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
  downloadButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
