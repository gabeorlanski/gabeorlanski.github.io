import { useEffect, useRef } from "react";
import * as d3 from "d3";
import data from "@/data/figs/gpt54-overall-performance.json";

type MetricKey = keyof typeof data;

const MODELS = ["Opus 4.6", "GPT-5.2", "GPT-5.3 Codex", "GPT-5.4"] as const;
const COLORS = ["#8b2e14", "#6bb8ad", "#3a8f83", "#1a5248"];

const PANELS: {
  key: MetricKey;
  title: string;
  yLabel: string;
  format: (v: number) => string;
}[] = [
  {
    key: "cost",
    title: "Cost per Checkpoint",
    yLabel: "Cost ($, log)",
    format: d3.format("$.2f"),
  },
  {
    key: "time",
    title: "Time per Checkpoint",
    yLabel: "Time (min, log)",
    format: v => `${d3.format(".1f")(v)} min`,
  },
  {
    key: "netLines",
    title: "Net Lines per Checkpoint",
    yLabel: "Lines (added − removed, log)",
    format: d3.format(",d"),
  },
  {
    key: "massAdded",
    title: "Δ Complexity Mass Added",
    yLabel: "Mass added per checkpoint",
    format: d3.format(",.1f"),
  },
];

const WIDTH = 720;
const PANEL_HEIGHT = 250;
const LEGEND_HEIGHT = 40;
const MARGIN = { top: 28, right: 12, bottom: 16, left: 62 };
const COLUMN_GAP = 20;

export default function OverallPerformance() {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const height = 2 * PANEL_HEIGHT + LEGEND_HEIGHT;
    const panelWidth = (WIDTH - COLUMN_GAP) / 2;
    const innerWidth = panelWidth - MARGIN.left - MARGIN.right;
    const innerHeight = PANEL_HEIGHT - MARGIN.top - MARGIN.bottom;

    const svg = d3
      .select(ref.current)
      .attr("viewBox", `0 0 ${WIDTH} ${height}`)
      .style("font-family", "inherit")
      .style("fill", "var(--foreground)");
    svg.selectAll("*").remove();

    const x = d3
      .scaleBand<string>()
      .domain(MODELS)
      .range([0, innerWidth])
      .padding(0.3);
    const jitter = d3.randomUniform.source(d3.randomLcg(0.42))(
      -x.bandwidth() / 2,
      x.bandwidth() / 2
    );

    PANELS.forEach((panel, i) => {
      const series = data[panel.key] as Record<
        (typeof MODELS)[number],
        number[]
      >;
      const [lo, hi] = d3.extent(MODELS.flatMap(m => series[m])) as [
        number,
        number,
      ];
      const y = d3
        .scaleLog()
        .domain([lo / 1.5, hi * 1.5])
        .range([innerHeight, 0]);

      const g = svg
        .append("g")
        .attr(
          "transform",
          `translate(${(i % 2) * (panelWidth + COLUMN_GAP) + MARGIN.left}, ${Math.floor(i / 2) * PANEL_HEIGHT + MARGIN.top})`
        );

      g.append("text")
        .attr("x", innerWidth / 2)
        .attr("y", -12)
        .attr("text-anchor", "middle")
        .attr("font-size", 14)
        .attr("font-weight", 700)
        .text(panel.title);

      const powers = d3.range(
        Math.ceil(Math.log10(y.domain()[0])),
        Math.floor(Math.log10(y.domain()[1])) + 1
      );
      g.append("g")
        .selectAll("line")
        .data(powers)
        .join("line")
        .attr("x1", 0)
        .attr("x2", innerWidth)
        .attr("y1", p => y(10 ** p))
        .attr("y2", p => y(10 ** p))
        .style("stroke", "var(--muted)");

      const tick = g
        .append("g")
        .attr("font-size", 11)
        .attr("fill-opacity", 0.7)
        .selectAll("text")
        .data(powers)
        .join("text")
        .attr("x", -8)
        .attr("y", p => y(10 ** p) + 4)
        .attr("text-anchor", "end");
      tick.append("tspan").text("10");
      tick
        .append("tspan")
        .attr("dy", -6)
        .attr("font-size", 8)
        .text(p => p);

      g.append("line")
        .attr("y1", 0)
        .attr("y2", innerHeight)
        .style("stroke", "currentColor")
        .attr("stroke-opacity", 0.3);
      g.append("line")
        .attr("x1", 0)
        .attr("x2", innerWidth)
        .attr("y1", innerHeight)
        .attr("y2", innerHeight)
        .style("stroke", "currentColor")
        .attr("stroke-opacity", 0.3);

      g.append("text")
        .attr("transform", `translate(${-44}, ${innerHeight / 2}) rotate(-90)`)
        .attr("text-anchor", "middle")
        .attr("font-size", 11)
        .text(panel.yLabel);

      MODELS.forEach((model, m) => {
        const center = x(model)! + x.bandwidth() / 2;
        g.append("g")
          .selectAll("circle")
          .data(series[model])
          .join("circle")
          .attr("cx", () => center + jitter() * 0.6)
          .attr("cy", v => y(v))
          .attr("r", 3)
          .style("fill", COLORS[m])
          .attr("fill-opacity", 0.65)
          .style("stroke", "var(--foreground)")
          .attr("stroke-opacity", 0.35)
          .attr("stroke-width", 0.6)
          .append("title")
          .text(v => `${model}: ${panel.format(v)}`);

        const median = d3.median(series[model])!;
        g.append("line")
          .attr("x1", center - x.bandwidth() / 2)
          .attr("x2", center + x.bandwidth() / 2)
          .attr("y1", y(median))
          .attr("y2", y(median))
          .style("stroke", "currentColor")
          .attr("stroke-width", 2)
          .append("title")
          .text(`${model} median: ${panel.format(median)}`);
      });
    });

    const legendRow = svg.append("g");
    const legend = legendRow
      .selectAll<SVGGElement, string>("g")
      .data(MODELS)
      .join("g");
    legend
      .append("circle")
      .attr("r", 5)
      .style("fill", (_, i) => COLORS[i])
      .style("stroke", "var(--foreground)")
      .attr("stroke-opacity", 0.35)
      .attr("stroke-width", 0.6);
    legend
      .append("text")
      .attr("x", 12)
      .attr("y", 4)
      .attr("font-size", 13)
      .text(d => d);

    let offset = 0;
    legend.attr("transform", function () {
      const at = offset;
      offset += this.getBBox().width + 32;
      return `translate(${at}, 0)`;
    });
    legendRow.attr(
      "transform",
      `translate(${(WIDTH - offset + 32) / 2}, ${2 * PANEL_HEIGHT + 20})`
    );
  }, []);

  return (
    <svg
      ref={ref}
      role="img"
      aria-label="Per-checkpoint cost, time, net lines, and complexity mass added for Opus 4.6, GPT-5.2, GPT-5.3 Codex, and GPT-5.4, with medians"
      style={{ width: "100%", height: "auto" }}
    />
  );
}
