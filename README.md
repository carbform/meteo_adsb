# Meto-ADSB 

## Vertical Atmospheric Structure Analysis 

![Bengaluru](bengaluru.png)

An app that plots the vertical atmospheric structure as plots between Altitude and Temperature, Altitude vs. wind speed, and Altitude vs. Wind Direction using data collected from the [dump1090-fa](https://www.flightaware.com/adsb/piaware/install) ADSB decoder. The calculations are similar to those used in the [tar1090](https://github.com/wiedehopf/tar1090) package.


Reads the JSON data from `dump1090-fa/history_xx.json` files and calculates the following meteorologic parameters:

* Wind Speed (WS)
* Outside Air Temperature (OAT)

### Usage

* When using a custom location containing the .json files, edit the Javascript line and replace the path to the       custom location (Generally 'usr/run/dump1090-fa/')

```
let jsonFilesToLoad = generateJSONFilePaths('path_to_json_files', 100);
```
Open index.html and the page will generate two plots:

* Altitude vs. temperature
* Altitude vs. wind speed

You can use these plots to analyze the vertical atmospheric structure in the area where the data was collected. For example, you can look at how the temperature and wind speed change with altitude.

### How to interpret the plots

Altitude vs. temperature: The temperature generally decreases with height. However, there can be inversions, where the temperature increases with altitude. Inversions can trap pollutants and cause decreased air quality. The lapse rate can also be used to study the local moisture convection.

Altitude vs. wind speed: The wind speed generally increases with altitude. However, there can be low-level winds, which are caused by surface friction which can be used to understand the planetary boundary layer.


### Disclaimer: The calculated data may not be accurate. The results must analyzed qualitatively
