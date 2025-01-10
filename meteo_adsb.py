import os
import shutil
import subprocess
import time
import json
import threading
import argparse
from http.server import SimpleHTTPRequestHandler, HTTPServer

CONFIG_FILE = "meteo_adsb_config.json"
DEST_DIR = os.path.join("json")
SRC_DIR = "/var/run/dump1090-fa"

def read_config():
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, "r") as f:
            config = json.load(f)
    else:
        config = {
            "local_machine": "n",
            "src_dir": SRC_DIR,
            "remote_ip": "",
            "remote_user": ""
        }
        save_config(config)
    return config

def save_config(config):
    with open(CONFIG_FILE, "w") as f:
        json.dump(config, f, indent=4)

def prompt_local_or_remote(config):
    config["local_machine"] = input("Is dump1090-fa running on the local machine? (y/n): ").strip().lower()
    if config["local_machine"] == "n":
        config["remote_ip"] = input("Enter the remote IP address: ").strip()
        config["remote_user"] = input("Enter the remote username: ").strip()
    save_config(config)

def copy_files(config):
    if config["local_machine"] == "n":
        remote_path = f"{config['remote_user']}@{config['remote_ip']}:{config['src_dir']}/*.json"
        subprocess.run(["scp", remote_path, DEST_DIR])
        print(f"Copied .json files from {config['src_dir']} on {config['remote_ip']} to {DEST_DIR}")
    else:
        for file_name in os.listdir(config["src_dir"]):
            if file_name.endswith(".json"):
                shutil.copy(os.path.join(config["src_dir"], file_name), DEST_DIR)
        print(f"Copied .json files from {config['src_dir']} to {DEST_DIR}")

class CustomHTTPRequestHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.path = '/index.html'
        return super().do_GET()

    def log_message(self, format, *args):
        pass  # Suppress logging

def start_server():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    local_ip = subprocess.check_output(["hostname", "-I"]).decode().split()[0]
    handler = CustomHTTPRequestHandler
    handler.extensions_map.update({
        '.html': 'text/html',
    })
    with HTTPServer(("", 8000), handler) as httpd:
        print(f"Do not close this terminal")
        print(f"Meteo-ADSB is running. Access it at http://{local_ip}:8000 on any browser")
        httpd.serve_forever()

def stop_server(server_process):
    if server_process:
        print("Stopping the server...")
        server_process.terminate()
        server_process.wait()
        print("Server stopped.")

def update_data_periodically(config, interval=300):
    def update():
        while True:
            copy_files(config)
            time.sleep(interval)
    threading.Thread(target=update, daemon=True).start()

def main(demo_mode):
    config = read_config()
    if len(os.sys.argv) == 2 and os.sys.argv[1] in ["-r", "-i"]:
        prompt_local_or_remote(config)
    else:
        read_config()

    if demo_mode:
        print("Running in demo mode. JSON files will not be copied.")
    else:
        print("Copying JSON files...")
        copy_files(config)
        update_data_periodically(config)

    print("Starting the server...")
    start_server()

    try:
        while True:
            time.sleep(1)
    except (KeyboardInterrupt, SystemExit):
        print("Exiting the script.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Meteo-ADSB script')
    parser.add_argument('-d', '--demo', action='store_true', help='Run in demo mode. JSON files will not be copied.')
    parser.add_argument('-r', '--remote', action='store_true', help='Prompt for remote setup details.')
    parser.add_argument('-i', '--interactive', action='store_true', help='Interactive mode to prompt for setup details.')
    args = parser.parse_args()
    main(args.demo)
