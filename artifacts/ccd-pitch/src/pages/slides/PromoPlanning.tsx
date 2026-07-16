import { MotionConfig } from "framer-motion";
import { Scene06_Planning } from "@/promo/scenes";

export default function PromoPlanning() {
  return (
    <MotionConfig>
      <div className="w-screen h-screen overflow-hidden relative bg-black">
        <div
          className="relative font-body overflow-hidden w-full h-full"
          style={{ containerType: "size" }}
        >
          <div className="absolute inset-0">
            <Scene06_Planning />
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}
