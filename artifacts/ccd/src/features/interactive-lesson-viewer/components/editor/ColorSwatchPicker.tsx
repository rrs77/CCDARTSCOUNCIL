import React, { useEffect, useRef, useState } from 'react';
import { Pipette, Copy, ClipboardPaste, Plus } from 'lucide-react';
import { BRAND_TEXT_COLORS, DEFAULT_SOLID_COLORS } from '../../types';
import { pushRecentColor, readRecentColors } from '../../utils/recentColors';
import {
  dedupeColors,
  hsvaToRgba,
  parseToHsva,
  rgbaToCss,
  rgbaToHex,
  type Hsva,
} from '../../utils/colorModel';
import { copyColorToClipboard, pasteColorFromClipboard } from '../../utils/styleClipboard';
import { PortalPopover } from './PortalPopover';

interface ColorSwatchPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  compact?: boolean;
  showAlpha?: boolean;
  /** Colours used in the current document/scene (shown as Document group). */
  documentColors?: string[];
  /** Stage element for eyedropper canvas fallback. */
  stageSelector?: string;
}

const BRAND = dedupeColors(BRAND_TEXT_COLORS);
const DEFAULTS = dedupeColors(
  DEFAULT_SOLID_COLORS.filter((c) => !BRAND.some((b) => b.toLowerCase() === c.toLowerCase())),
);

function SwatchGrid({
  colors,
  value,
  onPick,
}: {
  colors: string[];
  value: string;
  onPick: (c: string) => void;
}) {
  return (
    <div className="ilv-swatch-grid">
      {colors.map((c) => (
        <button
          key={c}
          type="button"
          className={`ilv-color-swatch ${value.toLowerCase() === c.toLowerCase() ? 'is-active' : ''}`}
          style={{ background: c }}
          title={c}
          aria-label={`Colour ${c}`}
          onClick={() => onPick(c)}
        />
      ))}
    </div>
  );
}

async function pickWithEyeDropper(): Promise<string | null> {
  const ED = (window as unknown as { EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> } })
    .EyeDropper;
  if (!ED) return null;
  try {
    const result = await new ED().open();
    return result.sRGBHex;
  } catch {
    return null;
  }
}

/** Sample colour from the stage canvas by click (Safari/Firefox fallback). */
function sampleFromStage(stageSelector: string): Promise<string | null> {
  return new Promise((resolve) => {
    const stage = document.querySelector(stageSelector) as HTMLElement | null;
    if (!stage) {
      resolve(null);
      return;
    }
    const overlay = document.createElement('div');
    overlay.className = 'ilv-eyedropper-overlay';
    overlay.textContent = 'Click the stage to sample a colour · Esc to cancel';
    document.body.appendChild(overlay);

    const cleanup = () => {
      overlay.remove();
      window.removeEventListener('keydown', onKey);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cleanup();
        resolve(null);
      }
    };
    window.addEventListener('keydown', onKey);

    overlay.addEventListener(
      'click',
      async (e) => {
        cleanup();
        // Sample topmost element under cursor (EyeDropper API is preferred when available)
        const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
        if (el) {
          const bg = getComputedStyle(el).backgroundColor || getComputedStyle(el).color;
          resolve(bg || null);
        } else resolve(null);
      },
      { once: true },
    );
  });
}

export function ColorSwatchPicker({
  value,
  onChange,
  label,
  compact,
  showAlpha = true,
  documentColors = [],
  stageSelector = '.ilv-stage-canvas',
}: ColorSwatchPickerProps) {
  const [recent, setRecent] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [hsva, setHsva] = useState<Hsva>(() => parseToHsva(value));
  const [hexInput, setHexInput] = useState('');
  const [copiedMsg, setCopiedMsg] = useState('');
  const anchorRef = useRef<HTMLButtonElement>(null);
  const satRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRecent(readRecentColors());
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const next = parseToHsva(value);
    setHsva(next);
    setHexInput(rgbaToHex(hsvaToRgba(next), next.a < 0.999));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, value]);

  const commit = (next: Hsva, pushRecent = true) => {
    setHsva(next);
    const css = rgbaToCss(hsvaToRgba(next));
    setHexInput(rgbaToHex(hsvaToRgba(next), next.a < 0.999));
    onChange(css);
    if (pushRecent) setRecent(pushRecentColor(css));
  };

  const applySwatch = (color: string) => {
    const next = parseToHsva(color, hsva);
    next.a = showAlpha ? hsva.a : 1;
    commit(next);
  };

  const onSatPointer = (e: React.PointerEvent) => {
    const el = satRef.current;
    if (!el) return;
    el.setPointerCapture?.(e.pointerId);
    const move = (ev: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const s = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
      const v = Math.max(0, Math.min(1, 1 - (ev.clientY - rect.top) / rect.height));
      commit({ ...hsva, s, v }, false);
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      setRecent(pushRecentColor(rgbaToCss(hsvaToRgba(hsva))));
    };
    move(e.nativeEvent);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const runEyedropper = async () => {
    let color = await pickWithEyeDropper();
    if (!color) color = await sampleFromStage(stageSelector);
    if (color) applySwatch(color);
  };

  const rgba = hsvaToRgba(hsva);
  const doc = dedupeColors(documentColors).slice(0, 12);

  const panel = (
    <div className="ilv-insert-menu ilv-color-panel">
      {label && <p className="ilv-insert-menu-title">{label}</p>}

      <div className="ilv-color-tools">
        <button
          type="button"
          className={`ilv-color-rainbow ${advanced ? 'is-on' : ''}`}
          title="Full colour picker"
          aria-label="Open full colour picker"
          aria-pressed={advanced}
          onClick={() => setAdvanced((v) => !v)}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          className="ilv-tool-btn"
          title="Eyedropper"
          aria-label="Pick colour from screen"
          onClick={() => void runEyedropper()}
        >
          <Pipette className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          className="ilv-tool-btn"
          title="Copy colour"
          aria-label="Copy colour"
          onClick={() => {
            copyColorToClipboard(rgbaToCss(rgba));
            setCopiedMsg('Colour copied');
            window.setTimeout(() => setCopiedMsg(''), 1200);
          }}
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          className="ilv-tool-btn"
          title="Paste colour"
          aria-label="Paste colour"
          onClick={() => {
            void pasteColorFromClipboard().then((c) => {
              if (c) applySwatch(c);
            });
          }}
        >
          <ClipboardPaste className="h-3.5 w-3.5" />
        </button>
      </div>

      {advanced && (
        <div className="ilv-color-advanced">
          <div
            ref={satRef}
            className="ilv-color-sat"
            style={{ backgroundColor: `hsl(${hsva.h}, 100%, 50%)` }}
            onPointerDown={onSatPointer}
            role="presentation"
          >
            <span
              className="ilv-color-sat-thumb"
              style={{ left: `${hsva.s * 100}%`, top: `${(1 - hsva.v) * 100}%` }}
            />
          </div>
          <label className="ilv-label">Hue</label>
          <input
            type="range"
            min={0}
            max={360}
            value={Math.round(hsva.h)}
            onChange={(e) => commit({ ...hsva, h: Number(e.target.value) }, false)}
            className="ilv-color-hue w-full"
            aria-label="Hue"
          />
          {showAlpha && (
            <>
              <label className="ilv-label">Opacity {Math.round(hsva.a * 100)}%</label>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(hsva.a * 100)}
                onChange={(e) => commit({ ...hsva, a: Number(e.target.value) / 100 }, false)}
                className="w-full"
                aria-label="Opacity"
                style={{
                  background: `linear-gradient(90deg, transparent, ${rgbaToHex({ ...rgba, a: 1 })})`,
                }}
              />
            </>
          )}
          <div className="ilv-color-inputs">
            <label className="ilv-label">HEX</label>
            <input
              className="ilv-input min-h-[32px] py-1 text-xs font-mono"
              value={hexInput}
              onChange={(e) => setHexInput(e.target.value)}
              onBlur={() => {
                const parsed = parseToHsva(hexInput, hsva);
                commit(parsed);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  commit(parseToHsva(hexInput, hsva));
                }
              }}
              aria-label="HEX colour"
            />
            <label className="ilv-label">RGB</label>
            <div className="flex gap-1">
              {(['r', 'g', 'b'] as const).map((ch) => (
                <input
                  key={ch}
                  className="ilv-input min-h-[32px] flex-1 py-1 text-xs"
                  type="number"
                  min={0}
                  max={255}
                  value={Math.round(rgba[ch])}
                  aria-label={ch.toUpperCase()}
                  onChange={(e) => {
                    const nextRgba = { ...rgba, [ch]: Number(e.target.value) || 0 };
                    commit({
                      ...parseToHsva(rgbaToCss(nextRgba), hsva),
                      a: hsva.a,
                    });
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {doc.length > 0 && (
        <div>
          <p className="ilv-color-group-label">Document</p>
          <SwatchGrid colors={doc} value={value} onPick={applySwatch} />
        </div>
      )}
      <div>
        <p className="ilv-color-group-label">Brand</p>
        <SwatchGrid colors={BRAND} value={value} onPick={applySwatch} />
      </div>
      <div>
        <p className="ilv-color-group-label">Default</p>
        <SwatchGrid colors={DEFAULTS} value={value} onPick={applySwatch} />
      </div>
      {recent.length > 0 && (
        <div>
          <p className="ilv-color-group-label">Recent</p>
          <SwatchGrid colors={recent} value={value} onPick={applySwatch} />
        </div>
      )}
      {copiedMsg && <p className="text-[10px] text-[var(--ss-muted)]">{copiedMsg}</p>}
    </div>
  );

  return (
    <div className={`ilv-color-picker ${compact ? 'is-compact' : ''}`}>
      {label && !compact && <span className="ilv-label">{label}</span>}
      <div className="ilv-color-trigger-row">
        <button
          ref={anchorRef}
          type="button"
          className="ilv-color-trigger"
          title={label || 'Colour'}
          aria-label={label || 'Colour'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="ilv-color-trigger-fill" style={{ background: value }} />
        </button>
        {!compact && (
          <SwatchGrid
            colors={BRAND.slice(0, 8)}
            value={value}
            onPick={applySwatch}
          />
        )}
      </div>
      <PortalPopover
        open={open}
        anchorRef={anchorRef}
        onClose={() => setOpen(false)}
        aria-label={label || 'Colour picker'}
        minWidth={280}
        maxWidth={320}
        maxHeight={560}
        placement="bottom-start"
      >
        {panel}
      </PortalPopover>
    </div>
  );
}
