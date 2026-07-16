import { MotionConfig } from "framer-motion";
import { Scene07_ArtsFocus } from "@/promo/scenes";
import { CornerBrand } from "@/promo/_shared";

export default function PromoArtsFocus() {
  return (
    <MotionConfig>
      <div className="w-screen h-screen overflow-hidden relative bg-black">
        <div
          className="relative font-body overflow-hidden w-full h-full"
          style={{ containerType: "size" }}
        >
          <div className="absolute inset-0">
            <Scene07_ArtsFocus />
          </div>
          <CornerBrand />
        </div>
      </div>
    </MotionConfig>
  );
}
