function generateJSONFilePaths(basePath, numberOfFiles) {
  const jsonFiles = [];
  for (let i = 0; i < numberOfFiles; i++) {
    const jsonFileName = `history_${i}.json`;
    jsonFiles.push(`${basePath}/${jsonFileName}`);
  }
  return jsonFiles;
}

// Declare jsonFilesToLoad as a global variable with an initial value
let jsonFilesToLoad = generateJSONFilePaths('json/', 120);

// Variables to store the chart objects and initial scale values
let chart1;
let chart2;
let chart3;
let chart4;
let chart5;
let chart6;
let chart1XMin = 0;
let chart1XMax = 30;
let chart1YMin = 0;
let chart1YMax = 14;
let chart2XMin = -60;
let chart2XMax = 40;
let chart2YMin = 0;
let chart2YMax = 14;

// Function to load a JSON file and concatenate data
async function loadAndConcatenateData(jsonFileName, data) {
  try {
    const response = await fetch(jsonFileName); // This will use the relative URL
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
function calculateWindSpeedAndDirection(df) {
  const filteredWindData = [];
  
  for (let row of df) {
    const tas = row.tas;
    const gs = row.gs;
    const hdg = row.track;
    const trk = row.mag_heading;
    const mach = row.mach;
    const oat = Math.pow((tas / 661.47 / mach), 2) * 288.15 - 273.15;
    const ws = Math.round(Math.sqrt(Math.pow(tas - gs, 2) + 4 * tas * gs * Math.pow(Math.sin((hdg - trk) / 2), 2)));
    const wd = trk + Math.atan2(tas * Math.sin(hdg - trk), tas * Math.cos(hdg - trk) - gs);
    
    // Adjust wind direction to [0, 360] degrees
    const wdAdjusted = ((wd * (180 / Math.PI)) + 360) % 360;
    
    if (!isNaN(tas) && !isNaN(gs) && !isNaN(hdg) && !isNaN(trk) && !isNaN(mach)) {
      
        row.ws = ws;
        row.wd = wdAdjusted;
        filteredWindData.push(row);
      
    }
  }

  // Extract temperature data for the filtered wind data
  const filteredTemperatureData = filteredWindData.map(row => {
    const mach = row.mach;
    const oat = Math.pow((row.tas / 661.47 / mach), 2) * 288.15 - 273.15;
    row.oat = oat;
    row.tat = -273.15 + (oat + 273.15) * (1 + 0.2 * mach * mach);
    return row;
  });

  return [filteredWindData, filteredTemperatureData];
}
let map;
let mapCenter = [13, 77.5];
let mapZoom = 9;

function extractLatLonAndMap(aircraftData) {
  // Filter out data with missing or undefined latitude or longitude values
  const validLocations = aircraftData.filter((row) => {
    return typeof row.lat === 'number' && typeof row.lon === 'number';
  });

  if (validLocations.length === 0) {
    console.error("No valid latitude and longitude data found in aircraftData.");
    return;
  }

  if (!map) {
    // Create a map centered at the initial map center and zoom
    map = L.map("map").setView(mapCenter, mapZoom);

    // Add a tile layer (basemap)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Get the latitude, longitude, and zoom input elements
    const latInput = document.getElementById('map-lat-input');
    const lonInput = document.getElementById('map-lon-input');
    const zoomInput = document.getElementById('map-zoom-input');

    // Add event listeners to update map center and zoom when inputs change
    latInput.addEventListener('input', () => {
      const lat = parseFloat(latInput.value);
      mapCenter[0] = isNaN(lat) ? 0 : lat;
      map.setView(mapCenter, mapZoom);
    },{ passive: true });

    lonInput.addEventListener('input', () => {
      const lon = parseFloat(lonInput.value);
      mapCenter[1] = isNaN(lon) ? 0 : lon;
      map.setView(mapCenter, mapZoom);
    },{ passive: true });

    zoomInput.addEventListener('input', () => {
      const zoom = parseInt(zoomInput.value);
      mapZoom = isNaN(zoom) ? 9 : zoom;
      map.setView(mapCenter, mapZoom);
    },{ passive: true });
  }

  // Define a function to determine the color based on some criteria
  function getColor() {
    // You can define your own logic to determine the color based on data
    // For simplicity, we'll use a random color here
    return '#' + (Math.random() * 0xFFFFFF << 0).toString(16);
  }

  // Clear existing layers from the map
  map.eachLayer((layer) => {
    if (layer instanceof L.Circle) {
      map.removeLayer(layer);
    }
  });

  // Add colored points to the map based on latitude and longitude data
  validLocations.forEach((location) => {
    L.circle([location.lat, location.lon], {
      color: getColor(),
      fillColor: getColor(),
      fillOpacity: 1,
      radius: 500,
    }).addTo(map);
  });
}

// Function to create a Chart.js scatter plot with custom aspect ratio
function createScatterChart(chartId, chartData, chartTitle, xLabel, yLabel, xMin, xMax, yMin, yMax, color, aspectRatio) {
    const isDarkMode = document.body.classList.contains('dark-mode');
    const textColor = isDarkMode ? '#ffffff' : '#000000';
    const gridColor = isDarkMode ? '#ffffff' : '#000000';

    const ctx = document.getElementById(chartId).getContext('2d');

    // Destroy existing chart if it exists
    if (window.myCharts && window.myCharts[chartId]) {
        window.myCharts[chartId].destroy();
    }

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
                        color: textColor,
                    },
                    min: xMin,
                    max: xMax,
                    grid: {
                        color: gridColor,
                        display: true, // Ensure the grid is turned on
                    },
                    ticks: {
                        color: textColor,
                    },
                },
                y: {
                    type: 'linear',
                    position: 'left',
                    title: {
                        display: true,
                        text: yLabel,
                        color: textColor,
                    },
                    min: yMin,
                    max: yMax,
                    grid: {
                        color: gridColor,
                        display: true, // Ensure the grid is turned on
                    },
                    ticks: {
                        color: textColor,
                    },
                },
            },
            plugins: {
                title: {
                    display: false, // Remove the chart title text
                },
                legend: {
                    display: true,
                    labels: {
                        usePointStyle: true,
                        pointStyle: 'circle',
                        radius: 3,
                        color: textColor,
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

    // Store the chart in a global object to keep track of it
    if (!window.myCharts) {
        window.myCharts = {};
    }
    window.myCharts[chartId] = scatterChart;

    return scatterChart;
}

function setChartTheme(chartInstance, isDark) {
    if (!chartInstance) return;
    const textColor = isDark ? '#ffffff' : '#000000';
    const gridColor = isDark ? '#ffffff' : '#000000';
    chartInstance.options.scales.x.ticks.color = textColor;
    chartInstance.options.scales.x.grid.color = gridColor;
    chartInstance.options.scales.y.ticks.color = textColor;
    chartInstance.options.scales.y.grid.color = gridColor;
    chartInstance.options.plugins.legend.labels.color = textColor;
    chartInstance.options.plugins.title.color = textColor;
    chartInstance.options.plugins.tooltip.titleColor = textColor;
    chartInstance.options.plugins.tooltip.bodyColor = textColor;
    chartInstance.update();
}

// Load the data and perform calculations.
async function main() {
  const aircraftData = await loadAndConcatenateAllData();
  if (aircraftData.length > 0) {
    const [filteredWindData, filteredTemperatureData] = calculateWindSpeedAndDirection(aircraftData);
    
    const windSpeedData = filteredWindData.map(row => ({
      x: row.ws,
      y: row.alt_geom*0.0003048,
    }));
    const temperatureData = filteredTemperatureData.map(row => ({
      x: row.oat,
      y: row.alt_geom*0.0003048,
    }));
    const groundSpeedData = aircraftData.map(row => ({
      x: row.gs,
      y: row.alt_geom*0.0003048,
    }));
    const trackData = aircraftData.map(row => ({
      x: row.track,
      y: row.alt_geom*0.0003048,
    }));
    const rateOfClimbData = aircraftData.map(row => ({
      x: row.baro_rate,
      y: row.alt_geom*0.0003048,
    }));
    const rssiData = aircraftData.map(row => ({
      x: row.rssi,
      y: row.alt_geom*0.0003048,
    }));

    // Create and update the charts based on the concatenated data
    // For chart1
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
      1 // Set the aspect ratio for chart1 here
    );

    // For chart2
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
      1 // Set the aspect ratio for chart2 here
    );

    // For chart3
    chart3 = createScatterChart(
      'chart3',
      groundSpeedData,
      'Ground Speed vs Altitude',
      'Ground Speed (knots/hr)',
      'Altitude (km)',
      0,
      500,
      0,
      14,
      'green',
      1 // Set the aspect ratio for chart3 here
    );

    // For chart4
    chart4 = createScatterChart(
      'chart4',
      trackData,
      'Track vs Altitude',
      'Track (degrees)',
      'Altitude (km)',
      0,
      360,
      0,
      14,
      'purple',
      1 // Set the aspect ratio for chart4 here
    );

    // For chart5
    chart5 = createScatterChart(
      'chart5',
      rateOfClimbData,
      'Rate of Climb/Descent vs Altitude',
      'Rate of Climb/Descent (ft/min)',
      'Altitude (km)',
      -3000,
      3000,
      0,
      14,
      'orange',
      1 // Set the aspect ratio for chart5 here
    );

    // For chart6
    chart6 = createScatterChart(
      'chart6',
      rssiData,
      'RSSI vs Altitude',
      'RSSI (dB)',
      'Altitude (km)',
      -40,
      0,
      0,
      14,
      'brown',
      1 // Set the aspect ratio for chart6 here
    );

    // Set the initial grid color for all charts
    chart1.options.scales.x.grid.color = getComputedStyle(document.documentElement).getPropertyValue('--chart-grid-color');
    chart1.options.scales.y.grid.color = getComputedStyle(document.documentElement).getPropertyValue('--chart-grid-color');
    chart2.options.scales.x.grid.color = getComputedStyle(document.documentElement).getPropertyValue('--chart-grid-color');
    chart2.options.scales.y.grid.color = getComputedStyle(document.documentElement).getPropertyValue('--chart-grid-color');
    chart3.options.scales.x.grid.color = getComputedStyle(document.documentElement).getPropertyValue('--chart-grid-color');
    chart3.options.scales.y.grid.color = getComputedStyle(document.documentElement).getPropertyValue('--chart-grid-color');
    chart4.options.scales.x.grid.color = getComputedStyle(document.documentElement).getPropertyValue('--chart-grid-color');
    chart4.options.scales.y.grid.color = getComputedStyle(document.documentElement).getPropertyValue('--chart-grid-color');
    chart5.options.scales.x.grid.color = getComputedStyle(document.documentElement).getPropertyValue('--chart-grid-color');
    chart5.options.scales.y.grid.color = getComputedStyle(document.documentElement).getPropertyValue('--chart-grid-color');
    chart6.options.scales.x.grid.color = getComputedStyle(document.documentElement).getPropertyValue('--chart-grid-color');
    chart6.options.scales.y.grid.color = getComputedStyle(document.documentElement).getPropertyValue('--chart-grid-color');
  }
  extractLatLonAndMap(aircraftData);
  setChartTheme(chart1, false);
  setChartTheme(chart2, false);
  setChartTheme(chart3, false);
  setChartTheme(chart4, false);
  setChartTheme(chart5, false);
  setChartTheme(chart6, false);
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
  const header = document.querySelector('.header');
  const chartForms = document.querySelectorAll('.form-container, .form-content, .form-control');
  const isDarkMode = document.getElementById('darkModeToggle').checked;

  if (isDarkMode) {
    body.classList.add('dark-mode');
    body.classList.remove('light-mode');
    header.classList.add('dark-mode');
    chartForms.forEach((form) => {
      form.classList.add('dark-mode');
      form.classList.remove('light-mode');
    });
  } else {
    body.classList.add('light-mode');
    body.classList.remove('dark-mode');
    header.classList.remove('dark-mode');
    chartForms.forEach((form) => {
      form.classList.add('light-mode');
      form.classList.remove('dark-mode');
    });
  }

  // Update the chart colors based on the mode
  updateChartColors();
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
  chart3.data.datasets[0].pointBackgroundColor = isDarkMode
    ? getComputedStyle(document.documentElement).getPropertyValue('--dark-chart-color3')
    : getComputedStyle(document.documentElement).getPropertyValue('--light-chart-color3');
  chart4.data.datasets[0].pointBackgroundColor = isDarkMode
    ? getComputedStyle(document.documentElement).getPropertyValue('--dark-chart-color4')
    : getComputedStyle(document.documentElement).getPropertyValue('--light-chart-color4');
  chart5.data.datasets[0].pointBackgroundColor = isDarkMode
    ? getComputedStyle(document.documentElement).getPropertyValue('--dark-chart-color5')
    : getComputedStyle(document.documentElement).getPropertyValue('--light-chart-color5');
  chart6.data.datasets[0].pointBackgroundColor = isDarkMode
    ? getComputedStyle(document.documentElement).getPropertyValue('--dark-chart-color6')
    : getComputedStyle(document.documentElement).getPropertyValue('--light-chart-color6');

  // Update chart options for scales, grid, and text colors
  chart1.options.scales.x.title.color = textColor;
  chart1.options.scales.y.title.color = textColor;
  chart1.options.scales.x.grid.color = gridColor;
  chart1.options.scales.y.grid.color = gridColor;
  chart1.options.scales.x.ticks.color = textColor; // Update axis number labels
  chart1.options.scales.y.ticks.color = textColor; // Update axis number labels
  chart1.options.plugins.title.color = textColor;
  chart1.options.plugins.legend.labels.color = textColor; // Update legend text color

  chart2.options.scales.x.title.color = textColor;
  chart2.options.scales.y.title.color = textColor;
  chart2.options.scales.x.grid.color = gridColor;
  chart2.options.scales.y.grid.color = gridColor;
  chart2.options.scales.x.ticks.color = textColor; // Update axis number labels
  chart2.options.scales.y.ticks.color = textColor; // Update axis number labels
  chart2.options.plugins.title.color = textColor;
  chart2.options.plugins.legend.labels.color = textColor; // Update legend text color

  chart3.options.scales.x.title.color = textColor;
  chart3.options.scales.y.title.color = textColor;
  chart3.options.scales.x.grid.color = gridColor;
  chart3.options.scales.y.grid.color = gridColor;
  chart3.options.scales.x.ticks.color = textColor; // Update axis number labels
  chart3.options.scales.y.ticks.color = textColor; // Update axis number labels
  chart3.options.plugins.title.color = textColor;
  chart3.options.plugins.legend.labels.color = textColor; // Update legend text color

  chart4.options.scales.x.title.color = textColor;
  chart4.options.scales.y.title.color = textColor;
  chart4.options.scales.x.grid.color = gridColor;
  chart4.options.scales.y.grid.color = gridColor;
  chart4.options.scales.x.ticks.color = textColor; // Update axis number labels
  chart4.options.scales.y.ticks.color = textColor; // Update axis number labels
  chart4.options.plugins.title.color = textColor;
  chart4.options.plugins.legend.labels.color = textColor; // Update legend text color

  chart5.options.scales.x.title.color = textColor;
  chart5.options.scales.y.title.color = textColor;
  chart5.options.scales.x.grid.color = gridColor;
  chart5.options.scales.y.grid.color = gridColor;
  chart5.options.scales.x.ticks.color = textColor; // Update axis number labels
  chart5.options.scales.y.ticks.color = textColor; // Update axis number labels
  chart5.options.plugins.title.color = textColor;
  chart5.options.plugins.legend.labels.color = textColor; // Update legend text color

  chart6.options.scales.x.title.color = textColor;
  chart6.options.scales.y.title.color = textColor;
  chart6.options.scales.x.grid.color = gridColor;
  chart6.options.scales.y.grid.color = gridColor;
  chart6.options.scales.x.ticks.color = textColor; // Update axis number labels
  chart6.options.scales.y.ticks.color = textColor; // Update axis number labels
  chart6.options.plugins.title.color = textColor;
  chart6.options.plugins.legend.labels.color = textColor; // Update legend text color

  // Update the chart after changing the dark/light mode settings
  chart1.update();
  chart2.update();
  chart3.update();
  chart4.update();
  chart5.update();
  chart6.update();
}

// Add event listener to the dark mode toggle
document.getElementById('darkModeToggle').addEventListener('change', toggleDarkMode);

// Function to capture and save a snapshot of a chart as a PNG image
async function captureAndSaveSnapshot(chart, filename) {
  const wasDarkMode = document.body.classList.contains('dark-mode');
  const originalBackgroundColor = chart.canvas.style.backgroundColor;
  const originalTextColor = chart.options.scales.x.ticks.color;

  if (wasDarkMode) {
    // Temporarily switch to light mode
    document.body.classList.remove('dark-mode');
    document.body.classList.add('light-mode');
    updateChartColors();
  }

  chart.canvas.style.backgroundColor = '#ffffff'; // Set to light mode background color
  chart.options.scales.x.ticks.color = '#000000'; // Set text color to black for light mode
  chart.options.scales.y.ticks.color = '#000000';
  chart.options.plugins.legend.labels.color = '#000000';
  chart.update();

  try {
    const canvas = await html2canvas(chart.canvas, { useCORS: true });
    canvas.toBlob(function (blob) {
      const folderPath = 'snaps'; // Specify the folder path
      saveAs(blob, `${folderPath}/${filename}.png`);
      // Restore original background color and text color
      chart.canvas.style.backgroundColor = originalBackgroundColor;
      chart.options.scales.x.ticks.color = originalTextColor;
      chart.options.scales.y.ticks.color = originalTextColor;
      chart.options.plugins.legend.labels.color = originalTextColor;
      chart.update();
    });
  } catch (error) {
    console.error("Error capturing snapshot:", error);
  }

  if (wasDarkMode) {
    // Switch back to dark mode
    document.body.classList.remove('light-mode');
    document.body.classList.add('dark-mode');
    updateChartColors();
  }
}

// Function to capture and save a screenshot of the charts container
async function captureAndSaveChartsScreenshot(filename) {
  const chartsContainer = document.getElementById('chartContainer');
  const charts = document.querySelectorAll('.chart canvas');
  const originalBackgroundColors = [];

  // Set the background color of all charts to white
  charts.forEach((chart, index) => {
    originalBackgroundColors[index] = chart.style.backgroundColor;
    chart.style.backgroundColor = '#ffffff';
  });

  try {
    const canvas = await html2canvas(chartsContainer, { useCORS: true });
    canvas.toBlob(function (blob) {
      const folderPath = 'snaps'; // Specify the folder path
      saveAs(blob, `${folderPath}/${filename}.png`);
      // Restore original background colors
      charts.forEach((chart, index) => {
        chart.style.backgroundColor = originalBackgroundColors[index];
      });
    });
  } catch (error) {
    console.error("Error capturing charts screenshot:", error);
  }
}

// Function to capture and save snapshots of all six charts
async function captureAndSaveSnapshots() {
  const utcTime = new Date().toISOString(); // Get the current UTC time
  await captureAndSaveChartsScreenshot(`charts_screenshot_${utcTime}`);
}

// Add event listener to the snapshot button
document.getElementById('snapshotButton').addEventListener('click', captureAndSaveSnapshots);