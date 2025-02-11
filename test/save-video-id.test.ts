import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import { handler } from '../lambda-handlers/save-video-id';
import { describe, it, expect, beforeEach } from 'vitest';

const ddbMock = mockClient(DynamoDBClient);

describe('save-video-id Lambda handler', () => {
  beforeEach(() => {
    ddbMock.reset();
  });

  it('should save the video ID and status to DynamoDB', async () => {
    const event = { videoId: 'test-video-id' };
    const expectedTableName = 'test-table-name';

    process.env.TABLE_NAME = expectedTableName;

    ddbMock.on(PutItemCommand).resolves({});

    const result = await handler(event);

    expect(ddbMock.calls()).toHaveLength(1);
    const dynamoDbCall = ddbMock.commandCalls(PutItemCommand)[0];
    expect(dynamoDbCall.args[0].input.TableName).toEqual(expectedTableName);
    expect(dynamoDbCall.args[0].input.Item?.videoId.S).toEqual(event.videoId);
    expect(dynamoDbCall.args[0].input.Item?.status.S).toEqual('RECEIVED');
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body).message).toBe('Video ID saved successfully');

  });
});