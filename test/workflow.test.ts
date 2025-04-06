import { test, expect } from 'vitest';
import { App } from 'aws-cdk-lib';
import { YoutubeStepFunctionStack } from '../lib/youtube-step-function-stack';

test('state machine ARN is correctly exposed', () => {
  const app = new App();
  const stack = new YoutubeStepFunctionStack(app, 'TestStack');

  expect(stack.stateMachineArn).toBeDefined();
  expect(stack.resolve(stack.stateMachineArn)).toEqual({
    Ref: 'YoutubeProcessingStateMachine9F0824C3'
  });
}, 30000); // Increased timeout to 30 seconds

test('state machine has correct configuration', () => {
  const app = new App();
  const stack = new YoutubeStepFunctionStack(app, 'TestStack');

  expect(stack.stateMachine).toBeDefined();
  const template = app.synth().getStackArtifact(stack.artifactId).template;
  const stateMachineResource = template.Resources.YoutubeProcessingStateMachine9F0824C3;
  const definitionString = stateMachineResource.Properties.DefinitionString['Fn::Join'][1].join('');
  const definition = JSON.parse(definitionString);
  expect(definition.TimeoutSeconds).toBe(900);
}, 30000); // Increased timeout to 30 seconds
