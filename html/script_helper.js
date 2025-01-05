// script_helper.js

// Ensure the calculateAdditionalParameters function is defined
function calculateAdditionalParameters(df) {
  const lapseRateData = calculateLapseRate(df);
  const temperatureData = df.map(row => ({
    x: row.oat,
    y: row.alt_geom * 0.0003048,
  })).filter(point => !isNaN(point.x) && !isNaN(point.y));

  console.log('Temperature Data:', temperatureData);

  const { slope, intercept } = calculateLinearRegression(temperatureData);
  const approximatedLine = temperatureData.map(point => ({
    x: slope * point.y + intercept,
    y: point.y,
  }));

  return { lapseRateData, approximatedLine, slope };
}

// Ensure the calculateLapseRate function is defined
function calculateLapseRate(df) {
  const lapseRateData = [];

  for (let i = 1; i < df.length; i++) {
    const prevRow = df[i - 1];
    const currRow = df[i];

    const deltaTemp = currRow.oat - prevRow.oat;
    const deltaAlt = (currRow.alt_geom - prevRow.alt_geom) * 0.0003048; // Convert feet to km

    if (!isNaN(deltaTemp) && !isNaN(deltaAlt) && deltaAlt !== 0) {
      const lapseRate = deltaTemp / deltaAlt;
      lapseRateData.push({ x: lapseRate, y: currRow.alt_geom * 0.0003048 });
    }
  }

  return lapseRateData;
}

// Ensure the calculateLinearRegression function is defined
function calculateLinearRegression(data) {
  const n = data.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

  for (let i = 0; i < n; i++) {
    const x = data[i].y; // Altitude
    const y = data[i].x; // Temperature
    if (!isNaN(x) && !isNaN(y)) {
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    }
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  console.log(`Slope (DT/DZ): ${slope}, Intercept: ${intercept}`);

  return { slope, intercept };
}

// Ensure the calculateWindSpeedAndDirection function is defined
function calculateWindSpeedAndDirection(df) {
  const filteredWindData = [];
  const filteredTemperatureData = [];

  for (let row of df) {
    const tas = row.tas;
    const gs = row.gs;
    const hdg = row.track;
    const trk = row.mag_heading;
    const mach = row.mach;
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
  filteredWindData.forEach(row => {
    const mach = row.mach;
    const oat = Math.pow((row.tas / 661.47 / mach), 2) * 288.15 - 273.15;
    row.oat = oat;
    row.tat = -273.15 + (oat + 273.15) * (1 + 0.2 * mach * mach);
    filteredTemperatureData.push(row);
  });

  return [filteredWindData, filteredTemperatureData];
}

// Attach functions to the window object to make them globally accessible
window.calculateWindSpeedAndDirection = calculateWindSpeedAndDirection;
window.calculateLinearRegression = calculateLinearRegression;
window.calculateLapseRate = calculateLapseRate;
window.calculateAdditionalParameters = calculateAdditionalParameters;
