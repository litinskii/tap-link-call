import type { PeerController } from '../call/PeerController';

export function DebugPanel({ peer, peerId }: { peer: PeerController | null; peerId: string | null }) {
  if (!import.meta.env.DEV || !peer) return null;
  const stats = peer.debugStats;
  return (
    <details className="debug-panel">
      <summary>Development diagnostics</summary>
      <dl>
        <dt>Peer ID</dt><dd>{peerId ?? 'pending'}</dd>
        <dt>Connection</dt><dd>{stats.connectionState}</dd>
        <dt>ICE</dt><dd>{stats.iceConnectionState}</dd>
        <dt>Signaling</dt><dd>{stats.signalingState}</dd>
        <dt>Control channel</dt><dd>{stats.dataChannelState}</dd>
        <dt>Resolution</dt><dd>{stats.resolution}</dd>
        <dt>Outgoing</dt><dd>{stats.outgoingKbps} Kbit/s</dd>
        <dt>Incoming</dt><dd>{stats.incomingKbps} Kbit/s</dd>
        <dt>RTT</dt><dd>{stats.rttMs} ms</dd>
        <dt>Packets lost</dt><dd>{stats.packetsLost}</dd>
        <dt>Frames sent</dt><dd>{stats.framesSent}</dd>
        <dt>Frames received</dt><dd>{stats.framesReceived}</dd>
      </dl>
    </details>
  );
}
