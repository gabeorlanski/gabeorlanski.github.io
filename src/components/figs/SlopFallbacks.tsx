// Hand-written fallback code per run: one labeled bar per study run, older runs then newer runs, each group with its mean.
// Data: the "Dependencies" row of src/data/figs/slop-moves-up-stack.json, written by
// scb-results/state-of-the-slop/M_thesis/scripts/export_blog.py.
import * as d3 from "d3";
import data from "@/data/figs/slop-moves-up-stack.json";
import "./SlopFigs.css";

const row = data.rows.find(r => r.key === "fallback_lines_per_run")!;
const max = d3.max(row.runs, r => r.value)!;
const GROUPS = [
  { era: "old", name: "Older runs", mean: row.old },
  { era: "new", name: "Newer runs", mean: row.new },
];

export default function SlopFallbacks() {
  return (
    <figure
      className="slop-fig not-prose"
      aria-label="Lines of hand-written fallback code per run, older vs. newer runs"
    >
      <p className="slop-fig-title">
        Lines of hand-written fallback code per run
      </p>
      <p className="slop-fig-sub">
        Code behind a guarded import of a library the agent itself declared. The
        benchmark always installs the library, so this code never runs.
      </p>
      {GROUPS.map(g => {
        const runs = row.runs
          .filter(r => r.era === g.era)
          .sort((p, q) => q.value - p.value);
        return (
          <div key={g.era} className={`slop-fb-group ${g.era}`}>
            <h4>
              {g.name} ({runs.length}){" "}
              <span>mean {d3.format(",.0f")(g.mean)} lines</span>
            </h4>
            {runs.map(r => (
              <div key={r.id} className="slop-fb-run">
                <span>
                  {r.model} <span className="effort">{r.effort}</span>
                </span>
                <div className="track">
                  <i style={{ width: `${(r.value / max) * 100}%` }} />
                  <b>{d3.format(",")(r.value)}</b>
                </div>
              </div>
            ))}
          </div>
        );
      })}
      <figcaption>
        Final snapshot of each problem, tests excluded, summed over each run's
        problems.
      </figcaption>
    </figure>
  );
}
