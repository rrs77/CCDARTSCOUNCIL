import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';
import { Scene5 } from './video_scenes/Scene5';

export const SCENE_DURATIONS = {
  problem: 6000,
  dashboard: 7000,
  library: 6500,
  lessons: 6500,
  outro: 8000,
};

const SCENE_COMPONENTS: Record<string, React.ComponentType> = {
  problem: Scene1,
  dashboard: Scene2,
  library: Scene3,
  lessons: Scene4,
  outro: Scene5,
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

  const baseSceneKey = currentSceneKey.replace(/_r[12]$/, '') as keyof typeof SCENE_DURATIONS;
  const sceneIndex = Object.keys(SCENE_DURATIONS).indexOf(baseSceneKey);
  const SceneComponent = SCENE_COMPONENTS[baseSceneKey];

  return (
    <div className="w-full h-screen overflow-hidden">
      <div
        className="relative bg-white font-body overflow-hidden w-full h-full"
        style={{
          containerType: 'size',
        }}
      >
      {/* Persistent Background Layer */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute w-[80cqw] h-[80cqw] rounded-full blur-[100px] opacity-30 mix-blend-multiply"
          style={{ background: 'var(--color-primary-light)' }}
          animate={{
            x: ['-20%', '10%', '-10%'],
            y: ['-20%', '20%', '-10%'],
            scale: [1, 1.2, 0.9],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute w-[60cqw] h-[60cqw] right-0 bottom-0 rounded-full blur-[100px] opacity-20 mix-blend-multiply"
          style={{ background: 'var(--color-accent-light)' }}
          animate={{
            x: ['10%', '-20%', '5%'],
            y: ['10%', '-30%', '0%'],
            scale: [0.8, 1.1, 1],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Subtle noise texture */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <AnimatePresence initial={false} mode="popLayout">
        {SceneComponent && <SceneComponent key={currentSceneKey} />}
      </AnimatePresence>
      </div>
    </div>
  );
}
