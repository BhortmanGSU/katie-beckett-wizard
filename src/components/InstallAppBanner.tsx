import { useEffect, useState } from 'react';

const DISMISSED_KEY = 'kb_helper_install_popup_dismissed';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * First-boot gentle popup on phones/tablets offering to save Katie Beckett Helper
 * to the Home Screen like a native app.
 */
export function InstallAppBanner() {
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other');

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISSED_KEY)) return;
    } catch {
      return;
    }

    const standalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) return;

    const ua = navigator.userAgent || '';
    const isIos = /iPhone|iPad|iPod/i.test(ua);
    const isAndroid = /Android/i.test(ua);
    const isMobile = isIos || isAndroid || window.matchMedia?.('(pointer: coarse)').matches;

    if (isIos) setPlatform('ios');
    else if (isAndroid) setPlatform('android');

    if (isMobile) setVisible(true);

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISSED_KEY, '1');
    } catch {
      // ignore
    }
  };

  const triggerNativeInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') dismiss();
  };

  if (!visible) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Save as an app on your phone">
      <div className="modal" style={{ maxWidth: 440 }}>
        <div className="warm-note" style={{ marginBottom: '0.2rem' }}>Welcome from your phone!</div>
        <h2 style={{ marginBottom: '0.45rem' }}>Save Katie Beckett Helper as an app?</h2>
        <p style={{ fontSize: '0.93rem', color: 'var(--muted)' }}>
          Adding it to your Home Screen lets you open your packet in one tap—great for snapping photos of doctor forms
          or checking deadlines on the go.
        </p>

        {deferredPrompt ? (
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '1rem' }}>
            <button type="button" className="btn btn-primary" onClick={triggerNativeInstall}>
              Add to Home Screen
            </button>
            <button type="button" className="btn btn-outline" onClick={dismiss}>
              Maybe later
            </button>
          </div>
        ) : platform === 'ios' ? (
          <div>
            <div className="callout" style={{ marginBottom: '0.9rem' }}>
              <strong>On iPhone / iPad (Safari):</strong>
              1. Tap the <strong>Share</strong> button (□↑) at the bottom of your screen.
              <br />
              2. Scroll down and tap <strong>Add to Home Screen</strong>.
              <br />
              3. Tap <strong>Add</strong> in the top-right corner.
            </div>
            <button type="button" className="btn btn-primary" onClick={dismiss}>
              Got it — take me to my packet
            </button>
          </div>
        ) : (
          <div>
            <div className="callout" style={{ marginBottom: '0.9rem' }}>
              <strong>On Android (Chrome):</strong>
              1. Tap the <strong>⋮</strong> menu button in the top-right corner.
              <br />
              2. Tap <strong>Add to Home screen</strong> (or <strong>Install app</strong>).
              <br />
              3. Tap <strong>Add</strong>.
            </div>
            <button type="button" className="btn btn-primary" onClick={dismiss}>
              Got it — take me to my packet
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
