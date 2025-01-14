import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { Duration } from 'aws-cdk-lib';

export interface YoutubeLambdaFunctions {
  fetchMetadata: lambda.Function;
  downloadVideo: lambda.Function;
  extractThumbnail: lambda.Function;
  processTranscript: lambda.Function;
}

export function createLambdaFunctions(scope: Construct): YoutubeLambdaFunctions {
  const fetchMetadata = new lambda.Function(scope, 'FetchMetadataFunction', {
    runtime: lambda.Runtime.NODEJS_18_X,
    code: lambda.Code.fromAsset('lambda/fetch-metadata'),
    handler: 'index.handler',
    environment: {
      YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY || ''
    }
  });

  const downloadVideo = new lambda.Function(scope, 'DownloadVideoFunction', {
    runtime: lambda.Runtime.NODEJS_18_X,
    code: lambda.Code.fromAsset('lambda/download-video'),
    handler: 'index.handler',
    timeout: Duration.minutes(5)
  });

  const extractThumbnail = new lambda.Function(scope, 'ExtractThumbnailFunction', {
    runtime: lambda.Runtime.NODEJS_18_X,
    code: lambda.Code.fromAsset('lambda/extract-thumbnail'),
    handler: 'index.handler',
    timeout: Duration.minutes(1)
  });

  const processTranscript = new lambda.Function(scope, 'ProcessTranscriptFunction', {
    runtime: lambda.Runtime.NODEJS_18_X,
    code: lambda.Code.fromAsset('lambda/process-transcript'),
    handler: 'index.handler',
    timeout: Duration.minutes(2)
  });

  return {
    fetchMetadata,
    downloadVideo,
    extractThumbnail,
    processTranscript
  };
}
