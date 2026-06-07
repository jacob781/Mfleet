import React, { useEffect, useRef } from 'react';
import SignaturePadLib from 'signature_pad';
import type { SignatureData } from '../../lib/driverTypes';

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

interface Props {
  label: string;
  signerFirstName: string;
  value?: SignatureData;
  onChange: (sig: SignatureData | null) => void;
}

const SignaturePad: React.FC<Props> = ({ label, signerFirstName, value, onChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePadLib | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
      const ctx = canvas.getContext('2d');
      ctx?.scale(ratio, ratio);
      padRef.current?.clear();
    };
    resize();

    const pad = new SignaturePadLib(canvas, { penColor: '#111827', minWidth: 0.7, maxWidth: 2.2 });
    padRef.current = pad;

    // Restore an existing signature image, if present.
    if (value?.image_base64) {
      pad.fromDataURL(value.image_base64).catch(() => undefined);
    }

    const handleEnd = () => {
      if (pad.isEmpty()) {
        onChange(null);
        return;
      }
      const { timestamp_et, date } = nowEastern();
      onChange({
        image_base64: pad.toDataURL('image/png'),
        signer_first_name: signerFirstName,
        timestamp_et,
        date,
      });
    };
    pad.addEventListener('endStroke', handleEnd);

    return () => {
      pad.removeEventListener('endStroke', handleEnd);
      pad.off();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clear = () => {
    padRef.current?.clear();
    onChange(null);
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-mfleet-gray-dark">{label}</span>
        <button type="button" onClick={clear} className="text-sm text-mfleet-blue underline">Clear</button>
      </div>
      <canvas
        ref={canvasRef}
        className="w-full h-40 rounded-lg border-2 border-dashed border-gray-300 bg-white touch-none"
      />
      {value?.image_base64
        ? <span className="block text-xs text-green-600 mt-1">Signed {value.timestamp_et}</span>
        : <span className="block text-xs text-gray-400 mt-1">Sign above with your finger or stylus</span>}
    </div>
  );
};

export default SignaturePad;
