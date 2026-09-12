import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
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

/** CCD house colours — readable on paper, distinct across series. */
const CCD_TEAL = "#14B8A6";
const CCD_TEAL_DEEP = "#0D9488";
const CCD_FOREST = "#002D24";
const CCD_CORAL = "#FF6B6B";
const CCD_INK = "#0f2a2e";
const CCD_MUTED = "#5c6f72";
const CCD_GRID = "#e8eeea";
/** Indexed lines: hue + luminance far enough apart to read without the legend. */
const LINE_ART = "#002D24";
const LINE_DRAMA = "#E23D3D";
const LINE_MUSIC = "#0B8A9A";
const LINE_PERFORMING = "#D97706";

function ChartFrame({
  caption,
  source,
  contentKey,
  showKeys,
  density = "detail",
  children,
}: {
  caption: string;
  source: string;
  contentKey?: string;
  showKeys?: boolean;
  density?: "canvas" | "detail";
  children: React.ReactNode;
}) {
  const isCanvas = density === "canvas";
  return (
    <div className={isCanvas ? "chart-frame chart-frame--canvas" : "chart-frame"}>
      <p className="chart-caption">
        {caption}
        {showKeys && contentKey ? <span className="edit-key"> charts.{contentKey}</span> : null}
      </p>
      {children}
      {isCanvas ? null : <p className="source-note">{source}</p>}
    </div>
  );
}

const enter = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.28, ease: [0.22, 0.61, 0.36, 1] as const },
};

const CHART_DRAW_MS = 1650; /* 1.2–1.8s ease-out bar/line draw */
const CHART_BAR_STAGGER_MS = 150; /* slight delay between series */

export function ContentChart({
  chart,
  showKeys,
  onDrill,
  density = "detail",
}: {
  chart: ChartDef;
  showKeys?: boolean;
  onDrill?: (label: string) => void;
  /** Canvas scenes need larger ticks; footnotes live in the detail modal. */
  density?: "canvas" | "detail";
}) {
  const [active, setActive] = useState<string | null>(null);
  const reduced = useReducedMotion() ?? false;
  const drawMs = reduced ? 0 : CHART_DRAW_MS;
  const stagger = reduced ? 0 : CHART_BAR_STAGGER_MS;
  const chartEnter = reduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.12 } }
    : enter;
  const tick = density === "canvas" ? 14 : 11;
  const tickInk = density === "canvas" ? 15 : 12;
  const labelFs = density === "canvas" ? 14 : 12;
  const chartH = density === "canvas" ? "h-[340px] w-full" : "h-[240px] w-full sm:h-[260px]";
  const chartHTall = density === "canvas" ? "h-[360px] w-full" : "h-[280px] w-full";
  const drawKey = `${chart.id}-${density}-${reduced ? "static" : "draw"}`;

  if (chart.type === "horizontal-change") {
    return (
      <ChartFrame caption={chart.caption} source={chart.sourceNote} contentKey={chart.id} showKeys={showKeys} density={density}>
        <motion.div key={drawKey} {...chartEnter} className={chartH}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={chart.series} margin={{ top: 4, right: 36, left: 8, bottom: 8 }}>
              <CartesianGrid stroke="#e8eeea" horizontal={false} />
              <XAxis type="number" domain={[-50, 0]} tickFormatter={(v) => `${v}%`} tick={{ fill: CCD_MUTED, fontSize: tick }} />
              <YAxis type="category" dataKey="name" width={density === "canvas" ? 140 : 120} tick={{ fill: CCD_INK, fontSize: tickInk }} />
              <Tooltip contentStyle={tip} formatter={(v: number) => [`${v}%`, "Change"]} />
              <ReferenceLine x={0} stroke={CCD_MUTED} />
              <Bar
                dataKey="change"
                radius={[6, 0, 0, 6]}
                label={{ position: "left", fill: CCD_INK, fontSize: labelFs, fontWeight: 700 }}
                cursor="pointer"
                isAnimationActive={!reduced}
                animationDuration={drawMs}
                animationBegin={0}
                animationEasing="ease-out"
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
      { name: indepLabel, value: independent, fill: CCD_FOREST },
      { name: "rest", value: 100 - independent, fill: "rgba(0,45,36,0.12)" },
    ];
    const inner = [
      { name: stateLabel, value: state, fill: CCD_TEAL },
      { name: "rest2", value: 100 - state, fill: "rgba(20,184,166,0.14)" },
    ];
    return (
      <ChartFrame caption={chart.caption} source={chart.sourceNote} contentKey={chart.id} showKeys={showKeys} density={density}>
        <motion.div key={drawKey} {...chartEnter} className={density === "canvas" ? "relative mx-auto h-[300px] w-full max-w-[360px]" : "relative mx-auto h-[250px] w-full max-w-[320px]"}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={outer} dataKey="value" innerRadius={78} outerRadius={98} startAngle={90} endAngle={-270} cursor="pointer" isAnimationActive={!reduced} animationDuration={drawMs} animationBegin={0} animationEasing="ease-out" onClick={() => onDrill?.(indepLabel)}>
                {outer.map((d) => (
                  <Cell key={d.name} fill={d.fill} />
                ))}
              </Pie>
              <Pie data={inner} dataKey="value" innerRadius={48} outerRadius={68} startAngle={90} endAngle={-270} cursor="pointer" isAnimationActive={!reduced} animationDuration={drawMs} animationBegin={stagger} animationEasing="ease-out" onClick={() => onDrill?.(stateLabel)}>
                {inner.map((d) => (
                  <Cell key={d.name} fill={d.fill} />
                ))}
              </Pie>
              <Tooltip contentStyle={tip} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-10">
            <span className="display text-2xl leading-none" style={{ color: CCD_FOREST }}>
              {independent}%
            </span>
            <span className="display mt-1 text-2xl leading-none" style={{ color: CCD_TEAL_DEEP }}>
              {state}%
            </span>
          </div>
        </motion.div>
        <div className={`mt-1 flex flex-wrap justify-center gap-3 text-[#33443e] ${density === "canvas" ? "text-sm" : "text-xs"}`}>
          <span>
            <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm" style={{ background: CCD_FOREST }} />
            {indepLabel}
          </span>
          <span>
            <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm" style={{ background: CCD_TEAL }} />
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
      <ChartFrame caption={chart.caption} source={chart.sourceNote} contentKey={chart.id} showKeys={showKeys} density={density}>
        <motion.div key={drawKey} {...chartEnter} className={chartHTall}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart.series} margin={{ top: 18, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid stroke={CCD_GRID} vertical={false} />
              <XAxis dataKey="subject" tick={{ fill: CCD_INK, fontSize: tick }} interval={0} angle={-15} textAnchor="end" height={56} />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: CCD_MUTED, fontSize: tick }}
                label={
                  chart.axis?.y
                    ? { value: chart.axis.y, angle: -90, position: "insideLeft", fill: "#6b7d80", fontSize: tick }
                    : undefined
                }
              />
              <Tooltip contentStyle={tip} />
              <Legend />
              <Bar dataKey="least" name={leastName} fill={CCD_TEAL_DEEP} radius={[4, 4, 0, 0]} label={{ position: "top", fontSize: tick, fill: CCD_INK }} cursor="pointer" isAnimationActive={!reduced} animationDuration={drawMs} animationBegin={0} animationEasing="ease-out" onClick={(e) => onDrill?.(String((e as { subject?: string }).subject ?? ""))} />
              <Bar dataKey="most" name={mostName} fill={CCD_CORAL} radius={[4, 4, 0, 0]} label={{ position: "top", fontSize: tick, fill: CCD_INK }} cursor="pointer" isAnimationActive={!reduced} animationDuration={drawMs} animationBegin={stagger} animationEasing="ease-out" onClick={(e) => onDrill?.(String((e as { subject?: string }).subject ?? ""))} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </ChartFrame>
    );
  }

  if (chart.type === "lollipop") {
    const valueKey =
      chart.series.some((d) => "value" in d && d.value != null) ? "value" : "none";
    const valueLabel = chart.axis?.x ?? (valueKey === "none" ? "No GCSE entries" : "Value");
    const yWidth = density === "canvas" ? 100 : 88;
    return (
      <ChartFrame caption={chart.caption} source={chart.sourceNote} contentKey={chart.id} showKeys={showKeys} density={density}>
        <motion.div key={drawKey} {...chartEnter} className={chartH}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={chart.series} margin={{ top: 8, right: 48, left: 8, bottom: 8 }}>
              <CartesianGrid stroke={CCD_GRID} horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: CCD_MUTED, fontSize: tick }} />
              <YAxis type="category" dataKey="subject" width={yWidth} tick={{ fill: CCD_INK, fontSize: tickInk }} />
              <Tooltip contentStyle={tip} formatter={(v: number) => [`${v}%`, valueLabel]} />
              <Bar dataKey={valueKey} barSize={10} background={{ fill: CCD_GRID }} radius={[0, 99, 99, 0]} label={{ position: "right", fill: CCD_INK, fontSize: labelFs, fontWeight: 700 }} cursor="pointer" isAnimationActive={!reduced} animationDuration={drawMs} animationBegin={0} animationEasing="ease-out" onClick={(e) => onDrill?.(String((e as { subject?: string }).subject ?? ""))}>
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
      <ChartFrame caption={chart.caption} source={chart.sourceNote} contentKey={chart.id} showKeys={showKeys} density={density}>
        <motion.div key={drawKey} {...chartEnter} className={chartH}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chart.series} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
              <CartesianGrid stroke={CCD_GRID} />
              <XAxis dataKey="year" tick={{ fill: CCD_INK, fontSize: tickInk }} />
              <YAxis domain={[yMin, yMax]} tick={{ fill: CCD_MUTED, fontSize: tick }} />
              <ReferenceLine y={100} stroke={CCD_MUTED} strokeDasharray="4 4" />
              <Tooltip contentStyle={tip} />
              <Legend
                onClick={(e) => {
                  setActive(String(e.dataKey));
                  onDrill?.(String(e.value ?? e.dataKey));
                }}
              />
              <Line type="monotone" dataKey="art" name={chart.axis?.series?.art ?? "Art & Design"} stroke={LINE_ART} strokeWidth={active && active !== "art" ? 1.5 : 2.75} dot={{ r: 5, fill: LINE_ART, strokeWidth: 0 }} activeDot={{ r: 6 }} isAnimationActive={!reduced} animationDuration={drawMs} animationBegin={0} animationEasing="ease-out" />
              <Line type="monotone" dataKey="drama" name={chart.axis?.series?.drama ?? "Drama"} stroke={LINE_DRAMA} strokeWidth={active && active !== "drama" ? 1.5 : 2.75} dot={{ r: 5, fill: LINE_DRAMA, strokeWidth: 0 }} activeDot={{ r: 6 }} isAnimationActive={!reduced} animationDuration={drawMs} animationBegin={stagger} animationEasing="ease-out" />
              <Line type="monotone" dataKey="music" name={chart.axis?.series?.music ?? "Music"} stroke={LINE_MUSIC} strokeWidth={active && active !== "music" ? 1.5 : 2.75} dot={{ r: 5, fill: LINE_MUSIC, strokeWidth: 0 }} activeDot={{ r: 6 }} isAnimationActive={!reduced} animationDuration={drawMs} animationBegin={stagger * 2} animationEasing="ease-out" />
              {!isAlevel ? (
                <Line type="monotone" dataKey="performing" name={chart.axis?.series?.performing ?? "Performing / Expressive Arts"} stroke={LINE_PERFORMING} strokeWidth={active && active !== "performing" ? 1.5 : 2.75} dot={{ r: 5, fill: LINE_PERFORMING, strokeWidth: 0 }} activeDot={{ r: 6 }} isAnimationActive={!reduced} animationDuration={drawMs} animationBegin={stagger * 3} animationEasing="ease-out" />
              ) : null}
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </ChartFrame>
    );
  }

  if (chart.type === "divergent-bars") {
    return (
      <ChartFrame caption={chart.caption} source={chart.sourceNote} contentKey={chart.id} showKeys={showKeys} density={density}>
        <motion.div key={drawKey} {...chartEnter} className={chartHTall}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={chart.series} margin={{ top: 8, right: 36, left: 8, bottom: 8 }}>
              <CartesianGrid stroke="#e8eeea" horizontal={false} />
              <XAxis type="number" domain={[-16, 3]} tickFormatter={(v) => `${v}%`} tick={{ fill: CCD_MUTED, fontSize: tick }} />
              <YAxis type="category" dataKey="subject" width={density === "canvas" ? 170 : 150} tick={{ fill: CCD_INK, fontSize: tickInk }} />
              <ReferenceLine x={0} stroke={CCD_MUTED} />
              <Tooltip contentStyle={tip} formatter={(v: number) => [`${v > 0 ? "+" : ""}${v}%`, "University students"]} />
              <Legend
                payload={[
                  { value: chart.axis?.legend?.decrease ?? "Decrease", type: "square", color: CCD_CORAL },
                  { value: chart.axis?.legend?.increase ?? "Increase", type: "square", color: CCD_TEAL },
                ]}
              />
              <Bar dataKey="change" radius={[4, 4, 4, 4]} label={{ position: "right", fill: CCD_INK, fontSize: labelFs, fontWeight: 700 }} cursor="pointer" isAnimationActive={!reduced} animationDuration={drawMs} animationBegin={0} animationEasing="ease-out" onClick={(e) => onDrill?.(String((e as { subject?: string }).subject ?? ""))}>
                {chart.series.map((d) => (
                  <Cell key={String(d.subject)} fill={Number(d.change) >= 0 ? CCD_TEAL : CCD_CORAL} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </ChartFrame>
    );
  }

  if (chart.type === "funding-trend") {
    const fundLabel = density === "canvas" ? 14 : 12;
    const fundTick = density === "canvas" ? 13 : 11;
    const yMax = Number(chart.meta?.yMax ?? 110);
    const cashName = chart.axis?.legend?.cash ?? "Cash revenue grant";
    const keepName = chart.axis?.legend?.keep2019 ?? "To hold 2019 purchasing power";
    return (
      <ChartFrame caption={chart.caption} source={chart.sourceNote} contentKey={chart.id} showKeys={showKeys} density={density}>
        <motion.div key={drawKey} {...chartEnter} className={density === "canvas" ? "h-[400px] w-full" : "h-[300px] w-full"}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chart.series}
              margin={
                density === "canvas"
                  ? { top: 28, right: 16, left: 8, bottom: 16 }
                  : { top: 24, right: 12, left: 4, bottom: 8 }
              }
            >
              <CartesianGrid stroke={CCD_GRID} vertical={false} />
              <XAxis dataKey="year" tick={{ fill: CCD_INK, fontSize: fundTick, fontWeight: 650 }} interval={0} />
              <YAxis
                domain={[0, yMax]}
                tick={{ fill: CCD_MUTED, fontSize: fundTick }}
                tickFormatter={(v: number) => `£${v}m`}
              />
              <Tooltip
                contentStyle={tip}
                formatter={(v: number, name: string) => [`£${v}m`, name]}
              />
              {density === "canvas" ? null : (
                <Legend
                  payload={[
                    { value: cashName, type: "square", color: CCD_TEAL },
                    { value: keepName, type: "line", color: CCD_FOREST },
                  ]}
                />
              )}
              <Bar
                dataKey="cash"
                name={cashName}
                fill={CCD_TEAL}
                barSize={density === "canvas" ? 36 : 28}
                radius={[6, 6, 0, 0]}
                label={{
                  position: "top",
                  formatter: (v: number) => (v ? `£${v}m` : ""),
                  fill: "#0f2a2e",
                  fontWeight: 800,
                  fontSize: fundLabel,
                }}
                isAnimationActive={!reduced}
                animationDuration={drawMs}
                animationBegin={0}
                animationEasing="ease-out"
                cursor="pointer"
                onClick={(e) => onDrill?.(String((e as { year?: string }).year ?? ""))}
              />
              <Line
                type="linear"
                dataKey="keep2019"
                name={keepName}
                stroke={CCD_FOREST}
                strokeWidth={2.75}
                strokeDasharray="6 4"
                connectNulls
                dot={{ r: 5, fill: CCD_FOREST, strokeWidth: 0 }}
                label={{
                  position: "right",
                  formatter: (v: number) => (v === 100 ? "£100m today" : ""),
                  fill: CCD_FOREST,
                  fontSize: fundLabel,
                  fontWeight: 700,
                }}
                isAnimationActive={!reduced}
                animationDuration={drawMs}
                animationBegin={stagger}
                animationEasing="ease-out"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </motion.div>
      </ChartFrame>
    );
  }

  if (chart.type === "funding-bars") {
    const fundLabel = density === "canvas" ? 15 : 14;
    const fundTick = density === "canvas" ? 13 : 12;
    // One series per bar so animationBegin can stagger £76m → £25m → £13m
    const fundRows = chart.series.map((d, i) => {
      const row: Record<string, string | number> = { label: String(d.label) };
      chart.series.forEach((s, j) => {
        row[`b${j}`] = i === j ? Number(s.value) : 0;
      });
      return row;
    });
    return (
      <ChartFrame caption={chart.caption} source={chart.sourceNote} contentKey={chart.id} showKeys={showKeys} density={density}>
        <motion.div key={drawKey} {...chartEnter} className={density === "canvas" ? "h-[400px] w-full" : "h-[300px] w-full"}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={fundRows}
              margin={
                density === "canvas"
                  ? { top: 36, right: 16, left: 8, bottom: 64 }
                  : { top: 32, right: 12, left: 4, bottom: 72 }
              }
              barCategoryGap="28%"
            >
              <CartesianGrid stroke="#e8eeea" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "#0f2a2e", fontSize: fundTick, fontWeight: 650 }}
                interval={0}
                angle={0}
                textAnchor="middle"
                height={density === "canvas" ? 64 : 72}
                tickFormatter={(v: string) => {
                  const s = String(v);
                  if (s.length <= 14) return s;
                  const mid = Math.ceil(s.length / 2);
                  const space = s.lastIndexOf(" ", mid);
                  if (space > 4) return `${s.slice(0, space)}\n${s.slice(space + 1)}`;
                  return s;
                }}
              />
              <YAxis domain={[0, 80]} tick={{ fill: "#6b7d80", fontSize: fundTick }} />
              <Tooltip
                contentStyle={tip}
                formatter={(v: number) => (v ? [`£${v}m`, "Funding"] : [null, null])}
              />
              {density === "canvas" ? null : (
                <Legend
                  payload={[
                    { value: chart.axis?.legend?.revenue ?? "Annual revenue backing", type: "square", color: CCD_TEAL_DEEP },
                    { value: chart.axis?.legend?.capital ?? "Additional capital investment", type: "square", color: CCD_TEAL },
                    { value: chart.axis?.legend?.centre ?? "Centre contract support", type: "square", color: CCD_FOREST },
                  ]}
                />
              )}
              {chart.series.map((d, i) => (
                <Bar
                  key={`fund-${i}`}
                  dataKey={`b${i}`}
                  stackId="fund"
                  barSize={density === "canvas" ? 56 : 48}
                  radius={[8, 8, 0, 0]}
                  fill={String(d.fill)}
                  label={{
                    position: "top",
                    formatter: (v: number) => (v ? `£${v}m` : ""),
                    fill: "#0f2a2e",
                    fontWeight: 800,
                    fontSize: fundLabel,
                  }}
                  cursor="pointer"
                  isAnimationActive={!reduced}
                  animationDuration={drawMs}
                  animationBegin={stagger * i}
                  animationEasing="ease-out"
                  onClick={() => onDrill?.(String(d.label))}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </ChartFrame>
    );
  }

  return null;
}
