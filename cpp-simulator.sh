#!/bin/bash

# Dummy C++ job simulator for macOS/Linux
# Randomly succeeds (exit 0) or fails (exit 1)

echo "Starting job with arguments: $*"
echo "Job name: $1"

# Generate random number between 1-10
rand=$((RANDOM % 10 + 1))

# Simulate some processing time (1-3 seconds)
sleep_time=$((RANDOM % 3 + 1))
sleep $sleep_time

# 70% success rate - exit 0 if rand <= 7, exit 1 if rand > 7
if [ $rand -le 7 ]; then
    echo "Job completed successfully"
    exit 0
else
    echo "Job failed with error"
    exit 1
fi