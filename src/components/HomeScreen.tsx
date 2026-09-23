type Props = { onStart: () => void; busy: boolean; error: string | null };

export function HomeScreen({ onStart, busy, error }: Props) {
  return (
    <main className="landing-shell">
      <section className="landing-card">
        <div className="brand-mark" aria-hidden="true"><span /><span /></div>
        <p className="eyebrow">Private browser calls</p>
        <h1>Quick Call</h1>
        <p className="lead">A simple face-to-face call with someone you care about.</p>
        <button className="primary-button primary-button--large" onClick={onStart} disabled={busy}>
          {busy ? <span className="spinner" aria-hidden="true" /> : <span aria-hidden="true">↗</span>}
          {busy ? 'Starting camera…' : 'Start a call'}
        </button>
        {error && <p className="error-message" role="alert">{error}</p>}
        <div className="trust-row" aria-label="No account and no installation needed">
          <span>✓ No account</span>
          <span>✓ No installation</span>
        </div>
      </section>
      <p className="privacy-note">Your call goes directly between browsers.</p>
    </main>
  );
}
