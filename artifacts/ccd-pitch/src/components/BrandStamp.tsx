const base = import.meta.env.BASE_URL;

export default function BrandStamp() {
  return (
    <div
      className="absolute top-[3vh] left-[2.5vw] z-[60] pointer-events-none"
      aria-hidden="true"
    >
      <img
        src={`${base}ccdesigner-logo.png`}
        alt="CCDesigner"
        crossOrigin="anonymous"
        className="h-[5vh] w-auto block drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)]"
      />
    </div>
  );
}
