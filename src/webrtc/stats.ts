import type { PeerDebugStats } from '../types';

type ByteSample = { sent: number; received: number; at: number };

type CandidateStats = RTCStats & {
  address?: string;
  ip?: string;
  candidateType?: string;
  protocol?: string;
};

function candidateLabel(candidate: CandidateStats): string {
  const address = candidate.address ?? candidate.ip ?? '';
  const family = typeof address === 'string' && address.includes(':')
    ? 'IPv6'
    : typeof address === 'string' && address.includes('.')
      ? 'IPv4'
      : 'unknown IP';
  return `${candidate.candidateType ?? 'unknown'}/${candidate.protocol ?? 'unknown'}/${family}`;
}

export async function collectDebugStats(
  pc: RTCPeerConnection,
  dataChannel: RTCDataChannel | null,
  previous?: ByteSample,
): Promise<{ stats: PeerDebugStats; sample: ByteSample }> {
  const report = await pc.getStats();
  let bytesSent = 0;
  let bytesReceived = 0;
  let framesSent = 0;
  let framesReceived = 0;
  let packetsLost = 0;
  let frameWidth = 0;
  let frameHeight = 0;
  let rttMs = 0;
  const localCandidateLabels = new Set<string>();
  const remoteCandidateLabels = new Set<string>();
  const candidates = new Map<string, CandidateStats>();
  let selectedLocalCandidateId: string | undefined;
  let selectedRemoteCandidateId: string | undefined;

  report.forEach((item) => {
    if (item.type === 'local-candidate' || item.type === 'remote-candidate') {
      const candidate = item as CandidateStats;
      candidates.set(item.id, candidate);
      const label = candidateLabel(candidate);
      if (item.type === 'local-candidate') localCandidateLabels.add(label);
      else remoteCandidateLabels.add(label);
    }
    if (item.type === 'outbound-rtp' && !item.isRemote) {
      bytesSent += item.bytesSent ?? 0;
      framesSent += item.framesSent ?? 0;
      if (item.kind === 'video' || item.mediaType === 'video') {
        frameWidth = item.frameWidth ?? frameWidth;
        frameHeight = item.frameHeight ?? frameHeight;
      }
    }
    if (item.type === 'inbound-rtp' && !item.isRemote) {
      bytesReceived += item.bytesReceived ?? 0;
      framesReceived += item.framesDecoded ?? item.framesReceived ?? 0;
      packetsLost += Math.max(0, item.packetsLost ?? 0);
    }
    if (item.type === 'candidate-pair' && item.state === 'succeeded' && item.nominated) {
      rttMs = Math.round((item.currentRoundTripTime ?? 0) * 1000);
      selectedLocalCandidateId = item.localCandidateId;
      selectedRemoteCandidateId = item.remoteCandidateId;
    }
  });

  const selectedLocal = selectedLocalCandidateId ? candidates.get(selectedLocalCandidateId) : undefined;
  const selectedRemote = selectedRemoteCandidateId ? candidates.get(selectedRemoteCandidateId) : undefined;
  const selectedCandidatePair = selectedLocal && selectedRemote
    ? `${candidateLabel(selectedLocal)} → ${candidateLabel(selectedRemote)}`
    : '—';
  const allCandidateLabels = [...localCandidateLabels, ...remoteCandidateLabels];

  const now = performance.now();
  const seconds = previous ? Math.max((now - previous.at) / 1000, 0.001) : 1;
  const outgoingKbps = previous ? Math.max(0, Math.round(((bytesSent - previous.sent) * 8) / seconds / 1000)) : 0;
  const incomingKbps = previous
    ? Math.max(0, Math.round(((bytesReceived - previous.received) * 8) / seconds / 1000))
    : 0;

  return {
    stats: {
      connectionState: pc.connectionState,
      iceConnectionState: pc.iceConnectionState,
      iceGatheringState: pc.iceGatheringState,
      signalingState: pc.signalingState,
      dataChannelState: dataChannel?.readyState ?? 'none',
      localCandidates: [...localCandidateLabels].join(', ') || '—',
      remoteCandidates: [...remoteCandidateLabels].join(', ') || '—',
      selectedCandidatePair,
      hasIpv6Candidate: allCandidateLabels.some((label) => label.includes('IPv6')),
      resolution: frameWidth && frameHeight ? `${frameWidth}×${frameHeight}` : '—',
      outgoingKbps,
      incomingKbps,
      rttMs,
      packetsLost,
      framesSent,
      framesReceived,
    },
    sample: { sent: bytesSent, received: bytesReceived, at: now },
  };
}
