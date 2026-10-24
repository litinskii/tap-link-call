import { describe, expect, it } from 'vitest';
import { RTC_CONFIGURATION } from './rtcConfig';

describe('direct ICE configuration', () => {
  it('uses independent STUN providers without a relay server', () => {
    expect(RTC_CONFIGURATION.iceServers).toHaveLength(2);
    expect(RTC_CONFIGURATION.iceServers?.map((server) => server.urls)).toEqual([
      'stun:stun.cloudflare.com:3478',
      'stun:stun.l.google.com:19302',
    ]);
    expect(JSON.stringify(RTC_CONFIGURATION)).not.toContain('turn:');
    expect(RTC_CONFIGURATION.iceTransportPolicy).toBe('all');
  });
});
