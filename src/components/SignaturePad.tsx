import React, { useEffect, useRef, useState } from 'react';

interface Props {
  value: string;
  defaultName: string;
  onChange: (dataUrl: string, width: number, height: number) => void;
}

export function SignaturePad({ value, defaultName, onChange }: Props) {
  const [mode, setMode] = useState<'draw' | 'type'>('draw');
  const [typed, setTyped] = useState(defaultName);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);

  useEffect(() => {
    if (!typed && defaultName) setTyped(defaultName);
  }, [defaultName]);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * e.currentTarget.width,
      y: ((e.clientY - rect.top) / rect.height) * e.currentTarget.height,
    };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current;
    const ctx = c?.getContext('2d');
    if (!c || !ctx) return;
    drawing.current = true;
    c.setPointerCapture(e.pointerId);
    const { x, y } = getPos(e);
    ctx.strokeStyle = '#122c73';
    ctx.lineWidth = 3.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const c = canvasRef.current;
    const ctx = c?.getContext('2d');
    if (!c || !ctx) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    const c = canvasRef.current;
    if (!c) return;
    onChange(c.toDataURL('image/png'), c.width, c.height);
  };

  const clear = () => {
    const c = canvasRef.current;
    c?.getContext('2d')?.clearRect(0, 0, c.width, c.height);
    onChange('', 0, 0);
  };

  const renderTyped = (name: string) => {
    setTyped(name);
    if (!name.trim()) {
      onChange('', 0, 0);
      return;
    }
    const c = document.createElement('canvas');
    c.width = 520;
    c.height = 130;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#122c73';
    ctx.font = '600 64px "Caveat", cursive';
    ctx.textBaseline = 'middle';
    ctx.fillText(name.trim(), 18, 68, 484);
    onChange(c.toDataURL('image/png'), c.width, c.height);
  };

  return (
    <div>
      <div className="tabs">
        <button
          type="button"
          className={`chip-btn ${mode === 'draw' ? 'selected' : ''}`}
          onClick={() => setMode('draw')}
        >
          Draw my signature
        </button>
        <button
          type="button"
          className={`chip-btn ${mode === 'type' ? 'selected' : ''}`}
          onClick={() => {
            setMode('type');
            if (typed) renderTyped(typed);
          }}
        >
          Type my signature
        </button>
      </div>

      {mode === 'draw' ? (
        <div>
          <canvas
            ref={canvasRef}
            width={520}
            height={150}
            className="sig-canvas"
            onPointerDown={start}
            onPointerMove={move}
            onPointerUp={end}
            onPointerCancel={end}
          />
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '0.55rem' }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={clear}>
              Clear &amp; try again
            </button>
            <span style={{ fontSize: '0.84rem', color: 'var(--muted)' }}>
              Sign with your mouse, trackpad, or finger.
            </span>
          </div>
        </div>
      ) : (
        <div className="field" style={{ maxWidth: 420 }}>
          <label htmlFor="typed-sig">Type your full legal name</label>
          <input
            id="typed-sig"
            value={typed}
            placeholder="Sarah J Thompson"
            onChange={(e) => renderTyped(e.target.value)}
          />
        </div>
      )}

      {value && (
        <div style={{ marginTop: '0.85rem' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--sage)', marginBottom: '0.3rem' }}>
            Saved signature preview:
          </div>
          <img
            src={value}
            alt="Your saved signature"
            style={{
              maxHeight: 62,
              background: '#fff',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '4px 10px',
            }}
          />
        </div>
      )}
    </div>
  );
}
