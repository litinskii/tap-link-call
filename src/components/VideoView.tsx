import { useEffect, useRef } from 'react';

type Props = {
  stream: MediaStream | null;
  muted?: boolean;
  label: string;
  cameraEnabled: boolean;
  variant?: 'remote' | 'local';
};

export function VideoView({ stream, muted = false, label, cameraEnabled, variant = 'remote' }: Props) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (ref.current && ref.current.srcObject !== stream) ref.current.srcObject = stream;
  }, [stream]);

  return (
    <div className={`video-card video-card--${variant}`}>
      <video ref={ref} autoPlay muted={muted} playsInline className={!cameraEnabled ? 'video--hidden' : ''} />
      {!cameraEnabled && (
        <div className="video-placeholder" aria-label={`${label}'s camera is off`}>
          <span aria-hidden="true">{label === 'You' ? 'Y' : 'P'}</span>
          <small>Camera off</small>
        </div>
      )}
      <div className="video-label">
        {label}
        {!cameraEnabled && <span aria-label="Camera off"> · camera off</span>}
      </div>
    </div>
  );
}
