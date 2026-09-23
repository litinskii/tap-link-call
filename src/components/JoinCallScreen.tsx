type Props = { onJoin: () => void; busy: boolean; error: string | null };

export function JoinCallScreen({ onJoin, busy, error }: Props) {
  return (
    <main className="landing-shell">
      <section className="landing-card">
        <div className="avatar-stack" aria-hidden="true"><span>Y</span><span>+</span></div>
        <p className="eyebrow">You’re invited</p>
        <h1>Join video call</h1>
        <p className="lead">Someone is waiting to talk with you.</p>
        <button className="primary-button primary-button--large" onClick={onJoin} disabled={busy}>
          {busy ? <span className="spinner" aria-hidden="true" /> : <span aria-hidden="true">↗</span>}
          {busy ? 'Preparing your call…' : 'Join call'}
        </button>
        <p className="permission-note">We’ll ask to use your camera and microphone next.</p>
        {error && <p className="error-message" role="alert">{error}</p>}
        <div className="trust-row"><span>✓ No account required</span></div>
      </section>
    </main>
  );
}
