const ICE_GATHERING_TIMEOUT_MS = 25_000;

export function waitForIceGatheringComplete(pc: RTCPeerConnection): Promise<void> {
  if (pc.iceGatheringState === 'complete') return Promise.resolve();

  return new Promise((resolve, reject) => {
    let timeoutId = 0;
    let gatheredCandidate = pc.localDescription?.sdp?.includes('a=candidate:') ?? false;
    const cleanup = () => {
      window.clearTimeout(timeoutId);
      pc.removeEventListener('icegatheringstatechange', onStateChange);
      pc.removeEventListener('icecandidate', onIceCandidate);
    };
    const finish = () => {
      cleanup();
      resolve();
    };
    const onStateChange = () => {
      if (pc.iceGatheringState === 'complete') finish();
    };
    const onIceCandidate = (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate) gatheredCandidate = true;
      else finish();
    };

    pc.addEventListener('icegatheringstatechange', onStateChange);
    pc.addEventListener('icecandidate', onIceCandidate);
    timeoutId = window.setTimeout(() => {
      cleanup();
      const descriptionHasCandidate = pc.localDescription?.sdp?.includes('a=candidate:') ?? false;
      if (gatheredCandidate || descriptionHasCandidate) resolve();
      else reject(new Error('The browser could not find a direct connection route. Please try again.'));
    }, ICE_GATHERING_TIMEOUT_MS);
  });
}
