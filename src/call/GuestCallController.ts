import type { AnswerPayload, ConnectionStatus, InvitePayload } from '../types';
import { waitForIceGatheringComplete } from '../webrtc/ice';
import { BaseCallController } from './BaseCallController';
import { PeerController } from './PeerController';

export class GuestCallController extends BaseCallController {
  answerPayload: AnswerPayload | null = null;
  status: ConnectionStatus = 'preparing';
  error: string | null = null;

  private constructor(
    roomId: string,
    localPeerId: string,
    localStream: MediaStream,
    readonly hostPeerId: string,
  ) {
    super(roomId, localPeerId, localStream);
  }

  static async join(invite: InvitePayload, localStream: MediaStream): Promise<GuestCallController> {
    const localPeerId = crypto.randomUUID();
    const controller = new GuestCallController(invite.roomId, localPeerId, localStream, invite.hostPeerId);
    const peer = new PeerController(localStream, localPeerId, false);
    controller.setPeer(peer);

    try {
      await peer.connection.setRemoteDescription(invite.offer);
      const answer = await peer.connection.createAnswer();
      await peer.connection.setLocalDescription(answer);
      await waitForIceGatheringComplete(peer.connection);
      const localDescription = peer.connection.localDescription;
      if (!localDescription?.sdp) throw new Error('The browser could not prepare your response.');
      controller.answerPayload = {
        version: 1,
        type: 'answer',
        roomId: invite.roomId,
        slotId: invite.slotId,
        peerId: localPeerId,
        answer: { type: 'answer', sdp: localDescription.sdp },
      };
      controller.status = 'waiting-for-response';
      controller.watchConnection();
      controller.emitChange();
      return controller;
    } catch (error) {
      controller.error = error instanceof Error ? error.message : 'The response could not be created.';
      controller.status = 'failed';
      controller.emitChange();
      peer.close();
      throw error;
    }
  }

  private watchConnection(): void {
    if (!this.peer) return;
    const update = () => {
      const state = this.peer?.connection.connectionState;
      if (state === 'connected') this.status = 'connected';
      else if (state === 'failed') {
        // The guest cannot know whether the host has imported the manual response yet.
        // Keep the response visible instead of reporting a premature network failure.
        this.status = 'waiting-for-response';
        this.error = null;
      } else if (state === 'disconnected') this.status = 'disconnected';
      else if (state === 'closed') {
        this.status = 'disconnected';
        this.error = 'The other person left the call.';
      }
      else if (state === 'connecting' && this.status !== 'waiting-for-response') this.status = 'connecting';
      this.emitChange();
    };
    this.peer.connection.addEventListener('connectionstatechange', update);
    update();
  }

  override leave(): void {
    super.leave();
    this.status = 'closed';
  }
}
