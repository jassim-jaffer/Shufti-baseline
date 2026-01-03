import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { HomeScreen } from './src/screens/HomeScreen';
import { TourMapScreen } from './src/screens/TourMapScreen';
import { DownloadedTour } from './src/types/tour';

type Screen = 'home' | 'tour';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [selectedTour, setSelectedTour] = useState<DownloadedTour | null>(null);

  const handleSelectTour = (tour: DownloadedTour) => {
    setSelectedTour(tour);
    setCurrentScreen('tour');
  };

  const handleBackToHome = () => {
    setSelectedTour(null);
    setCurrentScreen('home');
  };

  return (
    <>
      <StatusBar style="auto" />
      {currentScreen === 'home' && (
        <HomeScreen onSelectTour={handleSelectTour} />
      )}
      {currentScreen === 'tour' && selectedTour && (
        <TourMapScreen tour={selectedTour} onBack={handleBackToHome} />
      )}
    </>
  );
}
