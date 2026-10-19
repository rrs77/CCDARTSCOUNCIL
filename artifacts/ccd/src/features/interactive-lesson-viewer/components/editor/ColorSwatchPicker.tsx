import React, { useEffect, useState } from 'react';
import { BRAND_TEXT_COLORS, DEFAULT_SOLID_COLORS } from '../../types';
import { pushRecentColor, readRecentColors } from '../../utils/recentColors';

interface ColorSwatchPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  compact?: boolean;
}

export function ColorSwatchPicker({ value, onChange, label, compact }: ColorSwatchPickerProps) {
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    setRecent(readRecentColors());
  }, [value]);

  const apply = (color: string) => {
    onChange(color);
    setRecent(pushRecentColor(color));
  };

  return (
    <div className={`ilv-color-picker ${compact ? 'is-compact' : ''}`}>
      {label && <span className="ilv-label">{label}</span>}
      <div className="ilv-color-row">
        <label className="ilv-color-custom" title="Custom colour">
          <input
            type="color"
            value={/^#[0-9A-Fa-f]{6}$/.test(value) ? value : '#1F1B4D'}
            onChange={(e) => apply(e.target.value)}
            aria-label="Custom colour"
          />
          <span style={{ background: value }} />
        </label>
        {BRAND_TEXT_COLORS.map((c) => (
          <button
            key={`b-${c}`}
            type="button"
            className={`ilv-color-swatch ${value.toLowerCase() === c.toLowerCase() ? 'is-active' : ''}`}
            style={{ background: c }}
            title={c}
            aria-label={`Brand colour ${c}`}
            onClick={() => apply(c)}
          />
        ))}
      </div>
      {!compact && (
        <>
          <div className="ilv-color-row">
            {DEFAULT_SOLID_COLORS.map((c) => (
              <button
                key={`s-${c}`}
                type="button"
                className={`ilv-color-swatch ${value.toLowerCase() === c.toLowerCase() ? 'is-active' : ''}`}
                style={{ background: c }}
                title={c}
                aria-label={`Colour ${c}`}
                onClick={() => apply(c)}
              />
            ))}
          </div>
          {recent.length > 0 && (
            <div className="ilv-color-row">
              <span className="ilv-color-meta">Recent</span>
              {recent.map((c) => (
                <button
                  key={`r-${c}`}
                  type="button"
                  className={`ilv-color-swatch ${value.toLowerCase() === c.toLowerCase() ? 'is-active' : ''}`}
                  style={{ background: c }}
                  title={c}
                  onClick={() => apply(c)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
