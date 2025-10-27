import { v2 as cloudinary } from 'cloudinary';

import { env } from '@lib/env';

cloudinary.config({
  cloudinary_url: env.CLOUDINARY_URL,
  secure: true,
});

export function getCloudinary() {
  return cloudinary;
}

export type UploadOptions = {
  folder?: string;
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
  publicId?: string;
};

export type MediaType = 'image' | 'audio' | 'file';

export function getUploadOptions(mediaType: MediaType, folder?: string): UploadOptions {
  const baseFolder = folder ?? 'friendly-chart';

  switch (mediaType) {
    case 'image':
      return {
        folder: `${baseFolder}/images`,
        resourceType: 'image',
      };
    case 'audio':
      return {
        folder: `${baseFolder}/audio`,
        resourceType: 'video',
      };
    default:
      return {
        folder: `${baseFolder}/files`,
        resourceType: 'raw',
      };
  }
}
