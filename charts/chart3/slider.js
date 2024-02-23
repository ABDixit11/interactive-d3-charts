//This file integrates the Year Slider with the Year Input Box
const yearSlider = document.getElementById("yearSlider");
const playButton = document.getElementById("playButton");
const pauseButton = document.getElementById("pauseButton");
const xValueDropdown = document.getElementById("x-axis-attribute");
const sizeValueDropdown = document.getElementById("size-attribute");
const yearInput = document.getElementById("yearInput");

let year = 1980;
let intervalId;

function updateYear() {
  yearInput.textContent = year;
  yearSlider.value = year;
  yearInput.value = year;
  try {
    yearChanged(year);
  } catch (error) {
    console.log("Not defined error")
  }
  
}

yearSlider.addEventListener("input", () => {
  year = parseInt(yearSlider.value);
  yearSlider.value = year;
  yearInput.value = year;
});

yearSlider.addEventListener("change", () => {
  updateYear(); 
});

playButton.addEventListener("click", () => {
  playButton.disabled = true;
  pauseButton.disabled = false;
  if (year === 2013) {
    year = 1980;
  }
  updateYear();
  intervalId = setInterval(() => {
    if (year < 2014) {
      year++;
      updateYear();
    }
    if (year == 2013) {
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

yearInput.addEventListener("input", () => {
    year = parseInt(yearInput.value);
    yearSlider.value = year;
    updateYear();
});

yearInput.addEventListener("change", () => {
    year = parseInt(yearInput.value);
    yearSlider.value = year;
    updateYear();
});


document.addEventListener("click", (event) => {
  if (event.target == xValueDropdown || event.target == sizeValueDropdown) {
    playButton.disabled = false;
    pauseButton.disabled = true;
    clearInterval(intervalId);
  }
});

updateYear(); 

var selectAllButton = document.getElementById("selectAll");
var deselectAllButton = document.getElementById("deselectAll");
var checkboxes = document.querySelectorAll('.checkbox-input');

selectAllButton.addEventListener("click", function() {
    checkboxes.forEach(function(checkbox) {
        checkbox.checked = true;
    });
});

deselectAllButton.addEventListener("click", function() {
    checkboxes.forEach(function(checkbox) {
        checkbox.checked = false;
    });
});