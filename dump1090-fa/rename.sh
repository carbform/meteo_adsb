#!/bin/bash

# Get a list of all the .json files in the current directory
json_files=$(find . -type f -name "*.json")

# Create a set to store the generated random numbers
random_numbers=()

# Iterate over the .json files and rename them
for json_file in $json_files; do
  # Generate a random number
  random_number=$(($RANDOM % 10000))

  # Add the random number to the set
  random_numbers+=($random_number)

  # Make sure that the random number is not already in use as a file name
  while [[ -f "${random_number}.json" ]]; do
    random_number=$(($RANDOM % 10000))
  done

  # Rename the .json file
  mv "$json_file" "history_${random_number}.json"
done

