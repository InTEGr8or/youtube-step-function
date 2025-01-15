import { test, expect } from '@jest/globals';
import { App } from 'aws-cdk-lib';
import { YoutubeStepFunctionStack } from '../lib/youtube-step-function-stack';

test('S3 bucket is configured correctly', () => {
  const app = new App();
  const stack = new YoutubeStepFunctionStack(app, 'TestStack');

  const template = app.synth().getStackArtifact(stack.artifactId).template;
  const bucketResource = template.Resources.YoutubeStepFunctionBucket;

  expect(bucketResource).toBeDefined();
  expect(bucketResource.Properties.BucketName).toEqual({
    Ref: 'YoutubeStepFunctionBucketName'
  });
});

test('DynamoDB table has correct configuration', () => {
  const app = new App();
  const stack = new YoutubeStepFunctionStack(app, 'TestStack');

  const template = app.synth().getStackArtifact(stack.artifactId).template;
  const tableResource = template.Resources.YoutubeStepFunctionTable;

  expect(tableResource).toBeDefined();
  expect(tableResource.Properties.BillingMode).toBe('PAY_PER_REQUEST');
  expect(tableResource.Properties.KeySchema).toEqual([
    {
      AttributeName: 'videoId',
      KeyType: 'HASH'
    }
  ]);
});

test('API Gateway is configured correctly', () => {
  const app = new App();
  const stack = new YoutubeStepFunctionStack(app, 'TestStack');

  const template = app.synth().getStackArtifact(stack.artifactId).template;
  const apiResource = template.Resources.YoutubeStepFunctionApi;

  expect(apiResource).toBeDefined();
  expect(apiResource.Properties.ProtocolType).toBe('HTTP');
});
