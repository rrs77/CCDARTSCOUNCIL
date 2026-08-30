import { MotionConfig } from "framer-motion";
import { Scene22_Future } from "@/promo/scenes";

export default function PromoFuture() {
  return (
    <MotionConfig>
      <div className="w-screen h-screen overflow-hidden relative bg-black">
        <div
          className="relative font-body overflow-hidden w-full h-full"
          style={{ containerType: "size" }}
        >
          <div className="absolute inset-0">
            <Scene22_Future />
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}
