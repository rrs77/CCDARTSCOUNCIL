const base = import.meta.env.BASE_URL;

export default function BrandStamp() {
  return (
    <div
      className="absolute top-[2.4vh] left-[2vw] z-[60] rounded-md bg-white/85 backdrop-blur-sm px-[0.7vw] py-[0.5vh] shadow-[0_4px_18px_rgba(0,0,0,0.18)] pointer-events-none"
      aria-hidden="true"
    >
      <img
        src={`${base}ccdesigner-logo.png`}
        alt="CCDesigner"
        crossOrigin="anonymous"
        className="h-[2.2vw] w-auto block"
      />
    </div>
  );
}
