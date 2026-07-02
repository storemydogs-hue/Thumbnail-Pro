export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: string;
  preferences: {
    defaultFormat: 'jpg' | 'webp';
    notificationsEnabled: boolean;
  };
}

export interface DownloadLog {
  id: string;
  userId: string;
  videoId: string;
  videoTitle: string;
  thumbnailUrl: string;
  resolution: string;
  timestamp: any; // Firestore Timestamp
  isBulk: boolean;
  batchId?: string;
}

export interface AnalyticsSummary {
  totalDownloads: number;
  popularVideos: { videoId: string; count: number }[];
  lastUpdated: any;
}
