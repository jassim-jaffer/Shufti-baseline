import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProjectModel, DownloadedTour, TourModel, AssetInfo } from '../types/tour';

const TOURS_STORAGE_KEY = '@shufti_tours';
const TOURS_DIR = `${FileSystem.documentDirectory}tours/`;

export async function ensureToursDirectory(): Promise<void> {
  const dirInfo = await FileSystem.getInfoAsync(TOURS_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(TOURS_DIR, { intermediates: true });
  }
}

export function getBaseUrl(url: string): string {
  let baseUrl = url.replace(/\/$/, '');
  baseUrl = baseUrl.replace(/\/shufti\.json$/, '');
  baseUrl = baseUrl.replace(/\/tourforge\.json$/, '');
  return baseUrl;
}

export async function fetchProjectFromUrl(url: string): Promise<{ project: ProjectModel; baseUrl: string }> {
  const baseUrl = getBaseUrl(url);
  
  let response = await fetch(`${baseUrl}/shufti.json`);
  if (!response.ok) {
    response = await fetch(`${baseUrl}/tourforge.json`);
    if (!response.ok) {
      throw new Error('Failed to fetch tour data');
    }
  }
  
  const project = await response.json();
  return { project, baseUrl };
}

export async function downloadTour(
  url: string,
  onProgress?: (progress: number) => void
): Promise<DownloadedTour> {
  await ensureToursDirectory();
  
  const { project, baseUrl } = await fetchProjectFromUrl(url);
  
  if (project.tours.length === 0) {
    throw new Error('No tours found in project');
  }

  const tour = project.tours[0];
  const tourDir = `${TOURS_DIR}${tour.id}/`;
  
  const dirInfo = await FileSystem.getInfoAsync(tourDir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(tourDir, { intermediates: true });
  }

  await FileSystem.writeAsStringAsync(
    `${tourDir}tour.json`,
    JSON.stringify({ tour, assets: project.assets, baseUrl })
  );

  const assetHashes = Object.values(project.assets).map(a => a.hash);
  let downloaded = 0;
  let failedAssets: string[] = [];
  
  for (const hash of assetHashes) {
    try {
      const assetUrl = `${baseUrl}/${hash}`;
      const localPath = `${tourDir}${hash}`;
      
      const result = await FileSystem.downloadAsync(assetUrl, localPath);
      if (result.status === 200) {
        downloaded++;
      } else {
        failedAssets.push(hash);
        console.warn(`Failed to download asset ${hash}: status ${result.status}`);
      }
      onProgress?.(downloaded / assetHashes.length);
    } catch (error) {
      failedAssets.push(hash);
      console.warn(`Failed to download asset ${hash}:`, error);
    }
  }

  const isFullyOffline = failedAssets.length === 0;

  const downloadedTour: DownloadedTour = {
    id: tour.id,
    projectId: project.originalId,
    title: tour.title,
    projectTitle: project.title,
    tourData: tour,
    assets: project.assets,
    baseUrl,
    downloadedAt: new Date().toISOString(),
    isOffline: isFullyOffline,
  };

  await saveTourToStorage(downloadedTour);
  
  return downloadedTour;
}

export async function saveTourToStorage(tour: DownloadedTour): Promise<void> {
  const tours = await getDownloadedTours();
  const existingIndex = tours.findIndex(t => t.id === tour.id);
  
  if (existingIndex >= 0) {
    tours[existingIndex] = tour;
  } else {
    tours.push(tour);
  }
  
  await AsyncStorage.setItem(TOURS_STORAGE_KEY, JSON.stringify(tours));
}

export async function getDownloadedTours(): Promise<DownloadedTour[]> {
  const data = await AsyncStorage.getItem(TOURS_STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export async function deleteTour(tourId: string): Promise<void> {
  const tours = await getDownloadedTours();
  const filtered = tours.filter(t => t.id !== tourId);
  await AsyncStorage.setItem(TOURS_STORAGE_KEY, JSON.stringify(filtered));
  
  const tourDir = `${TOURS_DIR}${tourId}/`;
  try {
    await FileSystem.deleteAsync(tourDir, { idempotent: true });
  } catch (error) {
    console.warn('Failed to delete tour directory:', error);
  }
}

export function getLocalAssetPath(tourId: string, hash: string): string {
  return `${TOURS_DIR}${tourId}/${hash}`;
}

export function getRemoteAssetUrl(baseUrl: string, hash: string): string {
  return `${baseUrl}/${hash}`;
}
