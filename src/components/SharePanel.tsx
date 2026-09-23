import { useState } from 'react';

type Props = {
  title: string;
  description: string;
  url: string;
  shareText: string;
  copyLabel: string;
};

export function SharePanel({ title, description, url, shareText, copyLabel }: Props) {
  const [notice, setNotice] = useState<string | null>(null);

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Quick Call', text: shareText, url });
        setNotice('Shared');
      } else {
        await copy();
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) setNotice('Could not share. Try copying the link.');
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setNotice(copyLabel === 'Copy response' ? 'Response copied' : 'Invitation copied');
    } catch {
      setNotice('Press and hold the link below to copy it.');
    }
  }

  return (
    <section className="share-panel" aria-live="polite">
      <div className="share-panel__icon" aria-hidden="true">↗</div>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <div className="share-actions">
        <button className="primary-button" onClick={share}><span aria-hidden="true">↗</span> Share link</button>
        <button className="secondary-button" onClick={copy}><span aria-hidden="true">▣</span> {copyLabel}</button>
      </div>
      {notice && <p className="success-message">{notice}</p>}
      <details className="link-fallback">
        <summary>Show link</summary>
        <p>{url}</p>
      </details>
    </section>
  );
}
