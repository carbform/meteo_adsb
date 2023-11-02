# Meteo-ADSB

## Vertical Atmospheric Structure Analysis 

![Bengaluru](bengaluru.png)

 Plots the vertical atmospheric structure as plots between Altitude and Temperature and Altitude vs. wind speed using aircraft data collected from the [dump1090-fa](https://www.flightaware.com/adsb/piaware/install) ADSB decoder. The calculations are similar to those used in the [tar1090](https://github.com/wiedehopf/tar1090) package.


Reads the JSON data from `dump1090-fa/history_xx.json` files and calculates the following meteorologic parameters:

* Wind Speed (WS)
* Outside Air Temperature (OAT)

### Usage

* Installation:

1. Download the script to your system.

2. Open the terminal and navigate to the folder containing the script.

3. Make the script executable using the following command:

```
bash chmod +x meteo_adsb.sh ```

4. Open the terminal and run the command to install Meteo-ADSB:

```
sudo ./meteo_adsb.sh -i
```
The script will prompt you to configure the source directory for JSON data. You can choose to run the ADSB decoder locally or on a remote machine.

```sudo ./meteo_adsb.sh -r```

5. This will start a local server on port 5050, which is accessible at http://DEVICE_LOCAL_IP:5050.

The webpage will generate
* Altitude vs. temperature
* Altitude vs. wind speed
* Map of Aircraft data sampling locations

You can use these plots to analyze the vertical atmospheric structure in the area where the data was collected. For example, you can look at how the temperature and wind speed change with altitude.

### How to interpret the plots

Altitude vs. temperature: The temperature generally decreases with height. However, there can be inversions, where the temperature increases with altitude. Inversions can trap pollutants and cause decreased air quality. The lapse rate can also be used to study the local moisture convection.

Altitude vs. wind speed: The wind speed generally increases with altitude. However, there can be low-level winds, which are caused by surface friction which can be used to understand the planetary boundary layer.


### Disclaimer: The calculated data may not be accurate. The results must analyzed qualitatively
