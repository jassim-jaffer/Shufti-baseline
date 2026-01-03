import * as Location from 'expo-location';
import { StopModel } from '../types/tour';

export interface LocationState {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  heading: number | null;
}

export async function requestLocationPermissions(): Promise<boolean> {
  const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
  
  if (foregroundStatus !== 'granted') {
    return false;
  }

  const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
  
  return backgroundStatus === 'granted';
}

export async function getCurrentLocation(): Promise<LocationState | null> {
  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
      heading: location.coords.heading,
    };
  } catch (error) {
    console.error('Error getting location:', error);
    return null;
  }
}

export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function findNearestStop(
  location: LocationState,
  stops: StopModel[],
  visitedStops: Set<string>
): StopModel | null {
  let nearest: StopModel | null = null;
  let nearestDistance = Infinity;

  for (const stop of stops) {
    if (visitedStops.has(stop.id)) continue;
    
    const distance = calculateDistance(
      location.latitude,
      location.longitude,
      stop.lat,
      stop.lng
    );

    if (distance < stop.trigger_radius && distance < nearestDistance) {
      nearest = stop;
      nearestDistance = distance;
    }
  }

  return nearest;
}

export function isWithinRadius(
  location: LocationState,
  stop: StopModel
): boolean {
  const distance = calculateDistance(
    location.latitude,
    location.longitude,
    stop.lat,
    stop.lng
  );
  return distance <= stop.trigger_radius;
}
