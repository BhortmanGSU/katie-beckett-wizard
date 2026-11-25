import { useState } from 'react';
import { detectServer } from '../storage/sync';

interface Props {
  onUnlocked: () => void;
}

export function PinGate({ onUnlocked }: Props) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setChecking(true);
    try {
      const st = await detectServer(pin.trim());
      if (st.mode === 'local-server' && st.unlocked) {
        onUnlocked();
      } else {
        setError('That PIN didn’t match. Check the 4-digit PIN shown in “Open on Phone (QR)” on your computer.');
      }
    } finally {
      setChecking(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '1.5rem' }}>
      <form className="card" style={{ maxWidth: 420, width: '100%' }} onSubmit={submit}>
        <div className="warm-note">Keeping your family’s info private</div>
        <h1>Enter Family PIN</h1>
        <p className="card-hint">
          Enter the 4-digit PIN shown under <strong>Open on Phone (QR)</strong> on your computer—or scan the QR code
          to sign in automatically.
        </p>
        {error && <div className="callout danger">{error}</div>}
        <div className="field" style={{ marginBottom: '1rem' }}>
          <label htmlFor="family-pin">4-digit PIN</label>
          <input
            id="family-pin"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="••••"
            style={{ fontSize: '1.4rem', letterSpacing: '0.35em', textAlign: 'center' }}
            autoFocus
          />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={pin.length < 4 || checking}>
          {checking ? 'Checking...' : 'Unlock my packet'}
        </button>
      </form>
    </div>
  );
}
