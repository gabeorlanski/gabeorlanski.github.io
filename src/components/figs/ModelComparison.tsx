import { useEffect, useRef } from "react";
import * as d3 from "d3";

type Metric = {
  label: string;
  values: number[];
  better: "higher" | "lower";
  format: (v: number) => string;
};

type Section = { title: string; metrics: Metric[] };

const MODELS = ["Opus 4.6", "GPT 5.2", "Codex 5.3", "GPT 5.4"];

const pct = d3.format(".1f");
const SECTIONS: Section[] = [
  {
    title: "Correctness",
    metrics: [
      {
        label: "Checkpoints Solved (%)",
        values: [17.2, 10.8, 9.7, 11.8],
        better: "higher",
        format: pct,
      },
      {
        label: "Isolated Solved (%)",
        values: [21.5, 19.4, 23.7, 20.4],
        better: "higher",
        format: pct,
      },
      {
        label: "Core Solved (%)",
        values: [53.8, 43.0, 51.6, 48.4],
        better: "higher",
        format: pct,
      },
    ],
  },
  {
    title: "Cost & Speed",
    metrics: [
      {
        label: "Total Run Cost",
        values: [323, 423, 292, 304],
        better: "lower",
        format: d3.format("$d"),
      },
      {
        label: "Wall Time / Chkpt (min)",
        values: [14.4, 15.0, 7.5, 8.6],
        better: "lower",
        format: pct,
      },
    ],
  },
  {
    title: "Slop",
    metrics: [
      {
        label: "Structural Erosion",
        values: [0.647, 0.671, 0.678, 0.643],
        better: "lower",
        format: d3.format(".3f"),
      },
      {
        label: "Verbosity",
        values: [0.965, 0.765, 0.844, 0.682],
        better: "lower",
        format: d3.format(".3f"),
      },
      {
        label: "Clone Lines / 1K LOC*",
        values: [174.1, 143.2, 116.3, 85.7],
        better: "lower",
        format: pct,
      },
    ],
  },
];

const BEST = "#22c55e";
const WORST = "#ef4444";

const WIDTH = 720;
const PAD = 20;
const LABEL_WIDTH = 250;
const ROW_HEIGHT = 34;
const SECTION_HEIGHT = 34;
const TITLE_HEIGHT = 44;
const HEADER_HEIGHT = 32;
const FOOTER_HEIGHT = 36;

export default function ModelComparison() {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const rowCount = d3.sum(SECTIONS, s => s.metrics.length);
    const height =
      TITLE_HEIGHT +
      HEADER_HEIGHT +
      SECTIONS.length * SECTION_HEIGHT +
      rowCount * ROW_HEIGHT +
      FOOTER_HEIGHT;

    const svg = d3
      .select(ref.current)
      .attr("viewBox", `0 0 ${WIDTH} ${height}`)
      .style("font-family", "inherit")
      .style("fill", "var(--foreground)");
    svg.selectAll("*").remove();

    const x = d3
      .scalePoint()
      .domain(MODELS)
      .range([LABEL_WIDTH + 50, WIDTH - PAD - 50]);

    svg
      .append("text")
      .attr("x", WIDTH / 2)
      .attr("y", 30)
      .attr("text-anchor", "middle")
      .attr("font-size", 22)
      .attr("font-weight", 700)
      .text("SlopCodeBench");

    svg
      .append("g")
      .selectAll("text")
      .data(MODELS)
      .join("text")
      .attr("x", d => x(d)!)
      .attr("y", TITLE_HEIGHT + 20)
      .attr("text-anchor", "middle")
      .attr("font-size", 14)
      .attr("font-weight", 700)
      .text(d => d.toUpperCase());

    let y = TITLE_HEIGHT + HEADER_HEIGHT;
    for (const section of SECTIONS) {
      svg
        .append("text")
        .attr("x", PAD)
        .attr("y", y + 22)
        .attr("font-size", 13)
        .attr("font-weight", 700)
        .attr("letter-spacing", 1.5)
        .style("fill", "var(--accent)")
        .text(section.title.toUpperCase());
      svg
        .append("line")
        .attr("x1", PAD)
        .attr("x2", WIDTH - PAD)
        .attr("y1", y + SECTION_HEIGHT - 2)
        .attr("y2", y + SECTION_HEIGHT - 2)
        .style("stroke", "var(--accent)")
        .attr("stroke-opacity", 0.5);
      y += SECTION_HEIGHT;

      const rows = svg
        .append("g")
        .selectAll("g")
        .data(section.metrics)
        .join("g")
        .attr("transform", (_, i) => `translate(0, ${y + i * ROW_HEIGHT})`);

      rows
        .append("line")
        .attr("x1", PAD)
        .attr("x2", WIDTH - PAD)
        .attr("y1", ROW_HEIGHT)
        .attr("y2", ROW_HEIGHT)
        .style("stroke", "var(--muted)");

      rows
        .append("text")
        .attr("x", PAD)
        .attr("y", ROW_HEIGHT / 2 + 5)
        .attr("font-size", 14)
        .attr("fill-opacity", 0.8)
        .text(d => d.label);

      rows.each(function (metric) {
        const pick =
          metric.better === "higher"
            ? [d3.maxIndex, d3.minIndex]
            : [d3.minIndex, d3.maxIndex];
        const best = pick[0](metric.values);
        const worst = pick[1](metric.values);
        d3.select(this)
          .selectAll("text.value")
          .data(metric.values)
          .join("text")
          .attr("class", "value")
          .attr("x", (_, i) => x(MODELS[i])!)
          .attr("y", ROW_HEIGHT / 2 + 5)
          .attr("text-anchor", "middle")
          .attr("font-size", 15)
          .attr("font-weight", (_, i) => (i === best ? 700 : 400))
          .style("fill", (_, i) =>
            i === best ? BEST : i === worst ? WORST : "var(--foreground)"
          )
          .text(v => metric.format(v));
      });

      y += section.metrics.length * ROW_HEIGHT;
    }

    const legend = svg
      .append("g")
      .attr("transform", `translate(${PAD}, ${y + 24})`)
      .attr("font-size", 12);
    legend
      .append("text")
      .attr("fill-opacity", 0.7)
      .text("* Final checkpoint only.");
    legend
      .append("circle")
      .attr("cx", 200)
      .attr("cy", -4)
      .attr("r", 5)
      .style("fill", BEST);
    legend.append("text").attr("x", 210).attr("fill-opacity", 0.7).text("best");
    legend
      .append("circle")
      .attr("cx", 260)
      .attr("cy", -4)
      .attr("r", 5)
      .style("fill", WORST);
    legend
      .append("text")
      .attr("x", 270)
      .attr("fill-opacity", 0.7)
      .text("worst");
  }, []);

  return (
    <svg
      ref={ref}
      role="img"
      aria-label="SlopCodeBench comparison of Opus 4.6, GPT 5.2, Codex 5.3, and GPT 5.4 on correctness, cost and speed, and slop metrics"
      style={{ width: "100%", height: "auto" }}
    />
  );
}
