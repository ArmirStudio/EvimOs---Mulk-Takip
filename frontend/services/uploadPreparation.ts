import { Image } from 'react-native';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

const DEFAULT_MAX_IMAGE_DIMENSION = 1600;
const DEFAULT_IMAGE_QUALITY = 0.72;

type UploadPreparationInput = {
  uri: string;
  name: string;
  mimeType: string;
  size?: number | null;
  maxImageDimension?: number;
  imageQuality?: number;
};

export type PreparedUploadAsset = {
  uri: string;
  name: string;
  mimeType: string;
  size: number | null;
  originalSize: number | null;
  wasTransformed: boolean;
};

function getNormalizedImageMimeType(mimeType: string) {
  return mimeType.toLowerCase().startsWith('image/') ? 'image/jpeg' : mimeType;
}

function replaceExtension(name: string, nextExtension: string) {
  const baseName = name.replace(/\.[^.]+$/, '') || `upload-${Date.now()}`;
  return `${baseName}.${nextExtension}`;
}

function getImageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(uri, (width, height) => resolve({ width, height }), reject);
  });
}

async function getFileSize(uri: string) {
  const response = await fetch(uri);
  const blob = await response.blob();
  return blob.size;
}

export function isCompressibleImage(mimeType: string) {
  return mimeType.toLowerCase().startsWith('image/');
}

export async function prepareUploadAsset(input: UploadPreparationInput): Promise<PreparedUploadAsset> {
  const {
    uri,
    name,
    mimeType,
    size = null,
    maxImageDimension = DEFAULT_MAX_IMAGE_DIMENSION,
    imageQuality = DEFAULT_IMAGE_QUALITY,
  } = input;

  if (!isCompressibleImage(mimeType)) {
    return {
      uri,
      name,
      mimeType,
      size,
      originalSize: size,
      wasTransformed: false,
    };
  }

  const { width, height } = await getImageSize(uri);
  const longestEdge = Math.max(width, height);
  const resizeAction =
    longestEdge > maxImageDimension
      ? width >= height
        ? [{ resize: { width: maxImageDimension } }]
        : [{ resize: { height: maxImageDimension } }]
      : [];

  const result = await manipulateAsync(uri, resizeAction, {
    compress: imageQuality,
    format: SaveFormat.JPEG,
  });
  const preparedSize = await getFileSize(result.uri);

  return {
    uri: result.uri,
    name: replaceExtension(name, 'jpg'),
    mimeType: getNormalizedImageMimeType(mimeType),
    size: preparedSize,
    originalSize: size,
    wasTransformed: true,
  };
}
