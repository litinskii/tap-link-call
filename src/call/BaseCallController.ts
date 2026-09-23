import type { MediaState } from '../types';
import { stopMedia } from '../webrtc/media';
import { PeerController } from './PeerController';

export abstract class BaseCallController extends EventTarget {
  peer: PeerController | null = null;
  mediaState: MediaState = { microphoneEnabled: true, cameraEnabled: true };

  protected constructor(
    readonly roomId: string,
    readonly localPeerId: string,
    readonly localStream: MediaStream,
  ) {
    super();
  }

  protected setPeer(peer: PeerController): void {
    this.peer = peer;
    peer.addEventListener('change', () => this.emitChange());
    peer.addEventListener('controlopen', () => peer.sendHello(this.mediaState));
    peer.addEventListener('controlmessage', () => this.emitChange());
    this.emitChange();
  }

  toggleMicrophone(): void {
    this.mediaState = { ...this.mediaState, microphoneEnabled: !this.mediaState.microphoneEnabled };
    this.localStream.getAudioTracks().forEach((track) => {
      track.enabled = this.mediaState.microphoneEnabled;
    });
    this.peer?.sendMediaState(this.mediaState);
    this.emitChange();
  }

  toggleCamera(): void {
    this.mediaState = { ...this.mediaState, cameraEnabled: !this.mediaState.cameraEnabled };
    this.localStream.getVideoTracks().forEach((track) => {
      track.enabled = this.mediaState.cameraEnabled;
    });
    this.peer?.sendMediaState(this.mediaState);
    this.emitChange();
  }

  protected emitChange(): void {
    this.dispatchEvent(new Event('change'));
  }

  leave(): void {
    this.peer?.close(true);
    stopMedia(this.localStream);
    this.emitChange();
  }
}
