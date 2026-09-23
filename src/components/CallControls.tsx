import type { MediaState } from '../types';

type Props = {
  mediaState: MediaState;
  onToggleMicrophone: () => void;
  onToggleCamera: () => void;
  onLeave: () => void;
};

export function CallControls({ mediaState, onToggleMicrophone, onToggleCamera, onLeave }: Props) {
  return (
    <div className="call-controls" aria-label="Call controls">
      <button className={`control-button ${!mediaState.microphoneEnabled ? 'control-button--off' : ''}`} onClick={onToggleMicrophone}>
        <span className="control-icon" aria-hidden="true">{mediaState.microphoneEnabled ? '●' : '×'}</span>
        {mediaState.microphoneEnabled ? 'Mute' : 'Unmute'}
      </button>
      <button className={`control-button ${!mediaState.cameraEnabled ? 'control-button--off' : ''}`} onClick={onToggleCamera}>
        <span className="control-icon control-icon--camera" aria-hidden="true">▰</span>
        {mediaState.cameraEnabled ? 'Camera' : 'Camera on'}
      </button>
      <button className="control-button control-button--leave" onClick={onLeave}>
        <span className="control-icon" aria-hidden="true">↘</span>
        Leave
      </button>
    </div>
  );
}
