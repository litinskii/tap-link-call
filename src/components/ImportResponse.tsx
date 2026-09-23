import { useState } from 'react';

export function ImportResponse({ onImport }: { onImport: (value: string) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function connect() {
    setBusy(true);
    setError(null);
    try {
      await onImport(value.trim());
      setOpen(false);
      setValue('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'That response link could not be used.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="import-response">
      <button className="text-button" onClick={() => setOpen((current) => !current)}>Connection problem? Import response</button>
      {open && (
        <div className="import-form">
          <label htmlFor="response-link">Paste response link</label>
          <textarea id="response-link" value={value} onChange={(event) => setValue(event.target.value)} rows={3} placeholder="https://…/#answer=…" />
          <button className="secondary-button" disabled={!value.trim() || busy} onClick={connect}>{busy ? 'Connecting…' : 'Connect'}</button>
          {error && <p className="error-message" role="alert">{error}</p>}
        </div>
      )}
    </section>
  );
}
