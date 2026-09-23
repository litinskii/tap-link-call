import { describe, expect, it } from 'vitest';
import type { AnswerPayload, InvitePayload } from '../types';
import { decodePayload, encodePayload, isAnswerPayload, isInvitePayload } from './payloadCodec';

const invite: InvitePayload = {
  version: 1,
  type: 'invite',
  roomId: 'room-123',
  slotId: 'slot-456',
  hostPeerId: 'host-789',
  offer: { type: 'offer', sdp: 'v=0\r\na=ice-ufrag:hello\r\n' },
};

const answer: AnswerPayload = {
  version: 1,
  type: 'answer',
  roomId: 'room-123',
  slotId: 'slot-456',
  peerId: 'guest-321',
  answer: { type: 'answer', sdp: 'v=0\r\na=ice-ufrag:world\r\n' },
};

describe('payload codec', () => {
  it.each([invite, answer])('round-trips a $type payload', (payload) => {
    const encoded = encodePayload(payload);
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/u);
    expect(decodePayload(encoded)).toEqual(payload);
  });

  it('compresses repetitive SDP text', () => {
    const largeInvite = { ...invite, offer: { ...invite.offer, sdp: 'candidate line\r\n'.repeat(200) } };
    expect(encodePayload(largeInvite).length).toBeLessThan(JSON.stringify(largeInvite).length);
  });

  it('rejects invalid data', () => {
    expect(() => decodePayload('not_valid!')).toThrow(/invalid|damaged/u);
    expect(() => decodePayload(encodePayload({ ...invite, version: 2 } as unknown as InvitePayload))).toThrow(/invalid|damaged/u);
  });

  it('validates payload variants', () => {
    expect(isInvitePayload(invite)).toBe(true);
    expect(isInvitePayload(answer)).toBe(false);
    expect(isAnswerPayload(answer)).toBe(true);
    expect(isAnswerPayload(invite)).toBe(false);
  });
});
