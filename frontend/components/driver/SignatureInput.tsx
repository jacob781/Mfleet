import React, { useEffect, useRef, useState } from 'react';
import SignaturePadLib from 'signature_pad';
import type { SignatureData } from '../../lib/driverTypes';
import { useFileDrop } from '../../lib/useFileDrop';

const SIGNATURE_FONTS = [
  'Alex Brush', 'Allura', 'Great Vibes', 'Mr Dafoe',
  'Parisienne', 'Dancing Script', 'Sacramento', 'Caveat',
];

function nowEastern(): { timestamp_et: string; date: string } {
  const tz = 'America/New_York';
  const d = new Date();
  const timestamp_et =
    new Intl.DateTimeFormat('en-US', {
      timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: true,
    }).format(d) + ' ET';
  const date = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(d);
  return { timestamp_et, date };
}

type Mode = 'draw' | 'type' | 'upload';

interface Props {
  label: string;
  signerFirstName: string;
  value?: SignatureData;
  onChange: (sig: SignatureData | null) => void;
}

const tabCls = (active: boolean) =>
  'flex-1 min-h-10 text-sm font-medium rounded-md ' +
  (active ? 'bg-mfleet-blue text-white' : 'bg-gray-100 text-mfleet-gray-dark');

const SignatureInput: React.FC<Props> = ({ label, signerFirstName, value, onChange }) => {
  const [mode, setMode] = useState<Mode>('draw');
  const [typed, setTyped] = useState(signerFirstName || '');
  const [font, setFont] = useState(SIGNATURE_FONTS[0]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const drop = useFileDrop((f) => onFile(f));

  const emit = (dataUrl: string | null) => {
    if (!dataUrl) return onChange(null);
    const { timestamp_et, date } = nowEastern();
    onChange({ image_base64: dataUrl, signer_first_name: signerFirstName, timestamp_et, date });
  };

  // ── Draw mode ──────────────────────────────────────────────
  const drawCanvas = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePadLib | null>(null);
  useEffect(() => {
    if (mode !== 'draw') return;
    const canvas = drawCanvas.current;
    if (!canvas) return;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    canvas.getContext('2d')?.scale(ratio, ratio);
    const pad = new SignaturePadLib(canvas, { penColor: '#111827', minWidth: 0.7, maxWidth: 2.2 });
    padRef.current = pad;
    const onEnd = () => emit(pad.isEmpty() ? null : pad.toDataURL('image/png'));
    pad.addEventListener('endStroke', onEnd);
    return () => { pad.removeEventListener('endStroke', onEnd); pad.off(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // ── Type mode ──────────────────────────────────────────────
  const renderTyped = async (text: string, fontFamily: string) => {
    if (!text.trim()) return emit(null);
    try { await (document as any).fonts?.load(`48px "${fontFamily}"`); } catch { /* ignore */ }
    const c = document.createElement('canvas');
    c.width = 600; c.height = 200;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#111827';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `64px "${fontFamily}", cursive`;
    ctx.fillText(text, c.width / 2, c.height / 2);
    emit(c.toDataURL('image/png'));
  };

  // ── Upload mode ────────────────────────────────────────────
  const onFile = (file?: File | null) => {
    setUploadError(null);
    if (!file) return;
    if (!file.type.startsWith('image/')) return setUploadError('Please choose an image file.');
    if (file.size > 5 * 1024 * 1024) return setUploadError('Image too large (max 5 MB).');
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxW = 600, maxH = 200;
        const scale = Math.min(maxW / img.width, maxH / img.height, 1);
        const c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(img.width * scale));
        c.height = Math.max(1, Math.round(img.height * scale));
        c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
        emit(c.toDataURL('image/png')); // re-encode → strips any non-image payload
      };
      img.onerror = () => setUploadError('Could not read that image.');
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const clear = () => {
    padRef.current?.clear();
    setTyped(signerFirstName || '');
    onChange(null);
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-mfleet-gray-dark">{label}</span>
        <button type="button" onClick={clear} className="text-sm text-mfleet-blue underline">Clear</button>
      </div>

      <div className="flex gap-2 mb-2">
        <button type="button" className={tabCls(mode === 'draw')} onClick={() => setMode('draw')}>Draw</button>
        <button type="button" className={tabCls(mode === 'type')} onClick={() => setMode('type')}>Type</button>
        <button type="button" className={tabCls(mode === 'upload')} onClick={() => setMode('upload')}>Upload</button>
      </div>

      {mode === 'draw' && (
        <canvas ref={drawCanvas} className="w-full h-40 rounded-lg border-2 border-dashed border-gray-300 bg-white touch-none" />
      )}

      {mode === 'type' && (
        <div>
          <input
            value={typed}
            onChange={(e) => { setTyped(e.target.value); void renderTyped(e.target.value, font); }}
            placeholder="Type your full name"
            className="w-full min-h-12 rounded-lg border border-gray-300 px-3 text-base mb-2"
          />
          <div className="flex flex-wrap gap-2 mb-2">
            {SIGNATURE_FONTS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => { setFont(f); void renderTyped(typed, f); }}
                className={'px-3 min-h-10 rounded-md border text-xl ' + (font === f ? 'border-mfleet-blue' : 'border-gray-300')}
                style={{ fontFamily: `"${f}", cursive` }}
              >
                {typed || 'Signature'}
              </button>
            ))}
          </div>
          {value?.image_base64 && (
            <div className="rounded-lg border border-gray-200 p-2 bg-white">
              <img src={value.image_base64} alt="signature preview" className="h-16 mx-auto" />
            </div>
          )}
        </div>
      )}

      {mode === 'upload' && (
        <div
          {...drop.props}
          className={'rounded-lg border-2 border-dashed p-2 transition-colors ' +
            (drop.over ? 'border-mfleet-blue bg-mfleet-blue/5' : 'border-transparent')}
        >
          <div className="flex items-center gap-3 mb-2">
            <label className="inline-flex items-center gap-2 rounded-lg bg-mfleet-blue px-4 min-h-11 text-sm font-semibold text-white cursor-pointer">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12m0-12l-4 4m4-4l4 4" />
              </svg>
              {fileName ? 'Choose another' : 'Upload image'}
              <input type="file" accept="image/*" capture="environment" onChange={(e) => onFile(e.target.files?.[0])} className="hidden" />
            </label>
            <span className="text-sm text-gray-500 truncate">{fileName || 'No file selected'}</span>
          </div>
          <p className="text-xs text-gray-400 mb-2">Take a photo, drag &amp; drop, or pick a PNG/JPG of your signature (max 5 MB).</p>
          {uploadError && <span className="block text-sm text-red-600 mb-2">{uploadError}</span>}
          {value?.image_base64 && (
            <div className="rounded-lg border border-gray-200 p-2 bg-white">
              <img src={value.image_base64} alt="signature preview" className="h-20 mx-auto" />
            </div>
          )}
        </div>
      )}

      {value?.image_base64
        ? <span className="block text-xs text-green-600 mt-1">Signature ready</span>
        : <span className="block text-xs text-gray-400 mt-1">Draw, type, or upload your signature</span>}
    </div>
  );
};

export default SignatureInput;
