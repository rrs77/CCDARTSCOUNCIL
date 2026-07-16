import { MotionConfig } from "framer-motion";
import { Scene17_Inspiration } from "@/promo/scenes";
import { CornerBrand } from "@/promo/_shared";

export default function PromoInspiration() {
  return (
    <MotionConfig>
      <div className="w-screen h-screen overflow-hidden relative bg-black">
        <div
          className="relative font-body overflow-hidden w-full h-full"
          style={{ containerType: "size" }}
        >
          <div className="absolute inset-0">
            <Scene17_Inspiration />
          </div>
          <CornerBrand />
        </div>
      </div>
    </MotionConfig>
  );
}
