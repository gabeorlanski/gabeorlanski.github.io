// Overview: the stack, top to bottom (dependencies → lines), and how much slop changed at each level from the older to the
// newer SlopCodeBench runs. Blue arrows: less slop. Red: more. Click a row for every run's value.
// Data: src/data/figs/slop-moves-up-stack.json, written by scb-results/state-of-the-slop/M_thesis/scripts/export_blog.py.
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import data from "@/data/figs/slop-moves-up-stack.json";
import "./SlopFigs.css";

interface Run {
  id: string;
  model: string;
  effort: string;
  era: string;
  value: number;
}
interface Row {
  key: string;
  layer: string;
  label: string;
  note: string;
  unit: string;
  digits: number;
  old: number;
  new: number;
  runs: Run[];
}

const rows = data.rows as Row[];
const TICKS: [number, string][] = [
  [0.5, "½×"],
  [1, "1×"],
  [2, "2×"],
  [5, "5×"],
  [10, "10×"],
  [30, "30×"],
];
const ratio = d3.scaleLog().domain([0.5, 50]).range([0.04, 0.96]); // inset so edge ticks stay readable
const HEAD = 14;

const value = (row: Row, v: number) =>
  `${d3.format(`,.${row.digits}f`)(v)}${row.unit}`;
const change = (r: number) =>
  r < 2
    ? `${r >= 1 ? "+" : "−"}${Math.abs(Math.round((r - 1) * 100))}%`
    : `×${Math.round(r)}`;

function Arrow({ row, width }: { row: Row; width: number }) {
  const r = row.new / row.old;
  const a = ratio(1) * width;
  const e = ratio(r) * width;
  const dir = r >= 1 ? 1 : -1;
  const head = Math.min(HEAD, Math.abs(e - a)); // never reaches back past 1×
  const color = `var(--slop-${r >= 1 ? "worse" : "better"})`;
  return (
    <svg viewBox={`0 0 ${width} 46`} aria-hidden="true">
      {TICKS.map(([t]) => (
        <line
          key={t}
          x1={ratio(t) * width}
          x2={ratio(t) * width}
          y1={0}
          y2={46}
          stroke={t === 1 ? "var(--slop-axis)" : "var(--slop-grid)"}
          strokeWidth={t === 1 ? 1.5 : 1}
        />
      ))}
      <line
        x1={a}
        x2={e - dir * head}
        y1={23}
        y2={23}
        stroke={color}
        strokeWidth={5}
      />
      <path
        d={`M${e},23 L${e - dir * head},15 L${e - dir * head},31 Z`}
        fill={color}
      />
    </svg>
  );
}

function Runs({ row }: { row: Row }) {
  const x = d3
    .scaleLinear()
    .domain([0, d3.max(row.runs, run => run.value)!])
    .range([0, 100]);
  const column = (era: string, title: string, mean: number) => {
    const runs = row.runs
      .filter(run => run.era === era)
      .sort((p, q) => q.value - p.value);
    return (
      <div className={era}>
        <h4>
          {title} ({runs.length}) · mean {value(row, mean)}
        </h4>
        {runs.map(run => (
          <div key={run.id} className="slop-run">
            <span>
              {run.model} <span className="effort">{run.effort}</span>
            </span>
            <div className="bar" style={{ width: `${x(run.value)}%` }} />
            <span className="val">{value(row, run.value)}</span>
          </div>
        ))}
      </div>
    );
  };
  return (
    <div className={`slop-runs ${row.new >= row.old ? "worse" : "better"}`}>
      <p>{row.note}</p>
      {column("old", "Older runs", row.old)}
      {column("new", "Newer runs", row.new)}
    </div>
  );
}

export default function SlopStack() {
  const [open, setOpen] = useState<string | null>(null);
  const [width, setWidth] = useState(480);
  const axis = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width)
    );
    observer.observe(axis.current!);
    return () => observer.disconnect();
  }, []);

  return (
    <figure
      className="slop-fig not-prose"
      aria-label="Change in slop at each level of the stack, from older to newer SlopCodeBench runs"
    >
      <p className="slop-fig-title">
        How much slop changed at each level, {data.oldRuns} older runs →{" "}
        {data.newRuns} newer runs
      </p>
      <p className="slop-hint slop-stack-hint">
        <b className="better">Blue</b>: less slop. <b className="worse">Red</b>:
        more slop. <b>Click any row to see every run.</b>
      </p>
      <div className="slop-stack">
        <div className="slop-stack-arrow" aria-hidden="true">
          <span>up the stack</span>
        </div>
        <div className="slop-stack-grid">
          {rows.map(row => {
            const r = row.new / row.old;
            return [
              <button
                key={row.key}
                type="button"
                className={`slop-row ${r >= 1 ? "worse" : "better"}`}
                aria-expanded={open === row.key}
                aria-label={`${row.label}: ${value(row, row.old)} to ${value(row, row.new)}, ${change(r)}`}
                onClick={() => setOpen(open === row.key ? null : row.key)}
              >
                <span className="slop-row-label">
                  <b>{row.layer}</b>
                  <span>{row.label}</span>
                </span>
                <Arrow row={row} width={width} />
                <span className="slop-change">
                  <b>{change(r)}</b>
                  <span>
                    {value(row, row.old)} → {value(row, row.new)}
                  </span>
                </span>
              </button>,
              open === row.key && <Runs key={`r-${row.key}`} row={row} />,
            ];
          })}
          <div className="slop-axis" ref={axis}>
            {TICKS.map(([t, label]) => (
              <span key={t} style={{ left: `${ratio(t) * 100}%` }}>
                {label}
              </span>
            ))}
            <span className="slop-axis-label">
              change from older to newer runs (log scale)
            </span>
          </div>
        </div>
      </div>
    </figure>
  );
}
