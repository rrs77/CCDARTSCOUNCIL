import React from 'react';
import type { TextCase, TextEffects, TextOverlay } from '../../types';
import { TEXT_EFFECT_PRESETS, applyTextEffectPreset } from '../../types';
import { ColorSwatchPicker } from './ColorSwatchPicker';

interface TextEffectsPanelProps {
  overlay: TextOverlay;
  onChange: (patch: Partial<TextOverlay>) => void;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="ilv-fx-section">
      <h4 className="ilv-fx-section-title">{title}</h4>
      {children}
    </section>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="ilv-fx-slider">
      <label className="ilv-label">
        {label} <span className="tabular-nums text-[var(--ss-muted)]">{value}</span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        aria-label={label}
      />
    </div>
  );
}

/** Full Canva-style text effects + box chrome panel (rendered inside PortalPopover). */
export function TextEffectsPanel({ overlay, onChange }: TextEffectsPanelProps) {
  const fx: TextEffects = overlay.effects || {};
  const preset = fx.preset || (fx.shadow ? 'shadow' : fx.outline ? 'outline' : fx.highlight ? 'background' : 'none');

  const patchFx = (patch: Partial<TextEffects>) => {
    onChange({ effects: { ...fx, ...patch } });
  };

  const caseValue: TextCase = overlay.textTransform || 'none';
  const deco = overlay.textDecoration || 'none';

  return (
    <div className="ilv-fx-panel">
      <Section title="Effect presets">
        <div className="ilv-fx-presets" role="listbox" aria-label="Text effect presets">
          {TEXT_EFFECT_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              role="option"
              aria-selected={preset === p.id}
              className={`ilv-fx-preset ${preset === p.id ? 'is-on' : ''}`}
              data-preset={p.id}
              title={p.label}
              onClick={() => onChange({ effects: applyTextEffectPreset(fx, p.id) })}
            >
              <span className="ilv-fx-preset-sample" aria-hidden>
                Ag
              </span>
              <span className="ilv-fx-preset-label">{p.label}</span>
            </button>
          ))}
        </div>
      </Section>

      {preset === 'shadow' || preset === 'lift' || preset === 'echo' || preset === 'glitch' || preset === 'neon' ? (
        <Section title="Shadow / glow">
          <Slider
            label="Offset"
            value={fx.shadowOffset ?? 4}
            min={0}
            max={40}
            onChange={(n) => patchFx({ shadowOffset: n, shadow: true })}
          />
          <Slider
            label="Direction"
            value={fx.shadowAngle ?? 135}
            min={0}
            max={360}
            onChange={(n) => patchFx({ shadowAngle: n })}
          />
          <Slider
            label="Blur"
            value={fx.shadowBlur ?? 6}
            min={0}
            max={48}
            onChange={(n) => patchFx({ shadowBlur: n })}
          />
          <Slider
            label="Transparency"
            value={Math.round((fx.shadowOpacity ?? 0.45) * 100)}
            min={0}
            max={100}
            onChange={(n) => patchFx({ shadowOpacity: n / 100 })}
          />
          <ColorSwatchPicker
            label="Shadow colour"
            value={fx.shadowColor || 'rgba(0,0,0,0.55)'}
            onChange={(c) => patchFx({ shadowColor: c })}
            compact
          />
          {preset === 'neon' && (
            <>
              <Slider
                label="Neon intensity"
                value={fx.neonIntensity ?? 70}
                min={0}
                max={100}
                onChange={(n) => patchFx({ neonIntensity: n })}
              />
              <ColorSwatchPicker
                label="Neon colour"
                value={fx.neonColor || '#FFC93C'}
                onChange={(c) => patchFx({ neonColor: c, shadowColor: c })}
                compact
              />
            </>
          )}
          {(preset === 'echo' || preset === 'glitch') && (
            <ColorSwatchPicker
              label="Effect colour"
              value={fx.effectColor || '#4338E8'}
              onChange={(c) => patchFx({ effectColor: c })}
              compact
            />
          )}
        </Section>
      ) : null}

      {preset === 'splice' && (
        <Section title="Splice colour">
          <ColorSwatchPicker
            label="Effect colour"
            value={fx.effectColor || '#4338E8'}
            onChange={(c) => patchFx({ effectColor: c })}
            compact
          />
        </Section>
      )}

      {(preset === 'outline' || preset === 'hollow' || preset === 'splice') && (
        <Section title="Outline">
          <Slider
            label="Thickness"
            value={fx.outlineWidth ?? 2}
            min={0.5}
            max={12}
            step={0.5}
            onChange={(n) => patchFx({ outlineWidth: n, outline: true })}
          />
          <ColorSwatchPicker
            label="Outline colour"
            value={fx.outlineColor || '#FFFFFF'}
            onChange={(c) => patchFx({ outlineColor: c })}
            compact
          />
        </Section>
      )}

      {preset === 'background' && (
        <Section title="Highlight">
          <ColorSwatchPicker
            label="Highlight colour"
            value={fx.highlightColor || 'rgba(255,201,60,0.45)'}
            onChange={(c) => patchFx({ highlightColor: c, highlight: true })}
            compact
          />
          <Slider
            label="Highlight opacity"
            value={Math.round((fx.highlightOpacity ?? 0.45) * 100)}
            min={0}
            max={100}
            onChange={(n) => patchFx({ highlightOpacity: n / 100 })}
          />
        </Section>
      )}

      {preset === 'curve' && (
        <Section title="Curve">
          <Slider
            label="Curve amount"
            value={fx.curveAmount ?? 40}
            min={-100}
            max={100}
            onChange={(n) => patchFx({ curveAmount: n })}
          />
        </Section>
      )}

      <Section title="Text style">
        <Slider
          label="Letter spacing"
          value={overlay.letterSpacing ?? 0}
          min={-4}
          max={24}
          step={0.5}
          onChange={(n) => onChange({ letterSpacing: n })}
        />
        <Slider
          label="Line height"
          value={Math.round((overlay.lineHeight ?? 1.2) * 100)}
          min={80}
          max={220}
          onChange={(n) => onChange({ lineHeight: n / 100 })}
        />
        <p className="ilv-label">Case</p>
        <div className="flex flex-wrap gap-1">
          {(
            [
              ['none', 'Aa'],
              ['uppercase', 'AA'],
              ['lowercase', 'aa'],
              ['capitalize', 'Title'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`ilv-btn text-xs ${caseValue === id ? 'ilv-btn-primary' : 'ilv-btn-secondary'}`}
              onClick={() => onChange({ textTransform: id })}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          <button
            type="button"
            className={`ilv-btn text-xs ${deco.includes('underline') ? 'ilv-btn-primary' : 'ilv-btn-secondary'}`}
            onClick={() =>
              onChange({
                textDecoration: deco.includes('underline')
                  ? deco.includes('line-through')
                    ? 'line-through'
                    : 'none'
                  : deco.includes('line-through')
                    ? 'underline line-through'
                    : 'underline',
              })
            }
          >
            Underline
          </button>
          <button
            type="button"
            className={`ilv-btn text-xs ${deco.includes('line-through') ? 'ilv-btn-primary' : 'ilv-btn-secondary'}`}
            onClick={() =>
              onChange({
                textDecoration: deco.includes('line-through')
                  ? deco.includes('underline')
                    ? 'underline'
                    : 'none'
                  : deco.includes('underline')
                    ? 'underline line-through'
                    : 'line-through',
              })
            }
          >
            Strikethrough
          </button>
          <button
            type="button"
            className={`ilv-btn text-xs ${fx.superscript ? 'ilv-btn-primary' : 'ilv-btn-secondary'}`}
            onClick={() => patchFx({ superscript: !fx.superscript })}
          >
            Superscript
          </button>
        </div>
        <label className="ilv-label mt-2">Text gradient fill</label>
        <input
          className="ilv-input min-h-[32px] py-1 text-xs"
          value={fx.fillGradient || ''}
          placeholder="linear-gradient(90deg, #4338E8, #FFC93C)"
          onChange={(e) => patchFx({ fillGradient: e.target.value || undefined })}
        />
        <ColorSwatchPicker
          label="Solid text colour"
          value={overlay.color}
          onChange={(c) => onChange({ color: c, effects: { ...fx, fillGradient: undefined } })}
          compact
        />
      </Section>

      <Section title="Text box">
        <ColorSwatchPicker
          label="Background"
          value={fx.boxBackground || overlay.boxBackground || 'rgba(255,255,255,0)'}
          onChange={(c) => {
            patchFx({ boxBackground: c });
            onChange({ boxBackground: c, effects: { ...fx, boxBackground: c } });
          }}
          compact
        />
        <label className="ilv-label">Gradient background</label>
        <input
          className="ilv-input min-h-[32px] py-1 text-xs"
          value={fx.boxGradient || ''}
          placeholder="linear-gradient(180deg, #4338E8, #1F1B4D)"
          onChange={(e) => patchFx({ boxGradient: e.target.value || undefined })}
        />
        <Slider
          label="Corner radius"
          value={fx.boxRadius ?? 0}
          min={0}
          max={64}
          onChange={(n) => patchFx({ boxRadius: n })}
        />
        <Slider
          label="Padding"
          value={fx.boxPadding ?? 4}
          min={0}
          max={48}
          onChange={(n) => patchFx({ boxPadding: n })}
        />
        <Slider
          label="Border width"
          value={fx.boxBorderWidth ?? 0}
          min={0}
          max={12}
          onChange={(n) => patchFx({ boxBorderWidth: n })}
        />
        <ColorSwatchPicker
          label="Border colour"
          value={fx.boxBorderColor || '#1F1B4D'}
          onChange={(c) => patchFx({ boxBorderColor: c })}
          compact
        />
        <p className="ilv-label">Border style</p>
        <div className="flex flex-wrap gap-1">
          {(['none', 'solid', 'dashed', 'dotted'] as const).map((s) => (
            <button
              key={s}
              type="button"
              className={`ilv-btn text-xs ${
                (fx.boxBorderStyle || 'none') === s ? 'ilv-btn-primary' : 'ilv-btn-secondary'
              }`}
              onClick={() => patchFx({ boxBorderStyle: s })}
            >
              {s}
            </button>
          ))}
        </div>
      </Section>
    </div>
  );
}
