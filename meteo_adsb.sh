#!/bin/bash

CONFIG_FILE="config.json"
DEST_DIR="json_files"
DEMO_MODE=false

# Function to display help message
show_help() {
    echo "Usage: $0 [-d]"
    echo ""
    echo "Options:"
    echo "  -d    Run in demo mode. JSON files will not be copied."
    echo ""
    echo "Description:"
    echo "  This script sets up the Meteo-ADSB environment. It can be run in demo mode"
    echo "  where JSON files are not copied, or in normal mode where JSON files are"
    echo "  copied from a specified source directory."
}

# Function to read the configuration file
read_config() {
    if [ -f "$CONFIG_FILE" ]; then
        cat "$CONFIG_FILE"
    else
        echo "{}"
    fi
}

# Function to save the configuration file
save_config() {
    echo "$1" > "$CONFIG_FILE"
}

# Function to prompt for local or remote setup
prompt_local_or_remote() {
    config=$(read_config)
    local_machine=$(echo "$config" | jq -r '.local_machine')
    if [ "$local_machine" == "null" ]; then
        read -p "Is this a local machine setup? (y/n): " local_machine
        config=$(echo "$config" | jq --arg local_machine "$local_machine" '.local_machine = $local_machine')
    fi
    save_config "$config"
}

# Function to prompt for remote details if needed
prompt_remote_details() {
    config=$(read_config)
    local_machine=$(echo "$config" | jq -r '.local_machine')
    if [ "$local_machine" == "n" ]; then
        read -p "Enter the remote IP address: " remote_ip
        read -p "Enter the remote username: " remote_user
        config=$(echo "$config" | jq --arg remote_ip "$remote_ip" --arg remote_user "$remote_user" '.remote_ip = $remote_ip | .remote_user = $remote_user')
        save_config "$config"
    fi
}

# Function to copy JSON files from source to destination
copy_files() {
    config=$(read_config)
    local_machine=$(echo "$config" | jq -r '.local_machine')
    src_dir=$(echo "$config" | jq -r '.src_dir')
    if [ "$local_machine" == "n" ]; then
        remote_ip=$(echo "$config" | jq -r '.remote_ip')
        remote_user=$(echo "$config" | jq -r '.remote_user')
        scp "$remote_user@$remote_ip:$src_dir/*.json" "$DEST_DIR"
        echo "Copied .json files from $src_dir on $remote_ip to $DEST_DIR"
    else
        cp "$src_dir"/*.json "$DEST_DIR"
        echo "Copied .json files from $src_dir to $DEST_DIR"
    fi
}

# Function to start the server
start_server() {
    cd "$DEST_DIR" || exit
    local_ip=$(hostname -I | awk '{print $1}')
    echo "Starting server at http://$local_ip:8000"
    python3 -m http.server 8000
}

# Main script execution
main() {
    mkdir -p "$DEST_DIR"
    prompt_local_or_remote
    prompt_remote_details

    while getopts "dh" opt; do
      case $opt in
        d)
          DEMO_MODE=true
          ;;
        h)
          show_help
          exit 0
          ;;
        \?)
          echo "Invalid option: -$OPTARG" >&2
          show_help
          exit 1
          ;;
      esac
    done

    if [ "$DEMO_MODE" = true ]; then
      echo "Running in demo mode. JSON files will not be copied."
    else
      copy_files
    fi

    start_server
}

main "$@"