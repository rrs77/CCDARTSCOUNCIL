import { motion } from "framer-motion";
import { useState } from "react";
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
import type { ChartDef } from "@/content/facts.content";

const tip = {
  background: "#fffaf7",
  border: "1px solid #d7e0db",
  borderRadius: 8,
  fontSize: 12,
  color: "#0f2a2e",
};

function ChartFrame({
  caption,
  source,
  contentKey,
  showKeys,
  children,
}: {
  caption: string;
  source: string;
  contentKey?: string;
  showKeys?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="chart-caption">
        {caption}
        {showKeys && contentKey ? <span className="edit-key"> charts.{contentKey}</span> : null}
      </p>
      {children}
      <p className="source-note">{source}</p>
    </div>
  );
}

const enter = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: [0.22, 0.61, 0.36, 1] as const },
};

export function ContentChart({
  chart,
  showKeys,
  onDrill,
}: {
  chart: ChartDef;
  showKeys?: boolean;
  onDrill?: (label: string) => void;
}) {
  const [active, setActive] = useState<string | null>(null);

  if (chart.type === "horizontal-change") {
    return (
      <ChartFrame caption={chart.caption} source={chart.sourceNote} contentKey={chart.id} showKeys={showKeys}>
        <motion.div {...enter} className="h-[240px] w-full sm:h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={chart.series} margin={{ top: 4, right: 36, left: 8, bottom: 8 }}>
              <CartesianGrid stroke="#e8eeea" horizontal={false} />
              <XAxis type="number" domain={[-50, 0]} tickFormatter={(v) => `${v}%`} tick={{ fill: "#6b7d80", fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={120} tick={{ fill: "#0f2a2e", fontSize: 11 }} />
              <Tooltip contentStyle={tip} formatter={(v: number) => [`${v}%`, "Change"]} />
              <ReferenceLine x={0} stroke="#94a3b8" />
              <Bar
                dataKey="change"
                radius={[6, 0, 0, 6]}
                label={{ position: "left", fill: "#0f2a2e", fontSize: 12, fontWeight: 700 }}
                cursor="pointer"
                onClick={(e) => onDrill?.(String((e as { name?: string }).name ?? ""))}
              >
                {chart.series.map((d) => (
                  <Cell key={String(d.name)} fill={String(d.fill)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </ChartFrame>
    );
  }

  if (chart.type === "double-doughnut") {
    const independent = Number(chart.series[0]?.value ?? 0);
    const state = Number(chart.series[1]?.value ?? 0);
    const indepLabel = chart.axis?.legend?.independent ?? "Independent primary teachers";
    const stateLabel = chart.axis?.legend?.state ?? "State primary teachers";
    const outer = [
      { name: indepLabel, value: independent, fill: "#7B6B9C" },
      { name: "rest", value: 100 - independent, fill: "rgba(123,107,156,0.15)" },
    ];
    const inner = [
      { name: stateLabel, value: state, fill: "#2A9D8F" },
      { name: "rest2", value: 100 - state, fill: "rgba(42,157,143,0.15)" },
    ];
    return (
      <ChartFrame caption={chart.caption} source={chart.sourceNote} contentKey={chart.id} showKeys={showKeys}>
        <motion.div {...enter} className="relative mx-auto h-[250px] w-full max-w-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={outer} dataKey="value" innerRadius={78} outerRadius={98} startAngle={90} endAngle={-270} cursor="pointer" onClick={() => onDrill?.(indepLabel)}>
                {outer.map((d) => (
                  <Cell key={d.name} fill={d.fill} />
                ))}
              </Pie>
              <Pie data={inner} dataKey="value" innerRadius={48} outerRadius={68} startAngle={90} endAngle={-270} cursor="pointer" onClick={() => onDrill?.(stateLabel)}>
                {inner.map((d) => (
                  <Cell key={d.name} fill={d.fill} />
                ))}
              </Pie>
              <Tooltip contentStyle={tip} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-10">
            <span className="display text-2xl leading-none" style={{ color: "#7B6B9C" }}>
              {independent}%
            </span>
            <span className="display mt-1 text-2xl leading-none" style={{ color: "#2A9D8F" }}>
              {state}%
            </span>
          </div>
        </motion.div>
        <div className="mt-1 flex flex-wrap justify-center gap-3 text-xs text-[#33443e]">
          <span>
            <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "#7B6B9C" }} />
            {indepLabel}
          </span>
          <span>
            <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "#2A9D8F" }} />
            {stateLabel}
          </span>
        </div>
      </ChartFrame>
    );
  }

  if (chart.type === "grouped-bars") {
    const leastName = chart.axis?.legend?.least ?? "Least disadvantaged fifth";
    const mostName = chart.axis?.legend?.most ?? "Most disadvantaged fifth";
    return (
      <ChartFrame caption={chart.caption} source={chart.sourceNote} contentKey={chart.id} showKeys={showKeys}>
        <motion.div {...enter} className="h-[280px] w-full sm:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart.series} margin={{ top: 18, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid stroke="#e8eeea" vertical={false} />
              <XAxis dataKey="subject" tick={{ fill: "#0f2a2e", fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={50} />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: "#6b7d80", fontSize: 11 }}
                label={
                  chart.axis?.y
                    ? { value: chart.axis.y, angle: -90, position: "insideLeft", fill: "#6b7d80", fontSize: 10 }
                    : undefined
                }
              />
              <Tooltip contentStyle={tip} />
              <Legend />
              <Bar dataKey="least" name={leastName} fill="#5B7C99" radius={[4, 4, 0, 0]} label={{ position: "top", fontSize: 10, fill: "#0f2a2e" }} cursor="pointer" onClick={(e) => onDrill?.(String((e as { subject?: string }).subject ?? ""))} />
              <Bar dataKey="most" name={mostName} fill="#E97451" radius={[4, 4, 0, 0]} label={{ position: "top", fontSize: 10, fill: "#0f2a2e" }} cursor="pointer" onClick={(e) => onDrill?.(String((e as { subject?: string }).subject ?? ""))} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </ChartFrame>
    );
  }

  if (chart.type === "lollipop") {
    return (
      <ChartFrame caption={chart.caption} source={chart.sourceNote} contentKey={chart.id} showKeys={showKeys}>
        <motion.div {...enter} className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={chart.series} margin={{ top: 8, right: 48, left: 8, bottom: 8 }}>
              <CartesianGrid stroke="#e8eeea" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: "#6b7d80", fontSize: 11 }} />
              <YAxis type="category" dataKey="subject" width={70} tick={{ fill: "#0f2a2e", fontSize: 12 }} />
              <Tooltip contentStyle={tip} formatter={(v: number) => [`${v}%`, "No GCSE entries"]} />
              <Bar dataKey="none" barSize={10} background={{ fill: "#e8eeea" }} radius={[0, 99, 99, 0]} label={{ position: "right", fill: "#0f2a2e", fontSize: 13, fontWeight: 700 }} cursor="pointer" onClick={(e) => onDrill?.(String((e as { subject?: string }).subject ?? ""))}>
                {chart.series.map((d) => (
                  <Cell key={String(d.subject)} fill={String(d.fill)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </ChartFrame>
    );
  }

  if (chart.type === "indexed-line") {
    const isAlevel = chart.meta?.mode === "alevel";
    const yMin = Number(chart.meta?.yMin ?? 94);
    const yMax = Number(chart.meta?.yMax ?? 112);
    return (
      <ChartFrame caption={chart.caption} source={chart.sourceNote} contentKey={chart.id} showKeys={showKeys}>
        <motion.div {...enter} className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chart.series} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
              <CartesianGrid stroke="#e8eeea" />
              <XAxis dataKey="year" tick={{ fill: "#0f2a2e", fontSize: 12 }} />
              <YAxis domain={[yMin, yMax]} tick={{ fill: "#6b7d80", fontSize: 11 }} />
              <ReferenceLine y={100} stroke="#94a3b8" strokeDasharray="4 4" />
              <Tooltip contentStyle={tip} />
              <Legend
                onClick={(e) => {
                  setActive(String(e.dataKey));
                  onDrill?.(String(e.value ?? e.dataKey));
                }}
              />
              <Line type="monotone" dataKey="art" name={chart.axis?.series?.art ?? "Art & Design"} stroke="#5B7C99" strokeWidth={active && active !== "art" ? 1.5 : 2.75} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="drama" name={chart.axis?.series?.drama ?? "Drama"} stroke="#7B6B9C" strokeWidth={active && active !== "drama" ? 1.5 : 2.75} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="music" name={chart.axis?.series?.music ?? "Music"} stroke="#2A9D8F" strokeWidth={active && active !== "music" ? 1.5 : 2.75} dot={{ r: 4 }} />
              {!isAlevel ? (
                <Line type="monotone" dataKey="performing" name={chart.axis?.series?.performing ?? "Performing / Expressive Arts"} stroke="#E97451" strokeWidth={active && active !== "performing" ? 1.5 : 2.75} dot={{ r: 4 }} />
              ) : null}
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </ChartFrame>
    );
  }

  if (chart.type === "divergent-bars") {
    return (
      <ChartFrame caption={chart.caption} source={chart.sourceNote} contentKey={chart.id} showKeys={showKeys}>
        <motion.div {...enter} className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={chart.series} margin={{ top: 8, right: 36, left: 8, bottom: 8 }}>
              <CartesianGrid stroke="#e8eeea" horizontal={false} />
              <XAxis type="number" domain={[-3.5, 2.5]} tickFormatter={(v) => `${v}%`} tick={{ fill: "#6b7d80", fontSize: 11 }} />
              <YAxis type="category" dataKey="subject" width={150} tick={{ fill: "#0f2a2e", fontSize: 10 }} />
              <ReferenceLine x={0} stroke="#94a3b8" />
              <Tooltip contentStyle={tip} formatter={(v: number) => [`${v}%`, "Change"]} />
              <Legend
                payload={[
                  { value: chart.axis?.legend?.decrease ?? "Decrease", type: "square", color: "#E97451" },
                  { value: chart.axis?.legend?.increase ?? "Increase", type: "square", color: "#2A9D8F" },
                ]}
              />
              <Bar dataKey="change" radius={[4, 4, 4, 4]} label={{ position: "right", fill: "#0f2a2e", fontSize: 11, fontWeight: 700 }} cursor="pointer" onClick={(e) => onDrill?.(String((e as { subject?: string }).subject ?? ""))}>
                {chart.series.map((d) => (
                  <Cell key={String(d.subject)} fill={Number(d.change) >= 0 ? "#2A9D8F" : "#E97451"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </ChartFrame>
    );
  }

  if (chart.type === "funding-bars") {
    return (
      <ChartFrame caption={chart.caption} source={chart.sourceNote} contentKey={chart.id} showKeys={showKeys}>
        <motion.div {...enter} className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart.series} margin={{ top: 24, right: 8, left: 0, bottom: 48 }}>
              <CartesianGrid stroke="#e8eeea" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "#0f2a2e", fontSize: 10 }} interval={0} angle={-12} textAnchor="end" height={60} />
              <YAxis domain={[0, 80]} tick={{ fill: "#6b7d80", fontSize: 11 }} />
              <Tooltip contentStyle={tip} formatter={(v: number) => [`£${v}m`, "Funding"]} />
              <Legend
                payload={[
                  { value: chart.axis?.legend?.revenue ?? "Annual revenue backing", type: "square", color: "#2A9D8F" },
                  { value: chart.axis?.legend?.capital ?? "Additional capital investment", type: "square", color: "#C9A227" },
                  { value: chart.axis?.legend?.centre ?? "Centre contract support", type: "square", color: "#7B6B9C" },
                ]}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} label={{ position: "top", formatter: (v: number) => `£${v}m`, fill: "#0f2a2e", fontWeight: 700 }} cursor="pointer" onClick={(e) => onDrill?.(String((e as { label?: string }).label ?? ""))}>
                {chart.series.map((d) => (
                  <Cell key={String(d.label)} fill={String(d.fill)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </ChartFrame>
    );
  }

  return null;
}
