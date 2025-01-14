# 2025-01-14 YouTube Step Function Worklog

## Task
Create an AWS Step Function CDK that will:
1. Accept YouTube video IDs
2. Save video IDs
3. Process videos through steps:
   - Retrieve thumbnail
   - Retrieve transcript (if available)
   - Download video
   - Enable future video analysis steps

## Understanding
The Step Function will use S3 for storage with tags to track video processing status. We'll use DynamoDB as an alternative storage option for video metadata.

## Plan
1. Create CDK stack with:
   - S3 bucket for video storage
   - DynamoDB table for metadata
   - Lambda functions for each processing step
   - Step Function definition
2. Implement Lambda handlers:
   - save-video-id.ts
   - download-thumbnail.ts
   - download-video.ts
   - process-video.ts
3. Create Step Function state machine
4. Add error handling and retry logic
5. Implement testing

## Next Steps
1. Create initial CDK stack structure
2. Implement S3 bucket and DynamoDB table
3. Create base Lambda function infrastructure
