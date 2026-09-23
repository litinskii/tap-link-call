import { useEffect, useState } from 'react';
import type { AnswerPayload } from '../types';

export function AnswerRelayScreen({ payload, onDone }: { payload: AnswerPayload; onDone: () => void }) {
  const [state, setState] = useState<'sending' | 'sent' | 'not-found'>('sending');

  useEffect(() => {
    if (!('BroadcastChannel' in window)) {
      setState('not-found');
      return;
    }
    const channel = new BroadcastChannel(`quick-call:${payload.roomId}`);
    let attempts = 0;
    const send = () => {
      attempts += 1;
      channel.postMessage({ type: 'IMPORT_ANSWER', payload });
      if (attempts >= 8) {
        window.clearInterval(interval);
        setState('not-found');
      }
    };
    const interval = window.setInterval(send, 700);
    channel.addEventListener('message', (event) => {
      if (event.data?.type === 'ANSWER_IMPORTED' && event.data.slotId === payload.slotId) {
        setState('sent');
        window.clearInterval(interval);
        window.setTimeout(onDone, 1_500);
      }
    });
    send();
    return () => {
      window.clearInterval(interval);
      channel.close();
    };
  }, [onDone, payload]);

  return (
    <main className="landing-shell">
      <section className="landing-card">
        <div className={`relay-icon relay-icon--${state}`} aria-hidden="true">{state === 'sent' ? '✓' : '↗'}</div>
        <h1>{state === 'sent' ? 'Response delivered' : state === 'not-found' ? 'Open your call tab' : 'Connecting your call…'}</h1>
        <p className="lead">
          {state === 'sent'
            ? 'Return to the original call tabs.'
            : state === 'not-found'
              ? 'The original call tab was not found. Copy this response link and use “Import response” there.'
              : 'Keep this page open for a moment.'}
        </p>
      </section>
    </main>
  );
}
