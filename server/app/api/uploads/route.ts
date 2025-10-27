import { UploadApiResponse } from 'cloudinary';
import { NextRequest, NextResponse } from 'next/server';

import { getCloudinary, getUploadOptions, type MediaType } from '@lib/cloudinary';
import { HttpError, normalizeError } from '@lib/httpError';

export const runtime = 'nodejs';

function assertFile(value: FormDataEntryValue | null): File {
  if (!value || !(value instanceof File)) {
    throw new HttpError(400, 'Expected a file upload under the "file" field');
  }

  return value;
}

function getMediaType(entry: FormDataEntryValue | null): MediaType {
  if (!entry) {
    return 'file';
  }

  const value = entry.toString();
  if (value === 'image' || value === 'audio' || value === 'file') {
    return value;
  }

  throw new HttpError(400, 'Invalid media type');
}

async function bufferFromFile(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function uploadToCloudinary(file: File, mediaType: MediaType, folder?: string): Promise<UploadApiResponse> {
  const cloudinary = getCloudinary();
  const uploadOptions = getUploadOptions(mediaType, folder);
  const buffer = await bufferFromFile(file);

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: uploadOptions.resourceType ?? 'auto',
        folder: uploadOptions.folder,
        public_id: uploadOptions.publicId,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error('Unknown Cloudinary upload error'));
          return;
        }
        resolve(result);
      }
    );

    uploadStream.end(buffer);
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const file = assertFile(formData.get('file'));
    const mediaType = getMediaType(formData.get('mediaType'));
    const folder = formData.get('folder')?.toString();

    const uploadResult = await uploadToCloudinary(file, mediaType, folder);

    return NextResponse.json(
      {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        width: uploadResult.width,
        height: uploadResult.height,
        duration: uploadResult.duration,
        format: uploadResult.format,
        resourceType: uploadResult.resource_type,
      },
      { status: 201 }
    );
  } catch (error) {
    const { status, message, details } = normalizeError(error);
    return NextResponse.json({ message, details }, { status });
  }
}
