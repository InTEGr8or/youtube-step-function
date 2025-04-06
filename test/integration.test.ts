import { test, expect } from 'vitest';
import { App } from 'aws-cdk-lib';
import { YoutubeStepFunctionStack } from '../lib/youtube-step-function-stack';

test('DynamoDB table has correct configuration', () => {
  const app = new App();
  const stack = new YoutubeStepFunctionStack(app, 'TestStack');

  const template = app.synth().getStackArtifact(stack.artifactId).template;
  const tableResourceKey = Object.keys(template.Resources).find(key => template.Resources[key].Type === 'AWS::DynamoDB::Table');
  const tableResource = tableResourceKey ? template.Resources[tableResourceKey] : undefined;

  expect(tableResource).toBeDefined();
  expect(tableResource.Properties.BillingMode).toBe('PAY_PER_REQUEST');
  expect(tableResource.Properties.KeySchema).toEqual([
    {
      AttributeName: 'videoId',
      KeyType: 'HASH'
    }
  ]);
}, 30000); // Increased timeout to 30 seconds

test('API Gateway is configured correctly', () => {
  const app = new App();
  const stack = new YoutubeStepFunctionStack(app, 'TestStack');

  const template = app.synth().getStackArtifact(stack.artifactId).template;
    const apiResourceKey = Object.keys(template.Resources).find(key => template.Resources[key].Type === 'AWS::ApiGateway::RestApi');
  const apiResource = apiResourceKey ? template.Resources[apiResourceKey] : undefined;

  expect(apiResource).toBeDefined();
  expect(apiResource.Properties.ProtocolType).toBe(undefined); // ProtocolType is not a valid property for RestApi
  expect(apiResource.Properties.Name).toBe('Youtube Processor API');
}, 30000); // Increased timeout to 30 seconds
