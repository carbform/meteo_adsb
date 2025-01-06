let isDark = false; // Initialize the variable

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

let map;
let lightLayer;
let darkLayer;
let mapCenter = [13, 77.5];
let mapZoom = 9;

document.addEventListener('DOMContentLoaded', () => {
  initialize();
  const darkModeToggle = document.getElementById('darkModeToggle');
  darkModeToggle.addEventListener('change', () => {
    const isDark = darkModeToggle.checked;
    setChartTheme(window.myChart1, isDark);
    setChartTheme(window.myChart2, isDark);
    setChartTheme(window.myChart3, isDark);
    setFormTheme(isDark);
    setMapTheme(isDark);
    updateChartColors();
  });

  // Initialize the map
  map = L.map('map').setView([13, 77.5], 9);

  lightLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  darkLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    className: 'dark-matter'
  });

  // Set initial map theme based on current mode
  setMapTheme(isDark);
});

function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  document.querySelectorAll('.chart').forEach(chart => chart.classList.toggle('dark-mode'));
  document.getElementById('map').classList.toggle('dark-mode');

  const isDark = document.body.classList.contains('dark-mode');
  setChartTheme(window.myChart1, isDark);
  setChartTheme(window.myChart2, isDark);
  setChartTheme(window.myChart3, isDark);
  setFormTheme(isDark);
  setMapTheme(isDark);
  updateChartColors();
}

function setMapTheme(isDark) {
  console.log(`Setting map theme to ${isDark ? 'dark' : 'light'} mode`);
  if (isDark) {
    if (map.hasLayer(lightLayer)) {
      map.removeLayer(lightLayer);
      console.log('Removed light layer');
    }
    if (!map.hasLayer(darkLayer)) {
      darkLayer.addTo(map);
      console.log('Added dark layer');
    }
  } else {
    if (map.hasLayer(darkLayer)) {
      map.removeLayer(darkLayer);
      console.log('Removed dark layer');
    }
    if (!map.hasLayer(lightLayer)) {
      lightLayer.addTo(map);
      console.log('Added light layer');
    }
  }
}

function setFormTheme(isDark) {
  const formContainer = document.querySelector('.form-container');
  const formContents = document.querySelectorAll('.form-content');
  const formControls = document.querySelectorAll('.form-control');

  if (isDark) {
    formContainer.classList.add('dark-mode');
    formContents.forEach(content => content.classList.add('dark-mode'));
    formControls.forEach(control => control.classList.add('dark-mode'));
  } else {
    formContainer.classList.remove('dark-mode');
    formContents.forEach(content => content.classList.remove('dark-mode'));
    formControls.forEach(control => control.classList.remove('dark-mode'));
  }
}

function setChartTheme(chart, isDark) {
  if (chart) {
    const rootStyles = getComputedStyle(document.documentElement);
    chart.options.scales.x.grid.color = isDark ? rootStyles.getPropertyValue('--dark-chart-grid-color') : rootStyles.getPropertyValue('--light-chart-grid-color');
    chart.options.scales.y.grid.color = isDark ? rootStyles.getPropertyValue('--dark-chart-grid-color') : rootStyles.getPropertyValue('--light-chart-grid-color');
    chart.options.scales.x.ticks.color = isDark ? rootStyles.getPropertyValue('--dark-chart-text-color') : rootStyles.getPropertyValue('--light-chart-text-color');
    chart.options.scales.y.ticks.color = isDark ? rootStyles.getPropertyValue('--dark-chart-text-color') : rootStyles.getPropertyValue('--light-chart-text-color');
    chart.options.plugins.legend.labels.color = isDark ? rootStyles.getPropertyValue('--dark-chart-text-color') : rootStyles.getPropertyValue('--light-chart-text-color');
    chart.options.plugins.title.color = isDark ? rootStyles.getPropertyValue('--dark-chart-text-color') : rootStyles.getPropertyValue('--light-chart-text-color');
    chart.options.plugins.tooltip.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)';
    chart.options.plugins.tooltip.titleColor = isDark ? 'black' : 'white';
    chart.options.plugins.tooltip.bodyColor = isDark ? 'black' : 'white';

    // Update dataset colors
    chart.data.datasets.forEach((dataset, index) => {
      dataset.borderColor = isDark ? rootStyles.getPropertyValue(`--dark-chart-color${index + 1}`) : rootStyles.getPropertyValue(`--light-chart-color${index + 1}`);
      dataset.backgroundColor = isDark ? rootStyles.getPropertyValue(`--dark-chart-color${index + 1}`) : rootStyles.getPropertyValue(`--light-chart-color${index + 1}`);
    });

    chart.update();
  }
}

async function fetchData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching data:', error);
    Swal.fire({
      icon: 'error',
      title: 'Oops...',
      text: 'Something went wrong with fetching data!',
    });
  }
}

async function initialize() {
  const historyData = await fetchData('json/history_0.json');
  const aircraftData = await fetchData('json/aircraft.json');
  // Process and plot data
}

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
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
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
    }, { passive: true });

    lonInput.addEventListener('input', () => {
      const lon = parseFloat(lonInput.value);
      mapCenter[1] = isNaN(lon) ? 0 : lon;
      map.setView(mapCenter, mapZoom);
    }, { passive: true });

    zoomInput.addEventListener('input', () => {
      const zoom = parseInt(zoomInput.value);
      mapZoom = isNaN(zoom) ? 9 : zoom;
      map.setView(mapCenter, mapZoom);
    }, { passive: true });
  }

  // Map to store unique colors for each aircraft hex code
  const aircraftColors = new Map();

  // Function to generate a random color
  function generateRandomColor() {
    return '#' + (Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0');
  }

  // Function to get the color for an aircraft hex code
  function getColor(hex) {
    if (!aircraftColors.has(hex)) {
      aircraftColors.set(hex, generateRandomColor());
    }
    return aircraftColors.get(hex);
  }

  // Clear existing layers from the map
  map.eachLayer((layer) => {
    if (layer instanceof L.Circle) {
      map.removeLayer(layer);
    }
  });

  // Add colored points to the map based on latitude and longitude data
  validLocations.forEach((location) => {
    const color = getColor(location.hex);
    L.circle([location.lat, location.lon], {
      color: color,
      fillColor: color,
      fillOpacity: 1,
      radius: 500,
    }).addTo(map);
  });
}

// Load the data and perform calculations.
async function main() {
  const aircraftData = await loadAndConcatenateAllData();
  console.log('Aircraft Data:', aircraftData);
  if (aircraftData.length > 0) {
    const [filteredWindData, filteredTemperatureData] = window.calculateWindSpeedAndDirection(aircraftData);

    const windSpeedData = filteredWindData.map(row => ({
      x: row.ws,
      y: row.alt_geom * 0.0003048,
    }));
    const temperatureData = filteredTemperatureData.map(row => ({
      x: row.oat,
      y: row.alt_geom * 0.0003048,
    }));

    // Calculate additional meteorological parameters
    const { lapseRateData, approximatedLine, slope } = window.calculateAdditionalParameters(filteredTemperatureData);

    // Create and update the charts based on the concatenated data
    window.createCharts(windSpeedData, temperatureData, lapseRateData, approximatedLine, slope);
  }
  extractLatLonAndMap(aircraftData);
}

// Attach functions to the window object to make them globally accessible
window.generateJSONFilePaths = generateJSONFilePaths;
window.loadAndConcatenateData = loadAndConcatenateData;
window.loadAndConcatenateAllData = loadAndConcatenateAllData;
window.setMapTheme = setMapTheme;
window.setFormTheme = setFormTheme;
window.setChartTheme = setChartTheme;
window.fetchData = fetchData;
window.initialize = initialize;
window.extractLatLonAndMap = extractLatLonAndMap;
window.main = main;

// Ensure the toggleDarkMode function is attached to the window object
window.toggleDarkMode = toggleDarkMode;

// Call the main function.
main();