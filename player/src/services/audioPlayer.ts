import { Audio, AVPlaybackStatus } from 'expo-av';
import { getLocalAssetPath, getRemoteAssetUrl } from './tourLoader';

let currentSound: Audio.Sound | null = null;
let onPlaybackStatusUpdate: ((status: AVPlaybackStatus) => void) | null = null;

export interface AudioState {
  isLoaded: boolean;
  isPlaying: boolean;
  isBuffering: boolean;
  positionMillis: number;
  durationMillis: number;
  didJustFinish: boolean;
}

export async function setupAudioMode(): Promise<void> {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    staysActiveInBackground: true,
    playsInSilentModeIOS: true,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
  });
}

export async function loadAudio(
  tourId: string,
  assetHash: string,
  baseUrl: string,
  isOffline: boolean
): Promise<void> {
  await unloadAudio();

  const uri = isOffline
    ? getLocalAssetPath(tourId, assetHash)
    : getRemoteAssetUrl(baseUrl, assetHash);

  const { sound } = await Audio.Sound.createAsync(
    { uri },
    { shouldPlay: false },
    handlePlaybackStatusUpdate
  );

  currentSound = sound;
}

function handlePlaybackStatusUpdate(status: AVPlaybackStatus): void {
  if (onPlaybackStatusUpdate) {
    onPlaybackStatusUpdate(status);
  }
}

export function setPlaybackStatusCallback(
  callback: ((status: AVPlaybackStatus) => void) | null
): void {
  onPlaybackStatusUpdate = callback;
}

export async function playAudio(): Promise<void> {
  if (currentSound) {
    await currentSound.playAsync();
  }
}

export async function pauseAudio(): Promise<void> {
  if (currentSound) {
    await currentSound.pauseAsync();
  }
}

export async function stopAudio(): Promise<void> {
  if (currentSound) {
    await currentSound.stopAsync();
    await currentSound.setPositionAsync(0);
  }
}

export async function seekAudio(positionMillis: number): Promise<void> {
  if (currentSound) {
    await currentSound.setPositionAsync(positionMillis);
  }
}

export async function unloadAudio(): Promise<void> {
  if (currentSound) {
    await currentSound.unloadAsync();
    currentSound = null;
  }
}

export async function getAudioStatus(): Promise<AudioState | null> {
  if (!currentSound) return null;

  const status = await currentSound.getStatusAsync();
  
  if (!status.isLoaded) {
    return {
      isLoaded: false,
      isPlaying: false,
      isBuffering: false,
      positionMillis: 0,
      durationMillis: 0,
      didJustFinish: false,
    };
  }

  return {
    isLoaded: true,
    isPlaying: status.isPlaying,
    isBuffering: status.isBuffering,
    positionMillis: status.positionMillis,
    durationMillis: status.durationMillis ?? 0,
    didJustFinish: status.didJustFinish,
  };
}
