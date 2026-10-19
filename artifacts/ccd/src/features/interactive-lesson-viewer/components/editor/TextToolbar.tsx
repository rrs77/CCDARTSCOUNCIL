import React, { useMemo, useState } from 'react';
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
} from 'lucide-react';
import type { TextAlign, TextAnimationType, TextOverlay } from '../../types';
import {
  TEXT_ANIMATION_OPTIONS,
  TEXT_FONT_OPTIONS,
  TEXT_PRESET_DEFAULTS,
} from '../../types';
import { ColorSwatchPicker } from './ColorSwatchPicker';

interface TextToolbarProps {
  overlay: TextOverlay;
  onChange: (patch: Partial<TextOverlay>) => void;
}

export function TextToolbar({ overlay, onChange }: TextToolbarProps) {
  const [showFonts, setShowFonts] = useState(false);
  const [showAnim, setShowAnim] = useState(false);
  const [showEffects, setShowEffects] = useState(false);
  const [fontFilter, setFontFilter] = useState('');

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

  const setAlign = (next: TextAlign) => onChange({ textAlign: next });

  return (
    <div className="ilv-text-toolbar" role="toolbar" aria-label="Text formatting">
      <div className="ilv-text-toolbar-row">
        <div className="ilv-tt-group relative">
          <button
            type="button"
            className="ilv-tt-font"
            onClick={() => {
              setShowFonts((v) => !v);
              setShowAnim(false);
              setShowEffects(false);
            }}
            title="Font"
          >
            <Type className="h-3.5 w-3.5 shrink-0" />
            <span style={{ fontFamily: fontMeta.stack }}>{fontMeta.label}</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
          </button>
          {showFonts && (
            <div className="ilv-tt-popover ilv-tt-font-popover">
              <input
                className="ilv-input min-h-[32px] py-1 text-xs"
                placeholder="Search fonts…"
                value={fontFilter}
                onChange={(e) => setFontFilter(e.target.value)}
                autoFocus
              />
              <div className="ilv-tt-font-list">
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
          )}
        </div>

        <div className="ilv-tt-group">
          <button
            type="button"
            className="ilv-tool-btn"
            title="Smaller"
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
            onClick={() => onChange({ fontWeight: isBold ? 500 : 800 })}
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={`ilv-tool-btn ${isItalic ? 'is-active' : ''}`}
            title="Italic"
            onClick={() => onChange({ fontStyle: isItalic ? 'normal' : 'italic' })}
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={`ilv-tool-btn ${isUnderline ? 'is-active' : ''}`}
            title="Underline"
            onClick={() =>
              onChange({ textDecoration: isUnderline ? 'none' : 'underline' })
            }
          >
            <Underline className="h-4 w-4" />
          </button>
        </div>

        <div className="ilv-tt-group">
          <button
            type="button"
            className={`ilv-tool-btn ${align === 'left' ? 'is-active' : ''}`}
            title="Align left"
            onClick={() => setAlign('left')}
          >
            <AlignLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={`ilv-tool-btn ${align === 'center' ? 'is-active' : ''}`}
            title="Align center"
            onClick={() => setAlign('center')}
          >
            <AlignCenter className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={`ilv-tool-btn ${align === 'right' ? 'is-active' : ''}`}
            title="Align right"
            onClick={() => setAlign('right')}
          >
            <AlignRight className="h-4 w-4" />
          </button>
        </div>

        <div className="ilv-tt-group ilv-tt-color">
          <ColorSwatchPicker
            compact
            value={overlay.color}
            onChange={(color) => onChange({ color })}
          />
        </div>

        <div className="ilv-tt-group relative">
          <button
            type="button"
            className={`ilv-tool-btn ${overlay.animation?.type && overlay.animation.type !== 'none' ? 'is-active' : ''}`}
            title="Text animation"
            onClick={() => {
              setShowAnim((v) => !v);
              setShowFonts(false);
              setShowEffects(false);
            }}
          >
            <Sparkles className="h-4 w-4" />
          </button>
          {showAnim && (
            <div className="ilv-tt-popover">
              <p className="ilv-label mb-1">Entrance animation</p>
              <div className="grid grid-cols-2 gap-1.5">
                {TEXT_ANIMATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.type}
                    type="button"
                    className={`ilv-btn text-[11px] ${
                      (overlay.animation?.type || 'none') === opt.type ? 'ilv-btn-primary' : 'ilv-btn-secondary'
                    }`}
                    onClick={() => {
                      onChange({
                        animation: {
                          type: opt.type as TextAnimationType,
                          durationMs: overlay.animation?.durationMs || 700,
                          delayMs: overlay.animation?.delayMs || 0,
                        },
                      });
                      setShowAnim(false);
                    }}
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
                      durationMs: Math.max(100, Number(e.target.value) || 700),
                      delayMs: overlay.animation?.delayMs || 0,
                    },
                  })
                }
              />
            </div>
          )}
        </div>

        <div className="ilv-tt-group relative">
          <button
            type="button"
            className={`ilv-btn ilv-btn-secondary text-[11px] ${showEffects ? 'ilv-btn-primary' : ''}`}
            onClick={() => {
              setShowEffects((v) => !v);
              setShowFonts(false);
              setShowAnim(false);
            }}
          >
            Effects
          </button>
          {showEffects && (
            <div className="ilv-tt-popover ilv-tt-effects">
              <label className="flex items-center gap-2 text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={Boolean(overlay.effects?.shadow)}
                  onChange={(e) =>
                    onChange({
                      effects: { ...overlay.effects, shadow: e.target.checked },
                    })
                  }
                />
                Shadow
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={Boolean(overlay.effects?.outline)}
                  onChange={(e) =>
                    onChange({
                      effects: { ...overlay.effects, outline: e.target.checked, outlineWidth: 1.5 },
                    })
                  }
                />
                Outline
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={Boolean(overlay.effects?.highlight)}
                  onChange={(e) =>
                    onChange({
                      effects: {
                        ...overlay.effects,
                        highlight: e.target.checked,
                        highlightColor: overlay.effects?.highlightColor || 'rgba(255,201,60,0.4)',
                      },
                    })
                  }
                />
                Highlight
              </label>
              <label className="ilv-label mt-1">Uppercase</label>
              <button
                type="button"
                className={`ilv-btn text-xs w-full ${
                  overlay.textTransform === 'uppercase' ? 'ilv-btn-primary' : 'ilv-btn-secondary'
                }`}
                onClick={() =>
                  onChange({
                    textTransform: overlay.textTransform === 'uppercase' ? 'none' : 'uppercase',
                  })
                }
              >
                Aa → AA
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          className={`ilv-tool-btn ${overlay.locked ? 'is-active' : ''}`}
          title={overlay.locked ? 'Unlock' : 'Lock'}
          onClick={() => onChange({ locked: !overlay.locked })}
        >
          {overlay.locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
