#!/bin/bash

# Get the state machine ARN
STATE_MACHINE_ARN=$(aws cloudformation describe-stacks --stack-name YoutubeStepFunctionStack --query "Stacks[0].Outputs[?OutputKey=='StateMachineArn'].OutputValue" --output text)

if [ -z "$STATE_MACHINE_ARN" ]; then
  echo "Error: Could not retrieve state machine ARN."
  exit 1
fi

# Check for optional execution name
NAME=""
if [ "$1" = "-n" ] || [ "$1" = "--name" ]; then
  if [ -z "$2" ]; then
    echo "Error: Execution name not provided."
    exit 1
  fi
  NAME="$2"
fi

# Get the execution ARN
if [ -z "$NAME" ]; then
  # Get the latest execution ARN
  EXECUTIONS=$(aws stepfunctions list-executions --state-machine-arn "$STATE_MACHINE_ARN" --max-items 1 --query 'executions' --output json)
  if [ -z "$EXECUTIONS" ] || [ "$EXECUTIONS" = "[]" ]; then
    echo "No executions found for state machine: $STATE_MACHINE_ARN"
    exit 1
  fi
  EXECUTION_ARN=$(echo "$EXECUTIONS" | jq -r '.[0].executionArn')
else
  # Get the execution ARN by name
  EXECUTION_ARN=$(aws stepfunctions list-executions --state-machine-arn "$STATE_MACHINE_ARN" --name "$NAME" --query 'executions[0].executionArn' --output text)
fi

if [ -z "$EXECUTION_ARN" ]; then
  echo "Error: Could not retrieve execution ARN."
  exit 1
fi

# Describe the execution
aws stepfunctions describe-execution --execution-arn "$EXECUTION_ARN"