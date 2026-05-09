import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { SCENES } from './video_scenes/scenes';

// Per-scene durations tuned for cinematic pacing (~2 minutes total, 22 scenes).
// Hero / outro get a little more breathing room; mid-tour scenes are tighter.
export const SCENE_DURATIONS: Record<keyof typeof SCENES, number> = {
  s01_welcome: 7000,
  s02_creativeWork: 6500,
  s03_neverLose: 7000,
  s04_archive: 6500,
  s05_mapping: 6500,
  s06_planning: 6500,
  s07_arts: 6500,
  s08_creative: 5500,
  s09_ai: 6500,
  s10_adaptive: 6500,
  s11_send: 5500,
  s12_stretch: 6000,
  s13_crossCurric: 6500,
  s14_reflect: 6500,
  s15_progression: 6500,
  s16_sequencing: 6500,
  s17_inspiration: 6500,
  s18_community: 6500,
  s19_visualMap: 6500,
  s20_export: 6500,
  s21_mobile: 6000,
  s22_future: 8500,
};

interface VideoTemplateProps {
  durations?: Record<string, number>;
  loop?: boolean;
  onSceneChange?: (sceneKey: string) => void;
}

export default function VideoTemplate({
  durations = SCENE_DURATIONS,
  loop = true,
  onSceneChange,
}: VideoTemplateProps = {}) {
  const { currentSceneKey } = useVideoPlayer({ durations, loop });

  useEffect(() => {
    onSceneChange?.(currentSceneKey);
  }, [currentSceneKey, onSceneChange]);

  const baseSceneKey = currentSceneKey.replace(/_r[12]$/, '') as keyof typeof SCENES;
  const SceneComponent = SCENES[baseSceneKey];

  return (
    <div className="w-full h-[100dvh] overflow-hidden bg-black">
      <div
        className="relative font-body overflow-hidden w-full h-full"
        style={{ containerType: 'size' }}
      >
        <AnimatePresence initial={false} mode="popLayout">
          {SceneComponent && (
            <motion.div key={baseSceneKey} className="absolute inset-0">
              <SceneComponent />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
