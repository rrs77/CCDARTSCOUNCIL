import React, { useMemo, useRef, useState } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Type,
  Sparkles,
  Lock,
  Unlock,
  ChevronDown,
  Copy,
  ClipboardPaste,
} from 'lucide-react';
import type { TextAlign, TextAnimationPhase, TextAnimationType, TextOverlay } from '../../types';
import {
  TEXT_ANIMATION_OPTIONS,
  TEXT_FONT_OPTIONS,
  TEXT_PRESET_DEFAULTS,
} from '../../types';
import { ColorSwatchPicker } from './ColorSwatchPicker';
import { PortalPopover } from './PortalPopover';
import { TextEffectsPanel } from './TextEffectsPanel';
import {
  applyCopiedTextStyle,
  copyTextStyle,
  peekCopiedTextStyle,
} from '../../utils/styleClipboard';

interface TextToolbarProps {
  overlay: TextOverlay;
  onChange: (patch: Partial<TextOverlay>) => void;
}

export function TextToolbar({ overlay, onChange }: TextToolbarProps) {
  const [showFonts, setShowFonts] = useState(false);
  const [showAnim, setShowAnim] = useState(false);
  const [showEffects, setShowEffects] = useState(false);
  const [fontFilter, setFontFilter] = useState('');
  const [animPhase, setAnimPhase] = useState<TextAnimationPhase>('entrance');
  const fontBtnRef = useRef<HTMLButtonElement>(null);
  const animBtnRef = useRef<HTMLButtonElement>(null);
  const effectsBtnRef = useRef<HTMLButtonElement>(null);

  const fontId =
    TEXT_FONT_OPTIONS.find((f) => f.id === overlay.fontFamily || f.stack === overlay.fontFamily)?.id ||
    'plus-jakarta';
  const fontMeta = TEXT_FONT_OPTIONS.find((f) => f.id === fontId) || TEXT_FONT_OPTIONS[0];
  const preset = TEXT_PRESET_DEFAULTS[overlay.style];
  const size = overlay.fontSize || preset.fontSize;
  const weight = Number(overlay.fontWeight || preset.fontWeight);
  const isBold = weight >= 700;
  const isItalic = overlay.fontStyle === 'italic';
  const isUnderline = (overlay.textDecoration || '').includes('underline');
  const align = overlay.textAlign || 'left';

  const fonts = useMemo(() => {
    const q = fontFilter.trim().toLowerCase();
    if (!q) return TEXT_FONT_OPTIONS;
    return TEXT_FONT_OPTIONS.filter(
      (f) => f.label.toLowerCase().includes(q) || f.category.toLowerCase().includes(q),
    );
  }, [fontFilter]);

  const phaseAnims = TEXT_ANIMATION_OPTIONS.filter(
    (o) => o.type === 'none' || !o.phase || o.phase === animPhase,
  );

  return (
    <div className="ilv-text-toolbar" role="toolbar" aria-label="Text formatting">
      <div className="ilv-text-toolbar-row">
        <div className="ilv-tt-group">
          <button
            ref={fontBtnRef}
            type="button"
            className="ilv-tt-font"
            title="Font"
            aria-label="Font"
            aria-expanded={showFonts}
            onClick={() => {
              setShowFonts((v) => !v);
              setShowAnim(false);
              setShowEffects(false);
            }}
          >
            <Type className="h-3.5 w-3.5 shrink-0" />
            <span style={{ fontFamily: fontMeta.stack }}>{fontMeta.label}</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
          </button>
          <PortalPopover
            open={showFonts}
            anchorRef={fontBtnRef}
            onClose={() => setShowFonts(false)}
            aria-label="Font list"
            minWidth={260}
            maxWidth={300}
            maxHeight={360}
          >
            <div className="ilv-insert-menu">
              <input
                className="ilv-input min-h-[32px] py-1 text-xs"
                placeholder="Search fonts…"
                value={fontFilter}
                onChange={(e) => setFontFilter(e.target.value)}
                autoFocus
              />
              <div className="ilv-tt-font-list mt-2">
                {fonts.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`ilv-tt-font-item ${fontId === f.id ? 'is-active' : ''}`}
                    style={{ fontFamily: f.stack }}
                    onClick={() => {
                      onChange({ fontFamily: f.id });
                      setShowFonts(false);
                      setFontFilter('');
                    }}
                  >
                    <span>{f.label}</span>
                    <span className="ilv-tt-font-cat">{f.category}</span>
                  </button>
                ))}
              </div>
            </div>
          </PortalPopover>
        </div>

        <div className="ilv-tt-group">
          <button
            type="button"
            className="ilv-tool-btn"
            title="Smaller"
            aria-label="Decrease font size"
            onClick={() => onChange({ fontSize: Math.max(10, size - 2) })}
          >
            −
          </button>
          <input
            className="ilv-tt-size"
            type="number"
            min={10}
            max={120}
            value={size}
            onChange={(e) => onChange({ fontSize: Math.max(10, Math.min(120, Number(e.target.value) || 18)) })}
            aria-label="Font size"
          />
          <button
            type="button"
            className="ilv-tool-btn"
            title="Larger"
            aria-label="Increase font size"
            onClick={() => onChange({ fontSize: Math.min(120, size + 2) })}
          >
            +
          </button>
        </div>

        <div className="ilv-tt-group">
          <button
            type="button"
            className={`ilv-tool-btn ${isBold ? 'is-active' : ''}`}
            title="Bold"
            aria-label="Bold"
            onClick={() => onChange({ fontWeight: isBold ? 500 : 800 })}
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={`ilv-tool-btn ${isItalic ? 'is-active' : ''}`}
            title="Italic"
            aria-label="Italic"
            onClick={() => onChange({ fontStyle: isItalic ? 'normal' : 'italic' })}
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={`ilv-tool-btn ${isUnderline ? 'is-active' : ''}`}
            title="Underline"
            aria-label="Underline"
            onClick={() => onChange({ textDecoration: isUnderline ? 'none' : 'underline' })}
          >
            <Underline className="h-4 w-4" />
          </button>
        </div>

        <div className="ilv-tt-group">
          <button
            type="button"
            className={`ilv-tool-btn ${align === 'left' ? 'is-active' : ''}`}
            title="Align left"
            aria-label="Align left"
            onClick={() => onChange({ textAlign: 'left' as TextAlign })}
          >
            <AlignLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={`ilv-tool-btn ${align === 'center' ? 'is-active' : ''}`}
            title="Align center"
            aria-label="Align center"
            onClick={() => onChange({ textAlign: 'center' })}
          >
            <AlignCenter className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={`ilv-tool-btn ${align === 'right' ? 'is-active' : ''}`}
            title="Align right"
            aria-label="Align right"
            onClick={() => onChange({ textAlign: 'right' })}
          >
            <AlignRight className="h-4 w-4" />
          </button>
        </div>

        <div className="ilv-tt-group ilv-tt-color">
          <ColorSwatchPicker compact value={overlay.color} onChange={(color) => onChange({ color })} />
        </div>

        <div className="ilv-tt-group">
          <button
            ref={animBtnRef}
            type="button"
            className={`ilv-tool-btn ${overlay.animation?.type && overlay.animation.type !== 'none' ? 'is-active' : ''}`}
            title="Text animation"
            aria-label="Text animation"
            aria-expanded={showAnim}
            onClick={() => {
              setShowAnim((v) => !v);
              setShowFonts(false);
              setShowEffects(false);
            }}
          >
            <Sparkles className="h-4 w-4" />
          </button>
          <PortalPopover
            open={showAnim}
            anchorRef={animBtnRef}
            onClose={() => setShowAnim(false)}
            aria-label="Text animations"
            minWidth={300}
            maxWidth={340}
            maxHeight={440}
          >
            <div className="ilv-insert-menu">
              <p className="ilv-insert-menu-title">Animation</p>
              <div className="mb-2 flex gap-1">
                {(['entrance', 'emphasis', 'exit'] as TextAnimationPhase[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`ilv-btn flex-1 text-[11px] ${animPhase === p ? 'ilv-btn-primary' : 'ilv-btn-secondary'}`}
                    onClick={() => setAnimPhase(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {phaseAnims.map((opt) => (
                  <button
                    key={opt.type}
                    type="button"
                    className={`ilv-btn text-[11px] ${
                      (overlay.animation?.type || 'none') === opt.type ? 'ilv-btn-primary' : 'ilv-btn-secondary'
                    }`}
                    onClick={() =>
                      onChange({
                        animation: {
                          type: opt.type as TextAnimationType,
                          phase: animPhase,
                          durationMs: overlay.animation?.durationMs || 700,
                          delayMs: overlay.animation?.delayMs || 0,
                          speed: overlay.animation?.speed || 1,
                          scope: overlay.animation?.scope || 'line',
                        },
                      })
                    }
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <label className="ilv-label mt-2">Duration (ms)</label>
              <input
                className="ilv-input min-h-[32px] py-1 text-xs"
                type="number"
                min={100}
                max={4000}
                step={50}
                value={overlay.animation?.durationMs || 700}
                onChange={(e) =>
                  onChange({
                    animation: {
                      type: overlay.animation?.type || 'fade-in',
                      phase: overlay.animation?.phase || animPhase,
                      durationMs: Math.max(100, Number(e.target.value) || 700),
                      delayMs: overlay.animation?.delayMs || 0,
                      speed: overlay.animation?.speed || 1,
                    },
                  })
                }
              />
              <label className="ilv-label">Delay (ms)</label>
              <input
                className="ilv-input min-h-[32px] py-1 text-xs"
                type="number"
                min={0}
                max={4000}
                step={50}
                value={overlay.animation?.delayMs || 0}
                onChange={(e) =>
                  onChange({
                    animation: {
                      type: overlay.animation?.type || 'fade-in',
                      phase: overlay.animation?.phase || animPhase,
                      durationMs: overlay.animation?.durationMs || 700,
                      delayMs: Math.max(0, Number(e.target.value) || 0),
                      speed: overlay.animation?.speed || 1,
                    },
                  })
                }
              />
              <label className="ilv-label">Speed {(overlay.animation?.speed ?? 1).toFixed(2)}×</label>
              <input
                type="range"
                min={0.25}
                max={3}
                step={0.05}
                value={overlay.animation?.speed ?? 1}
                className="w-full"
                aria-label="Animation speed"
                onChange={(e) =>
                  onChange({
                    animation: {
                      type: overlay.animation?.type || 'fade-in',
                      phase: overlay.animation?.phase || animPhase,
                      durationMs: overlay.animation?.durationMs || 700,
                      delayMs: overlay.animation?.delayMs || 0,
                      speed: Number(e.target.value),
                    },
                  })
                }
              />
            </div>
          </PortalPopover>
        </div>

        <div className="ilv-tt-group">
          <button
            ref={effectsBtnRef}
            type="button"
            className={`ilv-btn ilv-btn-secondary text-[11px] ${showEffects ? 'ilv-btn-primary' : ''}`}
            title="Text effects"
            aria-label="Text effects"
            aria-expanded={showEffects}
            onClick={() => {
              setShowEffects((v) => !v);
              setShowFonts(false);
              setShowAnim(false);
            }}
          >
            Effects
          </button>
          <PortalPopover
            open={showEffects}
            anchorRef={effectsBtnRef}
            onClose={() => setShowEffects(false)}
            aria-label="Text effects"
            minWidth={340}
            maxWidth={380}
            maxHeight={560}
            placement="bottom-end"
          >
            <TextEffectsPanel overlay={overlay} onChange={onChange} />
          </PortalPopover>
        </div>

        <button
          type="button"
          className="ilv-tool-btn"
          title="Copy style"
          aria-label="Copy text style"
          onClick={() => copyTextStyle(overlay)}
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          className="ilv-tool-btn"
          title="Paste style"
          aria-label="Paste text style"
          onClick={() => {
            const s = peekCopiedTextStyle();
            if (s) onChange(applyCopiedTextStyle(overlay, s));
          }}
        >
          <ClipboardPaste className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          className={`ilv-tool-btn ${overlay.locked ? 'is-active' : ''}`}
          title={overlay.locked ? 'Unlock' : 'Lock'}
          aria-label={overlay.locked ? 'Unlock' : 'Lock'}
          onClick={() => onChange({ locked: !overlay.locked })}
        >
          {overlay.locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
