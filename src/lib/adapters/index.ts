import type { AssetRecord, PlatformKey, PlatformPayload } from '../domain';
import { basenameWithoutExt, trimText, unique } from '../utils';

function normalizeKeywords(keywords: string[], max: number) {
  return unique(
    keywords
      .map((keyword) => keyword.trim())
      .filter(Boolean),
  ).slice(0, max);
}

function resolveLicenseMode(asset: AssetRecord) {
  return asset.releaseStatus === 'none' ? 'editorial' : 'commercial';
}

export function buildPlatformPayload(platform: PlatformKey, asset: AssetRecord): PlatformPayload {
  const licenseMode = resolveLicenseMode(asset);
  const common = {
    assetId: asset.id,
    title: asset.title,
    description: asset.description,
    width: asset.width,
    height: asset.height,
    licenseMode,
    releaseStatus: asset.releaseStatus,
  };

  if (platform === 'adobe') {
    return {
      assetId: asset.id,
      platform,
      exportBaseName: `${basenameWithoutExt(asset.originalFilename)}-adobe`,
      instructions: ['Upload the JPEG in Adobe Stock contributor portal.', 'Paste ordered keywords exactly as provided.', 'Confirm release attachment before final submit.'],
      metadata: {
        ...common,
        title: trimText(asset.title, 200),
        keywords: normalizeKeywords(asset.keywords, 49),
        categoryHint: 'People / Education',
      },
    };
  }

  if (platform === 'shutterstock') {
    return {
      assetId: asset.id,
      platform,
      exportBaseName: `${basenameWithoutExt(asset.originalFilename)}-shutterstock`,
      instructions: ['Upload the file in Shutterstock Contributor.', 'If no releases exist, keep the item editorial-only.', 'Review keyword order and remove weak tail terms if needed.'],
      metadata: {
        ...common,
        caption: trimText(asset.description || asset.title, 200),
        keywords: normalizeKeywords(asset.keywords, 50),
        licenseMode,
      },
    };
  }

  if (platform === 'alamy') {
    return {
      assetId: asset.id,
      platform,
      exportBaseName: `${basenameWithoutExt(asset.originalFilename)}-alamy`,
      instructions: ['Upload JPEG to Alamy.', 'Use the caption and keyword set in the package.', 'Review discoverability fields before submission.'],
      metadata: {
        ...common,
        caption: trimText(asset.description || asset.title, 150),
        keywords: normalizeKeywords(asset.keywords, 50),
        discoverabilityNotes: 'Add location and contextual tags if available.',
      },
    };
  }

  return {
    assetId: asset.id,
    platform,
    exportBaseName: `${basenameWithoutExt(asset.originalFilename)}-getty`,
    instructions: ['Prepare this package for Getty/iStock submission flow.', 'Review commercial/editorial classification manually before final submit.'],
    metadata: {
      ...common,
      headline: trimText(asset.title, 80),
      caption: trimText(asset.description, 200),
      keywords: normalizeKeywords(asset.keywords, 50),
      collectionHint: 'Creative / Education',
    },
  };
}
