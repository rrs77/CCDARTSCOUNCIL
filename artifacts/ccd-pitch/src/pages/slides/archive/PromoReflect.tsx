import { MotionConfig } from "framer-motion";
import { Scene14_Reflect } from "@/promo/scenes";

export default function PromoReflect() {
  return (
    <MotionConfig>
      <div className="w-screen h-screen overflow-hidden relative bg-black">
        <div
          className="relative font-body overflow-hidden w-full h-full"
          style={{ containerType: "size" }}
        >
          <div className="absolute inset-0">
            <Scene14_Reflect />
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}
