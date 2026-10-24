import type { PeerController } from '../call/PeerController';

type Props = {
  peer: PeerController | null;
  peerId: string | null;
  open?: boolean;
};

export function DebugPanel({ peer, peerId, open = false }: Props) {
  if (!peer) return null;
  const debugMode = import.meta.env.DEV || new URLSearchParams(window.location.search).get('debug') === '1';
  const stats = peer.debugStats;
  return (
    <details className="debug-panel" open={open || debugMode}>
      <summary>Connection diagnostics</summary>
      <dl>
        <dt>Peer ID</dt><dd>{peerId ?? 'pending'}</dd>
        <dt>Connection</dt><dd>{stats.connectionState}</dd>
        <dt>ICE</dt><dd>{stats.iceConnectionState}</dd>
        <dt>ICE gathering</dt><dd>{stats.iceGatheringState}</dd>
        <dt>Signaling</dt><dd>{stats.signalingState}</dd>
        <dt>Control channel</dt><dd>{stats.dataChannelState}</dd>
        <dt>Local candidates</dt><dd>{stats.localCandidates}</dd>
        <dt>Remote candidates</dt><dd>{stats.remoteCandidates}</dd>
        <dt>Selected path</dt><dd>{stats.selectedCandidatePair}</dd>
        <dt>IPv6 found</dt><dd>{stats.hasIpv6Candidate ? 'yes' : 'no'}</dd>
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
