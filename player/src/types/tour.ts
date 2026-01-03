export interface AssetInfo {
  hash: string;
  type: 'audio' | 'image' | 'tiles';
  alt: string;
  attrib: string;
}

export interface StopModel {
  type: 'stop';
  id: string;
  title: string;
  desc: string;
  lat: number;
  lng: number;
  trigger_radius: number;
  control: 'route' | 'path' | 'none';
  gallery: string[];
  transcript?: string;
  narration?: string;
  links: Record<string, { href: string }>;
}

export interface ControlPointModel {
  type: 'control';
  id: string;
  lat: number;
  lng: number;
  control: 'route' | 'path' | 'none';
}

export type WaypointModel = StopModel | ControlPointModel;

export interface PoiModel {
  id: string;
  title: string;
  desc: string;
  lat: number;
  lng: number;
  gallery: string[];
  links: Record<string, { href: string }>;
}

export interface TourModel {
  type: 'driving' | 'walking';
  id: string;
  title: string;
  desc: string;
  gallery: string[];
  tiles?: string;
  route: WaypointModel[];
  pois: PoiModel[];
  path: string;
  links: Record<string, { href: string }>;
}

export interface ProjectModel {
  originalId: string;
  createDate?: string;
  modifyDate?: string;
  title: string;
  tours: TourModel[];
  assets: Record<string, AssetInfo>;
}

export interface DownloadedTour {
  id: string;
  projectId: string;
  title: string;
  projectTitle: string;
  tourData: TourModel;
  assets: Record<string, AssetInfo>;
  baseUrl: string;
  downloadedAt: string;
  isOffline: boolean;
}

export interface TourProgress {
  tourId: string;
  currentStopIndex: number;
  visitedStops: string[];
  isPlaying: boolean;
  lastPlayedAt: string;
}
