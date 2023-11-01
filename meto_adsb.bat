@echo off
setlocal enabledelayedexpansion

:: Check for source directory argument
if "%~1"=="" (
    echo Usage: %0 [source_directory]
    exit /b 1
)

set "src_dir=%~1"
for %%A in ("%src_dir%\*.json") do (
    set "dest_file=%~dp0\json\%%~nxA"
    copy "%%A" "!dest_file!" > nul
)
echo Files located and copied

:: Function to start the HTTP server
:start_server
cd "%~dp0\json"
for /f "delims=" %%I in ('ipconfig ^| findstr /R /C:"IPv4 Address"') do (
    set "local_ip=%%I"
)
set "local_ip=!local_ip:*: =!"
python -m http.server 5050 --bind !local_ip! > nul 2>&1
if not errorlevel 1 (
    echo Do not close this terminal.
    echo The app is available at http://!local_ip!:5050.
) else (
    echo Failed to start the server.
)

:: Function to stop the server gracefully
:stop_server
for /f "tokens=1" %%A in ('netstat -aon ^| find ":5050" ^| find "LISTENING"') do (
    set "pid=%%A"
)
if defined pid (
    echo Stopping the server...
    taskkill /F /PID !pid!
    timeout 1 > nul
    goto :stop_server
)

:: Exit the script gracefully
:end_script
exit /b 0
