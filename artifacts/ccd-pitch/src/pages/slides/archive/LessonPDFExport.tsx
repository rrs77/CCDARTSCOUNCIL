export default function LessonPDFExport() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-primary-dark">
      <div
        className="absolute top-0 left-0 rounded-full"
        style={{
          width: "55vw",
          height: "55vw",
          transform: "translate(-25%, -30%)",
          background:
            "radial-gradient(circle at center, rgba(20,184,166,0.22), transparent 65%)",
          filter: "blur(3vw)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "5vw 5vw",
        }}
      />

      <div className="relative z-10 h-full w-full flex flex-col px-[5vw] py-[4vh] slide-auto-enter">
        <div className="flex items-end justify-between mb-[2.4vh]">
          <div className="max-w-[60vw]">
            <span className="inline-block text-accent font-display font-semibold uppercase tracking-[0.18em] text-[0.95vw] mb-[0.8vh]">
              Feature 06 &middot; Print, project, share
            </span>
            <h2
              className="font-display font-black text-white tracking-tight leading-[1.04]"
              style={{ fontSize: "2.6vw", textWrap: "balance" }}
            >
              The same workspace — from{" "}
              <span className="text-accent">A-Level Drama</span> to{" "}
              <span className="text-accent">EYFS Reception</span>.
            </h2>
          </div>
          <div className="text-right">
            <div className="font-display font-bold text-white text-[1vw]">
              PDF &middot; A4 print-ready
            </div>
            <div className="font-body text-white/65 text-[0.8vw]">
              I-can statements &middot; clickable weblinks &middot; school header
            </div>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-[2vw] min-h-0">
          {/* ---------- A-LEVEL DRAMA ---------- */}
          <LessonCard
            accent="#7C6BF0"
            soft="#F4F1FB"
            schoolName="Coopersale Hall School"
            title="Brecht in Practice — Gestus & Verfremdung"
            meta="Year 13 · A-Level Drama (Eduqas) · Component 1 · Lesson 4 of 8"
            duration="80 min"
            term="Spring 1 · Wk 3"
            objectiveLabel="Lesson objective"
            objective="Apply Brechtian techniques (gestus, direct address, placard, song) to a 3-minute extract from Mother Courage and analyse how each device disrupts naturalistic empathy."
            iCanLabel="I can…"
            iCans={[
              "I can define gestus and demonstrate it through a single, socially-loaded gesture.",
              "I can use Verfremdung (the 'V-effekt') to break the fourth wall in performance.",
              "I can justify a directorial choice in writing using Brecht's own terminology.",
            ]}
            activities={[
              {
                tone: "warm",
                colour: "#FFB07A",
                bg: "#FFF7F0",
                titleColour: "#A24A1A",
                category: "Do Now · Gestus Gallery",
                time: "10 min",
                body:
                  "Students enter to projected stills from the Berliner Ensemble. In silence, each strikes a single 'socially loaded' gesture (the boss, the soldier, the mother). Hold for 30 seconds. Discuss: what does the body alone tell us about class and power?",
                link: "bbc.co.uk/bitesize/guides/zxqgxyc — Brecht's epic theatre",
              },
              {
                tone: "main",
                colour: "#0EA4D4",
                bg: "#F0F8FB",
                titleColour: "#0A4A66",
                category: "Main · Staging the Verfremdung extract",
                time: "40 min",
                body:
                  "Groups of four stage the recruiter scene from Mother Courage. Each version must integrate at least three Brechtian devices: placard, direct address, song interruption, half-curtain reveal. Rehearse with a stop-and-justify prompt every 8 minutes.",
                link: "nationaltheatre.org.uk/learning/brecht-resource-pack",
              },
              {
                tone: "extend",
                colour: "#FBBF24",
                bg: "#FFFBEB",
                titleColour: "#92580A",
                category: "Stretch · Director's commentary",
                time: "15 min",
                body:
                  "Each director writes a 200-word programme note in the style of Brecht's Short Organum, defending one staging decision against an imagined naturalistic critic.",
                link: "dramaonlinelibrary.com/brecht-short-organum",
              },
              {
                tone: "plenary",
                colour: "#5EEAD4",
                bg: "#ECFDF5",
                titleColour: "#0E5A4F",
                category: "Plenary · Cold-call & exam link",
                time: "15 min",
                body:
                  "Two groups perform. Cold-call three students to identify the gestus, the V-effekt moment, and the political 'invitation to think'. Map evidence onto AO2 / AO3 of the Component 1 mark scheme.",
                link: "eduqas.co.uk/qualifications/drama-as-a-level",
              },
            ]}
          />

          {/* ---------- EYFS RECEPTION ---------- */}
          <LessonCard
            accent="#9333EA"
            soft="#F4F1FB"
            schoolName="Coopersale Hall School"
            title="The Three Little Pigs — Acting Out the Story"
            meta="Reception · EYFS Drama · Storytelling Through Drama · Lesson 1 of 6"
            duration="35 min"
            term="Autumn 2 · Wk 2"
            objectiveLabel="Practitioner focus"
            objective="Children retell a familiar story through role play, using their bodies, voices and props to bring three characters to life and joining in with a repeated refrain."
            iCanLabel="I can… (child-facing)"
            iCans={[
              "I can use my big voice and my little voice to be different characters.",
              "I can act out the story with my friends and take turns.",
              "I can join in with 'I'll huff and I'll puff' at the right moment.",
              "I can show how the wolf feels using my face and my body.",
            ]}
            activities={[
              {
                tone: "warm",
                colour: "#FFB07A",
                bg: "#FFF7F0",
                titleColour: "#A24A1A",
                category: "Carpet · Story Voice Warm-Up",
                time: "6 min",
                body:
                  "On the story carpet, children practise three voices together: the squeaky pig, the stomping wolf, the calm narrator. Echo a line back in each voice. Builds vocal control before role play begins.",
                link: "bbc.co.uk/teach/school-radio/eyfs-three-little-pigs/zn6vbdm",
              },
              {
                tone: "main",
                colour: "#9333EA",
                bg: "#F4F1FB",
                titleColour: "#5B21B6",
                category: "Main · Acting Out the Story (small groups)",
                time: "18 min",
                body:
                  "Four corners of the hall become straw, sticks, brick and the wolf's path. Children move between zones in groups of four (3 pigs + 1 wolf), swapping roles after each refrain. Adults model gesture and facial expression at each new house.",
                link: "earlyyears.education/drama-three-little-pigs-zones",
              },
              {
                tone: "language",
                colour: "#0EA4D4",
                bg: "#F0F8FB",
                titleColour: "#0A4A66",
                category: "Language · Repeated Refrain Together",
                time: "6 min",
                body:
                  "Whole class chants 'Little pig, little pig, let me come in!' / 'Not by the hair of my chinny-chin-chin!' Add a clap on each beat. Encourages turn-taking and confident speaking in role.",
                link: "literacyshed.com/the-three-little-pigs.html",
              },
              {
                tone: "plenary",
                colour: "#5EEAD4",
                bg: "#ECFDF5",
                titleColour: "#0E5A4F",
                category: "Plenary · 'How did the wolf feel?'",
                time: "5 min",
                body:
                  "Sit in a circle. Each child shows the wolf's face at the start, the middle, and the end of the story. Practitioner notes which children used facial expression to communicate feeling — evidence for the EAD profile.",
                link: "foundationyears.org.uk/eyfs-statutory-framework",
              },
            ]}
            pinned={{
              label: "Linked EYFS objectives",
              chips: [
                "RD-EAD-3 · Acts out familiar stories using words, actions and props.",
                "RD-CL-2 · Speaks in role, using different voices for characters.",
                "RD-PSED-1 · Takes turns and shares space during drama activities.",
              ],
            }}
          />
        </div>
      </div>
    </div>
  );
}

type Activity = {
  tone: string;
  colour: string;
  bg: string;
  titleColour: string;
  category: string;
  time: string;
  body: string;
  link?: string;
};

type Pinned = {
  label: string;
  chips: string[];
};

function LessonCard(props: {
  accent: string;
  soft: string;
  schoolName: string;
  title: string;
  meta: string;
  duration: string;
  term: string;
  objectiveLabel: string;
  objective: string;
  iCanLabel: string;
  iCans: string[];
  activities: Activity[];
  pinned?: Pinned;
}) {
  return (
    <div
      className="h-full w-full rounded-[0.6rem] bg-white shadow-[0_30px_70px_rgba(0,0,0,0.45)] p-[1.6vh_1.4vw] flex flex-col"
      style={{ minHeight: 0 }}
    >
      {/* Header */}
      <div
        className="flex items-start justify-between pb-[0.8vh] border-b-2"
        style={{ borderColor: props.accent }}
      >
        <div className="min-w-0 pr-[0.6vw]">
          <div
            className="font-display font-bold text-[0.8vw] uppercase tracking-wide truncate"
            style={{ color: props.accent }}
          >
            {props.schoolName}
          </div>
          <div className="font-display font-black text-[#0f2a2e] text-[1.15vw] leading-tight mt-[0.2vh]">
            {props.title}
          </div>
          <div className="font-body text-[#6b7d80] text-[0.7vw] mt-[0.15vh]">
            {props.meta}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-display font-bold text-[#0f2a2e] text-[0.78vw]">
            {props.duration}
          </div>
          <div className="font-body text-[#6b7d80] text-[0.65vw]">
            {props.term}
          </div>
        </div>
      </div>

      {/* Objective + I can */}
      <div className="mt-[1vh] grid grid-cols-5 gap-[0.7vw]">
        <div className="col-span-3">
          <div className="font-display font-bold text-[#0f2a2e] text-[0.7vw] uppercase tracking-wide">
            {props.objectiveLabel}
          </div>
          <div className="font-body text-[#0f2a2e] text-[0.72vw] leading-snug mt-[0.2vh]">
            {props.objective}
          </div>
        </div>
        <div
          className="col-span-2 rounded-[0.4rem] p-[0.6vh_0.55vw]"
          style={{ background: props.soft }}
        >
          <div
            className="font-display font-bold text-[0.65vw] uppercase tracking-wide"
            style={{ color: props.accent }}
          >
            {props.iCanLabel}
          </div>
          <ul className="mt-[0.2vh] space-y-[0.15vh]">
            {props.iCans.map((s, i) => (
              <li
                key={i}
                className="font-body text-[#0f2a2e] text-[0.66vw] leading-snug flex gap-[0.3vw]"
              >
                <span style={{ color: props.accent }}>✓</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Activities */}
      <div className="mt-[0.9vh] flex-1 flex flex-col gap-[0.5vh] min-h-0">
        {props.activities.map((a, i) => (
          <div
            key={i}
            className="rounded-[0.4rem] p-[0.55vh_0.65vw]"
            style={{
              background: a.bg,
              borderLeft: `0.35vw solid ${a.colour}`,
            }}
          >
            <div className="flex items-start justify-between">
              <div
                className="font-display font-bold text-[0.74vw]"
                style={{ color: a.titleColour }}
              >
                {a.category}
              </div>
              <div
                className="font-body text-[0.62vw] shrink-0 ml-[0.4vw]"
                style={{ color: a.titleColour, opacity: 0.75 }}
              >
                {a.time}
              </div>
            </div>
            <div className="font-body text-[#0f2a2e] text-[0.66vw] leading-snug mt-[0.2vh]">
              {a.body}
            </div>
            {a.link && (
              <div className="font-body text-[0.6vw] mt-[0.2vh] text-[#008272] flex items-start gap-[0.25vw]">
                <span>↗</span>
                <span className="truncate">{a.link}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pinned objectives footer (EYFS card) */}
      {props.pinned && (
        <div className="mt-[0.7vh] pt-[0.6vh] border-t border-[#0f2a2e]/10">
          <div
            className="font-display font-bold text-[0.62vw] uppercase tracking-wide mb-[0.25vh]"
            style={{ color: props.accent }}
          >
            {props.pinned.label}
          </div>
          <div className="flex flex-wrap gap-[0.3vw]">
            {props.pinned.chips.map((c, i) => (
              <span
                key={i}
                className="rounded-full px-[0.5vw] py-[0.15vh] font-body text-[0.6vw]"
                style={{
                  background: props.soft,
                  color: "#0f2a2e",
                  border: `1px solid ${props.accent}33`,
                }}
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-[0.7vh] pt-[0.5vh] border-t border-[#0f2a2e]/10 flex items-center justify-between">
        <span className="font-body text-[#6b7d80] text-[0.6vw]">
          Created in Creative Curriculum Designer
        </span>
        <span className="font-body text-[#6b7d80] text-[0.6vw]">Page 1 of 1</span>
      </div>
    </div>
  );
}
