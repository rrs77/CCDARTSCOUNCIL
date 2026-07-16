import { MotionConfig } from "framer-motion";
import { Scene21_Mobile } from "@/promo/scenes";
import { CornerBrand } from "@/promo/_shared";

export default function PromoMobile() {
  return (
    <MotionConfig>
      <div className="w-screen h-screen overflow-hidden relative bg-black">
        <div
          className="relative font-body overflow-hidden w-full h-full"
          style={{ containerType: "size" }}
        >
          <div className="absolute inset-0">
            <Scene21_Mobile />
          </div>
          <CornerBrand />
        </div>
      </div>
    </MotionConfig>
  );
}
