#!/bin/bash

# Deploy the CDK stack locally
echo "Deploying CDK stack..."
cdk deploy --outputs-file outputs.json

# Get the API URL from CDK output
API_URL=$(jq -r '.YoutubeStepFunctionStack.ApiUrl' outputs.json)

# Update the invoke-video.http file with the API URL
sed -i "s|@apiUrl = .*|@apiUrl = $API_URL|" invoke-video.http

# Run the API tests
echo "Running API tests..."
http-client invoke-video.http

# Clean up
rm outputs.json
