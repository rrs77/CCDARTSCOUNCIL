// Video player hook - handles recording lifecycle, scene advancement, and looping

import { useState, useEffect, useRef } from 'react';

declare global {
  interface Window {
    startRecording?: () => Promise<void>;
    stopRecording?: () => void;
  }
}

export interface SceneDurations {
  [key: string]: number;
}

export interface UseVideoPlayerOptions {
  durations: SceneDurations;
  onVideoEnd?: () => void;
  loop?: boolean;
  paused?: boolean;
}

export interface UseVideoPlayerReturn {
  currentScene: number;
  totalScenes: number;
  currentSceneKey: string;
  hasEnded: boolean;
}

export function useVideoPlayer(options: UseVideoPlayerOptions): UseVideoPlayerReturn {
  const { durations, onVideoEnd, loop = true, paused = false } = options;

  // Captured once on mount -- durations must be a static object
  const sceneKeys = useRef(Object.keys(durations)).current;
  const totalScenes = sceneKeys.length;
  const durationsArray = useRef(Object.values(durations)).current;

  const [currentScene, setCurrentScene] = useState(0);
  const [hasEnded, setHasEnded] = useState(false);

  // Pause/resume bookkeeping: track elapsed across pause toggles within a scene
  const sceneAnchorRef = useRef<number>(performance.now());
  const elapsedBeforePauseRef = useRef<number>(0);

  // Start recording on mount
  useEffect(() => {
    window.startRecording?.();
  }, []);

  // Reset elapsed when scene changes
  useEffect(() => {
    sceneAnchorRef.current = performance.now();
    elapsedBeforePauseRef.current = 0;
  }, [currentScene]);

  // Scene advancement -- loops independently of recording, and respects pause
  useEffect(() => {
    if (hasEnded && !loop) return;

    if (paused) {
      // Accumulate elapsed time at the moment of pausing; do not schedule.
      elapsedBeforePauseRef.current += performance.now() - sceneAnchorRef.current;
      return;
    }

    // (Re)anchor for the running segment
    sceneAnchorRef.current = performance.now();
    const currentDuration = durationsArray[currentScene];
    const remaining = Math.max(0, currentDuration - elapsedBeforePauseRef.current);

    const timer = setTimeout(() => {
      elapsedBeforePauseRef.current = 0;
      // Last scene just finished playing
      if (currentScene >= totalScenes - 1) {
        if (!hasEnded) {
          window.stopRecording?.();
          setHasEnded(true);
          onVideoEnd?.();
        }
        if (loop) {
          setCurrentScene(0);
        }
      } else {
        setCurrentScene(prev => prev + 1);
      }
    }, remaining);

    return () => clearTimeout(timer);
  }, [currentScene, totalScenes, durationsArray, hasEnded, loop, paused, onVideoEnd]);

  return {
    currentScene,
    totalScenes,
    currentSceneKey: sceneKeys[currentScene],
    hasEnded,
  };
}

export function useSceneTimer(events: Array<{ time: number; callback: () => void }>) {
  const firedRef = useRef<Set<number>>(new Set());
  const callbacksRef = useRef<Array<() => void>>([]);

  useEffect(() => {
    callbacksRef.current = events.map(e => e.callback);
  }, [events]);

  const scheduleKey = events.map((event, i) => `${i}:${event.time}`).join('|');

  useEffect(() => {
    firedRef.current = new Set();

    const timers = events.map(({ time }, index) => {
      return setTimeout(() => {
        if (!firedRef.current.has(index)) {
          firedRef.current.add(index);
          callbacksRef.current[index]?.();
        }
      }, time);
    });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [scheduleKey]);
}
