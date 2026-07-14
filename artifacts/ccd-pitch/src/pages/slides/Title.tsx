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

      <div className="relative z-10 flex h-full w-full flex-col justify-between px-[7vw] py-[6vh]">
        <div
          className="flex items-center gap-[1.2vw] slide-fade-up"
          style={{ ['--slide-stagger' as string]: '0ms' }}
        >
          <img
            src={`${base}cd-logo.svg`}
            crossOrigin="anonymous"
            alt="CCD logo"
            className="h-[4.2vw] w-[4.2vw]"
          />
          <span className="font-display text-[1.6vw] font-semibold tracking-tight text-white">
            Creative Curriculum Designer
          </span>
        </div>

        <div className="max-w-[72vw]">
          <span
            className="mb-[3vh] inline-block rounded-full border border-white/30 bg-white/15 px-[1.2vw] py-[0.7vh] text-[1.05vw] font-medium uppercase tracking-wide text-white backdrop-blur-sm slide-fade-up"
            style={{ ['--slide-stagger' as string]: '120ms' }}
          >
            Drama · Music · Dance · EYFS to A-level
          </span>

          <h1
            className="slide-fade-up font-semibold leading-[1.08] tracking-tight text-white"
            style={{
              fontSize: '5.4vw',
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
            className="mt-[3vh] max-w-[54vw] font-body text-[1.65vw] font-medium leading-snug text-white/90 slide-fade-up"
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
          <span className="font-body text-[1.05vw] uppercase tracking-wide">
            For schools &amp; teachers · EYFS to A-level
          </span>
          <span className="font-body text-[1.05vw] tracking-wide">creativecurriculumdesigner.com</span>
        </div>
      </div>
    </div>
  );
}
