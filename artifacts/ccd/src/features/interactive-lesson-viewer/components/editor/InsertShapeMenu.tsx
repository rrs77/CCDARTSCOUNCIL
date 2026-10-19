import React, { useState } from 'react';
import {
  Square,
  Circle,
  Triangle,
  Minus,
  Star,
  ArrowRight,
  RectangleHorizontal,
} from 'lucide-react';
import type { ShapeKind, StageObject } from '../../types';
import { createId } from '../../types';
import { PortalPopover } from './PortalPopover';
import { ColorSwatchPicker } from './ColorSwatchPicker';

interface InsertShapeMenuProps {
  open: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  onInsert: (object: StageObject) => void;
}

const SHAPES: { id: ShapeKind; label: string; icon: React.ReactNode }[] = [
  { id: 'rect', label: 'Rectangle', icon: <Square className="h-4 w-4" /> },
  { id: 'rounded', label: 'Rounded rect', icon: <RectangleHorizontal className="h-4 w-4" /> },
  { id: 'ellipse', label: 'Circle / oval', icon: <Circle className="h-4 w-4" /> },
  { id: 'triangle', label: 'Triangle', icon: <Triangle className="h-4 w-4" /> },
  { id: 'line', label: 'Line', icon: <Minus className="h-4 w-4" /> },
  { id: 'arrow', label: 'Arrow', icon: <ArrowRight className="h-4 w-4" /> },
  { id: 'star', label: 'Star', icon: <Star className="h-4 w-4" /> },
];

function buildShape(kind: ShapeKind, fill: string, stroke: string, opacity: number, cornerRadius: number): StageObject {
  const isLine = kind === 'line' || kind === 'arrow';
  return {
    id: createId('obj'),
    kind: 'shape',
    shape: kind,
    x: isLine ? 20 : 30,
    y: isLine ? 45 : 30,
    width: isLine ? 40 : 28,
    height: isLine ? 4 : kind === 'ellipse' ? 28 : 22,
    fill,
    stroke,
    strokeWidth: isLine ? 3 : 2,
    opacity,
    rotation: 0,
    zIndex: 5,
    // corner radius stored as % of min(w,h) via strokeWidth abuse? use dedicated field via fill meta — put on object as strokeWidth companion
    ...(kind === 'rounded' ? { strokeWidth: Math.max(2, cornerRadius) } : {}),
  };
}

/** Portaled shape picker with fill/stroke/opacity/corner-radius. */
export function InsertShapeMenu({ open, anchorRef, onClose, onInsert }: InsertShapeMenuProps) {
  const [kind, setKind] = useState<ShapeKind>('rect');
  const [fill, setFill] = useState('#4338E8');
  const [stroke, setStroke] = useState('#1F1B4D');
  const [opacity, setOpacity] = useState(100);
  const [cornerRadius, setCornerRadius] = useState(12);

  return (
    <PortalPopover
      open={open}
      anchorRef={anchorRef}
      onClose={onClose}
      aria-label="Insert shape"
      role="dialog"
      minWidth={280}
      maxWidth={320}
      maxHeight={520}
      placement="bottom-start"
    >
      <div className="ilv-insert-menu">
        <p className="ilv-insert-menu-title">
          <Square className="h-4 w-4" />
          Insert shape
        </p>

        <div className="ilv-shape-grid" role="listbox" aria-label="Shape type">
          {SHAPES.map((s) => (
            <button
              key={s.id}
              type="button"
              role="option"
              aria-selected={kind === s.id}
              className={`ilv-shape-opt ${kind === s.id ? 'is-on' : ''}`}
              title={s.label}
              aria-label={s.label}
              onClick={() => setKind(s.id)}
            >
              {s.icon}
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        <ColorSwatchPicker label="Fill" value={fill} onChange={setFill} compact />
        <ColorSwatchPicker label="Stroke" value={stroke} onChange={setStroke} compact />

        <label className="ilv-label">Opacity {opacity}%</label>
        <input
          type="range"
          min={0}
          max={100}
          value={opacity}
          onChange={(e) => setOpacity(Number(e.target.value))}
          aria-label="Shape opacity"
          className="w-full"
        />

        {(kind === 'rounded' || kind === 'rect') && (
          <>
            <label className="ilv-label">Corner radius {cornerRadius}px</label>
            <input
              type="range"
              min={0}
              max={48}
              value={cornerRadius}
              onChange={(e) => setCornerRadius(Number(e.target.value))}
              aria-label="Corner radius"
              className="w-full"
              disabled={kind === 'rect'}
            />
          </>
        )}

        <button
          type="button"
          className="ilv-btn ilv-btn-primary w-full text-xs"
          onClick={() => {
            const shapeKind = kind === 'rect' && cornerRadius > 0 ? 'rounded' : kind;
            onInsert(buildShape(shapeKind, fill, stroke, opacity / 100, cornerRadius));
            onClose();
          }}
        >
          Add {SHAPES.find((s) => s.id === kind)?.label || 'shape'}
        </button>
      </div>
    </PortalPopover>
  );
}
