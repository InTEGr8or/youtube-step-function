#!/bin/bash

# Test the YouTube Processor API

# Get the API URL from .envrc
API_URL=$(grep '^export API_URL=' .envrc | cut -d '=' -f 2-)
API_URL+="process"

# Get the video IDs from test/videos.csv
VIDEO_IDS=$(awk -F'[=&]' '{if ($0 ~ /youtu.be/) {gsub(".*youtu.be/", "", $0); gsub("\\?.*", "", $0); print} else {print $2}}' test/videos.csv)

# Loop through the video IDs and send requests
for VIDEO_ID in $VIDEO_IDS; do
  curl -X POST \
    -H "Content-Type: application/json" \
    -d "{ \"videoId\": \"$VIDEO_ID\" }" \
    "$API_URL"
  echo "" # Add a newline for better output formatting
done

echo "API requests sent. Check the Step Function console for execution status."