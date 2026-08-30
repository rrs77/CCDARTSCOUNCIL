import { MotionConfig } from "framer-motion";
import VideoWithControls from "@/components/video/VideoWithControls";
import { SCENES } from "@/components/video/video_scenes/scenes";
import { CornerBrand } from "@/components/video/video_scenes/_shared";

function StillFrame({ index }: { index: number }) {
  const keys = Object.keys(SCENES) as Array<keyof typeof SCENES>;
  const safeIndex = Math.max(0, Math.min(keys.length - 1, index - 1));
  const key = keys[safeIndex];
  const SceneComponent = SCENES[key];
  const showCorner = key !== "s01_welcome" && key !== "s22_future";
  return (
    <MotionConfig reducedMotion="always">
      <div className="w-full h-[100dvh] overflow-hidden bg-black">
        <div
          className="relative font-body overflow-hidden w-full h-full"
          style={{ containerType: "size" }}
        >
          <div className="absolute inset-0">
            <SceneComponent />
          </div>
          {showCorner && <CornerBrand />}
        </div>
      </div>
    </MotionConfig>
  );
}

export default function App() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("still") === "1") {
    const idx = parseInt(params.get("scene") || "1", 10) || 1;
    return <StillFrame index={idx} />;
  }
  return (
    <div className="relative w-full h-[100dvh] bg-black">
      <VideoWithControls />
    </div>
  );
}
