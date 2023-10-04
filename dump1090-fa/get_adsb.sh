#!/bin/bash

# You can use this code to copy all the .json files remotely from your Raspberry Pi / any Linux desktop running dump1090-fa.
# Replace the username and the IP address with the remote machine's.
# Also, change the destination folder /home/user/aircraft to suit your's appropriately.
scp -r username@xx.xxx.xx.xx:/var/run/dump1090-fa/*.json /home/user/aircraft


