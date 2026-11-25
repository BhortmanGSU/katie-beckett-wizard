import { useEffect, useRef, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';

pdfjs.GlobalWorkerOptions.workerSrc = './vendor/pdf.worker.min.mjs';

interface Props {
  bytes: Uint8Array | null;
  loading?: boolean;
}

export function PdfPreview({ bytes, loading }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState('');
  const [pageCount, setPageCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function render() {
      const el = containerRef.current;
      if (!el) return;
      el.innerHTML = '';
      setError('');
      setPageCount(0);
      if (!bytes) return;
      try {
        const pdf = await pdfjs.getDocument({ data: bytes.slice() }).promise;
        if (cancelled) return;
        setPageCount(pdf.numPages);
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          if (cancelled) return;
          const vp = page.getViewport({ scale: 1.4 });
          const canvas = document.createElement('canvas');
          canvas.width = vp.width;
          canvas.height = vp.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) continue;
          el.appendChild(canvas);
          await page.render({ canvasContext: ctx, viewport: vp }).promise;
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not display PDF preview.');
      }
    }
    render();
    return () => {
      cancelled = true;
    };
  }, [bytes]);

  if (loading) return <div className="callout">Preparing your form preview...</div>;
  if (error) return <div className="callout danger">{error}</div>;

  return (
    <div>
      {pageCount > 0 && (
        <div style={{ fontSize: '0.84rem', color: 'var(--muted)', marginBottom: '0.45rem' }}>
          Showing all {pageCount} {pageCount === 1 ? 'page' : 'pages'}. Scroll down to inspect every blank.
        </div>
      )}
      <div ref={containerRef} className="pdf-viewer" />
    </div>
  );
}
