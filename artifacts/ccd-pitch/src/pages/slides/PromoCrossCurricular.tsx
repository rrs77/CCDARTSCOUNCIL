import { MotionConfig } from "framer-motion";
import { Scene13_CrossCurricular } from "@/promo/scenes";

export default function PromoCrossCurricular() {
  return (
    <MotionConfig>
      <div className="w-screen h-screen overflow-hidden relative bg-black">
        <div
          className="relative font-body overflow-hidden w-full h-full"
          style={{ containerType: "size" }}
        >
          <div className="absolute inset-0">
            <Scene13_CrossCurricular />
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}
