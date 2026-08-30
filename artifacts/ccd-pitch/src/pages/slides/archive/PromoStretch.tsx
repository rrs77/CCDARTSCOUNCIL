import { MotionConfig } from "framer-motion";
import { Scene12_Stretch } from "@/promo/scenes";

export default function PromoStretch() {
  return (
    <MotionConfig>
      <div className="w-screen h-screen overflow-hidden relative bg-black">
        <div
          className="relative font-body overflow-hidden w-full h-full"
          style={{ containerType: "size" }}
        >
          <div className="absolute inset-0">
            <Scene12_Stretch />
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}
