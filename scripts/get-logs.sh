#!/bin/bash

# Get the latest log events for a given Lambda function.

# Usage: ./scripts/get-logs.sh <function_name>

FUNCTION_NAME=$1

if [ -z "$FUNCTION_NAME" ]; then
  echo "Usage: ./scripts/get-logs.sh <function_name>"
  exit 1
fi

LOG_GROUP_NAME="/aws/lambda/$FUNCTION_NAME"

LOG_STREAM_NAME=$(aws logs describe-log-streams --log-group-name "$LOG_GROUP_NAME" --order-by LastEventTime --descending --query 'logStreams[0].logStreamName' --output text)

if [ -z "$LOG_STREAM_NAME" ]; then
  echo "No log streams found for function: $FUNCTION_NAME"
  exit 1
fi

aws logs get-log-events --log-group-name "$LOG_GROUP_NAME" --log-stream-name "$LOG_STREAM_NAME" --limit 10