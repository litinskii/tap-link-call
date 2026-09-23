import type { PeerDebugStats } from '../types';

type ByteSample = { sent: number; received: number; at: number };

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

  report.forEach((item) => {
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
    }
  });

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
      signalingState: pc.signalingState,
      dataChannelState: dataChannel?.readyState ?? 'none',
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
