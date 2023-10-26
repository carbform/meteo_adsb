// Get the path to the JSON file.
const jsonFile = 'dump1090-fa/9829.json';

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

function plotScatter(chartId, chartData, chartTitle, xLabel, yLabel, xMin, xMax, yMin, yMax, color) {
  new Chart(chartId, {
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
          },
          min: xMin,
          max: xMax,
        },
        y: {
          type: 'linear',
          position: 'left',
          title: {
            display: true,
            text: yLabel,
          },
          min: yMin,
          max: yMax,
        },
      },
      plugins: {
        title: {
          display: true,
          text: chartTitle,
        },
      },
      plugins: {
        legend: {
          labels: {
            font: {
              color: color, // Set the legend label color to match the scatter color
            },
          },
        },
      },
    },
  });
}

// Load the data and perform calculations.
async function main() {
  const aircraftData = await getDf();
  calculateWindSpeedAndDirection(aircraftData);
  calculateOatAndTat(aircraftData);

  // Get the canvas elements for the charts.
  const chartCanvas1 = document.getElementById('chart1');
  const chartCanvas2 = document.getElementById('chart2');

  // Filter data for the two charts (Wind Speed vs Altitude and Temperature vs Altitude).
  const windSpeedData = aircraftData.map(row => ({
    x: row.ws,
    y: row.alt_geom / 1000,
  }));
  const temperatureData = aircraftData.map(row => ({
    x: row.oat,
    y: row.alt_geom / 1000,
  }));

  // Plot the two scatter charts.
  plotScatter(
    chartCanvas1,
    windSpeedData,
    'Wind Speed vs Altitude',
    'Wind Speed (km/hr)',
    'Altitude (km)',
    0,
    60,
    0,
    14,
    'red',
  );

  plotScatter(
    chartCanvas2,
    temperatureData,
    'Temperature vs Altitude',
    'Temperature (°C)',
    'Altitude (km)',
    -60,
    40,
    0,
    14,
    'blue'
  );
}

// Call the main function.
main();