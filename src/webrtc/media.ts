export async function requestLocalMedia(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('Camera and microphone are not available in this browser.');
  }

  return navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
    video: {
      facingMode: 'user',
      width: { ideal: 640 },
      height: { ideal: 360 },
      frameRate: { ideal: 20, max: 24 },
    },
  });
}

export function stopMedia(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => track.stop());
}

export function friendlyMediaError(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
      return 'Camera and microphone access is needed for the call. Please allow access and try again.';
    }
    if (error.name === 'NotFoundError') {
      return 'No camera or microphone was found on this device.';
    }
    if (error.name === 'NotReadableError') {
      return 'Your camera or microphone is already in use by another app.';
    }
  }
  return error instanceof Error ? error.message : 'We could not start the camera and microphone.';
}
