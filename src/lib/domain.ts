export type PlatformKey = 'adobe' | 'shutterstock' | 'alamy' | 'getty';

export type ReleaseStatus = 'none' | 'model_attached' | 'property_attached' | 'both_attached';

export type AssetRecord = {
  id: string;
  originalFilename: string;
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
  platform: PlatformKey;
  status: 'exported' | 'failed';
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
