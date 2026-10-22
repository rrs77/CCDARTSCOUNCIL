import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  A4_HEIGHT_PX,
  A4_WIDTH_PX,
  buildLessonPdfHtml,
  type BuildLessonPdfHtmlOptions,
} from '../utils/lessonPdfHtml';

interface LessonPrintPreviewProps {
  options: BuildLessonPdfHtmlOptions;
  className?: string;
  /** Fit width of container (default true). */
  fitWidth?: boolean;
}

/**
 * Live A4 print preview — renders the same HTML document PDFBolt uses.
 * Updates whenever `options` change (unsaved form data included).
 */
export function LessonPrintPreview({
  options,
  className = '',
  fitWidth = true,
}: LessonPrintPreviewProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const html = useMemo(() => buildLessonPdfHtml(options), [options]);

  useEffect(() => {
    if (!fitWidth || !hostRef.current) return;
    const el = hostRef.current;
    const update = () => {
      const w = el.clientWidth;
      if (w > 0) setScale(Math.min(1, (w - 16) / A4_WIDTH_PX));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fitWidth]);

  const scaledH = A4_HEIGHT_PX * scale;

  return (
    <div
      ref={hostRef}
      className={`flex justify-center overflow-auto bg-[#E8E6F0] p-3 sm:p-4 ${className}`}
    >
      <div
        className="relative shrink-0"
        style={{ width: A4_WIDTH_PX * scale, height: scaledH }}
      >
        <div
          className="origin-top-left rounded-sm bg-white shadow-[0_8px_30px_rgba(31,27,77,0.18)]"
          style={{
            width: A4_WIDTH_PX,
            minHeight: A4_HEIGHT_PX,
            transform: `scale(${scale})`,
          }}
        >
          <iframe
            title="Lesson print preview"
            srcDoc={html}
            className="h-full w-full border-0"
            style={{ width: A4_WIDTH_PX, height: A4_HEIGHT_PX, background: '#fff' }}
            sandbox="allow-same-origin"
          />
        </div>
      </div>
    </div>
  );
}
