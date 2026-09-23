import type { AnswerPayload } from '../types';
import { HostCallController } from '../call/HostCallController';
import { GuestCallController } from '../call/GuestCallController';
import { buildSignalingUrl, readPayloadFromHash } from '../signaling/payloadCodec';
import { CallControls } from './CallControls';
import { DebugPanel } from './DebugPanel';
import { ImportResponse } from './ImportResponse';
import { SharePanel } from './SharePanel';
import { VideoView } from './VideoView';

type Props = {
  controller: HostCallController | GuestCallController;
  onLeave: () => void;
};

function statusCopy(status: HostCallController['status']) {
  if (status === 'ready') return { label: 'Ready', tone: 'connected' };
  if (status === 'connected') return { label: 'Connected', tone: 'connected' };
  if (status === 'failed') return { label: 'Connection problem', tone: 'danger' };
  if (status === 'disconnected') return { label: 'Reconnecting…', tone: 'warning' };
  if (status === 'preparing') return { label: 'Preparing…', tone: 'neutral' };
  if (status === 'waiting-for-response') return { label: 'Waiting', tone: 'neutral' };
  return { label: 'Connecting…', tone: 'warning' };
}

export function CallScreen({ controller, onLeave }: Props) {
  const isHost = controller instanceof HostCallController;
  const status = statusCopy(controller.status);
  const remoteCamera = controller.peer?.remoteMediaState.cameraEnabled ?? true;
  const hasRemote = Boolean(controller.peer?.remoteStream.getTracks().length);

  async function importResponse(value: string) {
    const url = new URL(value);
    const payload = readPayloadFromHash(url.hash);
    if (!payload || payload.type !== 'answer') throw new Error('Paste the response link sent by your guest.');
    await (controller as HostCallController).importAnswer(payload as AnswerPayload);
  }

  return (
    <main className="call-shell">
      <header className="call-header">
        <a className="brand" href="#" onClick={(event) => event.preventDefault()}>
          <span className="brand-mark brand-mark--small" aria-hidden="true"><span /><span /></span>
          Quick Call
        </a>
        <span className={`status-pill status-pill--${status.tone}`}><i />{status.label}</span>
      </header>

      <section className={`video-stage ${hasRemote ? 'video-stage--connected' : ''}`}>
        {hasRemote ? (
          <VideoView stream={controller.peer?.remoteStream ?? null} label="Person 2" cameraEnabled={remoteCamera} />
        ) : (
          <div className="waiting-stage">
            <div className="waiting-orbit" aria-hidden="true"><span>+</span></div>
            <h2>{isHost ? 'Your call is ready' : 'Almost ready'}</h2>
            <p>{isHost ? 'Invite someone to join you.' : 'Send your response, then keep this page open.'}</p>
          </div>
        )}
        <VideoView stream={controller.localStream} muted label="You" cameraEnabled={controller.mediaState.cameraEnabled} variant="local" />
      </section>

      <section className="call-action-area">
        {isHost && !controller.peer && controller.status !== 'preparing' && (
          <button className="primary-button invite-button" onClick={() => void controller.createInvitation()}>
            <span aria-hidden="true">＋</span> Invite someone
          </button>
        )}
        {isHost && controller.status === 'preparing' && <p className="preparing-line"><span className="spinner spinner--dark" /> Preparing invitation…</p>}
        {isHost && controller.invitePayload && controller.status === 'waiting-for-response' && (
          <>
            <SharePanel
              title="Invite someone"
              description="Send this private link to the person you want to call."
              url={buildSignalingUrl(controller.invitePayload)}
              shareText="Open this link to join my Quick Call"
              copyLabel="Copy link"
            />
            <button className="text-button text-button--muted" onClick={() => controller.cancelInvitation()}>Cancel invitation</button>
          </>
        )}
        {!isHost && controller.answerPayload && controller.status !== 'connected' && (
          <SharePanel
            title="Almost ready"
            description="Send this back to the person who invited you, then keep this page open."
            url={buildSignalingUrl(controller.answerPayload)}
            shareText="Open this to connect me to the call"
            copyLabel="Copy response"
          />
        )}
        {isHost && controller.peer && controller.status !== 'connected' && <ImportResponse onImport={importResponse} />}
        {controller.error && <p className="error-message error-message--call" role="alert">{controller.error}</p>}
      </section>

      <CallControls
        mediaState={controller.mediaState}
        onToggleMicrophone={() => controller.toggleMicrophone()}
        onToggleCamera={() => controller.toggleCamera()}
        onLeave={onLeave}
      />
      <DebugPanel peer={controller.peer} peerId={isHost ? controller.remotePeerId : controller.hostPeerId} />
    </main>
  );
}
