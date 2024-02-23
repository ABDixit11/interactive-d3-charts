document.addEventListener("DOMContentLoaded", function () {});
const vowels = "aeiouy";
const consonants = "bcdfghjklmnpqrstvwxz";
const punctuations = ".,?!:;";

function submitText() {
  var inputString = document.getElementById("wordbox").value;
  inputString = inputString.toLowerCase().replace(/[^a-z.,?!:;]+/g, "");
  var vowelCount = 0;
  var consonantCount = 0;
  var punctuationCount = 0;
  var punctuationStats = {};
  var vowelStats = {};
  var consonantStats = {};

  // Initialize the vowels, punctuations and consonants array count as 0
  vowels.split("").forEach((v) => {
    vowelStats[v] = 0;
  });
  consonants.split("").forEach((c) => {
    consonantStats[c] = 0;
  });
  punctuations.split("").forEach((p) => {
    punctuationStats[p] = 0;
  });

  //Calcuate the count of characters according to their classification
  for (const character of inputString) {
    if (vowels.includes(character)) {
      vowelCount += 1;
      vowelStats[character] += 1;
    } else if (consonants.includes(character)) {
      consonantCount += 1;
      consonantStats[character] += 1;
    } else if (punctuations.includes(character)) {
      punctuationCount += 1;
      punctuationStats[character] += 1;
    }
  }

  //Remove initially plotted charts
  d3.select(".inner-svg-donut").remove();
  d3.select(".inner-svg-bar").remove();

  if (inputString.length > 0) {
    //Draw the donut chart
    drawDonutChart(
      {
        vowels: vowelCount,
        consonants: consonantCount,
        punctuation: punctuationCount,
      },
      {
        vowels: vowelStats,
        consonants: consonantStats,
        punctuation: punctuationStats,
      }
    );
  }
}

function drawDonutChart(characterCount, characterStats) {
  //Initialize SVG width, height, margins
  const donut_svg = d3.select("#pie_svg");
  const width = +donut_svg.style("width").replace("px", "");
  const height = +donut_svg.style("height").replace("px", "");
  const margin = { top: 20, bottom: 20, left: 20, right: 20 };
  const innerSvgHeight = height - margin.top - margin.bottom;
  const innerSvgWidth = width - margin.right - margin.left;

  var innerSvg = donut_svg
    .append("g")
    .attr("transform", `translate(${innerSvgWidth / 2},${innerSvgHeight / 2})`)
    .attr("class", "inner-svg-donut");

  //Create a color scale
  const color = d3.scaleOrdinal().range(d3.schemeSet2);

  //Initialize Pie Chart
  const pie = d3.pie().value((d) => d[1]);
  const pieData = pie(Object.entries(characterCount));

  const arc = d3
    .arc()
    .innerRadius(innerSvgWidth / 4 - 50)
    .outerRadius(innerSvgWidth / 4);

  innerSvg
    .selectAll("donut-charts")
    .data(pieData)
    .join("path")
    .attr("d", arc)
    .attr("fill", (d) => color(d.data[0]))
    .attr("class", "donut-arcs")
    .attr("stroke", "black")
    .attr("stroke-width", 1)
    .on("mouseover", function (event, d) {
      //On mouseover, increase the stroke width and display text in the center of the donut chart
      d3.select(this).attr("stroke-width", 4).attr("cursor", "pointer");
      innerSvg
        .append("text")
        .attr("class", "donut-text")
        .text(`${d.data[0]}: ${d.data[1]}`)
        .attr("y", "5")
        .style("text-anchor", "middle");
    })
    .on("mouseout", function () {
      //On moving the mouse away from the screen, revert to default stroke width and remove the text
      d3.select(this).attr("stroke-width", 1);
      innerSvg.select(".donut-text").remove();
    })
    .on("click", function (event, d) {
      //After clicking on an arc, draw corresponding bar chart
      const label = d.data[0];
      drawBarChart(characterStats[label], color(d.data[0]));
    });
}

function drawBarChart(characterStats, color) {
  d3.select(".inner-svg-bar").remove();

  //Initialze bar chart SVG
  const barSvg = d3.select("#bar_svg");
  const width = +barSvg.style("width").replace("px", "");
  const height = +barSvg.style("height").replace("px", "");
  const margin = { top: 20, bottom: 25, left: 35, right: 20 };
  const innerSvgHeight = height - margin.top - margin.bottom;
  const innerSvgWidth = width - margin.right - margin.left;

  const defaultHoverMessage = "Count for selected character is NONE.";

  var innerSvg = barSvg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`)
    .attr("class", "inner-svg-bar");

  // Initialize X-axis scale
  const xScale = d3
    .scaleBand()
    .domain(Object.keys(characterStats))
    .range([0, innerSvgWidth])
    .padding(0.2);

  // Initialize Y-axis scale
  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(Object.values(characterStats))])
    .range([innerSvgHeight, 0]);
  const xAxis = d3.axisBottom(xScale);

  // Append X-Axis to SVG
  innerSvg
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${innerSvgHeight})`)
    .call(xAxis);

  // Append Y-axis to SVG
  const yAxis = d3.axisLeft(yScale);
  innerSvg.append("g").attr("class", "y-axis").call(yAxis);

  // Initialize Bar chart tooltip
  var tooltip = d3.select("body").append("div").attr("class", "tooltip");

  //Append Bars to the SVG
  innerSvg
    .append("g")
    .attr("fill", color)
    .selectAll()
    .data(Object.entries(characterStats))
    .join("rect")
    .attr("x", (d) => xScale(d[0]))
    .attr("y", (d) => yScale(d[1]))
    .attr("height", (d) => yScale(0) - yScale(d[1]))
    .attr("width", xScale.bandwidth())
    .attr("stroke", "black")
    .attr("stroke-width", 1)
    .on("mouseover", function (event, d) {
      //Make the tooltip visible
      tooltip
        .html("Character: " + d[0] + "<br>" + "Value: " + d[1])
        .style("opacity", 1);
    })
    .on("mousemove", function (event, d) {
      //Change the position of the tooltip with respect to mouse movement and add the tooltip message
      tooltip
        .style("left", event.pageX + 20 + "px")
        .style("top", event.pageY - 80 + "px");
      d3.select("#hover-message").text(
        `The count for  character '${d[0]}' is ${d[1]}.`
      );
    })
    .on("mouseleave", function (event, d) {
      //Remove tooltip and replace the description back to default value
      tooltip.style("opacity", 0);
      d3.select("#hover-message").text(defaultHoverMessage);
    });
}

function loadMainChart() {
  console.log("Chart Loaded");
}
