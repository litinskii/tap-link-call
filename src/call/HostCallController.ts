import type { AnswerPayload, ConnectionStatus, InvitePayload } from '../types';
import { waitForIceGatheringComplete } from '../webrtc/ice';
import { BaseCallController } from './BaseCallController';
import { PeerController } from './PeerController';

export class HostCallController extends BaseCallController {
  slotId: string | null = null;
  invitePayload: InvitePayload | null = null;
  remotePeerId: string | null = null;
  status: ConnectionStatus = 'ready';
  error: string | null = null;
  private answerChannel: BroadcastChannel | null = null;

  constructor(roomId: string, localPeerId: string, localStream: MediaStream) {
    super(roomId, localPeerId, localStream);
    if ('BroadcastChannel' in window) {
      this.answerChannel = new BroadcastChannel(`quick-call:${roomId}`);
      this.answerChannel.addEventListener('message', (event) => {
        if (event.data?.type !== 'IMPORT_ANSWER') return;
        void this.importAnswer(event.data.payload)
          .then(() => this.answerChannel?.postMessage({ type: 'ANSWER_IMPORTED', slotId: this.slotId }))
          .catch(() => undefined);
      });
    }
  }

  async createInvitation(): Promise<InvitePayload> {
    if (this.peer) throw new Error('This Phase 1 call already has an invitation or participant.');
    this.error = null;
    this.status = 'preparing';
    this.emitChange();

    const slotId = crypto.randomUUID();
    const peer = new PeerController(this.localStream, this.localPeerId, true);
    this.slotId = slotId;
    this.setPeer(peer);

    try {
      const offer = await peer.connection.createOffer();
      await peer.connection.setLocalDescription(offer);
      await waitForIceGatheringComplete(peer.connection);
      const localDescription = peer.connection.localDescription;
      if (!localDescription?.sdp) throw new Error('The browser could not prepare the invitation.');

      this.invitePayload = {
        version: 1,
        type: 'invite',
        roomId: this.roomId,
        slotId,
        hostPeerId: this.localPeerId,
        offer: { type: 'offer', sdp: localDescription.sdp },
      };
      this.status = 'waiting-for-response';
      this.emitChange();
      return this.invitePayload;
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'The invitation could not be created.';
      this.status = 'failed';
      peer.close();
      this.peer = null;
      this.slotId = null;
      this.emitChange();
      throw error;
    }
  }

  async importAnswer(payload: AnswerPayload): Promise<void> {
    if (payload.roomId !== this.roomId) throw new Error('This response belongs to another call.');
    if (!this.slotId || payload.slotId !== this.slotId || !this.peer) {
      throw new Error('This response does not match the active invitation.');
    }
    if (this.peer.connection.currentRemoteDescription) return;

    this.status = 'connecting';
    this.error = null;
    this.remotePeerId = payload.peerId;
    this.emitChange();
    try {
      await this.peer.connection.setRemoteDescription(payload.answer);
      this.watchConnection();
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'The response could not be applied.';
      this.status = 'failed';
      this.emitChange();
      throw error;
    }
  }

  private watchConnection(): void {
    if (!this.peer) return;
    const update = () => {
      const state = this.peer?.connection.connectionState;
      if (state === 'connected') this.status = 'connected';
      else if (state === 'failed') {
        this.status = 'failed';
        this.error = "We couldn't connect the call. Please try again or switch networks.";
      } else if (state === 'disconnected') this.status = 'disconnected';
      else if (state === 'closed') {
        this.status = 'disconnected';
        this.error = 'The other person left the call.';
      }
      else if (state === 'connecting' || state === 'new') this.status = 'connecting';
      this.emitChange();
    };
    this.peer.connection.addEventListener('connectionstatechange', update);
    update();
  }

  cancelInvitation(): void {
    if (this.status === 'connected' || this.status === 'connecting') return;
    this.peer?.close();
    this.peer = null;
    this.slotId = null;
    this.invitePayload = null;
    this.status = 'ready';
    this.error = null;
    this.emitChange();
  }

  async retryInvitation(): Promise<InvitePayload> {
    if (this.status === 'connected') throw new Error('The call is already connected.');
    this.peer?.close();
    this.peer = null;
    this.slotId = null;
    this.invitePayload = null;
    this.remotePeerId = null;
    this.error = null;
    return this.createInvitation();
  }

  override leave(): void {
    this.answerChannel?.close();
    this.answerChannel = null;
    super.leave();
    this.status = 'closed';
  }
}
