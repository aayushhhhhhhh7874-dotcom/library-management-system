@echo off
setlocal
cd /d "%~dp0java-backend"

where java >nul 2>nul
if errorlevel 1 (
  echo Java was not found on this computer.
  echo Install JDK 17 or newer, then run this file again.
  echo.
  pause
  exit /b 1
)

echo Starting StackShelf Java backend...
echo Open http://127.0.0.1:8080 after the server starts.
echo Press Ctrl+C in this window to stop the server.
echo.

if not exist build mkdir build
del /q build\*.class >nul 2>nul

javac -d build *.java
if errorlevel 1 (
  echo.
  echo Java compilation failed. Fix the errors above, then run again.
  pause
  exit /b 1
)

java -cp build StackShelfJavaServer --open

echo.
echo StackShelf Java server stopped.
pause
