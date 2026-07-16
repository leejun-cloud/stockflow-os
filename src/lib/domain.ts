export type PlatformKey = 'adobe' | 'shutterstock' | 'alamy' | 'getty';

export type ReleaseStatus = 'none' | 'model_attached' | 'property_attached' | 'both_attached';
export type StorageBackend = 'local' | 's3';

export type UserRecord = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type AssetRecord = {
  id: string;
  userId: string;
  originalFilename: string;
  storageBackend: StorageBackend;
  storagePath: string;
  mimeType: string;
  fileSize: number;
  width: number | null;
  height: number | null;
  title: string;
  description: string;
  keywords: string[];
  releaseStatus: ReleaseStatus;
  createdAt: string;
  updatedAt: string;
};

export type SubmissionRecord = {
  id: string;
  assetId: string;
  userId: string;
  platform: PlatformKey;
  status: 'exported' | 'failed';
  exportBackend: StorageBackend;
  exportPath: string;
  createdAt: string;
  updatedAt: string;
};

export type PlatformPayload = {
  assetId: string;
  platform: PlatformKey;
  metadata: Record<string, unknown>;
  instructions: string[];
  exportBaseName: string;
};
