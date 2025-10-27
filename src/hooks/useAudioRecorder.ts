import { useCallback, useEffect, useRef, useState } from 'react';

import { Audio } from 'expo-av';

import type { AudioRecordingAsset, MediaHookError } from '@/lib/media/types';

export type AudioRecorderStatus = 'idle' | 'recording' | 'stopping' | 'error';

async function ensureAudioPermission(): Promise<boolean> {
  const permission = await Audio.getPermissionsAsync();

  if (permission.status === 'granted') {
    return true;
  }

  const requested = await Audio.requestPermissionsAsync();
  return requested.status === 'granted';
}

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
  const recordingRef = useRef<Audio.Recording | null>(null);
  const [status, setStatus] = useState<AudioRecorderStatus>('idle');
  const [error, setError] = useState<MediaHookError | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    void (async () => {
      const existing = await Audio.getPermissionsAsync();
      setHasPermission(existing.status === 'granted');
    })();
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);

    try {
      const permissionGranted = await ensureAudioPermission();
      setHasPermission(permissionGranted);

      if (!permissionGranted) {
        setError({ message: 'Microphone access is required to record audio.' });
        return false;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();

      recordingRef.current = recording;
      setStatus('recording');
      return true;
    } catch (caught) {
      const mediaError = createMediaError(caught, 'Unable to start recording.');
      setError(mediaError);
      setStatus('error');
      return false;
    }
  }, []);

  const stopRecording = useCallback(async () => {
    const recording = recordingRef.current;

    if (!recording) {
      return null;
    }

    setStatus('stopping');

    try {
      await recording.stopAndUnloadAsync();
      const recordingStatus = (await recording.getStatusAsync()) as Audio.RecordingStatus;
      const uri = recording.getURI();

      recordingRef.current = null;
      setStatus('idle');

      if (!uri) {
        return null;
      }

      return {
        uri,
        durationMillis: recordingStatus.durationMillis ?? 0,
        mimeType: 'audio/m4a',
        fileSize: null,
      } satisfies AudioRecordingAsset;
    } catch (caught) {
      const mediaError = createMediaError(caught, 'Unable to finalize recording.');
      setError(mediaError);
      setStatus('error');
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setStatus('idle');
  }, []);

  useEffect(() => {
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => undefined);
      }
    };
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
