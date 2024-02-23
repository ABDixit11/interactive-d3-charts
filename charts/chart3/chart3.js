const REGIONS = [
  "North America",
  "Sub-Saharan Africa",
  "East Asia & Pacific",
  "South Asia",
  "Latin America & Caribbean",
  "Middle East & North Africa",
  "Europe & Central Asia",
];

const DEV_FACTORS = [
  "Birth Rate",
  "Death Rate",
  "Fertility Rate",
  "Life Expectancy at Birth, Female",
  "Life Expectancy at Birth, Male",
  "Life Expectancy at Birth, Total",
  "Population Growth",
  "Total Population",
  "Mobile Cellular Subscriptions",
  "Mobile Cellular Subscriptions per 100 People",
  "Telephone Lines",
  "Telephone Lines per 100 People",
  "Agricultural Land",
  "Agricultural Land Percent",
  "Arable Land",
  "Arable Land Percent",
  "Land Area",
  "Rural Population",
  "Rural Population Growth",
  "Surface Area",
  "Population Density",
  "Urban Population Percent",
  "Urban Population Percent Growth",
];
var minRadius = 4;
var maxRadius = 30;
var masterData = [];
var xAxis,
  beeswarmYear,
  beeswarmXAttr,
  beeswarmSizeAttr,
  beeswarmCheckedRegions,
  xScale,
  colorScale,
  svg,
  innerSvg,
  innerSvgHeight,
  innerSvgWidth,
  tooltip,
  xAxisLabel,
  margin;

//DATA WRANGLING
function loadMainChart() {
  Promise.all([
    d3.csv("/data/countries_regions.csv"),
    d3.csv("/data/global_development.csv"),
  ]).then(function (values) {
    console.log("Error");
    const regionData = values[0];
    const globalData = values[1];
    globalData.forEach((element) => {
      modifiedObject = {};
      Object.keys(element).forEach((key) => {
        const splitKey = key.split(".");
        const newKey = splitKey[splitKey.length - 1];
        modifiedObject[newKey] = element[key];
      });
      regionData.forEach((region) => {
        if (region.name === element["Country"]) {
          modifiedObject["geo"] = region["geo"];
          modifiedObject["region"] = region["World bank region"];
        }
      });
      masterData.push(modifiedObject);
    });
    initUI();
    initChart();
  });
}

//INITIALIZE THE UI AND ADD EVENT LISTENERS
function initUI() {
  const xAxisSelectList = d3.select("#x-axis-attribute");
  const sizeSelectList = d3.select("#size-attribute");
  xAxisSelectList
    .selectAll("option")
    .data(DEV_FACTORS)
    .enter()
    .append("option")
    .text((d) => d)
    .attr("value", (d) => d);

  sizeSelectList
    .selectAll("option")
    .data(DEV_FACTORS)
    .enter()
    .append("option")
    .text((d) => d)
    .attr("value", (d) => d);

  var xValueDropdown = document.getElementById("x-axis-attribute");
  xValueDropdown.addEventListener("change", () => {
    var selectedValue = xValueDropdown.value;
    beeswarmXAttr = selectedValue;
    updateChart();
  });
  var sizeValueDropdown = document.getElementById("size-attribute");
  sizeValueDropdown.addEventListener("change", () => {
    var selectedValue = sizeValueDropdown.value;
    beeswarmSizeAttr = selectedValue;
    updateChart();
  });

  d3.selectAll(".checkbox-input").on("change", afterCheckboxUpdate);

  selectAllButton.addEventListener("click", function () {
    checkboxes.forEach(function (checkbox) {
      checkbox.checked = true;
    });
    afterCheckboxUpdate();
  });
  deselectAllButton.addEventListener("click", function () {
    checkboxes.forEach(function (checkbox) {
      checkbox.checked = false;
    });
    afterCheckboxUpdate();
  });

  function afterCheckboxUpdate() {
    const checkedCheckboxes = d3.selectAll(".checkbox-input:checked").nodes();
    const checkedValues = checkedCheckboxes.map((checkbox) => checkbox.value);
    beeswarmCheckedRegions = checkedValues;
    updateChart();
  }
}

//INITIALIZE THE CHART, PLOT AXIS, DEFINE SCALES.
function initChart() {
  svg = d3.select("#beeswarm-svg");
  const width = +svg.style("width").replace("px", "");
  const height = +svg.style("height").replace("px", "");
  margin = { top: 20, bottom: 45, left: 35, right: 20 };
  innerSvgHeight = height - margin.top - margin.bottom;
  innerSvgWidth = width - margin.right - margin.left;

  tooltip = d3.select("body").append("div").attr("class", "tooltip");
  innerSvg = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`)
    .attr("class", "inner-svg-bar");

  //Put initial value
  beeswarmXAttr = "Birth Rate";
  beeswarmSizeAttr = "Birth Rate";
  beeswarmCheckedRegions = ["North America"];
  beeswarmYear = 2000;
  colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(REGIONS);
  xScale = d3.scaleLinear().range([0, innerSvgWidth]);
  xAxis = d3.axisBottom(xScale);

  d3.selectAll(".color-dot")
    .data(REGIONS)
    .style("background-color", (d) => colorScale(d));

  innerSvg
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${innerSvgHeight})`)
    .call(xAxis);

  xAxisLabel = svg
    .append("text")
    .classed("x-axis-label", true)
    .attr("text-anchor", "end")
    .attr("x", (innerSvgWidth + margin.left + margin.right) / 2)
    .attr("y", innerSvgHeight + margin.top + margin.bottom - 5)
    .text(beeswarmXAttr);

  updateChart();
}

function yearChanged(year) {
  beeswarmYear = year;
  updateChart();
}

//THIS FUNCTION WILL RUN ON ANY CHANGE DETECTED IN THE CONTROL PANEL
function updateChart() {
  d3.select(".x-axis-label")
    .transition()
    .duration(100)
    .style("opacity", 0)
    .remove();

  var filteredResults = masterData
    .filter((obj) => {
      return (
        beeswarmCheckedRegions.includes(obj["region"]) &&
        obj["Year"] == beeswarmYear
      );
    })
    .map((obj) => ({
      [beeswarmXAttr]: +obj[beeswarmXAttr],
      [beeswarmSizeAttr]: +obj[beeswarmSizeAttr],
      Country: obj["Country"],
      Year: +obj["Year"],
      region: obj["region"],
    }));

  var maxXScale = d3.max(filteredResults, (d) => d[beeswarmXAttr]);
  var minXScale = d3.min(filteredResults, (d) => d[beeswarmXAttr]);

  xScale.domain([
    minXScale - getPowerOf10(maxXScale),
    maxXScale + getPowerOf10(maxXScale),
  ]);
  innerSvg.select(".x-axis").transition().duration(500).call(xAxis);

  const radiusScale = d3
    .scaleLinear()
    .domain([
      d3.min(filteredResults, (d) => d[beeswarmSizeAttr]),
      d3.max(filteredResults, (d) => d[beeswarmSizeAttr]),
    ])
    .range([minRadius, maxRadius]);

  //Initialize x and y as forceSimulation may return NaN values
  filteredResults = filteredResults.map((obj) => {
    return Object.assign({}, obj, {
      x: xScale(obj[beeswarmXAttr]),
      y: innerSvgHeight / 2,
    });
  });

  xAxisLabel = svg
    .append("text")
    .classed("x-axis-label", true)
    .attr("text-anchor", "end")
    .attr("x", (innerSvgWidth + margin.left + margin.right) / 2)
    .attr("y", innerSvgHeight + margin.top + margin.bottom - 5)
    .text(beeswarmXAttr)
    .transition()
    .duration(1000)
    .style("opacity", 1);

  //CREATE A SIMULATION
  const simulation = d3
    .forceSimulation(filteredResults)
    .force(
      "x",
      d3.forceX().x(function (d) {
        return xScale(d[beeswarmXAttr]);
      })
    )
    .force(
      "y",
      d3.forceY().y(function (d) {
        return innerSvgHeight / 2;
      })
    )
    .force(
      "collide",
      d3.forceCollide().radius((d) => radiusScale(d[beeswarmSizeAttr]) + 1)
    )
    .stop();

  //RUN SIMULATION UNTIL THE 2000TH TICK
  simulation.tick(2000);

  var circles = innerSvg.selectAll(".omg-circle").data(filteredResults);

  circles.join(
    function (enter) {
      return enter
        .append("circle")
        .classed("omg-circle", true)
        .attr("cy", (d) => d.y)
        .attr("fill", (d) => colorScale(d["region"]))
        .attr("cx", (d) => d.x)
        .attr("r", 0)
        .style("stroke", "black")
        .attr("stroke-width", 1)
        .on("mouseover", function (event, d) {
          tooltip
            .html(
              "Country: " +
                d["Country"] +
                "<br>" +
                beeswarmXAttr +
                ": " +
                d[beeswarmXAttr] +
                "<br>" +
                beeswarmSizeAttr +
                ": " +
                d[beeswarmSizeAttr]
            )
            .style("opacity", 1);
        })
        .on("mousemove", function (event, d) {
          tooltip
            .style("left", event.pageX + 20 + "px")
            .style("top", event.pageY - 80 + "px");
        })
        .on("mouseleave", function (event, d) {
          tooltip.style("opacity", 0);
        })
        .transition()
        .delay((d, i) => i * 10)
        .duration(1000)
        .attr("r", (d) => radiusScale(d[beeswarmSizeAttr]));
    },
    function (update) {
      update
        .on("mouseover", function (event, d) {
          tooltip
            .html(
              "Country: " +
                d["Country"] +
                "<br>" +
                beeswarmXAttr +
                ": " +
                d[beeswarmXAttr] +
                "<br>" +
                beeswarmSizeAttr +
                ": " +
                d[beeswarmSizeAttr]
            )
            .style("opacity", 1);
        })
        .on("mousemove", function (event, d) {
          tooltip
            .style("left", event.pageX + 20 + "px")
            .style("top", event.pageY - 80 + "px");
        })
        .on("mouseleave", function (event, d) {
          tooltip.style("opacity", 0);
        })
        .transition()
        .delay((d, i) => i * 10)
        .duration(1000)
        .attr("cx", (d) => d.x)
        .attr("cy", (d) => d.y)
        .attr("r", (d) => radiusScale(d[beeswarmSizeAttr]))
        .attr("fill", (d) => colorScale(d["region"]))
        .style("stroke", "black") // Add a 1px black border
        .attr("stroke-width", 1);
    },
    function (exit) {
      exit
        .transition()
        .delay((d, i) => i * 10)
        .duration(1000)
        .attr("r", 0)
        .remove();
    }
  );
}

//GET THE NEAREST POWER OF A NUMBER FOR ADDING PADDING IN THE X AXIS.
function getPowerOf10(number) {
  if (typeof number !== "number" || isNaN(number) || number <= 0) {
    return 0;
  }
  let power = 1;
  while (number >= 10) {
    number /= 10;
    power *= 10;
  }
  return power;
}
