import { compressSync, decompressSync, strFromU8, strToU8 } from 'fflate';
import type { AnswerPayload, InvitePayload, SignalingPayload } from '../types';

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;

  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }

  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function toBase64Url(bytes: Uint8Array): string {
  return bytesToBase64(bytes)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/u, '');
}

function fromBase64Url(value: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]+$/u.test(value)) {
    throw new Error('The link contains invalid characters.');
  }
  const base64 = value.replaceAll('-', '+').replaceAll('_', '/');
  return base64ToBytes(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='));
}

export function encodePayload(payload: SignalingPayload): string {
  return toBase64Url(compressSync(strToU8(JSON.stringify(payload)), { level: 9 }));
}

function isDescription(value: unknown, type: 'offer' | 'answer'): boolean {
  if (!value || typeof value !== 'object') return false;
  const description = value as Record<string, unknown>;
  return description.type === type && typeof description.sdp === 'string' && description.sdp.length > 0;
}

function isCommonPayload(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object') return false;
  const payload = value as Record<string, unknown>;
  return (
    payload.version === 1 &&
    typeof payload.roomId === 'string' &&
    payload.roomId.length > 0 &&
    typeof payload.slotId === 'string' &&
    payload.slotId.length > 0
  );
}

export function isInvitePayload(value: unknown): value is InvitePayload {
  if (!isCommonPayload(value)) return false;
  return (
    value.type === 'invite' &&
    typeof value.hostPeerId === 'string' &&
    value.hostPeerId.length > 0 &&
    isDescription(value.offer, 'offer')
  );
}

export function isAnswerPayload(value: unknown): value is AnswerPayload {
  if (!isCommonPayload(value)) return false;
  return (
    value.type === 'answer' &&
    typeof value.peerId === 'string' &&
    value.peerId.length > 0 &&
    isDescription(value.answer, 'answer')
  );
}

export function decodePayload(value: string): SignalingPayload {
  try {
    const decoded: unknown = JSON.parse(strFromU8(decompressSync(fromBase64Url(value))));
    if (isInvitePayload(decoded) || isAnswerPayload(decoded)) return decoded;
  } catch (error) {
    if (error instanceof Error && error.message === 'The link contains invalid characters.') throw error;
  }
  throw new Error('This call link is invalid or damaged. Ask for a new link.');
}

export function buildSignalingUrl(payload: SignalingPayload, baseUrl = window.location.href): string {
  const url = new URL(baseUrl);
  url.search = '';
  url.hash = `${payload.type}=${encodePayload(payload)}`;
  return url.toString();
}

export function readPayloadFromHash(hash = window.location.hash): SignalingPayload | null {
  const match = hash.match(/^#(invite|answer)=(.+)$/u);
  if (!match) return null;
  const payload = decodePayload(match[2]);
  if (payload.type !== match[1]) throw new Error('This call link has mismatched information.');
  return payload;
}
