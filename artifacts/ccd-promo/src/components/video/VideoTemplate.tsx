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
  paused?: boolean;
  onSceneChange?: (sceneKey: string) => void;
}

export const SCENE_LABELS: Record<keyof typeof SCENES, string> = {
  s01_welcome: 'Welcome',
  s02_creativeWork: 'Creative Work',
  s03_neverLose: 'Never Lose Ideas',
  s04_archive: 'Living Archive',
  s05_mapping: 'Curriculum Mapping',
  s06_planning: 'Lesson Planning',
  s07_arts: 'Performing Arts',
  s08_creative: 'Creative Process',
  s09_ai: 'Smart Suggestions',
  s10_adaptive: 'Adaptive',
  s11_send: 'SEND',
  s12_stretch: 'Stretch & Extend',
  s13_crossCurric: 'Cross-Curricular',
  s14_reflect: 'Reflection',
  s15_progression: 'Progression',
  s16_sequencing: 'Sequencing',
  s17_inspiration: 'Inspiration',
  s18_community: 'Community',
  s19_visualMap: 'Visual Map',
  s20_export: 'Export & Share',
  s21_mobile: 'On Any Device',
  s22_future: 'What\u2019s Next',
};

export default function VideoTemplate({
  durations = SCENE_DURATIONS,
  loop = true,
  paused = false,
  onSceneChange,
}: VideoTemplateProps = {}) {
  const { currentSceneKey } = useVideoPlayer({ durations, loop, paused });

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
