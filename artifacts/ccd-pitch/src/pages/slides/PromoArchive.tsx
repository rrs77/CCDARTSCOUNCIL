import { MotionConfig } from "framer-motion";
import { Scene04_Archive } from "@/promo/scenes";
import { CornerBrand } from "@/promo/_shared";

export default function PromoArchive() {
  return (
    <MotionConfig>
      <div className="w-screen h-screen overflow-hidden relative bg-black">
        <div
          className="relative font-body overflow-hidden w-full h-full"
          style={{ containerType: "size" }}
        >
          <div className="absolute inset-0">
            <Scene04_Archive />
          </div>
          <CornerBrand />
        </div>
      </div>
    </MotionConfig>
  );
}
