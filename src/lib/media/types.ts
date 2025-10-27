export type PickedImage = {
  uri: string;
  width: number;
  height: number;
  fileSize?: number | null;
  fileName?: string | null;
  mimeType?: string | null;
  fromCamera: boolean;
};

export type AudioRecordingAsset = {
  uri: string;
  durationMillis: number;
  mimeType?: string | null;
  fileSize?: number | null;
  channels?: number | null;
  sampleRate?: number | null;
};

export type MediaHookError = {
  message: string;
  cause?: unknown;
};
