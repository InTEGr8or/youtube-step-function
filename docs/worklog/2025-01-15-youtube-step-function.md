# 2025-01-15 YouTube Step Function Worklog

## Task
Create an AWS Step Function CDK project that will:
1. Accept YouTube video IDs
2. Save video IDs and metadata
3. Step through a collection of actions including:
   - Retrieving thumbnails
   - Retrieving transcripts (if available)
   - Downloading videos
   - Supporting future video analysis steps

## Understanding
The project will use:
- AWS Step Functions for workflow orchestration
- S3 for storing video assets and metadata
- DynamoDB for tracking video processing status
- AWS Lambda for processing steps
- YouTube Data API for metadata retrieval

## Plan
1. Create CDK stack with:
   - S3 bucket for video assets
   - DynamoDB table for tracking
   - Step Function workflow
   - Lambda functions for processing steps
2. Implement initial workflow steps:
   - Save video ID
   - Fetch metadata
   - Download thumbnail
   - Download video
3. Use S3 tags to track processing status
4. Structure project for future analysis steps

## Next Steps
1. Create initial CDK stack structure
2. Implement save-video-id Lambda function
3. Create Step Function workflow
4. Add S3 bucket and DynamoDB table resources
