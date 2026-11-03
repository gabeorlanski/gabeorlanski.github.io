// Every fully measured SlopCodeBench setup by release date, one panel per measure: a logo per setup (faded = run with the
// anti_slop or plan_first prompt), a dashed least-squares trend, and the extreme setup labeled. Hover a logo for the setup.
// Data: src/data/figs/slop-moves-up-timeline.json, written by scb-results/state-of-the-slop/M_thesis/scripts/export_blog.py.
import { useState } from "react";
import * as d3 from "d3";
import anthropic from "@/assets/logos/anthropic.svg?raw";
import moonshot from "@/assets/logos/moonshot.svg?raw";
import openai from "@/assets/logos/openai.svg?raw";
import zai from "@/assets/logos/zai.svg?raw";
import data from "@/data/figs/slop-moves-up-timeline.json";
import "./SlopFigs.css";

interface Point {
  model: string;
  effort: string;
  harness: string;
  vendor: string;
  prompt: string;
  faded: boolean;
  date: string;
  value: number;
}
interface Panel {
  key: string;
  title: string;
  unit: string;
  digits: number;
  yMax: number;
  yStep: number;
  points: Point[];
  /** A least-squares trend over every setup, or (for measures taken on the study runs only) the older and newer means. */
  trend?: { from: number; to: number; intercept: number; perMonth: number; slope: number };
  segments?: { name: string; from: number; to: number; mean: number }[];
  label: number;
}

const ALL = data.panels as Panel[];
const VENDORS: Record<string, { name: string; logo: string | null; initials?: string }> = {
  anthropic: { name: "Anthropic", logo: anthropic },
  openai: { name: "OpenAI", logo: openai },
  zai: { name: "GLM", logo: zai },
  moonshot: { name: "Kimi", logo: moonshot },
  minimax: { name: "MiniMax", logo: null, initials: "M" },
  cursor: { name: "Composer", logo: null, initials: "C" },
};
const DAY0 = Date.UTC(2026, 0, 1);
const dayOf = (s: string) => (Date.parse(`${s}T00:00:00Z`) - DAY0) / 864e5;
const X_MAX = dayOf("2026-10-15");
const at = (v: number) => `${+v.toFixed(3)}%`;
const MONTHS = ["2026-01-01", "2026-04-01", "2026-07-01", "2026-10-01"];

const fmt = (p: Panel, v: number) =>
  `${d3.format(`,.${p.digits}f`)(v)}${p.unit}`;

function Marker({ point }: { point: Point }) {
  const v = VENDORS[point.vendor];
  return (
    <span className={`slop-logo ${point.vendor}`}>
      {v.logo ? (
        <span dangerouslySetInnerHTML={{ __html: v.logo }} />
      ) : (
        <b>{v.initials}</b>
      )}
    </span>
  );
}

function TimePanel({ panel }: { panel: Panel }) {
  const [active, setActive] = useState<number | null>(null);
  const x = (day: number) => (day / X_MAX) * 100;
  const y = (v: number) => (v / panel.yMax) * 100;
  const ticks = d3.range(0, panel.yMax + 1e-9, panel.yStep);
  const t = panel.trend;
  const lines = t
    ? [{ x1: t.from, x2: t.to, y1: t.intercept + t.slope * t.from, y2: t.intercept + t.slope * t.to }]
    : panel.segments!.map(s => ({ x1: s.from - 6, x2: s.to + 6, y1: s.mean, y2: s.mean }));
  const best = panel.points[panel.label];
  const per = t && d3.format(`.${panel.digits === 2 ? 3 : 1}f`)(Math.abs(t.perMonth));
  return (
    <div className="slop-tl-panel">
      <div className="slop-tl-title">
        <b>{panel.title}</b>
        <span>
          {t
            ? `trend ${t.perMonth >= 0 ? "+" : "−"}${per}${panel.unit === "%" ? " pts" : ""} per month`
            : panel.segments!.map(s => `${s.name}: ${fmt(panel, s.mean)}`).join(" · ")}
        </span>
      </div>
      <div className="slop-tl-body">
        <div className="slop-tl-y">
          {ticks.map(v => (
            <span key={v} style={{ bottom: at(y(v)) }}>
              {fmt({ ...panel, digits: panel.digits === 2 ? 2 : 0 }, v)}
            </span>
          ))}
        </div>
        <div className={`slop-tl-plot ${active !== null ? "has-active" : ""}`}>
          {ticks.map(v => (
            <span key={v} className="grid" style={{ bottom: at(y(v)) }} />
          ))}
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {lines.map(l => (
              <line
                key={l.x1}
                x1={x(l.x1)}
                x2={x(l.x2)}
                y1={100 - y(l.y1)}
                y2={100 - y(l.y2)}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>
          <span
            className={`slop-tl-label ${x(dayOf(best.date)) > 50 ? "left" : "right"} ${best.value > d3.mean(panel.points, q => q.value)! ? "above" : "below"}`}
            style={{ left: at(x(dayOf(best.date))), bottom: at(y(best.value)) }}
          >
            {best.model} {best.effort}: {fmt(panel, best.value)}
          </span>
          {panel.points.map((p, i) => (
            <div
              key={`${p.model}-${p.effort}-${p.harness}-${p.prompt}`}
              className={`slop-tl-point ${p.faded ? "faded" : ""} ${active === i ? "active" : ""} ${x(dayOf(p.date)) > 60 ? "edge-right" : ""}`}
              style={{ left: at(x(dayOf(p.date))), bottom: at(y(p.value)) }}
              tabIndex={0}
              role="img"
              aria-label={`${p.model} ${p.effort}, ${p.harness}, ${p.date}: ${fmt(panel, p.value)}`}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
            >
              <Marker point={p} />
              {active === i && (
                <div className="slop-tl-tip" role="tooltip">
                  <b>
                    {p.model} {p.effort}
                  </b>
                  <span>{p.harness}</span>
                  <span>
                    released {p.date}
                    {p.faded ? ` · ${p.prompt} prompt` : ""}
                  </span>
                  <span className="v">{fmt(panel, p.value)}</span>
                </div>
              )}
            </div>
          ))}
        </div>
        <div />
        <div className="slop-tl-x">
          {MONTHS.map(m => (
            <span key={m} style={{ left: at(x(dayOf(m))) }}>
              {d3.utcFormat("%b '%y")(new Date(`${m}T00:00:00Z`))}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/** `keys`: which panels to show, in order (strict, isolated, core, lines, erosion). */
export default function SlopTimeline({ keys }: { keys: string[] }) {
  const panels = keys.map(k => ALL.find(p => p.key === k)!);
  const present = new Set(panels.flatMap(p => p.points.map(q => q.vendor)));
  return (
    <figure
      className="slop-fig not-prose"
      aria-label={`${panels.map(p => p.title).join(", ")} for every setup, by release date`}
    >
      <div className="slop-tl-legend">
        {Object.entries(VENDORS)
          .filter(([k]) => present.has(k))
          .map(([k, v]) => (
            <span key={k}>
              <Marker point={{ vendor: k } as Point} /> {v.name}
            </span>
          ))}
        {panels.some(p => p.points.some(q => q.faded)) && (
        <span className="faded-key">
          <Marker point={{ vendor: "openai" } as Point} /> faded = anti_slop or
          plan_first prompt
        </span>
        )}
      </div>
      <div className={`slop-tl-grid n${panels.length}`}>
        {panels.map(p => (
          <TimePanel key={p.key} panel={p} />
        ))}
      </div>
      <figcaption>
        {panels.every(p => p.trend)
          ? `One logo per setup (${data.setups} in all), placed at the later of the model's and the harness version's release. Dashed line: least-squares trend over every setup. Hover a logo for the setup.`
          : "One logo per run we compare, placed at the later of the model's and the harness version's release. Dashed lines: the older and newer runs' means. Hover a logo for the run."}
      </figcaption>
    </figure>
  );
}
