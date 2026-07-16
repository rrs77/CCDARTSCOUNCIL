import { MotionConfig } from "framer-motion";
import { Scene18_Community } from "@/promo/scenes";

export default function PromoCommunity() {
  return (
    <MotionConfig>
      <div className="w-screen h-screen overflow-hidden relative bg-black">
        <div
          className="relative font-body overflow-hidden w-full h-full"
          style={{ containerType: "size" }}
        >
          <div className="absolute inset-0">
            <Scene18_Community />
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}
