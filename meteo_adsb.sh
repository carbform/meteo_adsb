#!/bin/bash

CONFIG_FILE="meteo_adsb_config.json"
DEST_DIR="html/json"
SRC_DIR="/var/run/dump1090-fa"

read_config() {
    if [ -f "$CONFIG_FILE" ]; then
        config=$(cat "$CONFIG_FILE")
    else
        config=$(cat <<EOF
{
    "local_machine": "n",
    "src_dir": "$SRC_DIR",
    "remote_ip": "",
    "remote_user": ""
}
EOF
)
        echo "$config" > "$CONFIG_FILE"
    fi
    echo "$config"
}

save_config() {
    echo "$1" > "$CONFIG_FILE"
}

prompt_local_or_remote() {
    config=$(read_config)
    local_machine=$(echo "$config" | jq -r '.local_machine')
    if [ "$local_machine" == "n" ]; then
        read -p "Enter the remote IP address: " remote_ip
        read -p "Enter the remote username: " remote_user
        config=$(echo "$config" | jq --arg remote_ip "$remote_ip" --arg remote_user "$remote_user" '.remote_ip = $remote_ip | .remote_user = $remote_user')
    fi
    save_config "$config"
}

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

start_server() {
    cd "$DEST_DIR"
    local_ip=$(hostname -I | awk '{print $1}')
    python3 -m http.server 5050 -d .. --bind "$local_ip" &
    server_pid=$!
    sleep 1
    if ps -p $server_pid > /dev/null; then
        echo "Do not close this terminal"
        echo "Meteo-ADSB is running. Access it at http://$local_ip:5050 on any browser"
    else
        echo "Failed to start the server. Check if Python 3 is installed on this machine."
    fi
    echo $server_pid
}

stop_server() {
    if [ -n "$1" ]; then
        echo "Stopping the server..."
        kill "$1"
        wait "$1"
        echo "Server stopped."
    fi
}

main() {
    config=$(read_config)
    if [ "$1" == "-r" ] || [ "$1" == "-i" ]; then
        prompt_local_or_remote
    else
        read_config
    fi

    copy_files
    server_pid=$(start_server)

    trap "stop_server $server_pid; exit" INT TERM

    while true; do
        sleep 240
        copy_files
    done
}

main "$@"
