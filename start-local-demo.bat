@echo off
setlocal
cd /d "%~dp0"

set "BUNDLED_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

if exist "%BUNDLED_NODE%" (
  "%BUNDLED_NODE%" scripts\dev-local-api.js
) else (
  node scripts\dev-local-api.js
)

echo.
echo StackShelf local server stopped.
pause
