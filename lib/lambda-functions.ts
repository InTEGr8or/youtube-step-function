import { Duration } from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import * as path from 'path';

export interface YoutubeLambdaFunctions {
  fetchMetadata: NodejsFunction;
  extractThumbnail: NodejsFunction;
  processTranscript: NodejsFunction;
  downloadVideo: NodejsFunction;
}

export function createLambdaFunctions(scope: Construct): YoutubeLambdaFunctions {
  const commonProps = {
    runtime: Runtime.NODEJS_18_X,
    memorySize: 512,
    timeout: Duration.seconds(30),
    logRetention: RetentionDays.ONE_WEEK,
    bundling: {
      minify: true,
      sourceMap: true,
      target: 'es2020'
    }
  };

  // Fetch video metadata from YouTube API
  const fetchMetadata = new NodejsFunction(scope, 'FetchMetadataFunction', {
    ...commonProps,
    functionName: 'YoutubeFetchMetadata',
    entry: path.join(__dirname, 'lambda-handlers/fetch-metadata.ts'),
    environment: {
      YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY || '',
      BUCKET_NAME: process.env.BUCKET_NAME || '',
      TABLE_NAME: process.env.TABLE_NAME || ''
    }
  });

  // Download and process video thumbnail
  const extractThumbnail = new NodejsFunction(scope, 'ExtractThumbnailFunction', {
    ...commonProps,
    functionName: 'YoutubeExtractThumbnail',
    entry: path.join(__dirname, 'lambda-handlers/extract-thumbnail.ts'),
    memorySize: 1024, // Higher memory for image processing
    timeout: Duration.minutes(1)
  });

  // Retrieve and process video transcript
  const processTranscript = new NodejsFunction(scope, 'ProcessTranscriptFunction', {
    ...commonProps,
    functionName: 'YoutubeProcessTranscript',
    entry: path.join(__dirname, 'lambda-handlers/process-transcript.ts'),
    memorySize: 1024, // Higher memory for text processing
    timeout: Duration.minutes(2)
  });

  // Download video content from YouTube
  const downloadVideo = new NodejsFunction(scope, 'DownloadVideoFunction', {
    ...commonProps,
    functionName: 'YoutubeDownloadVideo',
    entry: path.join(__dirname, 'lambda-handlers/download-video.ts'),
    memorySize: 2048, // Higher memory for video processing
    timeout: Duration.minutes(5)
  });

  return {
    fetchMetadata,
    extractThumbnail,
    processTranscript,
    downloadVideo
  };
}
