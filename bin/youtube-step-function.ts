#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { YoutubeStepFunctionStack } from '../lib/youtube-step-function-stack';

const app = new cdk.App();
new YoutubeStepFunctionStack(app, 'YoutubeStepFunctionStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
