#!/bin/bash

# Check for source directory argument
if [ $# -ne 1 ]; then
    echo "Usage: $0 [source_directory]"
    exit 1
fi

src_dir="$1"
script_dir="$(dirname "$(realpath "$0")")"
dest_dir="$script_dir/json"
server_pid=""

# Function to copy .json files from source to destination
copy_files() {
    cp "$src_dir"/*.json "$dest_dir"
    echo "Files located and copied"
}

# Function to start the HTTP server
start_server() {
    cd "$dest_dir"
    local_ip=$(hostname -I | awk '{print $1}')
    python3 -m http.server 5050 -d .. --bind "$local_ip" > /dev/null 2>&1 &
    server_pid=$!
    sleep 1
    if ps -p $server_pid > /dev/null; then
        echo "Do not close this terminal."
        echo "The app is available at http://$local_ip:5050."
    else
        echo "Failed to start the server."
    fi
}

# Function to stop the server gracefully
stop_server() {
    if [ -n "$server_pid" ]; then
        echo "Stopping the server..."
        kill -TERM "$server_pid"
        wait "$server_pid"
        server_pid=""
    fi
}

# Function to exit the script gracefully
exit_script() {
    stop_server
    exit 0
}

# Trap termination signals to stop the server and exit the script
trap exit_script SIGINT SIGTERM

# Start the server and copy files once initially
copy_files
start_server

while true; do
    sleep 240
    copy_files
done