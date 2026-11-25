import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  fetchFirewallStatus,
  fetchServerInfo,
  requestFirewallAllow,
  type ServerInfo,
} from '../storage/sync';

interface Props {
  onClose: () => void;
}

export function PhoneSyncModal({ onClose }: Props) {
  const [info, setInfo] = useState<ServerInfo | null>(null);
  const [firewall, setFirewall] = useState<{ supported: boolean; allowed: boolean }>({ supported: false, allowed: true });
  const [allowing, setAllowing] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [qrUrl, setQrUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchServerInfo().then(setInfo);
    fetchFirewallStatus().then(setFirewall);
  }, []);

  const current = info?.addresses[selectedIdx];

  useEffect(() => {
    if (!current) return;
    QRCode.toDataURL(current.pairUrl, {
      width: 240,
      margin: 2,
      color: { dark: '#1f3333', light: '#ffffff' },
    }).then(setQrUrl);
  }, [current]);

  const handleAllowFirewall = async () => {
    setAllowing(true);
    try {
      const result = await requestFirewallAllow();
      setFirewall(result);
    } finally {
      setAllowing(false);
    }
  };

  const copyLink = async () => {
    if (!current) return;
    try {
      await navigator.clipboard.writeText(current.pairUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Open on your phone">
      <div className="modal" style={{ maxWidth: 540 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
          <h2>Open on your phone</h2>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
            Close
          </button>
        </div>

        <p style={{ fontSize: '0.92rem', color: 'var(--muted)' }}>
          Scan this QR code with your phone’s camera to work on your application from the couch, at the doctor’s office
          (over a home VPN like Tailscale or ZeroTier), or to snap photos of forms straight into your packet—<strong>no emailing files to yourself</strong>.
        </p>

        {!info ? (
          <div className="callout warm">
            <strong>Built-in phone sync runs in the desktop app</strong>
            Right now you’re viewing the standalone browser version. Open the installed <strong>Katie Beckett Helper</strong> desktop app on your computer to share live with your phone over Wi-Fi or VPN.
          </div>
        ) : info.addresses.length === 0 ? (
          <div className="callout warm">
            <strong>No Wi-Fi or network address found</strong>
            Connect this computer to your home Wi-Fi or VPN, then re-open this window.
          </div>
        ) : (
          <div>
            {/* One-click Windows Firewall setup so families never touch PowerShell */}
            {firewall.supported && !firewall.allowed && (
              <div className="callout warm" style={{ marginBottom: '0.85rem' }}>
                <strong>One quick click before you scan</strong>
                <div style={{ marginBottom: '0.55rem' }}>
                  Windows Firewall blocks phones from connecting until you say it’s okay. Click below and choose{' '}
                  <strong>Yes</strong> on the Windows prompt (you only ever have to do this once).
                </div>
                <button
                  type="button"
                  className="btn btn-warm btn-sm"
                  disabled={allowing}
                  onClick={handleAllowFirewall}
                >
                  {allowing ? 'Waiting for Windows prompt...' : 'Allow Phone Access on Windows'}
                </button>
              </div>
            )}
            {firewall.supported && firewall.allowed && (
              <div style={{ marginBottom: '0.7rem' }}>
                <span className="badge badge-ok">✓ Windows Firewall is open for your phone</span>
              </div>
            )}

            {info.addresses.length > 1 && (
              <div className="field" style={{ marginBottom: '0.8rem' }}>
                <label htmlFor="lan-select">Choose network (Home Wi-Fi or VPN)</label>
                <select
                  id="lan-select"
                  value={selectedIdx}
                  onChange={(e) => setSelectedIdx(Number(e.target.value))}
                >
                  {info.addresses.map((a, i) => (
                    <option key={a.ip} value={i}>
                      {a.label} — {a.ip}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.7rem',
                background: '#fcfaf6',
                border: '1px solid var(--border)',
                borderRadius: 14,
                padding: '1.1rem',
                marginBottom: '0.85rem',
              }}
            >
              {qrUrl && (
                <img
                  src={qrUrl}
                  alt="QR code to open Katie Beckett Helper on your phone"
                  style={{ width: 220, height: 220, borderRadius: 10, border: '1px solid var(--border)' }}
                />
              )}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.84rem', color: 'var(--muted)' }}>Or type this in your phone’s browser:</div>
                <div style={{ fontWeight: 800, color: 'var(--teal)', fontSize: '1.02rem', wordBreak: 'break-all' }}>
                  {current?.url}
                </div>
                <div style={{ fontSize: '0.88rem', marginTop: '0.25rem' }}>
                  Family PIN: <strong style={{ letterSpacing: '0.12em', fontSize: '1rem' }}>{info.pin}</strong>{' '}
                  <span style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>(included automatically in the QR code)</span>
                </div>
              </div>
              <button type="button" className="btn btn-outline btn-sm" onClick={copyLink}>
                {copied ? '✓ Link copied!' : 'Copy pairing link'}
              </button>
            </div>

            <div className="callout sage" style={{ marginBottom: 0 }}>
              <strong>Live sync &amp; private</strong>
              Changes and uploaded photos sync immediately between your phone and this computer. Nothing ever goes to the
              cloud, and the 4-digit PIN keeps anyone else on the Wi-Fi out.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
