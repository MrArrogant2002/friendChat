import { useCallback, useState } from 'react';

import {
  RecordingPresets,
  useAudioRecorderState,
  useAudioRecorder as useExpoAudioRecorder,
} from 'expo-audio';

import type { AudioRecordingAsset, MediaHookError } from '@/lib/media/types';

export type AudioRecorderStatus = 'idle' | 'recording' | 'stopping' | 'error';

function createMediaError(error: unknown, fallback: string): MediaHookError {
  if (error instanceof Error) {
    return { message: error.message || fallback, cause: error };
  }
  return { message: fallback, cause: error };
}

export type UseAudioRecorderResult = {
  startRecording: () => Promise<boolean>;
  stopRecording: () => Promise<AudioRecordingAsset | null>;
  reset: () => void;
  status: AudioRecorderStatus;
  error: MediaHookError | null;
  hasPermission: boolean | null;
};

export function useAudioRecorder(): UseAudioRecorderResult {
  const recorder = useExpoAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const [status, setStatus] = useState<AudioRecorderStatus>('idle');
  const [error, setError] = useState<MediaHookError | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const startRecording = useCallback(async () => {
    setError(null);

    try {
      // expo-audio handles permissions automatically when calling record()
      await recorder.record();
      setHasPermission(true);
      setStatus('recording');
      return true;
    } catch (caught) {
      const mediaError = createMediaError(
        caught,
        'Unable to start recording. Please grant microphone permission.'
      );
      setError(mediaError);
      setStatus('error');
      setHasPermission(false);
      return false;
    }
  }, [recorder]);

  const stopRecording = useCallback(async () => {
    if (!recorder.isRecording) {
      return null;
    }

    setStatus('stopping');

    try {
      await recorder.stop();
      const uri = recorder.uri;
      setStatus('idle');

      if (!uri) {
        return null;
      }

      return {
        uri,
        durationMillis: recorder.currentTime * 1000, // Convert to milliseconds
        mimeType: 'audio/m4a',
        fileSize: null,
      } satisfies AudioRecordingAsset;
    } catch (caught) {
      const mediaError = createMediaError(caught, 'Unable to finalize recording.');
      setError(mediaError);
      setStatus('error');
      return null;
    }
  }, [recorder]);

  const reset = useCallback(() => {
    setError(null);
    setStatus('idle');
  }, []);

  return {
    startRecording,
    stopRecording,
    reset,
    status,
    error,
    hasPermission,
  };
}
