import type { ControlMessage, MediaState, PeerDebugStats } from '../types';
import { collectDebugStats } from '../webrtc/stats';
import { RTC_CONFIGURATION } from '../webrtc/rtcConfig';

type ByteSample = { sent: number; received: number; at: number };

export class PeerController extends EventTarget {
  readonly connection: RTCPeerConnection;
  readonly remoteStream = new MediaStream();
  controlChannel: RTCDataChannel | null = null;
  remoteMediaState: MediaState = { microphoneEnabled: true, cameraEnabled: true };
  debugStats: PeerDebugStats;
  private statsTimer: number | null = null;
  private byteSample?: ByteSample;

  constructor(
    localStream: MediaStream,
    private readonly localPeerId: string,
    createDataChannel: boolean,
  ) {
    super();
    this.connection = new RTCPeerConnection(RTC_CONFIGURATION);
    this.debugStats = this.emptyDebugStats();

    localStream.getTracks().forEach((track) => this.connection.addTrack(track, localStream));
    this.connection.addEventListener('track', (event) => {
      const incoming = event.streams[0];
      if (incoming) {
        incoming.getTracks().forEach((track) => {
          if (!this.remoteStream.getTracks().some((current) => current.id === track.id)) {
            this.remoteStream.addTrack(track);
          }
        });
      } else if (!this.remoteStream.getTracks().some((track) => track.id === event.track.id)) {
        this.remoteStream.addTrack(event.track);
      }
      this.emitChange();
    });
    this.connection.addEventListener('connectionstatechange', () => {
      this.refreshDebugState();
      this.emitChange();
    });
    this.connection.addEventListener('iceconnectionstatechange', () => {
      this.refreshDebugState();
      this.emitChange();
    });
    this.connection.addEventListener('signalingstatechange', () => {
      this.refreshDebugState();
      this.emitChange();
    });
    this.connection.addEventListener('datachannel', (event) => this.attachDataChannel(event.channel));

    if (createDataChannel) this.attachDataChannel(this.connection.createDataChannel('control', { ordered: true }));
    if (this.diagnosticsEnabled()) this.startStats();
  }

  private emptyDebugStats(): PeerDebugStats {
    return {
      connectionState: this.connection?.connectionState ?? 'new',
      iceConnectionState: this.connection?.iceConnectionState ?? 'new',
      iceGatheringState: this.connection?.iceGatheringState ?? 'new',
      signalingState: this.connection?.signalingState ?? 'stable',
      dataChannelState: 'none',
      localCandidates: '—',
      remoteCandidates: '—',
      selectedCandidatePair: '—',
      hasIpv6Candidate: false,
      resolution: '—',
      outgoingKbps: 0,
      incomingKbps: 0,
      rttMs: 0,
      packetsLost: 0,
      framesSent: 0,
      framesReceived: 0,
    };
  }

  private attachDataChannel(channel: RTCDataChannel): void {
    this.controlChannel = channel;
    channel.addEventListener('open', () => {
      this.emitChange();
      this.dispatchEvent(new Event('controlopen'));
    });
    channel.addEventListener('close', () => this.emitChange());
    channel.addEventListener('error', () => this.emitChange());
    channel.addEventListener('message', (event) => {
      try {
        const message = JSON.parse(String(event.data)) as ControlMessage;
        if (message.type === 'HELLO' || message.type === 'MEDIA_STATE') {
          this.remoteMediaState = {
            microphoneEnabled: message.microphoneEnabled,
            cameraEnabled: message.cameraEnabled,
          };
        }
        this.dispatchEvent(new CustomEvent<ControlMessage>('controlmessage', { detail: message }));
        if (message.type === 'PEER_LEFT') this.close();
        this.emitChange();
      } catch {
        // Ignore malformed peer messages. They never affect signaling state.
      }
    });
    this.refreshDebugState();
  }

  send(message: ControlMessage): void {
    if (this.controlChannel?.readyState === 'open') {
      this.controlChannel.send(JSON.stringify(message));
    }
  }

  sendHello(mediaState: MediaState): void {
    this.send({ type: 'HELLO', peerId: this.localPeerId, ...mediaState });
  }

  sendMediaState(mediaState: MediaState): void {
    this.send({ type: 'MEDIA_STATE', peerId: this.localPeerId, ...mediaState });
  }

  private refreshDebugState(): void {
    this.debugStats = {
      ...this.debugStats,
      connectionState: this.connection.connectionState,
      iceConnectionState: this.connection.iceConnectionState,
      iceGatheringState: this.connection.iceGatheringState,
      signalingState: this.connection.signalingState,
      dataChannelState: this.controlChannel?.readyState ?? 'none',
    };
  }

  private startStats(): void {
    const update = async () => {
      if (this.connection.connectionState === 'closed') return;
      try {
        const result = await collectDebugStats(this.connection, this.controlChannel, this.byteSample);
        this.debugStats = result.stats;
        this.byteSample = result.sample;
        this.emitChange();
      } catch {
        // Stats support differs slightly between browsers; the call should continue.
      }
    };
    void update();
    this.statsTimer = window.setInterval(() => void update(), 3_000);
  }

  private diagnosticsEnabled(): boolean {
    return import.meta.env.DEV || new URLSearchParams(window.location.search).get('debug') === '1';
  }

  private emitChange(): void {
    this.dispatchEvent(new Event('change'));
  }

  close(sendLeave = false): void {
    if (sendLeave) this.send({ type: 'PEER_LEFT', peerId: this.localPeerId });
    if (this.statsTimer !== null) window.clearInterval(this.statsTimer);
    this.controlChannel?.close();
    this.connection.close();
    this.remoteStream.getTracks().forEach((track) => {
      track.stop();
      this.remoteStream.removeTrack(track);
    });
    this.refreshDebugState();
    this.emitChange();
  }
}
