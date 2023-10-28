// Define a function to generate JSON file paths based on a pattern
function generateJSONFilePaths(basePath, numberOfFiles) {
  const jsonFiles = [];
  for (let i = 0; i < numberOfFiles; i++) {
    const jsonFileName = `history_${i}.json`;
    jsonFiles.push(`${basePath}/${jsonFileName}`);
  }
  return jsonFiles;
}

const jsonFilesToLoad = generateJSONFilePaths('dump1090-fa', 100);

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

// Function to load a JSON file and concatenate data
async function loadAndConcatenateData(jsonFileName, data) {
  try {
    const response = await fetch(jsonFileName);
    if (!response.ok) {
      throw new Error(`Failed to fetch data from ${jsonFileName}.`);
    }
    const jsonData = await response.json();
    if (Array.isArray(jsonData.aircraft)) {
      data.push(...jsonData.aircraft);
    } else {
      console.error(`File ${jsonFileName} does not contain aircraft data.`);
    }
  } catch (error) {
    console.error(`Error loading data from ${jsonFileName}:`, error);
  }
}

// Load and concatenate data from multiple JSON files
async function loadAndConcatenateAllData() {
  const aircraftData = [];
  for (const jsonFileName of jsonFilesToLoad) {
    await loadAndConcatenateData(jsonFileName, aircraftData);
  }
  return aircraftData;
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

// Function to create a Chart.js scatter plot
// Function to create a Chart.js scatter plot
// Function to create a Chart.js scatter plot
// Function to create a Chart.js scatter plot with custom aspect ratio
function createScatterChart(chartId, chartData, chartTitle, xLabel, yLabel, xMin, xMax, yMin, yMax, color, aspectRatio) {
  const gridColor = getComputedStyle(document.documentElement).getPropertyValue('--chart-grid-color');

  // Set the initial grid color
  document.documentElement.style.setProperty('--chart-grid-color', gridColor);

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
      aspectRatio: aspectRatio, // Set the aspect ratio here
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
            color: getComputedStyle(document.documentElement).getPropertyValue('--chart-grid-color'),
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
            color: getComputedStyle(document.documentElement).getPropertyValue('--chart-grid-color'),
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
    },
  });

  return scatterChart;
}



async function main() {
  const aircraftData = await loadAndConcatenateAllData();
  if (aircraftData.length > 0) {
    calculateWindSpeedAndDirection(aircraftData);
    calculateOatAndTat(aircraftData);

    const windSpeedData = aircraftData.map(row => ({
      x: row.ws,
      y: row.alt_geom * 0.0003048,
    }));
    const temperatureData = aircraftData.map(row => ({
      x: row.oat,
      y: row.alt_geom * 0.0003048,
    }));

    // Destroy the existing charts if they exist
    if (chart1) {
      chart1.destroy();
    }
    if (chart2) {
      chart2.destroy();
    }

    // Create and update the charts based on the concatenated data
    chart1 = createScatterChart(
      'chart1',
      windSpeedData,
      'Wind Speed vs Altitude',
      'Wind Speed (km/hr)',
      'Altitude (km)',
      chart1XMin,
      chart1XMax,
      chart1YMin,
      chart1YMax,
      'red',
      0.9 // Set the aspect ratio for chart1 here
    );

    chart2 = createScatterChart(
      'chart2',
      temperatureData,
      'Temperature vs Altitude',
      'Temperature (°C)',
      'Altitude (km)',
      chart2XMin,
      chart2XMax,
      chart2YMin,
      chart2YMax,
      'blue',
      0.9 // Set the aspect ratio for chart2 here
    );

    // Set the initial grid color for chart1 and chart2
    chart1.options.scales.x.grid.color = getComputedStyle(document.documentElement).getPropertyValue('--chart-grid-color');
    chart1.options.scales.y.grid.color = getComputedStyle(document.documentElement).getPropertyValue('--chart-grid-color');
    chart2.options.scales.x.grid.color = getComputedStyle(document.documentElement).getPropertyValue('--chart-grid-color');
    chart2.options.scales.y.grid.color = getComputedStyle(document.documentElement).getPropertyValue('--chart-grid-color');
  }
}

// Call the main function.
main();

// Function to update chart scales when input values change
function updateChartScales(chartId, xMinId, xMaxId, yMinId, yMaxId) {
  const xMin = parseFloat(document.getElementById(xMinId).value);
  const xMax = parseFloat(document.getElementById(xMaxId).value);
  const yMin = parseFloat(document.getElementById(yMinId).value);
  const yMax = parseFloat(document.getElementById(yMaxId).value);

  if (chartId === 'chart1') {
    chart1XMin = xMin;
    chart1XMax = xMax;
    chart1YMin = yMin;
    chart1YMax = yMax;

    chart1.options.scales.x.min = xMin;
    chart1.options.scales.x.max = xMax;
    chart1.options.scales.y.min = yMin;
    chart1.options.scales.y.max = yMax;

    // Update the chart colors based on the mode
    updateChartColors();
    chart1.update();
  } else if (chartId === 'chart2') {
    chart2XMin = xMin;
    chart2XMax = xMax;
    chart2YMin = yMin;
    chart2YMax = yMax;

    chart2.options.scales.x.min = xMin;
    chart2.options.scales.x.max = xMax;
    chart2.options.scales.y.min = yMin;
    chart2.options.scales.y.max = yMax;

    // Update the chart colors based on the mode
    updateChartColors();
    chart2.update();
  }
}

function toggleDarkMode() {
  const body = document.body;
  const chartForms = document.querySelectorAll('.form-container');

  if (body.classList.contains('light-mode')) {
    body.classList.replace('light-mode', 'dark-mode');
    chartForms.forEach((form) => {
      form.classList.replace('light-mode', 'dark-mode');
    });

    // Update the chart colors based on dark mode
    updateChartColors();
  } else {
    body.classList.replace('dark-mode', 'light-mode');
    chartForms.forEach((form) => {
      form.classList.replace('dark-mode', 'light-mode');
    });

    // Update the chart colors based on light mode
    updateChartColors();
  }
}

function updateChartColors() {
  const isDarkMode = document.body.classList.contains('dark-mode');
  const gridColor = isDarkMode
    ? getComputedStyle(document.documentElement).getPropertyValue('--dark-chart-grid-color')
    : getComputedStyle(document.documentElement).getPropertyValue('--light-chart-grid-color');
  const textColor = isDarkMode
    ? getComputedStyle(document.documentElement).getPropertyValue('--dark-chart-text-color')
    : getComputedStyle(document.documentElement).getPropertyValue('--light-chart-text-color');

  chart1.data.datasets[0].pointBackgroundColor = isDarkMode
    ? getComputedStyle(document.documentElement).getPropertyValue('--dark-chart-color1')
    : getComputedStyle(document.documentElement).getPropertyValue('--light-chart-color1');
  chart2.data.datasets[0].pointBackgroundColor = isDarkMode
    ? getComputedStyle(document.documentElement).getPropertyValue('--dark-chart-color2')
    : getComputedStyle(document.documentElement).getPropertyValue('--light-chart-color2');

  // Update chart options for scales, grid, and text colors
  chart1.options.scales.x.title.color = textColor;
  chart1.options.scales.y.title.color = textColor;
  chart1.options.scales.x.grid.color = gridColor;
  chart1.options.scales.y.grid.color = gridColor;
  chart1.options.plugins.title.color = textColor;

  chart2.options.scales.x.title.color = textColor;
  chart2.options.scales.y.title.color = textColor;
  chart2.options.scales.x.grid.color = gridColor;
  chart2.options.scales.y.grid.color = gridColor;
  chart2.options.plugins.title.color = textColor;

  // Update the chart after changing the dark/light mode settings
  chart1.update();
  chart2.update();
}
// Wrap the main function call in an event listener
document.addEventListener('DOMContentLoaded', () => {
  // Call the main function immediately when the page loads
  main();

  // Schedule the main function to be called every 300 seconds (30,000 milliseconds)
  setInterval(main, 300000);
});