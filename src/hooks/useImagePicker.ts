import { useCallback, useState } from 'react';

import * as ImagePicker from 'expo-image-picker';

import type { MediaHookError, PickedImage } from '@/lib/media/types';

const defaultPickerOptions: ImagePicker.ImagePickerOptions = {
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  allowsEditing: false,
  quality: 0.9,
};

function createMediaError(error: unknown, fallback: string): MediaHookError {
  if (error instanceof Error) {
    return { message: error.message || fallback, cause: error };
  }
  return { message: fallback, cause: error };
}

function mapAssetToImage(asset: ImagePicker.ImagePickerAsset, fromCamera: boolean): PickedImage {
  return {
    uri: asset.uri,
    width: asset.width ?? 0,
    height: asset.height ?? 0,
    fileSize: asset.fileSize ?? null,
    fileName: asset.fileName ?? null,
    mimeType: asset.mimeType ?? asset.type ?? null,
    fromCamera,
  };
}

async function ensureLibraryPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
}

async function ensureCameraPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  return status === 'granted';
}

export type UseImagePickerResult = {
  pickImage: (options?: ImagePicker.ImagePickerOptions) => Promise<PickedImage | null>;
  captureImage: (options?: ImagePicker.ImagePickerOptions) => Promise<PickedImage | null>;
  loading: boolean;
  error: MediaHookError | null;
  reset: () => void;
};

export function useImagePicker(): UseImagePickerResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<MediaHookError | null>(null);

  const pickImage = useCallback<UseImagePickerResult['pickImage']>(
    async (options) => {
      setLoading(true);
      setError(null);

      try {
        const hasPermission = await ensureLibraryPermission();
        if (!hasPermission) {
          setError({ message: 'Photo library access is required to pick images.' });
          return null;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          ...defaultPickerOptions,
          ...options,
        });

        if (result.canceled || !result.assets?.length) {
          return null;
        }

        return mapAssetToImage(result.assets[0] as ImagePicker.ImagePickerAsset, false);
      } catch (caught) {
        const mediaError = createMediaError(caught, 'Unable to select image.');
        setError(mediaError);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const captureImage = useCallback<UseImagePickerResult['captureImage']>(
    async (options) => {
      setLoading(true);
      setError(null);

      try {
        const hasCameraPermission = await ensureCameraPermission();
        if (!hasCameraPermission) {
          setError({ message: 'Camera access is required to capture images.' });
          return null;
        }

        const result = await ImagePicker.launchCameraAsync({
          ...defaultPickerOptions,
          ...options,
        });

        if (result.canceled || !result.assets?.length) {
          return null;
        }

        return mapAssetToImage(result.assets[0] as ImagePicker.ImagePickerAsset, true);
      } catch (caught) {
        const mediaError = createMediaError(caught, 'Unable to capture image.');
        setError(mediaError);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setError(null);
  }, []);

  return {
    pickImage,
    captureImage,
    loading,
    error,
    reset,
  };
}
