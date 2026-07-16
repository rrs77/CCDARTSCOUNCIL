import { MotionConfig } from "framer-motion";
import { Scene16_Sequencing } from "@/promo/scenes";
import { CornerBrand } from "@/promo/_shared";

export default function PromoSequencing() {
  return (
    <MotionConfig>
      <div className="w-screen h-screen overflow-hidden relative bg-black">
        <div
          className="relative font-body overflow-hidden w-full h-full"
          style={{ containerType: "size" }}
        >
          <div className="absolute inset-0">
            <Scene16_Sequencing />
          </div>
          <CornerBrand />
        </div>
      </div>
    </MotionConfig>
  );
}
