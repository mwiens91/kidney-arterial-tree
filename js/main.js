import { makeBranches as makeABTBranches } from "./modules/make_abt_branches.mjs";
import { makeBranches as makeKSABTBranches } from "./modules/make_ksabt_branches.mjs";

// Maximum svg height
const MAX_HEIGHT = 690;

// This will store the branches to render
let branches;

// Starting and stop diameter—the stop diameter is fixed (some values in
// the distributions to generate the trees seem to depend on this value)
let initDiam;
const STOP_DIAM = 22;

// Flag for whether to draw nephrons
let drawNephrons;

// Angle delta
let angleDelta;

// Type of tree
let treeType;

const resize = () => {
  const svgDiv = document.getElementById("div-svg");
  const width = svgDiv.clientWidth;

  d3.select("svg")
    .attr("width", width)
    .attr("height", () => (width > MAX_HEIGHT ? MAX_HEIGHT : width));
};

const drawTree = (initialize = true, drawNephrons = false) => {
  if (!initialize) {
    d3.selectAll("circle").remove();
    d3.selectAll("line").remove();
  }

  // Find extrema of coordinates
  const xVals = branches.map((branch) => [branch.x1, branch.x2]).flat();
  let minX = Math.min(...xVals);
  let maxX = Math.max(...xVals);

  const yVals = branches.map((branch) => [branch.y1, branch.y2]).flat();
  let minY = Math.min(...yVals);
  let maxY = Math.max(...yVals);

  // Dynamically scale nephron radius as a function of viewbox
  const nephronRadius = Math.max(10, (maxY - minY) / 500);

  // Add the nephron radius to the extrema of coordinates so they're
  // always shown in the viewbox
  minX -= nephronRadius * 2;
  maxX += nephronRadius * 2;
  minY -= nephronRadius * 2;
  maxY += nephronRadius * 2;

  // Draw the tree
  const svg = d3
    .select("svg")
    .call(
      d3.zoom().on("zoom", ({ transform }) => g.attr("transform", transform))
    )
    .attr(
      "viewBox",
      minX + " " + minY + " " + (maxX - minX) + " " + (maxY - minY)
    );

  const g = svg.append("g");

  // Sort branches so afferent arterioles are drawn first
  branches.sort((a, b) => b.isAfferent - a.isAfferent)

  // Draw the vessels
  g.selectAll("line")
    .data(branches)
    .enter()
    .append("line")
    .attr("x1", (d) => d.x1)
    .attr("y1", (d) => d.y1)
    .attr("x2", (d) => d.x2)
    .attr("y2", (d) => d.y2)
    .style("stroke-width", (d) => d.diameter * 0.2 + "px")
    .style("stroke", (d) => (d.isAfferent ? "green" : "red"))
    .attr("id", (d) => "id-" + d.i);

  // Draw the nephrons if we're asked to
  if (drawNephrons) {
    g.selectAll("circle")
      .data(branches.filter((branch) => branch.isAfferent))
      .enter()
      .append("circle")
      .attr("cx", (d) => d.x2)
      .attr("cy", (d) => d.y2)
      .attr("r", nephronRadius)
      .attr("id", (d) => "id-nephron" + d.i);
  }

  // Fit the svg to its container size
  resize();
};

const generate = (initialize) => {
  initDiam = parseFloat(document.getElementById("input-init-diam").value);
  drawNephrons = document.getElementById("input-nephron").checked;
  angleDelta = document.getElementById("input-angle-delta").value / 200;
  treeType = document.getElementById("form-select").value;

  if (treeType === "KSABT") {
    branches = makeKSABTBranches(initDiam, STOP_DIAM, angleDelta);
  } else {
    branches = makeABTBranches(initDiam, STOP_DIAM, angleDelta);
  }

  drawTree(initialize, drawNephrons);
};

// Redraw the tree on submitting form
const form = document.getElementById("form-options");
form.addEventListener("submit", (e) => {
  if (!form.checkValidity()) {
    e.preventDefault();
    e.stopPropagation();
    form.classList.add("was-validated");
  } else {
    e.preventDefault();
    generate(false);
  }
});

// Resize the svg when the window size changes
window.addEventListener("resize", resize);

generate(true);
