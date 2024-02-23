// Hint: This is a good place to declare your global variables
var male_data;
var female_data;
var countries = [
  "Year",
  "Argentina",
  "Belgium",
  "Netherlands",
  "South Africa",
  "Venezuela",
];

// This function is called once the HTML page is fully loaded by the browser
function loadMainChart() {
  // Hint: create or set your svg element inside this function

  //Declaring variables required for plotting and updating the chart
  var dropDownSelection, innerGroup, xScale, yScale, innerSvgHeight;

  //Select the dropdown with countries
  const dropdownSelect = document.getElementById("country-dropdown");

  //Add an Event listener to check for value changes in the Dropdown
  dropdownSelect.addEventListener("change", () => {
    dropDownSelection = dropdownSelect.value;

    //Update the chart using the following function
    updateChart(
      filterData(male_data, dropDownSelection),
      filterData(female_data, dropDownSelection)
    );
  });

  //Select the SVG
  var svg = d3.select("svg");

  //Adjust margins and calculate the height and width for the Inner Plotting Area
  const width = +svg.style("width").replace("px", "");
  const height = +svg.style("height").replace("px", "");
  const margin = { top: 60, bottom: 60, left: 60, right: 30 };
  innerSvgHeight = height - margin.top - margin.bottom;
  const innerSvgWidth = width - margin.right - margin.left;

  //Add Label to X-Axis
  svg
    .append("text")
    .attr("text-anchor", "end")
    .attr("x", (innerSvgWidth + margin.left + margin.right) / 2)
    .attr("y", innerSvgHeight + margin.top + margin.bottom - 15)
    .text("Year");

  //Add Label to Y-Axis
  svg
    .append("text")
    .attr("text-anchor", "end")
    .attr("transform", "rotate(-90)")
    .attr("y", 20)
    .attr("x", -(innerSvgHeight / 2))
    .text("Employment Rate");

  //Append the inner plotting area to the SVG
  innerGroup = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`)
    .attr("class", "inner-group");

  //Declare Keys and Color for the Legend
  const keys = ["Female Employment Rate", "Male Employment Rate"];
  const color = ["#FF1393", "#028B8B"];
  const colorScale = d3.scaleOrdinal().domain(keys).range(color);

  //Append a group which will host the legend and translate it to the top right corner
  const legend = innerGroup
    .append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${innerSvgWidth - 300}, ${-margin.top})`);

  legend
    .selectAll(".legend-rect")
    .data(keys)
    .join("rect")
    .attr("class", "legend-rect")
    .attr("x", 50)
    .attr("y", function (d, i) {
      return i * 25;
    })
    .attr("width", 20)
    .attr("height", 20)
    .style("fill", function (d) {
      return colorScale(d);
    });

  legend
    .selectAll(".legend-label")
    .data(keys)
    .join("text")
    .attr("class", "legend-label")
    .attr("x", 79)
    .attr("y", function (d, i) {
      return i * 25 + 15;
    })
    .text(function (d) {
      return d;
    });

  //Initialize the X-Axis Scale
  xScale = d3
    .scaleTime()
    .domain([new Date("1990-01-01"), new Date("2023-12-31")])
    .range([0, innerSvgWidth]);

  //Initialize the Y-Axis Scale
  yScale = d3.scaleLinear().range([innerSvgHeight, 0]);

  //Define X and Y axes
  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale);

  //Append the X-Axis to the SVG
  innerGroup
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${innerSvgHeight})`)
    .call(xAxis);

  // This will load your two CSV files and store them into two arrays.
  Promise.all([
    d3.csv("data/females_data.csv"),
    d3.csv("data/males_data.csv"),
  ]).then(function (values) {
    console.log("loaded females_data.csv and males_data.csv");
    female_data = values[0];
    male_data = values[1];

    // Hint: This is a good spot for doing data wrangling

    //Converting the string data into numeric for Female Dataset and narrowing the selection to 5 countries
    female_data = female_data.map((obj) => {
      const filteredObject = {};
      countries.forEach((country) => {
        filteredObject[country] = parseFloat(obj[country]);
      });
      return filteredObject;
    });

    //Converting the string data into numeric for Male Dataset and narrowing the selection to 5 countries
    male_data = male_data.map((obj) => {
      const filteredObject = {};
      countries.forEach((country) => {
        filteredObject[country] = parseFloat(obj[country]);
      });
      return filteredObject;
    });
    //Call drawLollipopChart for the first Dataset
    drawLolliPopChart(
      filterData(male_data, countries[1]),
      filterData(female_data, countries[1])
    );
  });

  // Use this function to draw the lollipop chart.
  function drawLolliPopChart(menFilter, womenFilter) {
    //Calculate the Maximum value for men and women datasets for Y Axis domain and then plot Y axis
    const maxValue = maxDatasetValue(menFilter, womenFilter);
    yScale.domain([0, maxValue]);
    innerGroup.append("g").attr("class", "y-axis").call(yAxis);

    //Plot Line Chart for selected country for the Mens Dataset
    innerGroup
      .selectAll("men-line-plot")
      .data(menFilter)
      .join("line")
      .attr("class", "men-line-plot")
      .attr("x1", function (d) {
        return xScale(new Date(d.year, 0, 1)) - 5; // 5 pixel offset
      })
      .attr("x2", function (d) {
        return xScale(new Date(d.year, 0, 1)) - 5;
      })
      .attr("y1", function (d) {
        return yScale(d.value);
      })
      .attr("y2", yScale(0))
      .attr("stroke", color[1]);

    //Plot Circles for selected country for the Mens Dataset
    innerGroup
      .selectAll("men-circle")
      .data(menFilter)
      .join("circle")
      .attr("class", "men-circle")
      .attr("cx", function (d) {
        return xScale(new Date(d.year, 0, 1)) - 5; // 5 pixel offset
      })
      .attr("cy", function (d) {
        return yScale(d.value);
      })
      .attr("r", "4")
      .style("fill", color[1])
      .attr("stroke", color[1]);

    //Plot Line Chart for selected country for the Womens Dataset
    innerGroup
      .selectAll("women-line-plot")
      .data(womenFilter)
      .join("line")
      .attr("class", "women-line-plot")
      .attr("x1", function (d) {
        return xScale(new Date(d.year, 0, 1)) + 5; // 5 pixel offset
      })
      .attr("x2", function (d) {
        return xScale(new Date(d.year, 0, 1)) + 5;
      })
      .attr("y1", function (d) {
        return yScale(d.value);
      })
      .attr("y2", yScale(0))
      .attr("stroke", color[0]);

    //Plot Circles for selected country for the Womens Dataset
    innerGroup
      .selectAll("women-circle")
      .data(womenFilter)
      .join("circle")
      .attr("class", "women-circle")
      .attr("cx", function (d) {
        return xScale(new Date(d.year, 0, 1)) + 5; // 5 pixel offset
      })
      .attr("cy", function (d) {
        return yScale(d.value);
      })
      .attr("r", "4")
      .style("fill", color[0])
      .attr("stroke", color[0]);
  }

  //Function to filter the dataset based on the selected Country
  function filterData(main_array, selectedCountry) {
    return main_array.map((obj) => {
      return {
        year: obj.Year,
        value: obj[selectedCountry],
      };
    });
  }

  //Calculate the maximum numeric value between male and female datasets
  function maxDatasetValue(first_dataset, second_dataset) {
    const firstDatasetMaxValue = d3.max(first_dataset, (d) => d.value);
    const secondDatasetMaxValue = d3.max(second_dataset, (d) => d.value);
    return firstDatasetMaxValue > secondDatasetMaxValue
      ? firstDatasetMaxValue
      : secondDatasetMaxValue;
  }

  //This function will be called to update the lollipop chart after selection of a country from the dropdown
  function updateChart(menFilter, womenFilter) {
    const maxValue = maxDatasetValue(menFilter, womenFilter);

    //Update the Domain and re-plot the Y-Axis
    yScale.domain([0, maxValue]);
    svg.select(".y-axis").transition().duration(1000).call(yAxis);

    // Update all the existing elements to the current selection using transition()
    innerGroup
      .selectAll(".men-line-plot")
      .data(menFilter)
      .transition()
      .duration(1000)
      .attr("x1", function (d) {
        return xScale(new Date(d.year, 0, 1)) - 5;
      })
      .attr("x2", function (d) {
        return xScale(new Date(d.year, 0, 1)) - 5;
      })
      .attr("y1", function (d) {
        return yScale(d.value);
      });

    innerGroup
      .selectAll(".men-circle")
      .data(menFilter)
      .transition()
      .duration(1000)
      .attr("cx", function (d) {
        return xScale(new Date(d.year, 0, 1)) - 5;
      })
      .attr("cy", function (d) {
        return yScale(d.value);
      })
      .attr("r", "4");

    innerGroup
      .selectAll(".women-line-plot")
      .data(womenFilter)
      .transition()
      .duration(1000)
      .attr("x1", function (d) {
        return xScale(new Date(d.year, 0, 1)) + 5;
      })
      .attr("x2", function (d) {
        return xScale(new Date(d.year, 0, 1)) + 5;
      })
      .attr("y1", function (d) {
        return yScale(d.value);
      });

    innerGroup
      .selectAll(".women-circle")
      .data(womenFilter)
      .transition()
      .duration(1000)
      .attr("cx", function (d) {
        return xScale(new Date(d.year, 0, 1)) + 5;
      })
      .attr("cy", function (d) {
        return yScale(d.value);
      });
  }
}
