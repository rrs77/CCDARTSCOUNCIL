import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { ChapterBody } from "@/chapters/ChapterBody";
import { meta, type ClusterDef } from "@/content/facts.content";

/**
 * True overlay modal: fixed header, scrollable body.
 * Wheel / touch stay inside the modal — they do not pan the canvas.
 */
export function TopicModal({
  cluster,
  showKeys,
  onClose,
  footer,
}: {
  cluster: ClusterDef;
  showKeys?: boolean;
  onClose: () => void;
  footer?: React.ReactNode;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
  }, [cluster.id]);

  const stopCanvas = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className="topic-modal-root"
      role="dialog"
      aria-modal="true"
      aria-labelledby="topic-modal-title"
      onPointerDown={stopCanvas}
      onWheel={stopCanvas}
      onTouchMove={stopCanvas}
    >
      <button type="button" className="topic-modal-backdrop" aria-label="Close" onClick={onClose} />
      <div
        className={`topic-modal ${cluster.id === "cover" ? "topic-modal--dark" : ""}`}
        onPointerDown={stopCanvas}
        onWheel={(e) => {
          e.stopPropagation();
        }}
        onTouchMove={(e) => {
          e.stopPropagation();
        }}
      >
        <header className="topic-modal-header">
          <div className="topic-modal-header-text">
            <p className="topic-modal-kicker">{meta.brand}</p>
            <h2 id="topic-modal-title" className="topic-modal-title">
              {cluster.id === "cover" ? meta.title : cluster.title}
            </h2>
          </div>
          <button
            type="button"
            className="topic-modal-close"
            aria-label={meta.ui.closeModal}
            onClick={onClose}
          >
            <X className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </header>

        <div className="topic-modal-scroll-wrap">
          <div
            ref={bodyRef}
            className="topic-modal-body"
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            <ChapterBody cluster={cluster} showKeys={showKeys} hideTitle />
            <div className="topic-modal-body-end" aria-hidden />
          </div>
          <div className="topic-modal-fade" aria-hidden />
        </div>

        {footer ? <footer className="topic-modal-footer">{footer}</footer> : null}
      </div>
    </div>
  );
}
