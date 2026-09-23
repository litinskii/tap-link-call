import { useCallback, useEffect, useMemo, useState } from 'react';
import { HostCallController } from '../call/HostCallController';
import { GuestCallController } from '../call/GuestCallController';
import { AnswerRelayScreen } from '../components/AnswerRelayScreen';
import { CallScreen } from '../components/CallScreen';
import { HomeScreen } from '../components/HomeScreen';
import { JoinCallScreen } from '../components/JoinCallScreen';
import { useControllerState } from '../hooks/useControllerState';
import { readPayloadFromHash } from '../signaling/payloadCodec';
import type { AnswerPayload, InvitePayload, SignalingPayload } from '../types';
import { friendlyMediaError, requestLocalMedia, stopMedia } from '../webrtc/media';

type Route =
  | { type: 'home' }
  | { type: 'invite'; payload: InvitePayload }
  | { type: 'answer'; payload: AnswerPayload }
  | { type: 'invalid'; message: string };

function getInitialRoute(): Route {
  if (!window.location.hash) return { type: 'home' };
  try {
    const payload: SignalingPayload | null = readPayloadFromHash();
    if (!payload) return { type: 'home' };
    return payload.type === 'invite' ? { type: 'invite', payload } : { type: 'answer', payload };
  } catch (error) {
    return { type: 'invalid', message: error instanceof Error ? error.message : 'This call link is invalid.' };
  }
}

export default function App() {
  const initialRoute = useMemo(getInitialRoute, []);
  const [route, setRoute] = useState<Route>(initialRoute);
  const [controller, setController] = useState<HostCallController | GuestCallController | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(initialRoute.type === 'invalid' ? initialRoute.message : null);
  useControllerState(controller);

  const cleanUrl = useCallback(() => {
    history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
  }, []);

  useEffect(() => () => controller?.leave(), [controller]);

  async function startCall() {
    setBusy(true);
    setError(null);
    try {
      const stream = await requestLocalMedia();
      const host = new HostCallController(crypto.randomUUID(), crypto.randomUUID(), stream);
      setController(host);
      setRoute({ type: 'home' });
      cleanUrl();
    } catch (reason) {
      setError(friendlyMediaError(reason));
    } finally {
      setBusy(false);
    }
  }

  async function joinCall(invite: InvitePayload) {
    setBusy(true);
    setError(null);
    let stream: MediaStream | null = null;
    try {
      stream = await requestLocalMedia();
      const guest = await GuestCallController.join(invite, stream);
      setController(guest);
      cleanUrl();
    } catch (reason) {
      stopMedia(stream);
      setError(friendlyMediaError(reason));
    } finally {
      setBusy(false);
    }
  }

  function leaveCall() {
    controller?.leave();
    setController(null);
    setRoute({ type: 'home' });
    setError(null);
    cleanUrl();
  }

  if (controller) return <CallScreen controller={controller} onLeave={leaveCall} />;

  if (route.type === 'answer') {
    return <AnswerRelayScreen payload={route.payload} onDone={() => { cleanUrl(); setRoute({ type: 'home' }); }} />;
  }

  if (route.type === 'invite') {
    return <JoinCallScreen onJoin={() => void joinCall(route.payload)} busy={busy} error={error} />;
  }

  return <HomeScreen onStart={() => void startCall()} busy={busy} error={error} />;
}
