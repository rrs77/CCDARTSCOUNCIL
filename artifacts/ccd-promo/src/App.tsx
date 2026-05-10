import { MotionConfig } from "framer-motion";
import VideoWithControls from "@/components/video/VideoWithControls";
import { SCENES } from "@/components/video/video_scenes/scenes";
import { CornerBrand } from "@/components/video/video_scenes/_shared";

const PPTX_URL = `${import.meta.env.BASE_URL}downloads/CCDesigner-Promo.pptx`;

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
      <a
        href={PPTX_URL}
        download="CCDesigner-Promo.pptx"
        className="absolute top-3 right-3 z-50 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md ring-1 ring-white/20 transition hover:bg-white/20 hover:ring-white/40 active:scale-95"
        title="Download editable PowerPoint"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3.5 w-3.5"
          aria-hidden
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        <span>PPTX</span>
      </a>
    </div>
  );
}
