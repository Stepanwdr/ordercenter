@echo off
REM ===================================================================
REM  Install the Kitchen Print Agent as a Windows service.
REM  - autostarts when the PC boots
REM  - runs headless, so Windows QuickEdit Mode can NEVER freeze it
REM  - restarts automatically if it crashes
REM
REM  Requires nssm.exe (https://nssm.cc) on PATH or in this folder.
REM  RIGHT-CLICK this file -> "Run as administrator".
REM ===================================================================
setlocal
set "DIR=%~dp0"

REM locate node.exe
for /f "delims=" %%i in ('where node 2^>nul') do set "NODE=%%i"
if not defined NODE (
  echo ERROR: node.exe not found on PATH. Install Node.js first.
  pause
  exit /b 1
)

echo Installing service KitchenPrintAgent...
nssm install KitchenPrintAgent "%NODE%" "%DIR%index.js"
nssm set KitchenPrintAgent AppDirectory "%DIR%"
nssm set KitchenPrintAgent AppStdout "%DIR%agent.log"
nssm set KitchenPrintAgent AppStderr "%DIR%agent.log"
nssm set KitchenPrintAgent Start SERVICE_AUTO_START
nssm start KitchenPrintAgent

echo.
echo Done. Service "KitchenPrintAgent" installed and started.
echo Logs: %DIR%agent.log
echo Manage: nssm restart KitchenPrintAgent ^| nssm stop KitchenPrintAgent ^| nssm remove KitchenPrintAgent confirm
pause
endlocal
