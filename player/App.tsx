import React, { useState, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { ExploreScreen } from './src/screens/ExploreScreen';
import { ActiveToursScreen } from './src/screens/ActiveToursScreen';
import { TourDetailsScreen } from './src/screens/TourDetailsScreen';
import { MapPlayerScreen } from './src/screens/MapPlayerScreen';
import { BottomTabs } from './src/components/BottomTabs';
import { DownloadedTour, TourPreview } from './src/types/tour';

type Screen = 'explore' | 'active' | 'details' | 'player';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('explore');
  const [activeTab, setActiveTab] = useState<'explore' | 'active'>('explore');
  const [selectedPreview, setSelectedPreview] = useState<TourPreview | null>(null);
  const [selectedTour, setSelectedTour] = useState<DownloadedTour | null>(null);

  const handleSelectPreview = useCallback((preview: TourPreview) => {
    setSelectedPreview(preview);
    setCurrentScreen('details');
  }, []);

  const handlePlayTour = useCallback((tour: DownloadedTour) => {
    setSelectedTour(tour);
    setCurrentScreen('player');
  }, []);

  const handleBackFromDetails = useCallback(() => {
    setSelectedPreview(null);
    setCurrentScreen(activeTab);
  }, [activeTab]);

  const handleBackFromPlayer = useCallback(() => {
    setSelectedTour(null);
    setCurrentScreen('active');
    setActiveTab('active');
  }, []);

  const handleTabChange = useCallback((tab: 'explore' | 'active') => {
    setActiveTab(tab);
    setCurrentScreen(tab);
  }, []);

  const handleDownloadComplete = useCallback((tour: DownloadedTour) => {
    setActiveTab('active');
    setCurrentScreen('active');
    setSelectedPreview(null);
  }, []);

  const showTabs = currentScreen === 'explore' || currentScreen === 'active';

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      {currentScreen === 'explore' && (
        <ExploreScreen onSelectTour={handleSelectPreview} />
      )}
      
      {currentScreen === 'active' && (
        <ActiveToursScreen 
          onPlayTour={handlePlayTour}
          onSelectTour={handleSelectPreview}
        />
      )}
      
      {currentScreen === 'details' && selectedPreview && (
        <TourDetailsScreen
          preview={selectedPreview}
          onBack={handleBackFromDetails}
          onDownloadComplete={handleDownloadComplete}
          onPlay={handlePlayTour}
        />
      )}
      
      {currentScreen === 'player' && selectedTour && (
        <MapPlayerScreen tour={selectedTour} onBack={handleBackFromPlayer} />
      )}
      
      {showTabs && (
        <BottomTabs activeTab={activeTab} onTabChange={handleTabChange} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});
