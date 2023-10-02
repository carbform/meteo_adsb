

# %%
import pandas as pd
import json
import numpy as np
import math
# Read the JSON data
json_data = json.load(open('dump1090-fa/aircraft.json'))

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
      "baro_rate": pd.to_numeric(aircraft["baro_rate"]) if "alt_geom" in aircraft else np.nan,
      "nav_qnh": pd.to_numeric(aircraft["nav_qnh"]) if "nav_qnh" in aircraft else np.nan,
      "mag_heading": pd.to_numeric(aircraft["mag_heading"]) if "mag_heading" in aircraft else np.nan ,
      "nav_altitude_mcp": pd.to_numeric(aircraft["nav_altitude_mcp"]) if "nav_altitude_mcp" in aircraft else np.nan,
      "lat": aircraft["lat"] if "lat" in aircraft else np.nan,
      "lon": aircraft["lon"] if "lon" in aircraft else np.nan,
  })

# Create a Pandas DataFrame
df = pd.DataFrame(flight_details)

# Print the DataFrame
print(df)





#%%
import numpy as np
import math

def calculate_wind_speed_and_direction(aircraft):
  """Calculates the wind speed and direction of the given aircraft.

  Args:
    aircraft: A dictionary containing the aircraft's flight details.

  Returns:
    A tuple containing the wind speed and direction in degrees.
  """

  # Preprocess the track and heading values.

  trk = (math.pi / 180) * aircraft["track"]
  hdg = (math.pi / 180) * aircraft["mag_heading"]

  # Calculate the true airspeed (TAS) in meters per second.
  tas = aircraft["tas"]

  # Calculate the ground speed (GS) in meters per second.
  gs = aircraft["gs"]

  # Handle the NaN values.
  if np.isnan(trk) or np.isnan(hdg):
    ws = np.nan
    wd = np.nan
  else:
    # Calculate the wind speed in meters per second.
    ws = round(math.sqrt(math.pow(tas - gs, 2) + 4 * tas * gs * math.pow(math.sin((hdg - trk) / 2), 2)))

    # Calculate the wind direction in degrees.
    wd = trk + math.atan2(tas * math.sin(hdg - trk), tas * math.cos(hdg - trk) - gs)

    # Fix the wind direction if it is negative or greater than 360 degrees.
    if wd < 0:
      wd = wd + 2 * math.pi
    if wd > 2 * math.pi:
      wd = wd - 2 * math.pi

    # Convert the wind direction from radians to degrees.
    wd = round((180 / math.pi) * wd)

  return ws, wd




#%%

# Create a Pandas DataFrame from the flight details.
flight_df = df

# Calculate the wind speed and direction for each aircraft.
for i in range(len(flight_df)):
    

    # Add the wind speed and direction to the DataFrame.
    flight_df.loc[i, "wind_speed"] = wind_speed
    flight_df.loc[i, "wind_direction"] = wind_direction

# Print the DataFrame.
print(flight_df)

# %%
result = df.apply(calculate_wind_speed_and_direction, axis=1)
# %%
