// Ensure the DOM is fully loaded before running the script
document.addEventListener('DOMContentLoaded', function() {
  // Fetch the data from the JSON file
  fetch('/home/carbform/meto_adsb/html/json/history_117.json')
    .then(response => response.json())
    .then(data => {
      const df = data.aircraft;

      // Calculate the lapse rate using the helper function
      const lapseRateData = calculateLapseRate(df);
      const lapseRate = lapseRateData.length > 0 ? lapseRateData[0].x : -0.0065; // Default lapse rate if not calculated

      // Calculate the air pressure using the helper function
      const pressureData = calculateAirPressure(df, lapseRate);

      // Prepare the data for the chart
      const chartData = {
        labels: pressureData.map(point => point.altitude.toFixed(2)),
        datasets: [{
          label: 'Altitude vs Pressure',
          data: pressureData.map(point => point.pressure.toFixed(2)),
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          fill: false,
          tension: 0.1
        }]
      };

      // Create the chart
      const ctx = document.getElementById('altitudePressureChart').getContext('2d');
      new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
          responsive: true,
          scales: {
            x: {
              title: {
                display: true,
                text: 'Altitude (m)'
              }
            },
            y: {
              title: {
                display: true,
                text: 'Pressure (Pa)'
              }
            }
          }
        }
      });
    })
    .catch(error => console.error('Error fetching data:', error));
});
