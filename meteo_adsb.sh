#!/bin/bash

# Get the script's directory
script_dir="$(dirname "$(realpath "$0")")"

# Set the local destination directory
dest_dir="$script_dir/html/json"

# Config file path
config_file="$script_dir/meteo_adsb_config"

local_machine="n"
src_dir="/var/run/dump1090-fa"

read_config() {
    if [ -f "$config_file" ]; then
        source "$config_file"
    else
        echo "Config file not found. Creating a new configuration."

        read -p "Enter the source directory (e.g., /var/run/dump1090-fa): " src_dir

        # Initialize default values
        local_machine="n"
        remote_ip=""
        remote_user=""
        save_config
    fi
}

# Function to save the configuration
save_config() {
    echo "local_machine=\"$local_machine\"" > "$config_file"
    echo "src_dir=\"$src_dir\"" >> "$config_file"
    echo "remote_ip=\"$remote_ip\"" >> "$config_file"
    echo "remote_user=\"$remote_user\"" >> "$config_file"
}

# Function to prompt if dump1090-fa is running locally or remotely
prompt_local_or_remote() {
    read -p "Is dump1090-fa running on the local machine? (y/n): " local_machine
    if [[ "$local_machine" == "n" || "$local_machine" == "N" ]]; then
        read -p "Enter the remote IP address: " remote_ip
        read -p "Enter the remote username: " remote_user
    fi
    save_config
}

# Function to copy .json files from source to destination
copy_files() {
    if [[ "$local_machine" == "n" || "$local_machine" == "N" ]]; then
        # Copy from the remote source using scp
        scp "$remote_user@$remote_ip:$src_dir"/*.json "$dest_dir"
        echo "JSON Files found"
        echo "Copied .json files from $src_dir on $remote_ip to $dest_dir"
    else
        cp "$src_dir"/*.json "$dest_dir"
        if [ $? -eq 0 ]; then
            echo "JSON Files found"
            echo "Copied .json files from $src_dir to $dest_dir"
        else
            echo "Error: Failed to copy .json files from $src_dir. Please check the source directory."
        fi
    fi
}

# Function to start the HTTP server
start_server() {
    cd "$dest_dir"
    local_ip=$(hostname -I | awk '{print $1}')
    python3 -m http.server 5050 -d .. --bind "$local_ip" > /dev/null 2>&1 &
    server_pid=$!
    sleep 1
    if ps -p $server_pid > /dev/null; then
        echo "Do not close this terminal"
        echo "Meteo-ADSB is running. Access it at http://$local_ip:5050 on any browser"
    
    else
        echo "Failed to start the server. Check if Python 3 is installed on this machine."
    fi
}

# Function to stop the server gracefully
stop_server() {
    if [ -n "$server_pid" ]; then
        echo "Stopping the server..."
        kill -TERM "$server_pid"
        wait "$server_pid"
        server_pid=""
        echo "Server stopped."
    fi
}

# Function to exit the script gracefully
exit_script() {
    stop_server
    echo "Exiting the script."
    exit 0
}

# Trap termination signals to stop the server and exit the script
trap exit_script SIGINT SIGTERM

# Check if the user provided the -i or -r option
if [[ $# -eq 1 && ( "$1" == "-r" || "$1" == "-i" ) ]]; then
    prompt_local_or_remote
else
    # Read or create the configuration
    read_config
fi

# Start the server and copy files once initially
copy_files
start_server

while true; do
    sleep 240
    copy_files
done
