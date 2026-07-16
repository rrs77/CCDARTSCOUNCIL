import { MotionConfig } from "framer-motion";
import { Scene01_Welcome } from "@/promo/scenes";

export default function PromoWelcome() {
  return (
    <MotionConfig>
      <div className="w-screen h-screen overflow-hidden relative bg-black">
        <div
          className="relative font-body overflow-hidden w-full h-full"
          style={{ containerType: "size" }}
        >
          <div className="absolute inset-0">
            <Scene01_Welcome />
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}
