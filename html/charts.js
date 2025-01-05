

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

// Variables to store the chart objects and initial scale values
let chart1;
let chart2;
let chart3;
let chart1XMin = 0;
let chart1XMax = 30;
let chart1YMin = 0;
let chart1YMax = 14;
let chart2XMin = -60;
let chart2XMax = 40;
let chart2YMin = 0;
let chart2YMax = 14;

function createScatterChart(chartId, chartData, chartTitle, xLabel, yLabel, xMin, xMax, yMin, yMax, color, aspectRatio) {
    const isDarkMode = document.body.classList.contains('dark-mode');
    const textColor = isDarkMode ? '#ffffff' : '#000000';
    const gridColor = isDarkMode ? '#444444' : '#e0e0e0'; // Adjust grid color for better visibility

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
    const gridColor = isDark ? '#444444' : '#e0e0e0'; // Adjust grid color for better visibility
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

function createCharts(windSpeedData, temperatureData, lapseRateData, approximatedLine, slope) {
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

    // For chart2 (Temperature)
    chart2 = createScatterChart(
        'chart2',
        temperatureData,
        '',
        'Temperature (°C)',
        'Altitude (km)',
        chart2XMin,
        chart2XMax,
        chart2YMin,
        chart2YMax,
        'blue',
        1 // Set the aspect ratio for chart2 here
    );

    // Add approximated line to chart2
    chart2.data.datasets.push({
        label: `Lapse Rate (°C/km): ${slope.toFixed(2)}`,
        data: approximatedLine,
        type: 'line',
        borderColor: 'green',
        borderWidth: 5, // Thicker line
        fill: false,
        pointRadius: 0,
        order: 1, // Ensure the line is drawn over the markers
    });

    // Configure the legend to show the slope line as a line
    chart2.options.plugins.legend = {
        display: true,
        labels: {
            generateLabels: function (chart) {
                const datasets = chart.data.datasets;
                return datasets.map((dataset, i) => {
                    const meta = chart.getDatasetMeta(i);
                    const style = meta.controller.getStyle(i);

                    return {
                        text: dataset.label,
                        fillStyle: style.backgroundColor,
                        strokeStyle: style.borderColor,
                        lineWidth: style.borderWidth,
                        hidden: !chart.isDatasetVisible(i),
                        datasetIndex: i,
                        // Use line style for the slope line
                        pointStyle: dataset.type === 'line' ? 'line' : style.pointStyle,
                    };
                });
            },
            usePointStyle: true,
            pointStyle: 'circle',
            radius: 3,
            color: chart2.options.scales.x.ticks.color,
        },
    };

    // For chart3 (Lapse Rate)
    chart3 = createScatterChart(
        'chart3',
        lapseRateData,
        'Lapse Rate vs Altitude',
        'Lapse Rate (°C/km)',
        'Altitude (km)',
        -10,
        10,
        0,
        14,
        'green',
        1 // Set the aspect ratio for chart3 here
    );

    // Set the initial grid color for all charts
    chart1.options.scales.x.grid.color = getComputedStyle(document.documentElement).getPropertyValue('--chart-grid-color');
    chart1.options.scales.y.grid.color = getComputedStyle(document.documentElement).getPropertyValue('--chart-grid-color');
    chart2.options.scales.x.grid.color = getComputedStyle(document.documentElement).getPropertyValue('--chart-grid-color');
    chart2.options.scales.y.grid.color = getComputedStyle(document.documentElement).getPropertyValue('--chart-grid-color');
    chart3.options.scales.x.grid.color = getComputedStyle(document.documentElement).getPropertyValue('--chart-grid-color');
    chart3.options.scales.y.grid.color = getComputedStyle(document.documentElement).getPropertyValue('--chart-grid-color');

    // Update the charts to reflect the changes
    chart1.update();
    chart2.update();
    chart3.update();
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

    // Update the chart after changing the dark/light mode settings
    chart1.update();
    chart2.update();
    chart3.update();
}

// Attach functions to the window object to make them globally accessible
window.createCharts = createCharts;
window.setChartTheme = setChartTheme;
window.updateChartColors = updateChartColors;
window.calculateAdditionalParameters = calculateAdditionalParameters;
window.calculateLapseRate = calculateLapseRate;
window.calculateLinearRegression = calculateLinearRegression;
window.toggleDarkMode = toggleDarkMode;
window.updateChartScales = updateChartScales;
