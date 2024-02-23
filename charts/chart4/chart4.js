var xAxis,
  selectedYear = 1992,
  svg,
  innerSvg,
  innerSvgHeight,
  innerSvgWidth,
  tooltip,
  xAxisLabel,
  margin,
  planetData,
  width,
  height,
  planetNumber;

const PLANET_TYPE = ["Gas Giant", "Super Earth", "Neptune-like", "Terrestrial"];
const colorCategory = {
  "Gas Giant": "#ffcc00",
  "Super Earth": "#33cc33",
  "Neptune-like": "#3366cc",
  Terrestrial: "#ff66b2",
  "Planet's Sun": "#ffffff",
};

let t0 = Date.now();
//DATA WRANGLING
function loadMainChart() {
  Promise.all([d3.csv("/data/exoplanets.csv")]).then(function (values) {
    rawData = values[0];
    planetData = rawData
      .map((obj) => {
        const numericFields = [
          "orbital_radius",
          "stellar_magnitude",
          "discovery_year",
          "mass_multiplier",
          "radius_multiplier",
          "orbital_period",
        ];
        numericFields.forEach((field) => {
          obj[field] = Number(obj[field]);
        });
        const isEmpty = Object.values(obj).some(
          (value) => value === "" || value === null
        );
        newObj = {
          planet_radius_km: obj["radius_multiplier"] * getPlanetRadius(obj),
        };
        return isEmpty ? null : { ...obj, ...newObj };
      })
      .filter(Boolean);
    initUI();
    initChart();
  });
}

function getPlanetRadius(obj) {
  const planetRadius = { Jupiter: 69911, Earth: 6371 };
  if (obj !== "") {
    return planetRadius[obj["radius_wrt"]];
  }
  return 1;
}

function initUI() {
  const yearSlider = document.getElementById("yearSlider");
  const playButton = document.getElementById("playButton");
  const pauseButton = document.getElementById("pauseButton");
  const xValueDropdown = document.getElementById("x-axis-attribute");
  const sizeValueDropdown = document.getElementById("size-attribute");
  const yearInput = document.getElementById("year-display");
  let year = 1992;
  let intervalId;
  yearSlider.value = year;
  yearInput.textContent = year;
  function updateYear() {
    yearInput.textContent = year;
    yearSlider.value = year;
    try {
      yearChanged(year);
    } catch (error) {
      console.log("Not defined error");
    }
  }

  yearSlider.addEventListener("input", () => {
    year = parseInt(yearSlider.value);
    yearSlider.value = year;
    yearInput.textContent = year;
  });

  yearSlider.addEventListener("change", () => {
    updateYear();
  });

  playButton.addEventListener("click", () => {
    playButton.disabled = true;
    pauseButton.disabled = false;
    if (year === 2023) {
      year = 1992;
    }
    updateYear();
    intervalId = setInterval(() => {
      if (year < 2023) {
        year++;
        updateYear();
      }
      if (year == 2023) {
        playButton.disabled = false;
        pauseButton.disabled = true;
        clearInterval(intervalId);
      }
    }, 3500); //Adding 3.5 second delay between two transitions (Years)
  });

  pauseButton.addEventListener("click", () => {
    playButton.disabled = false;
    pauseButton.disabled = true;
    clearInterval(intervalId);
  });

  document.addEventListener("click", (event) => {
    if (event.target == xValueDropdown || event.target == sizeValueDropdown) {
      playButton.disabled = false;
      pauseButton.disabled = true;
      clearInterval(intervalId);
    }
  });

  const legendContainers = d3.selectAll(".legend-container");

  legendContainers.each(function (d, i) {
    const container = d3.select(this);
    const category = container.select(".legend-label").text();

    if (colorCategory[category]) {
      container
        .select(".color-dot")
        .style("background-color", colorCategory[category]);
    }
  });
}

function yearChanged(year) {
  selectedYear = year;
  updateChart();
}

function initChart() {
  const svgElement = document.getElementById("exo-svg");
  svgElement.setAttribute("width", window.innerWidth);
  svgElement.setAttribute("height", window.innerHeight + 400);

  svg = d3.select("#exo-svg");
  width = +svg.style("width").replace("px", "");
  height = +svg.style("height").replace("px", "");
  margin = { top: 20, bottom: 45, left: 35, right: 20 };
  innerSvgHeight = height - margin.top - margin.bottom;
  innerSvgWidth = width - margin.right - margin.left;

  tooltip = d3.select("body").append("div").attr("class", "tooltip");
  innerSvg = svg
    .append("g")
    .attr("transform", `translate(${width / 2},${height / 2})`)
    .attr("class", "inner-svg-bar");

  innerSvg
    .append("circle")
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("r", 20)
    .attr("fill", "white");

  const zoom = d3.zoom().scaleExtent([0.1, 10]).on("zoom", zoomed);

  updateChart();
}

function zoomed(event) {
  svg.attr("transform", event.transform);
}

function updateChart() {
  d3.select(".lines").remove();
  const filteredData = planetData.filter(
    (d) => d.discovery_year === selectedYear
  );
  const planetNumber = document.getElementById("planet-count");
  planetNumber.textContent = filteredData.length;

  const minOrbitalRadius = d3.min(filteredData, (d) => d.orbital_radius);
  const maxOrbitalRadius = d3.max(filteredData, (d) => d.orbital_radius);

  const minOrbitalSpeed = d3.min(
    filteredData,
    (d) => (2 * Math.PI * d.orbital_radius) / d.orbital_period
  );
  const maxOrbitalSpeed = d3.max(
    filteredData,
    (d) => (2 * Math.PI * d.orbital_radius) / d.orbital_period
  );

  const minPlanetRadius = d3.min(filteredData, (d) => d.planet_radius_km);
  const maxPlanetRadius = d3.max(filteredData, (d) => d.planet_radius_km);

  const orbitalRadiusScale = d3
    .scaleLinear()
    .domain([
      minOrbitalRadius - getPowerOf10(maxOrbitalRadius),
      maxOrbitalRadius + +getPowerOf10(maxOrbitalRadius),
    ])
    .range([150, 400]);

  const orbitalSpeedScale = d3
    .scaleLinear()
    .domain([minOrbitalSpeed, maxOrbitalSpeed])
    .range([1, 5]);

  const planetaryRadiusScale = d3
    .scaleLinear()
    .domain([
      minPlanetRadius - getPowerOf10(maxPlanetRadius),
      maxPlanetRadius + getPowerOf10(maxPlanetRadius),
    ])
    .range([3, 18]);
  const planetColorScale = d3
    .scaleOrdinal()
    .domain(PLANET_TYPE)
    .range(["#ffcc00", "#33cc33", "#3366cc", "#ff66b2"]);

  const simulation = d3
    .forceSimulation(filteredData)
    .force("center", d3.forceCenter(0, 0))
    .force(
      "circle",
      d3.forceRadial((d) => orbitalRadiusScale(d.orbital_radius)).strength(1)
    )
    .force("charge", d3.forceManyBody().strength(-150))
    .stop();

  if ([1993, 1994, 1995, 1997].includes(selectedYear)) {
    simulation.tick(20);
  } else {
    simulation.tick(2500);
  }

  const lines = innerSvg.append("g").attr("class", "lines");
  const circles = innerSvg
    .selectAll(".planet")
    .data(filteredData)
    .join(
      function (enter) {
        return enter
          .append("circle")
          .classed("planet", true)
          .attr("r", 0)
          .attr("fill", (d) => planetColorScale(d.planet_type))
          .attr("cx", (d) => d.x)
          .attr("cy", (d) => d.y)
          .on("mouseover", function (event, d) {
            const x = d.x || 0;
            const y = d.y || 0;

            lines
              .append("line")
              .attr("class", "radius-line")
              .attr("x1", x)
              .attr("y1", y)
              .attr("x2", 0)
              .attr("y2", 0)
              .style("stroke", "white");

            lines
              .append("text")
              .attr("class", "radius-text")
              .attr("x", (x + 50) / 2)
              .attr("y", (y + 50) / 2)
              .style("fill", "white")
              .style("z-index", 100);

            tooltip
              .html(
                `<strong>Planet Details</strong><br> 
            <strong>Name</strong> : ${d.name} <br>
            <strong>Planet Type</strong> : ${d.planet_type} <br>
            <strong>Planet Radius</strong> : ${d.planet_radius_km} kilometers <br>
            <strong>Orbital Radius</strong> : ${d.orbital_radius} AU <br>
            <strong>Detection Method</strong> : ${d.detection_method} <br>`
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
            lines.selectAll(".radius-line, .radius-text").remove();
          })
          .transition()
          .duration(1000)
          .attr("r", (d) => planetaryRadiusScale(d.planet_radius_km));
      },
      function (update) {
        return update
          .on("mouseover", function (event, d) {
            tooltip
              .html(
                `<strong>Planet Details</strong><br> 
            <strong>Name</strong> : ${d.name} <br>
            <strong>Planet Type</strong> : ${d.planet_type} <br>
            <strong>Planet Radius</strong> : ${d.planet_radius_km} kilometers <br>
            <strong>Orbital Radius</strong> : ${d.orbital_radius} AU <br>
            <strong>Detection Method</strong> : ${d.detection_method} <br>`
              )
              .style("opacity", 1);
            const x = d.x || 0;
            const y = d.y || 0;

            lines
              .append("line")
              .attr("class", "radius-line")
              .attr("x1", x)
              .attr("y1", y)
              .attr("x2", 0)
              .attr("y2", 0)
              .style("stroke", "white");

            lines
              .append("text")
              .attr("class", "radius-text")
              .attr("x", (x + 200) / 2)
              .attr("y", (y + 200) / 2)
              .style("fill", "white")
              .style("z-index", 100);
          })
          .on("mousemove", function (event, d) {
            tooltip
              .style("left", event.pageX + 20 + "px")
              .style("top", event.pageY - 80 + "px");
          })
          .on("mouseleave", function (event, d) {
            tooltip.style("opacity", 0);
            lines.selectAll(".radius-line, .radius-text").remove();
          })
          .transition()
          .delay((d, i) => i * 10)
          .duration(1000)
          .attr("cx", (d) => d.x)
          .attr("cy", (d) => d.y)
          .attr("r", (d) => planetaryRadiusScale(d.planet_radius_km))
          .attr("fill", (d) => planetColorScale(d.planet_type));
      },
      function (exit) {
        return exit.transition().duration(1000).attr("r", 0).remove();
      }
    );
}

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

function rotatePlanets() {
  d3.timer(function () {
    var delta = Date.now() - t0;
    svg.selectAll(".planet").attr("transform", function (d) {
      const orbitalSpeed = (2 * Math.PI * d.orbital_radius) / d.orbital_period;
      return (
        "rotate(" + 90 + (delta * orbitalSpeedScale(orbitalSpeed)) / 2000 + ")"
      );
    });
  });
}
