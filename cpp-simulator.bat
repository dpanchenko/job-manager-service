@echo off
REM Dummy C++ job simulator for Windows
REM Randomly succeeds (exit 0) or fails (exit 1)

setlocal enabledelayedexpansion

echo Starting job with arguments: %*
echo Job name: %1

REM Generate random number between 1-10
set /a "rand=%RANDOM% %% 10 + 1"

REM Simulate some processing time (1-3 seconds)
set /a "sleepTime=%RANDOM% %% 3 + 1"
timeout /t !sleepTime! > nul

REM 70% success rate - exit 0 if rand <= 7, exit 1 if rand > 7
if !rand! LEQ 7 (
    echo Job completed successfully
    exit /b 0
) else (
    echo Job failed with error
    exit /b 1
)