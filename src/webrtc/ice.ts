const ICE_GATHERING_TIMEOUT_MS = 15_000;

export function waitForIceGatheringComplete(pc: RTCPeerConnection): Promise<void> {
  if (pc.iceGatheringState === 'complete') return Promise.resolve();

  return new Promise((resolve, reject) => {
    let timeoutId = 0;
    const cleanup = () => {
      window.clearTimeout(timeoutId);
      pc.removeEventListener('icegatheringstatechange', onStateChange);
    };
    const finish = () => {
      cleanup();
      resolve();
    };
    const onStateChange = () => {
      if (pc.iceGatheringState === 'complete') finish();
    };

    pc.addEventListener('icegatheringstatechange', onStateChange);
    timeoutId = window.setTimeout(() => {
      cleanup();
      reject(new Error('The browser could not prepare a direct connection. Please try again.'));
    }, ICE_GATHERING_TIMEOUT_MS);
  });
}
