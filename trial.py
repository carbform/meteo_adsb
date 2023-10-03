
# METO-ADSB 
#Author : Sarat Chandra (www.carbform.github.io)
# Inspired by tar1090

#%% Read the JSON data
import glob
import pandas as pd
import json
import numpy as np

# Get a list of all the JSON files in the folder
json_files = glob.glob('dump1090-fa/*.json')

# Create an empty list to store the Pandas DataFrames
df_list = []

# Iterate over the list of JSON files and read each file into a Pandas DataFrame
for json_file in json_files:
    json_data = json.load(open(json_file))

    # Check if the "aircraft" key exists in the JSON data
    if "aircraft" in json_data:
        # Create a list of flight details
        flight_details = []
        for aircraft in json_data["aircraft"]:
            flight_details.append({
                "hex": aircraft["hex"],
                "flight": aircraft["flight"] if "flight" in aircraft else np.nan,
                "alt_baro": pd.to_numeric(aircraft["alt_baro"]) if "alt_baro" in aircraft else np.nan,
                "alt_geom": pd.to_numeric(aircraft["alt_geom"]) if "alt_geom" in aircraft else np.nan,
                "gs": pd.to_numeric(aircraft["gs"]) if "gs" in aircraft else np.nan,
                "tas": pd.to_numeric(aircraft["tas"]) if "tas" in aircraft else np.nan,
                "track": pd.to_numeric(aircraft["track"]) if "track" in aircraft else np.nan,
                "track_rate": pd.to_numeric(aircraft["track_rate"]) if "track_rate" in aircraft else np.nan,
                "mach": pd.to_numeric(aircraft["mach"]) if "mach" in aircraft else np.nan,
                "baro_rate": pd.to_numeric(aircraft["baro_rate"]) if "baro_rate" in aircraft else np.nan,
                "nav_qnh": pd.to_numeric(aircraft["nav_qnh"]) if "nav_qnh" in aircraft else np.nan,
                "mag_heading": pd.to_numeric(aircraft["mag_heading"]) if "mag_heading" in aircraft else np.nan ,
                "nav_altitude_mcp": pd.to_numeric(aircraft["nav_altitude_mcp"]) if "nav_altitude_mcp" in aircraft else np.nan,
                "lat": aircraft["lat"] if "lat" in aircraft else np.nan,
                "lon": aircraft["lon"] if "lon" in aircraft else np.nan,
            })

        # Create a Pandas DataFrame
        df = pd.DataFrame(flight_details)
        df["trk"] = (np.pi / 180) * df["track"]
        df["hdg"] = (np.pi / 180) * df["mag_heading"]

        # Append the Pandas DataFrame to the empty list
        df_list.append(df)

# Concatenate all the Pandas DataFrames in the list into a single Pandas DataFrame
df = pd.concat(df_list)

# Print the Pandas DataFrame
print(df)

#%%
import pandas as pd
import numpy as np

def calculate_wind_speed_and_direction(df):
  """Calculates the wind speed and wind direction in meters per second and
  degrees, respectively, from the given DataFrame.

  Args:
    df: A Pandas DataFrame containing the aircraft's flight details.

  Returns:
    A DataFrame containing the wind speed and wind direction for each row.
  """

  # Check if any of the "tas", "gs", "hdg", or "track" columns are NaN.
  if df["tas"].isna().all() or df["trk"].isna().all() or df["hdg"].isna().all() or df["gs"].isna().all():
    # If any of the columns are NaN, set the wind speed and wind direction to NaN.
    df["ws"] = np.nan
    df["wd"] = np.nan
  else:
    # Calculate the wind speed and wind direction.
    df["ws"] = np.round(np.sqrt(np.power(df["tas"] - df["gs"], 2) + 4 * df["tas"] * df["gs"] * np.power(np.sin((df["hdg"] - df["trk"]) / 2), 2)))
    df["wd"] = df["trk"] + np.arctan2(df["tas"] * np.sin(df["hdg"] - df["trk"]), df["tas"] * np.cos(df["hdg"] - df["trk"]) - df["gs"])

  # Fix the wind direction if it is negative or greater than 360 degrees.
  if df["wd"].any() < 0:
    df["wd"] = df["wd"] + 2 * np.pi
  if df["wd"].any() > 2 * np.pi:
    df["wd"] = df["wd"] - 2 * np.pi

  # Convert the wind direction from radians to degrees.
  df["wd"] = np.round((180 / np.pi) * df["wd"])


  # Check if any of the "tas", or "mach" columns are NaN.
  if df["tas"].isna().all() or df["mach"].isna().all():
    # If any of the columns are NaN, set the wind speed and wind direction to NaN.
    df["oat"] = np.nan
    df["tat"] = np.nan
  else:
    # Calculate the wind speed and wind direction.
    df["oat"] = np.power((df["tas"] / 661.47 / df["mach"]), 2) * 288.15 - 273.15
    df["tat"] = -273.15 + (df["oat"] + 273.15) * (1 + 0.2 * df["mach"] * df["mach"])

  return df
#%%
# Calculate the wind speed, wind direction, oat and tat for each row of the DataFrame.
df = calculate_wind_speed_and_direction(df.copy())

# Print the DataFrame.
print(df)

# %%




# %%
import matplotlib.pyplot as plt
plt.scatter(df.ws,df.alt_geom)
#%%
plt.scatter(df.oat,df.alt_geom*0.0003048)

# %%
plt.scatter(df.lat,df.alt_geom*0.0003048)