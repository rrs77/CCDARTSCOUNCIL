import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { SCENES } from './video_scenes/scenes';
import { CornerBrand } from './video_scenes/_shared';

// Per-scene durations tuned for cinematic pacing (~2 minutes total, 22 scenes).
// Hero / outro get a little more breathing room; mid-tour scenes are tighter.
export const SCENE_DURATIONS: Record<keyof typeof SCENES, number> = {
  s01_welcome: 10000,
  s02_creativeWork: 9500,
  s03_neverLose: 10500,
  s04_archive: 9500,
  s05_mapping: 9500,
  s06_planning: 9500,
  s07_arts: 9500,
  s08_creative: 8500,
  s09_ai: 9500,
  s10_adaptive: 9500,
  s11_send: 8500,
  s12_stretch: 9000,
  s13_crossCurric: 9500,
  s14_reflect: 9500,
  s15_progression: 9500,
  s16_sequencing: 9500,
  s17_inspiration: 9500,
  s18_community: 9500,
  s19_visualMap: 9500,
  s20_export: 9500,
  s21_mobile: 9000,
  s22_future: 12000,
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
        {baseSceneKey !== 's01_welcome' && baseSceneKey !== 's22_future' && <CornerBrand />}
      </div>
    </div>
  );
}
