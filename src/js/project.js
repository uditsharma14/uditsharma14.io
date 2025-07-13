// --- Globals & State ---
const svg = d3.select("#chart"),
  margin = { top: 50, right: 20, bottom: 80, left: 100 },
  width = +svg.attr("width") - margin.left - margin.right,
  height = +svg.attr("height") - margin.top - margin.bottom,
  container = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

let fullData = [], xScale, yScale, currentScene = 0, scenes;


const svg2 = d3.select("#map")
  // ensure the map SVG is the same size as your chart SVG
  .attr("width", +svg.attr("width"))
  .attr("height", +svg.attr("height"))
  // origin 0,0 in its own box
  .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`);

const projection = d3.geoNaturalEarth1()
  .fitSize(
    [width + margin.left + margin.right, height + margin.top + margin.bottom],
    { type: "Sphere" }
  );

const path = d3.geoPath(projection);

// target the tooltip you actually have in your HTML
const tooltipMap = d3.select("#tooltip-map");

const tooltip = d3.select("#tooltip");
const dataUrl = 'https://uditsharma14.github.io/uditsharma14.io/data/owid-covid-data_final_2023_1.csv';

// --- Scene Definitions ---
function renderOverview() {
  drawAxes(xScale, yScale);
  drawBars(fullData, xScale, yScale);
  const x1 = xScale.copy().domain([parseDate("2020-03-01"), parseDate("2021-01-31")]);
  const ann = d3.annotation()
    .annotations([{
      note: { title: "Covid Cases Overview ", label: "SARS Covid-19 2020-2023" },
      x: x1(parseDate("2020-07-15")),
      y: yScale(4500_000),
      dx: 0, dy: -40
    }]);

  container.append("g")
    .attr("class", "annotation-group")
    .call(ann);

}

function renderFirstWave() {
  const x1 = xScale.copy().domain([parseDate("2020-03-01"), parseDate("2021-01-31")]);
  drawAxes(x1, yScale);
  drawBars(fullData.filter(d => d.date >= x1.domain()[0] && d.date <= x1.domain()[1]), x1, yScale);

  const ann = d3.annotation()
    .annotations([{
      note: { title: "Covid First Wave,Daily ~70K cases", label: "July 2020 Peak" },
      x: x1(parseDate("2020-07-15")),
      y: yScale(70_000),
      dx: 0, dy: -40
    }]);
  container.append("g").call(ann);
}

function renderOmicron() {
  const x2 = xScale.copy().domain([parseDate("2021-11-01"), parseDate("2022-03-31")]);
  drawAxes(x2, yScale);
  drawBars(fullData.filter(d => d.date >= x2.domain()[0] && d.date <= x2.domain()[1]), x2, yScale);

  const ann = d3.annotation()
    .annotations([
      {
        note: { title: "Rapid Surge", label: "Nov–Dec 2021" },
        x: x2(parseDate("2021-12-01")),
        y: yScale(1_000_000),
        dx: -20, dy: -40
      },
      {
        note: { title: "Omicron Wave", label: "Nov 2021 – Feb 2022" },
        x: x2(parseDate("2022-02-01")),
        y: yScale(4500_000),
        dx: -20, dy: -40
      },
      {
        note: { title: "Decline", label: "Feb–Mar 2022" },
        x: x2(parseDate("2022-02-15")),
        y: yScale(1_200_000),
        dx: +30, dy: +30
      }
    ]);
  container.append("g").call(ann);
}




// --- Load & Parse Data ---
const parseDate = d3.timeParse("%Y-%m-%d");
d3.csv(dataUrl,
  d => d.iso_code === "USA"
    ? { date: parseDate(d.date), cases: +d.new_cases }
    : null
).then(raw => {
  fullData = raw.filter(d => d).sort((a, b) => a.date - b.date);

  // define base scales
  xScale = d3.scaleTime()
    .range([0, width])
    .domain(d3.extent(fullData, d => d.date));
  yScale = d3.scaleLinear()
    .range([height, 0])
    .domain([0, d3.max(fullData, d => d.cases)]);

  // define scenes
  scenes = [renderOverview, renderFirstWave, renderOmicron];
  // wire buttons
  d3.select("#prev").on("click", () => changeScene(-1));
  d3.select("#next").on("click", () => changeScene(1));
  // initial render
  renderScene();
});

// --- Scene Control ---
function changeScene(delta) {
  currentScene = Math.max(0, Math.min(scenes.length - 1, currentScene + delta));
  d3.select("#prev").property("disabled", currentScene === 0);
  d3.select("#next").property("disabled", currentScene === scenes.length - 1);
  renderScene();
}

function renderScene() {
  container.selectAll("*").remove();
  scenes[currentScene]();
}

// --- Shared Drawing Helpers ---
function drawAxes(x, y) {
  container.append("g")
    .call(d3.axisLeft(y).tickFormat(d3.format(",")));
  container.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%b %Y")))
    .selectAll("text")
    .attr("text-anchor", "end")
    .attr("transform", "rotate(-40) translate(-5,0)");
  // Axis titles
  svg.selectAll(".axis-title").remove();
  svg.append("text")
    .attr("class", "axis-title")
    .attr("x", margin.left + width / 2)
    .attr("y", margin.top + height + 60)
    .attr("text-anchor", "middle")
    .text("Date (Month Year)");
  svg.append("text")
    .attr("class", "axis-title")
    .attr("transform",
      `translate(${margin.left - 60},${margin.top + height / 2}) rotate(-90)`)
    .attr("text-anchor", "middle")
    .text("Daily New COVID-19 Cases");
}

function drawBars(data, x, y) {
  container.selectAll("rect")
    .data(data)
    .join("rect")
    .attr("x", d => x(d.date) - 1)
    .attr("y", d => y(d.cases))
    .attr("width", 2)
    .attr("height", d => height - y(d.cases))
    .attr("fill", "blue")                    // ← add this
    .on("mouseover", function (event, d) {
      const [mx, my] = d3.pointer(event, document.body);
      tooltip.style("opacity", 1)
        .html(`<strong>${d3.timeFormat("%b %d, %Y")(d.date)}</strong><br/>${d3.format(",")(d.cases)} cases`)
        .style("left", (mx + 10) + "px")
        .style("top", (my - 30) + "px");
    })
    .on("mouseout", () => tooltip.style("opacity", 0));
}


// 1) Load both datasets in parallel
Promise.all([
  d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"),
  d3.csv("https://uditsharma14.github.io/uditsharma14.io/data/owid-covid-data_final_2023_1.csv", d => ({
    iso: d.iso_code,
    continent: d.continent,
    location: d.location,
    date: d3.timeParse("%Y-%m-%d")(d.date),
    totalCases: +d.total_cases || 0,
    totaldeaths: + d.total_deaths||0
  }))
]).then(([world, rawData]) => {

  const iso3List = world.features.map(f => f.id);
  // --- 1) Aggregate to latest per ISO code ---
  const casesByIso = new Map();
  rawData.forEach(d => {
    if (!d.iso || !d.date) return;  // skip invalid rows
    const existing = casesByIso.get(d.iso);
    if ((!existing || d.date > existing.date) && iso3List.includes(d.iso)) {
      casesByIso.set(d.iso, d);
    }
  });

  const isoByContinent = new Map();
  rawData.forEach(d => {
    if (iso3List.includes(d.iso)) {
      isoByContinent.set(d.iso, d.continent);
    }
  });

  // Build continent color scale
  const continents = Array.from(new Set(Array.from(casesByIso.values()).map(d => d.continent).filter(c => c)));
  const allTotals = Array.from(casesByIso.values()).map(d => d.totalCases);
  const minCases = d3.min(allTotals);
  const maxCases = d3.max(allTotals);

  const color = d3.scaleOrdinal().domain(continents).range(d3.schemeCategory10);

  const colorByCases = d3.scaleSequential()
    .domain([minCases, maxCases])
    .interpolator(d3.interpolateRgb("#fee5d9", "#8B0000"))
    .clamp(true);  // light → dark

  // Draw countries
  svg2.append("g")
    .selectAll("path")
    .data(world.features)
    .join("path")
    .attr("class", "country")
    .attr("d", path)
    .attr("fill", d => {
      const info = casesByIso.get(d.id);
      return info
        ? colorByCases(info.totalCases)   // ← use totalCases here
        : "#eee";
    })
    .on("mouseover", (event, d) => {
      const info = casesByIso.get(d.id);
      tooltipMap.html(`
        <strong>${d.properties.name}</strong><br/>
        Continent: ${info ? info.continent : "N/A"}<br/>
        Total cases: ${info ? d3.format(",")(info.totalCases) : "N/A"}</br>
        Total Deaths: ${info ? d3.format(",")(info.totaldeaths) : "N/A"}
      `)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px")
        .style("opacity", 1);
    })
    .on("mouseout", () => tooltipMap.style("opacity", 0));

  // after you compute `continents` (and before drawing the map):
  const select = d3.select("#continent-select");

  // add one <option> per continent
  select.selectAll("option.continent")
    .data(continents)
    .enter().append("option")
    .classed("continent", true)
    .attr("value", d => d)
    .text(d => d);

  // when the user picks a continent, re‐shade the map:
  select.on("change", () => {
    const chosen = select.node().value;
    svg2.selectAll("path.country")
      .transition().duration(300)
      .style("opacity", d => {
        const info = casesByIso.get(d.id);
        return (chosen === "All" || (info && info.continent === chosen))
          ? 1
          : 0;
      });
  });
  // 1) Legend dimensions & position
const legendWidth   = 120,
      legendHeight  = 12,
      legendX       = 10,
      legendY       = +svg2.attr("height") - margin.bottom + 30;

// 2) Ensure you have a <defs> + gradient (reuse if already present)
const defs = svg2.select("defs") .empty()
  ? svg2.append("defs")
  : svg2.select("defs");

const gradient = defs.select("#cases-gradient").empty()
  ? defs.append("linearGradient").attr("id","cases-gradient")
            .attr("x1","0%").attr("y1","0%")
            .attr("x2","100%").attr("y2","0%")
  : defs.select("#cases-gradient");

// 3) (Re)populate your gradient stops
gradient.selectAll("stop").remove();
d3.range(0,1.01,0.01).forEach(t => {
  gradient.append("stop")
    .attr("offset", `${t*100}%`)
    .attr("stop-color", colorByCases(minCases + t*(maxCases-minCases)));
});

// 4) Draw the legend bar group
const legendG = svg2.append("g")
  .attr("transform", `translate(${legendX},${legendY})`);

// 5) Gradient rect
legendG.append("rect")
  .attr("width",  legendWidth)
  .attr("height", legendHeight)
  .style("fill", "url(#cases-gradient)")
  .style("stroke", "#ccc")
  .style("stroke-width", 1);

// 6) Min & Max labels
legendG.append("text")
  .attr("x", 0)
  .attr("y", legendHeight + 16)
  .attr("text-anchor","start")
  .style("font-size","12px")
  .text(d3.format(".2s")(minCases));

legendG.append("text")
  .attr("x", legendWidth)
  .attr("y", legendHeight + 16)
  .attr("text-anchor","end")
  .style("font-size","12px")
  .text(d3.format(".2s")(maxCases));

// 7) Optional title above
legendG.append("text")
  .attr("x", 0)
  .attr("y", -6)
  .style("font-size","13px")
  .style("font-weight","600")
  .text("Total Cases");

  

});


