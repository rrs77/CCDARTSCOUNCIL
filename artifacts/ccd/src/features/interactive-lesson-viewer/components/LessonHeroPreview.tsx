import React from 'react';
import { Mic2, Play, Maximize2, Music2, Youtube } from 'lucide-react';

/**
 * Styled mock of a classroom lesson mid-play — built from Studio Score shapes,
 * not stock photography. Used in the Lesson Viewer hero.
 */
export function LessonHeroPreview() {
  return (
    <div className="ilv-hero-preview" aria-hidden>
      <div className="ilv-hero-preview-stage">
        <div className="ilv-hero-preview-chrome">
          <span className="ilv-hero-preview-dot" />
          <span className="ilv-hero-preview-dot" />
          <span className="ilv-hero-preview-dot" />
          <span className="ilv-hero-preview-live">
            <span className="ilv-hero-preview-live-pulse" />
            Presenting
          </span>
        </div>

        <div className="ilv-hero-preview-slide">
          <div className="ilv-hero-preview-slide-bg" />
          <p className="ilv-hero-preview-kicker">Scene 3 · Karaoke</p>
          <h3 className="ilv-hero-preview-title">Clap your hands…</h3>
          <div className="ilv-hero-preview-lyrics">
            <span className="is-past">Clap</span>
            <span className="is-past">your</span>
            <span className="is-active">hands</span>
            <span>and</span>
            <span>sing</span>
            <span>along</span>
          </div>
          <div className="ilv-hero-preview-timeline">
            <div className="ilv-hero-preview-playhead" />
            <div className="ilv-hero-preview-block is-a" />
            <div className="ilv-hero-preview-block is-b" />
            <div className="ilv-hero-preview-block is-c" />
          </div>
        </div>

        <div className="ilv-hero-preview-rail">
          <div className="ilv-hero-preview-thumb is-on">
            <Play className="h-3 w-3" />
            Intro
          </div>
          <div className="ilv-hero-preview-thumb">
            <Music2 className="h-3 w-3" />
            Title
          </div>
          <div className="ilv-hero-preview-thumb is-active">
            <Mic2 className="h-3 w-3" />
            Karaoke
          </div>
          <div className="ilv-hero-preview-thumb">
            <Youtube className="h-3 w-3" />
            YouTube
          </div>
        </div>

        <div className="ilv-hero-preview-fab">
          <Maximize2 className="h-3.5 w-3.5" />
          Full screen
        </div>
      </div>
    </div>
  );
}
