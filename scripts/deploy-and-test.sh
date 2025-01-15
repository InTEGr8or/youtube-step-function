#!/bin/bash
set -e

# Deploy CDK stack
echo "Deploying CDK stack..."
cdk_output=$(cdk deploy --outputs-file cdk-outputs.json)

# Get API URL from outputs
api_url=$(jq -r '.YoutubeStepFunctionStack.ApiUrl' cdk-outputs.json)

# Update .envrc.local
echo "Updating .envrc.local..."
echo -e "# Deployment-specific environment variables" > .envrc.local
echo "export API_URL=$api_url" >> .envrc.local

# Reload direnv
echo "Reloading direnv..."
direnv allow .

# Run tests
echo "Running API tests..."
node scripts/test-api.js

echo "Deployment and testing completed successfully"
