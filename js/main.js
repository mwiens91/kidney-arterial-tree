import { makeBranches as makeABTBranches } from "./modules/make_abt_branches.mjs";
import { makeBranches as makeKSABTBranches } from "./modules/make_ksabt_branches.mjs";

// Maximum svg height
const MAX_HEIGHT = 690;

const resize = () => {
  const svgDiv = document.getElementById("div-svg");
  const width = svgDiv.clientWidth;

  d3.select("svg")
    .attr("width", width)
    .attr("height", () => (width > MAX_HEIGHT ? MAX_HEIGHT : width));
};

// Render the tree
const drawTree = (branches, initialize = true, drawNephrons = false) => {
  // Clear previous render
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
  branches.sort((a, b) => b.isAfferent - a.isAfferent);

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

// Get the options input and generate the tree
const generate = (initialize) => {
  // This will store the branches to render
  let branches;

  // Initial diameter
  const initDiam = parseFloat(document.getElementById("input-init-diam").value);

  // Flag for whether to draw nephrons
  const drawNephrons = document.getElementById("input-nephron").checked;

  // Angle delta
  const angleDelta = document.getElementById("input-angle-delta").value / 200;

  // Type of tree
  const treeType = document.getElementById("form-select").value;

  if (treeType === "KSABT") {
    branches = makeKSABTBranches(initDiam, 22, angleDelta);
  } else {
    branches = makeABTBranches(initDiam, 22, angleDelta);
  }

  drawTree(branches, initialize, drawNephrons);
};

// Redraw the tree on submitting form—also make sure to block the submit
// propagation so the page doesn't reload
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

// Grab any query params and set these as options
const urlSearchParams = new URLSearchParams(window.location.search);
const params = Object.fromEntries(urlSearchParams.entries());

// Tree-type query param
if (params.hasOwnProperty("treetype")) {
  const treeType = params.treetype.toUpperCase();

  if (treeType === "ABT" || treeType === "KSABT") {
    document.getElementById("form-select").value = treeType;
  }
}

// Initial diameter query param
if (params.hasOwnProperty("initdiam")) {
  const initDiam = parseFloat(params.initdiam);

  if (initDiam >= 30) {
    document.getElementById("input-init-diam").value = initDiam;
  }
}

// Angle delta query param
if (params.hasOwnProperty("angledelta")) {
  const angleDelta = parseInt(params.angledelta);

  if (angleDelta >= 0 && angleDelta <= 100) {
    document.getElementById("input-angle-delta").value = angleDelta;
  }
}

if (params.hasOwnProperty("drawnephrons")) {
  const drawNephrons = !(params.drawnephrons.toLowerCase() === "false");

  document.getElementById("input-nephron").checked = drawNephrons;
}

generate(true);
