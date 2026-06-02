import { useEffect, useState } from "react";
import { slides } from "@/slideLoader";

const SLIDE_MS = 8000;

export function PitchAutoplayViewer() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, SLIDE_MS);
    return () => window.clearInterval(id);
  }, []);

  const slide = slides[index];

  return (
    <div className="select-none bg-black">
      <div key={slide.id} className="h-screen w-screen overflow-hidden">
        <div className="h-full w-full [&_.h-screen]:!h-full [&_.w-screen]:!w-full">
          <slide.Component />
        </div>
      </div>
    </div>
  );
}
