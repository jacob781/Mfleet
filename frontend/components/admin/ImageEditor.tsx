import React from 'react';
import { Button } from './ui';
import { toast } from '../Toast';

type Rect = { x: number; y: number; w: number; h: number };   // canvas pixels

/**
 * Crop + rotate for a photo that is about to be uploaded. Everything runs in the
 * browser on a canvas — the server only ever sees the finished JPEG, so this costs
 * the backend nothing.
 * ponytail: drag a new rectangle to re-crop; no resize handles, no zoom, no filters.
 */
const ImageEditor: React.FC<{
  file: File;
  onCancel: () => void;
  onApply: (file: File) => void;
}> = ({ file, onCancel, onApply }) => {
  const [img, setImg] = React.useState<HTMLImageElement | null>(null);
  const [rot, setRot] = React.useState(0);
  const [crop, setCrop] = React.useState<Rect | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const start = React.useRef<{ x: number; y: number } | null>(null);

  // Via a ref: onCancel is an inline arrow in the parent, and reloading the image on
  // every parent render would revoke the URL mid-decode and look like a broken file.
  const cancelRef = React.useRef(onCancel);
  cancelRef.current = onCancel;

  React.useEffect(() => {
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => setImg(im);
    // HEIC and friends: no browser decoder, so there is nothing to edit here.
    im.onerror = () => { toast('This image format cannot be edited in the browser — upload it as is.'); cancelRef.current(); };
    im.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // The canvas holds the rotated image and nothing else — the crop rectangle is a DOM
  // overlay, so what is on the canvas is exactly what gets saved.
  React.useEffect(() => {
    const cv = canvasRef.current;
    if (!cv || !img) return;
    const swap = rot % 180 !== 0;
    cv.width = swap ? img.height : img.width;
    cv.height = swap ? img.width : img.height;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    ctx.translate(cv.width / 2, cv.height / 2);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
  }, [img, rot]);

  const toCanvas = (e: React.PointerEvent) => {
    const cv = canvasRef.current!;
    const r = cv.getBoundingClientRect();
    return {
      x: Math.min(Math.max((e.clientX - r.left) * (cv.width / r.width), 0), cv.width),
      y: Math.min(Math.max((e.clientY - r.top) * (cv.height / r.height), 0), cv.height),
    };
  };

  const onDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    start.current = toCanvas(e);
    setCrop(null);
  };

  const onMove = (e: React.PointerEvent) => {
    if (!start.current) return;
    const p = toCanvas(e);
    setCrop({
      x: Math.min(start.current.x, p.x),
      y: Math.min(start.current.y, p.y),
      w: Math.abs(p.x - start.current.x),
      h: Math.abs(p.y - start.current.y),
    });
  };

  const onUp = () => {
    start.current = null;
    // A stray click is not a crop — anything tiny goes back to "whole image".
    setCrop((c) => (c && c.w > 16 && c.h > 16 ? c : null));
  };

  const apply = () => {
    const cv = canvasRef.current;
    if (!cv) return;
    const r = crop ?? { x: 0, y: 0, w: cv.width, h: cv.height };
    const out = document.createElement('canvas');
    out.width = Math.round(r.w);
    out.height = Math.round(r.h);
    out.getContext('2d')!.drawImage(cv, r.x, r.y, r.w, r.h, 0, 0, out.width, out.height);
    // 0.92 here, the server re-encodes at its own quality — keeps the double pass invisible.
    out.toBlob(
      (b) => b && onApply(new File([b], `${file.name.replace(/\.[^.]+$/, '')}.jpg`, { type: 'image/jpeg' })),
      'image/jpeg',
      0.92,
    );
  };

  const cv = canvasRef.current;
  const pct = (v: number, total: number) => `${(v / total) * 100}%`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onCancel}>
      <div className="flex max-h-full w-full max-w-3xl flex-col gap-3 rounded-xl bg-white p-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-mfleet-gray-dark">Crop &amp; rotate</h3>
          <span className="text-xs text-mfleet-gray">Drag on the photo to crop</span>
        </div>

        <div className="relative flex justify-center overflow-hidden bg-gray-100">
          <div className="relative">
            <canvas
              ref={canvasRef}
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={onUp}
              className="block max-h-[60vh] max-w-full cursor-crosshair touch-none select-none"
            />
            {crop && cv && (
              <div
                className="pointer-events-none absolute border border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]"
                style={{
                  left: pct(crop.x, cv.width),
                  top: pct(crop.y, cv.height),
                  width: pct(crop.w, cv.width),
                  height: pct(crop.h, cv.height),
                }}
              />
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => { setRot((r) => (r + 270) % 360); setCrop(null); }}>⟲ Left</Button>
            <Button variant="secondary" onClick={() => { setRot((r) => (r + 90) % 360); setCrop(null); }}>⟳ Right</Button>
            {crop && <Button variant="secondary" onClick={() => setCrop(null)}>Reset crop</Button>}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onCancel}>Cancel</Button>
            <Button onClick={apply} disabled={!img}>Apply</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;
