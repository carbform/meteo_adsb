// Get the path to the JSON file.
const jsonFile = 'dump1090-fa/9829.json';

// Variables to store the chart objects and initial scale values
let chart1;
let chart2;
let chart1XMin = 0;
let chart1XMax = 60;
let chart1YMin = 0;
let chart1YMax = 14;
let chart2XMin = -60;
let chart2XMax = 40;
let chart2YMin = 0;
let chart2YMax = 14;

// Load the JSON file.
async function getDf() {
  const response = await fetch(jsonFile);
  const data = await response.json();
  const aircraft = data.aircraft;
  return aircraft;
}

// Calculate wind speed and direction, OAT, and TAT.
function calculateWindSpeedAndDirection(df) {
  df.forEach(row => {
    const tas = row.tas;
    const gs = row.gs;
    const hdg = row.track;
    const trk = row.mag_heading;

    const ws = Math.sqrt(Math.pow(tas - gs, 2) + 4 * tas * gs * Math.pow(Math.sin((hdg - trk) / 2), 2));
    const wd = trk + Math.atan2(tas * Math.sin(hdg - trk), tas * Math.cos(hdg - trk) - gs);

    // Convert the wind direction from radians to degrees.
    row.ws = ws;
    row.wd = (180 * wd) / Math.PI;
  });
}

function calculateOatAndTat(df) {
  df.forEach(row => {
    const tas = row.tas;
    const mach = row.mach;

    const oat = Math.pow((tas / 661.47 / mach), 2) * 288.15 - 273.15;
    const tat = -273.15 + (oat + 273.15) * (1 + 0.2 * mach * mach);

    // Update the OAT and TAT values in the data.
    row.oat = oat;
    row.tat = tat;
  });
}

// Function to update chart scales
function updateChartScales(chart, xMin, xMax, yMin, yMax) {
  chart.options.scales.x.min = xMin;
  chart.options.scales.x.max = xMax;
  chart.options.scales.y.min = yMin;
  chart.options.scales.y.max = yMax;
  chart.update();
}

function createScatterPlot(chartId, chartData, chartTitle, xLabel, yLabel, xMin, xMax, yMin, yMax, color) {
  const gridColor = getComputedStyle(document.documentElement).getPropertyValue('--chart-grid-color'); // Get the grid color from CSS variable

  const ctx = document.getElementById(chartId).getContext('2d');
  const scatterChart = new Chart(ctx, {
      type: 'scatter',
      data: {
          datasets: [
              {
                  label: chartTitle,
                  data: chartData,
                  pointRadius: 3,
                  pointBackgroundColor: color,
              },
          ],
      },
      options: {
          scales: {
              x: {
                  type: 'linear',
                  position: 'bottom',
                  title: {
                      display: true,
                      text: xLabel,
                      color: getComputedStyle(document.documentElement).getPropertyValue('--chart-text-color'),
                  },
                  min: xMin,
                  max: xMax,
                  grid: {
                      color: gridColor, // Set grid color using CSS variable
                  },
              },
              y: {
                  type: 'linear',
                  position: 'left',
                  title: {
                      display: true,
                      text: yLabel,
                      color: getComputedStyle(document.documentElement).getPropertyValue('--chart-text-color'),
                  },
                  min: yMin,
                  max: yMax,
                  grid: {
                      color: gridColor, // Set grid color using CSS variable
                  },
              },
          },
          plugins: {
              title: {
                  display: true,
                  text: chartTitle,
                  color: getComputedStyle(document.documentElement).getPropertyValue('--chart-text-color'),
              },
              legend: {
                  display: true,
                  labels: {
                      usePointStyle: true,
                      pointStyle: 'circle',
                      radius: 3,
                  },
              },
              zoom: {
                  zoom: {
                      wheel: {
                          enabled: true,
                      },
                      pinch: {
                          enabled: true,
                      },
                      mode: 'xy',
                  },
              },
          },
          aspectRatio: 0.95,
      },
  });

  return scatterChart;
}

// Load the data and perform calculations.
async function main() {
  const aircraftData = await getDf();
  calculateWindSpeedAndDirection(aircraftData);
  calculateOatAndTat(aircraftData);

  // Filter data for the two charts (Wind Speed vs Altitude and Temperature vs Altitude).
  const windSpeedData = aircraftData.map(row => ({
    x: row.ws,
    y: row.alt_geom / 1000,
  }));
  const temperatureData = aircraftData.map(row => ({
    x: row.oat,
    y: row.alt_geom / 1000,
  }));

  chart1 = createScatterPlot(
    'chart1',
    windSpeedData,
    'Wind Speed vs Altitude',
    'Wind Speed (km/hr)',
    'Altitude (km)',
    chart1XMin,
    chart1XMax,
    chart1YMin,
    chart1YMax,
    'red'
  );
  
  // Enable zoom plugin for chart1
  chart1.resetZoom();
  chart1.options.plugins.zoom = {
    pan: {
      enabled: true,
      mode: 'xy',
    },
    zoom: {
      wheel: {
        enabled: true,
      },
      pinch: {
        enabled: true,
      },
      mode: 'xy',
    },
  };
  chart1.update();
  
  chart2 = createScatterPlot(
    'chart2',
    temperatureData,
    'Temperature vs Altitude',
    'Temperature (°C)',
    'Altitude (km)',
    chart2XMin,
    chart2XMax,
    chart2YMin,
    chart2YMax,
    'blue'
  );
  
  // Enable zoom plugin for chart2
  chart2.resetZoom();
  chart2.options.plugins.zoom = {
    pan: {
      enabled: true,
      mode: 'xy',
    },
    zoom: {
      wheel: {
        enabled: true,
      },
      pinch: {
        enabled: true,
      },
      mode: 'xy',
    },
  };
  chart2.update();
}

// Call the main function.
main();

// Function to update chart scales when input values change
function updateChart(chartId, xMinId, xMaxId, yMinId, yMaxId) {
  const xMin = parseFloat(document.getElementById(xMinId).value);
  const xMax = parseFloat(document.getElementById(xMaxId).value);
  const yMin = parseFloat(document.getElementById(yMinId).value);
  const yMax = parseFloat(document.getElementById(yMaxId).value);
  updateChartScales(chartId, xMin, xMax, yMin, yMax);
}

// Function to update chart scales
function updateChartScales(chartId, xMin, xMax, yMin, yMax) {
  if (chartId === 'chart1') {
    chart1XMin = xMin; // Update the min values for chart1
    chart1XMax = xMax; // Update the max values for chart1
    chart1YMin = yMin; // Update the min values for chart1
    chart1YMax = yMax; // Update the max values for chart1

    chart1.options.scales.x.min = xMin;
    chart1.options.scales.x.max = xMax;
    chart1.options.scales.y.min = yMin;
    chart1.options.scales.y.max = yMax;
    chart1.update();
  } else if (chartId === 'chart2') {
    chart2XMin = xMin; // Update the min values for chart2
    chart2XMax = xMax; // Update the max values for chart2
    chart2YMin = yMin; // Update the min values for chart2
    chart2YMax = yMax; // Update the max values for chart2

    chart2.options.scales.x.min = xMin;
    chart2.options.scales.x.max = xMax;
    chart2.options.scales.y.min = yMin;
    chart2.options.scales.y.max = yMax;
    chart2.update();
  }
}
function toggleDarkMode() {
  const style = document.getElementById("dark-mode-style");
  const isDarkMode = document.body.classList.toggle("dark-mode");

  if (isDarkMode) {
    style.href = "dark-mode.css";
    document.documentElement.style.setProperty('--chart-background-color', getComputedStyle(document.documentElement).getPropertyValue('--dark-chart-background-color'));
    document.documentElement.style.setProperty('--chart-text-color', getComputedStyle(document.documentElement).getPropertyValue('--dark-chart-text-color'));
    document.documentElement.style.setProperty('--chart-grid-color', getComputedStyle(document.documentElement).getPropertyValue('--dark-chart-grid-color'));
  } else {
    style.href = "style.css";
    document.documentElement.style.setProperty('--chart-background-color', getComputedStyle(document.documentElement).getPropertyValue('--light-chart-background-color'));
    document.documentElement.style.setProperty('--chart-text-color', getComputedStyle(document.documentElement).getPropertyValue('--light-chart-text-color'));
    document.documentElement.style.setProperty('--chart-grid-color', getComputedStyle(document.documentElement).getPropertyValue('--light-chart-grid-color'));
  }

  // Update the chart after changing the dark/light mode settings
  updateChartColors();
}