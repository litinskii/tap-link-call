export type InvitePayload = {
  version: 1;
  type: 'invite';
  roomId: string;
  slotId: string;
  hostPeerId: string;
  offer: { type: 'offer'; sdp: string };
};

export type AnswerPayload = {
  version: 1;
  type: 'answer';
  roomId: string;
  slotId: string;
  peerId: string;
  answer: { type: 'answer'; sdp: string };
};

export type SignalingPayload = InvitePayload | AnswerPayload;

export type MediaState = {
  microphoneEnabled: boolean;
  cameraEnabled: boolean;
};

export type ControlMessage =
  | ({ type: 'HELLO'; peerId: string } & MediaState)
  | ({ type: 'MEDIA_STATE'; peerId: string } & MediaState)
  | { type: 'PEER_LEFT'; peerId: string };

export type ConnectionStatus =
  | 'preparing'
  | 'ready'
  | 'waiting-for-response'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'failed'
  | 'closed';

export type PeerDebugStats = {
  connectionState: RTCPeerConnectionState;
  iceConnectionState: RTCIceConnectionState;
  iceGatheringState: RTCIceGatheringState;
  signalingState: RTCSignalingState;
  dataChannelState: RTCDataChannelState | 'none';
  localCandidates: string;
  remoteCandidates: string;
  selectedCandidatePair: string;
  hasIpv6Candidate: boolean;
  resolution: string;
  outgoingKbps: number;
  incomingKbps: number;
  rttMs: number;
  packetsLost: number;
  framesSent: number;
  framesReceived: number;
};
