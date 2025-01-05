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

// Call the main function.
main();