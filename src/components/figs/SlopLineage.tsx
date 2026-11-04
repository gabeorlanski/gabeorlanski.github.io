// Patterns along each lineage, in release order: the ones that went away (kind="down") or showed up (kind="up").
// Cell shade = how much of the pattern, relative to its row. Data: src/data/figs/slop-moves-up-lineage.json, written by
// scb-results/state-of-the-slop/M_thesis/scripts/export_blog.py from the twitter_tables.py row specs.
import { Fragment, useState, type CSSProperties } from "react";
import * as d3 from "d3";
import data from "@/data/figs/slop-moves-up-lineage.json";
import "./SlopFigs.css";

interface Row {
  label: string;
  values: (number | null)[];
  digits: number;
}
interface Lineage {
  runs: string[];
  newFrom: number;
  down: Row[];
  up: Row[];
}

const LINEAGES = data as Record<string, Lineage>;

/** `code` spans in a label become <code>. */
const Label = ({ text }: { text: string }) => (
  <>
    {text
      .split(/(`[^`]+`)/)
      .map((part, i) =>
        part.startsWith("`") ? <code key={i}>{part.slice(1, -1)}</code> : part
      )}
  </>
);

function Change({ row, newFrom }: { row: Row; newFrom: number }) {
  const mean = (vs: (number | null)[]) => d3.mean(vs.filter(v => v != null));
  const from = mean(row.values.slice(0, newFrom))!;
  const to = mean(row.values.slice(newFrom))!;
  if (from === 0) return <td className="trend worse">new</td>;
  const r = to / from;
  const text =
    r < 2 ? `${Math.abs(Math.round((r - 1) * 100))}%` : `×${Math.round(r)}`;
  return (
    <td className={`trend ${r > 1 ? "worse" : "better"}`}>
      {r > 1 ? "↑" : "↓"} {text}
    </td>
  );
}

export default function SlopLineage({ kind }: { kind: "down" | "up" }) {
  const [lineage, setLineage] = useState("Anthropic");
  const { runs, newFrom, ...rows } = LINEAGES[lineage];
  return (
    <figure
      className="slop-fig slop-lineage not-prose"
      aria-label={`Patterns that went ${kind} along the ${lineage} lineage`}
    >
      <div className="slop-tabs" role="group" aria-label="Lineage">
        {Object.keys(LINEAGES).map(name => (
          <button
            key={name}
            type="button"
            aria-pressed={name === lineage}
            onClick={() => setLineage(name)}
          >
            {name}
          </button>
        ))}
      </div>
      <table className={`slop-table ${kind}`}>
        <thead>
          <tr className="era">
            <th />
            <th colSpan={newFrom}>Older</th>
            <th colSpan={runs.length - newFrom} className="first-new">
              Newer
            </th>
            <th />
          </tr>
          <tr>
            <th>Pattern</th>
            {runs.map((run, i) => (
              <th key={run} className={i === newFrom ? "first-new" : ""}>
                {run}
              </th>
            ))}
            <th>Change</th>
          </tr>
        </thead>
        <tbody>
          {rows[kind].map(row => {
            const max = d3.max(row.values, v => v ?? 0)!;
            return (
              <Fragment key={row.label}>
                {/* Narrow figures show the pattern on its own line above its numbers (see .label-row). */}
                <tr className="label-row">
                  <td colSpan={runs.length + 1}>
                    <Label text={row.label} />
                  </td>
                </tr>
                <tr>
                  <td>
                    <Label text={row.label} />
                  </td>
                  {row.values.map((v, i) => (
                    <td
                      key={runs[i]}
                      className={`${v == null ? "nm" : "cell"} ${i === newFrom ? "first-new" : ""}`}
                      style={
                        v == null
                          ? undefined
                          : ({ "--t": max ? v / max : 0 } as CSSProperties)
                      }
                    >
                      {v == null ? "n/m" : d3.format(`,.${row.digits}f`)(v)}
                    </td>
                  ))}
                  <Change row={row} newFrom={newFrom} />
                </tr>
              </Fragment>
            );
          })}
        </tbody>
      </table>
      <figcaption>
        scb-check 0.1.3 and our own measures on each problem's final code, tests
        excluded. Shade: how much of the pattern, relative to its row. Change:
        mean of the newer runs against the mean of the older ones. n/m: not
        measured.
      </figcaption>
    </figure>
  );
}
