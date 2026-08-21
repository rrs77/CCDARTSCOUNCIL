import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ALEVEL_INDEX_2024_26,
  DFE_DISADVANTAGE_WITH_ENTRIES,
  FUNDING_STREAMS,
  GCSE_INDEX_2024_26,
  HE_SUBJECT_CHANGE,
  LONG_TERM_CONTRACTION,
  PRIMARY_HOURS,
  SCHOOLS_NO_GCSE_2223,
} from "@/data/stats";

const tip = {
  background: "#fff",
  border: "1px solid #d7e0db",
  borderRadius: 8,
  fontSize: 12,
  color: "#1a1f1c",
};

function ChartFrame({
  caption,
  source,
  children,
}: {
  caption: string;
  source: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="chart-caption">{caption}</p>
      {children}
      <p className="source-note">{source}</p>
    </div>
  );
}

/** Chart 1 — horizontal bars left of zero */
export function ChartLongTerm({
  onSelect,
}: {
  onSelect?: (label: string) => void;
}) {
  const data = LONG_TERM_CONTRACTION.map((d) => ({
    name: d.label,
    change: d.change,
    fill: d.color,
    baseline: d.baseline,
  }));

  return (
    <ChartFrame
      caption="Long-term contraction in arts education"
      source="Baselines: GCSE 2010; A level 2010/11; teaching hours 2011/12; teacher headcount reported by CLA against 2010. End point 2022/23. Source: CLA Report Card 2024."
    >
      <motion.div
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="h-[240px] w-full sm:h-[260px]"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 4, right: 36, left: 8, bottom: 8 }}
          >
            <CartesianGrid stroke="#e8eeea" horizontal={false} />
            <XAxis
              type="number"
              domain={[-50, 0]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fill: "#5c6b66", fontSize: 11 }}
              label={{ value: "Percentage change", position: "insideBottom", offset: -2, fill: "#5c6b66", fontSize: 11 }}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={120}
              tick={{ fill: "#1a1f1c", fontSize: 11 }}
            />
            <Tooltip
              contentStyle={tip}
              formatter={(v: number, _n, p) => [
                `${v}% (baseline ${String((p?.payload as { baseline?: string })?.baseline ?? "")})`,
                "Change",
              ]}
            />
            <ReferenceLine x={0} stroke="#94a3b8" />
            <Bar
              dataKey="change"
              radius={[6, 0, 0, 6]}
              label={{ position: "left", fill: "#1a1f1c", fontSize: 12, fontWeight: 700 }}
              cursor="pointer"
              onClick={(entry) => {
                const name = (entry as { name?: string })?.name;
                if (name) onSelect?.(name);
              }}
            >
              {data.map((d) => (
                <Cell key={d.name} fill={d.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </ChartFrame>
  );
}

/** Chart 2 — double doughnut */
export function ChartPrimaryHours({
  onSelect,
}: {
  onSelect?: (which: "independent" | "state") => void;
}) {
  const independent = [
    { name: "Independent primary teachers", value: PRIMARY_HOURS.independentOver2_5, fill: "#7B6B9C" },
    { name: "Other", value: 100 - PRIMARY_HOURS.independentOver2_5, fill: "rgba(123,107,156,0.15)" },
  ];
  const state = [
    { name: "State primary teachers", value: PRIMARY_HOURS.stateOver2_5, fill: "#2A9D8F" },
    { name: "Other", value: 100 - PRIMARY_HOURS.stateOver2_5, fill: "rgba(42,157,143,0.15)" },
  ];

  return (
    <ChartFrame
      caption="Primary teachers reporting more than 2.5 hours of arts per week"
      source="Teacher Tapp survey reported in CLA Report Card 2026. These are teacher-reported survey results, not a census of schools."
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative mx-auto h-[250px] w-full max-w-[320px]"
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={independent}
              dataKey="value"
              innerRadius={78}
              outerRadius={98}
              startAngle={90}
              endAngle={-270}
              cursor="pointer"
              onClick={() => onSelect?.("independent")}
            >
              {independent.map((d) => (
                <Cell key={d.name} fill={d.fill} />
              ))}
            </Pie>
            <Pie
              data={state}
              dataKey="value"
              innerRadius={48}
              outerRadius={68}
              startAngle={90}
              endAngle={-270}
              cursor="pointer"
              onClick={() => onSelect?.("state")}
            >
              {state.map((d) => (
                <Cell key={d.name} fill={d.fill} />
              ))}
            </Pie>
            <Legend verticalAlign="bottom" height={36} />
            <Tooltip contentStyle={tip} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-10">
          <span className="display text-2xl leading-none" style={{ color: "#7B6B9C" }}>
            {PRIMARY_HOURS.independentOver2_5}%
          </span>
          <span className="display mt-1 text-2xl leading-none" style={{ color: "#2A9D8F" }}>
            {PRIMARY_HOURS.stateOver2_5}%
          </span>
        </div>
        <div className="mt-1 flex flex-wrap justify-center gap-3 text-xs text-[#33443e]">
          <span>
            <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "#7B6B9C" }} />
            Independent primary teachers
          </span>
          <span>
            <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "#2A9D8F" }} />
            State primary teachers
          </span>
        </div>
      </motion.div>
    </ChartFrame>
  );
}

/** Chart 3 — grouped bars disadvantage */
export function ChartDisadvantage({
  onSelect,
}: {
  onSelect?: (subject: string) => void;
}) {
  const data = DFE_DISADVANTAGE_WITH_ENTRIES.map((d) => ({
    subject: d.subject,
    least: d.least,
    most: d.most,
  }));

  return (
    <ChartFrame
      caption="Access to arts qualifications differs by disadvantage"
      source="GCSE entries for Art & Design, Dance, Music and Speech & Drama (Table 19). *Photography is any exam entry by subject discount group (Table 18), not GCSE-only. DfE Curriculum & Assessment Review analytical annex, 2024/25."
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-[280px] w-full sm:h-[300px]"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 18, right: 8, left: 0, bottom: 8 }}>
            <CartesianGrid stroke="#e8eeea" vertical={false} />
            <XAxis dataKey="subject" tick={{ fill: "#1a1f1c", fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={50} />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: "#5c6b66", fontSize: 11 }}
              label={{ value: "% of state-funded mainstream schools", angle: -90, position: "insideLeft", fill: "#5c6b66", fontSize: 10 }}
            />
            <Tooltip contentStyle={tip} />
            <Legend />
            <Bar
              dataKey="least"
              name="Least disadvantaged fifth"
              fill="#5B7C99"
              radius={[4, 4, 0, 0]}
              label={{ position: "top", fontSize: 10, fill: "#1a1f1c" }}
              cursor="pointer"
              onClick={(e) => onSelect?.((e as { subject?: string }).subject ?? "")}
            />
            <Bar
              dataKey="most"
              name="Most disadvantaged fifth"
              fill="#E97451"
              radius={[4, 4, 0, 0]}
              label={{ position: "top", fontSize: 10, fill: "#1a1f1c" }}
              cursor="pointer"
              onClick={(e) => onSelect?.((e as { subject?: string }).subject ?? "")}
            />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </ChartFrame>
  );
}

/** Chart 4 — lollipop no GCSE entries */
export function ChartNoGcse({
  onSelect,
}: {
  onSelect?: (subject: string) => void;
}) {
  return (
    <ChartFrame
      caption="Schools with no GCSE entries, 2022/23"
      source='Source: Cultural Learning Alliance Report Card 2024. “No GCSE entries” does not mean “subject not taught”.'
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="h-[220px] w-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={[...SCHOOLS_NO_GCSE_2223]}
            margin={{ top: 8, right: 48, left: 8, bottom: 8 }}
          >
            <CartesianGrid stroke="#e8eeea" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}`} tick={{ fill: "#5c6b66", fontSize: 11 }} label={{ value: "% of schools", position: "insideBottom", offset: -2, fill: "#5c6b66", fontSize: 11 }} />
            <YAxis type="category" dataKey="subject" width={70} tick={{ fill: "#1a1f1c", fontSize: 12 }} />
            <Tooltip contentStyle={tip} formatter={(v: number) => [`${v}%`, "No GCSE entries"]} />
            <Legend />
            <Bar
              dataKey="none"
              barSize={10}
              background={{ fill: "#e8eeea" }}
              radius={[0, 99, 99, 0]}
              label={{ position: "right", fill: "#1a1f1c", fontSize: 13, fontWeight: 700 }}
              cursor="pointer"
              onClick={(e) => onSelect?.((e as { subject?: string }).subject ?? "")}
            >
              {SCHOOLS_NO_GCSE_2223.map((d) => (
                <Cell key={d.subject} fill={d.color} name={d.subject} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </ChartFrame>
  );
}

/** Chart 5 — indexed GCSE lines */
export function ChartGcseIndex({
  onSelect,
}: {
  onSelect?: (series: string) => void;
}) {
  const [active, setActive] = useState<string | null>(null);
  const data = useMemo(() => [...GCSE_INDEX_2024_26], []);

  return (
    <ChartFrame
      caption="Recent GCSE entry movement: 2024–2026"
      source="Index uses Ofqual provisional entry counts with 2024=100 so subjects of different sizes can be compared visually. Underlying counts (2024 / 2025 / 2026): Art 197,500 / 194,190 / 199,435; Drama 49,410 / 48,650 / 48,220; Music 32,615 / 34,555 / 34,120; Performing/Expressive Arts 6,675 / 7,175 / 7,265."
    >
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
            <CartesianGrid stroke="#e8eeea" />
            <XAxis dataKey="year" tick={{ fill: "#1a1f1c", fontSize: 12 }} />
            <YAxis
              domain={[94, 112]}
              tick={{ fill: "#5c6b66", fontSize: 11 }}
              label={{ value: "Index (2024 = 100)", angle: -90, position: "insideLeft", fill: "#5c6b66", fontSize: 11 }}
            />
            <ReferenceLine y={100} stroke="#94a3b8" strokeDasharray="4 4" />
            <Tooltip contentStyle={tip} />
            <Legend
              onClick={(e) => {
                const key = String(e.dataKey);
                setActive(key);
                onSelect?.(key);
              }}
            />
            <Line type="monotone" dataKey="art" name="Art & Design" stroke="#5B7C99" strokeWidth={active && active !== "art" ? 1.5 : 2.75} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="drama" name="Drama" stroke="#7B6B9C" strokeWidth={active && active !== "drama" ? 1.5 : 2.75} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="music" name="Music" stroke="#2A9D8F" strokeWidth={active && active !== "music" ? 1.5 : 2.75} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="performing" name="Performing / Expressive Arts" stroke="#E97451" strokeWidth={active && active !== "performing" ? 1.5 : 2.75} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
    </ChartFrame>
  );
}

/** Chart 6 — A-level indexed */
export function ChartAlevelIndex({
  onSelect,
}: {
  onSelect?: (series: string) => void;
}) {
  return (
    <ChartFrame
      caption="Recent A-level entry movement: 2024–2026"
      source="Index uses Ofqual provisional entry counts. Underlying counts (2024 / 2025 / 2026): Art & Design 40,965 / 40,400 / 40,015; Drama 7,895 / 7,410 / 6,710; Music 5,005 / 4,875 / 4,635. Recent change 2025→2026: Drama −9.5%; Music −4.9%; Art & Design −1.0%."
    >
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={[...ALEVEL_INDEX_2024_26]} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
            <CartesianGrid stroke="#e8eeea" />
            <XAxis dataKey="year" tick={{ fill: "#1a1f1c", fontSize: 12 }} />
            <YAxis
              domain={[82.5, 100]}
              tick={{ fill: "#5c6b66", fontSize: 11 }}
              label={{ value: "Index (2024 = 100)", angle: -90, position: "insideLeft", fill: "#5c6b66", fontSize: 11 }}
            />
            <ReferenceLine y={100} stroke="#94a3b8" strokeDasharray="4 4" />
            <Tooltip contentStyle={tip} />
            <Legend onClick={(e) => onSelect?.(String(e.dataKey))} />
            <Line type="monotone" dataKey="art" name="Art & Design" stroke="#5B7C99" strokeWidth={2.75} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="music" name="Music" stroke="#2A9D8F" strokeWidth={2.75} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="drama" name="Drama" stroke="#7B6B9C" strokeWidth={2.75} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
    </ChartFrame>
  );
}

/** Chart 7 — HE divergent bars */
export function ChartHe({
  onSelect,
}: {
  onSelect?: (subject: string) => void;
}) {
  return (
    <ChartFrame
      caption="Higher education: change within Creative Arts & Design"
      source="Domestic undergraduate student numbers. HESA 2024/25 as analysed in CLA Report Card 2026 Detailed Analysis."
    >
      <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={[...HE_SUBJECT_CHANGE]}
            margin={{ top: 8, right: 36, left: 8, bottom: 8 }}
          >
            <CartesianGrid stroke="#e8eeea" horizontal={false} />
            <XAxis
              type="number"
              domain={[-3.5, 2.5]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fill: "#5c6b66", fontSize: 11 }}
              label={{ value: "% change, 2023/24 to 2024/25", position: "insideBottom", offset: -2, fill: "#5c6b66", fontSize: 11 }}
            />
            <YAxis type="category" dataKey="subject" width={150} tick={{ fill: "#1a1f1c", fontSize: 10 }} />
            <ReferenceLine x={0} stroke="#94a3b8" />
            <Tooltip contentStyle={tip} formatter={(v: number) => [`${v}%`, "Change"]} />
            <Legend
              payload={[
                { value: "Decrease", type: "square", color: "#E97451" },
                { value: "Increase", type: "square", color: "#2A9D8F" },
              ]}
            />
            <Bar
              dataKey="change"
              radius={[4, 4, 4, 4]}
              label={{ position: "right", fill: "#1a1f1c", fontSize: 11, fontWeight: 700 }}
              cursor="pointer"
              onClick={(e) => onSelect?.((e as { subject?: string }).subject ?? "")}
            >
              {HE_SUBJECT_CHANGE.map((d) => (
                <Cell key={d.subject} fill={d.change >= 0 ? "#2A9D8F" : "#E97451"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </ChartFrame>
  );
}

/** Chart 8 — funding streams (non-additive) */
export function ChartFunding({
  onSelect,
}: {
  onSelect?: (label: string) => void;
}) {
  return (
    <ChartFrame
      caption="Current national commitments: different funding purposes"
      source="Not additive like-for-like funding: £76m is annual Music Hubs backing; £25m is additional capital; National Centre is backed by up to £13m over 3 years. Source: DCMS/DfE, Turn It Up, July 2026."
    >
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={[...FUNDING_STREAMS]} margin={{ top: 24, right: 8, left: 0, bottom: 48 }}>
            <CartesianGrid stroke="#e8eeea" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "#1a1f1c", fontSize: 10 }}
              interval={0}
              angle={-12}
              textAnchor="end"
              height={60}
            />
            <YAxis
              domain={[0, 80]}
              tick={{ fill: "#5c6b66", fontSize: 11 }}
              label={{ value: "£ million", angle: -90, position: "insideLeft", fill: "#5c6b66", fontSize: 11 }}
            />
            <Tooltip
              contentStyle={tip}
              formatter={(v: number, _n, p) => [
                `£${v}m`,
                String((p?.payload as { kind?: string })?.kind ?? "Funding"),
              ]}
            />
            <Legend
              payload={[
                { value: "Annual revenue backing", type: "square", color: "#2A9D8F" },
                { value: "Additional capital investment", type: "square", color: "#C9A227" },
                { value: "Centre contract support", type: "square", color: "#7B6B9C" },
              ]}
            />
            <Bar
              dataKey="value"
              radius={[6, 6, 0, 0]}
              label={{ position: "top", formatter: (v: number) => `£${v}m`, fill: "#1a1f1c", fontWeight: 700 }}
              cursor="pointer"
              onClick={(e) => onSelect?.((e as { label?: string }).label ?? "")}
            >
              {FUNDING_STREAMS.map((d) => (
                <Cell key={d.label} fill={d.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </ChartFrame>
  );
}
