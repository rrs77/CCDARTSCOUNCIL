const base = import.meta.env.BASE_URL;

export default function Title() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#002D24]">
      <img
        src={`${base}performing-arts-hero.jpg`}
        crossOrigin="anonymous"
        alt="Young dancers rehearsing on stage"
        className="absolute inset-0 h-full w-full object-cover object-center opacity-45"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#002D24]/92 via-[#002D24]/78 to-[#002D24]/55" />
      <div
        className="absolute -top-[18vh] -left-[8vw] rounded-full"
        style={{
          width: '48vw',
          height: '48vw',
          background: 'radial-gradient(circle at center, rgba(182,255,126,0.14), transparent 68%)',
          filter: 'blur(3vw)',
        }}
      />

      <div className="relative z-10 flex h-full w-full flex-col justify-between px-[5.74vw] py-[5.3vh]">
        <div
          className="flex items-center gap-[0.98vw] slide-fade-up"
          style={{ ['--slide-stagger' as string]: '0ms' }}
        >
          <img
            src={`${base}cd-logo.svg`}
            crossOrigin="anonymous"
            alt="CCD logo"
            className="h-[3.44vw] w-[3.44vw]"
          />
          <span className="font-display text-[1.31vw] font-semibold tracking-tight text-white">
            Creative Curriculum Designer
          </span>
        </div>

        <div className="max-w-[48.41vw]">
          <span
            className="mb-[2.6vh] inline-block rounded-full border border-white/30 bg-white/15 px-[0.98vw] py-[0.6vh] text-[0.86vw] font-medium uppercase tracking-wide text-white backdrop-blur-sm slide-fade-up"
            style={{ ['--slide-stagger' as string]: '120ms' }}
          >
            Drama · Music · Dance · EYFS to A-level
          </span>

          <h1
            className="slide-fade-up font-semibold leading-[1.08] tracking-tight text-white"
            style={{
              fontSize: "4.43vw",
              textWrap: 'balance',
              fontFamily: 'Inter, system-ui, sans-serif',
              ['--slide-stagger' as string]: '220ms',
            }}
          >
            Exceptional lessons start with{' '}
            <span
              className="italic font-normal"
              style={{ color: '#B6FF7E', fontFamily: '"Playfair Display", Georgia, serif' }}
            >
              connection
            </span>
          </h1>

          <p
            className="mt-[2.6vh] max-w-[36.31vw] font-body text-[1.35vw] font-medium leading-snug text-white/90 slide-fade-up"
            style={{ textWrap: 'pretty', ['--slide-stagger' as string]: '380ms' }}
          >
            A living repository of lessons and activities — and a quick way for children to capture
            the hidden gems that spark the next great idea.
          </p>
        </div>

        <div
          className="flex items-end justify-between text-white/85 slide-fade-up"
          style={{ ['--slide-stagger' as string]: '520ms' }}
        >
          <span className="font-body text-[0.86vw] uppercase tracking-wide">
            For schools &amp; teachers · EYFS to A-level
          </span>
          <span className="font-body text-[0.86vw] tracking-wide">creativecurriculumdesigner.com</span>
        </div>
      </div>
    </div>
  );
}
