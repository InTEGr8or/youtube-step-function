import { handler } from '../lambda-handlers/tag-video-status';
import type { Event } from '../lambda-handlers/tag-video-status';
import { mockClient } from 'aws-sdk-client-mock';
import { S3Client, PutObjectTaggingCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';

const s3Mock = mockClient(S3Client);
const dynamoMock = mockClient(DynamoDBClient);

describe('tag-video-status Lambda', () => {
  beforeEach(() => {
    s3Mock.reset();
    dynamoMock.reset();
  });

  it('should update tags and status successfully', async () => {
    // Mock S3 response
    s3Mock.on(PutObjectTaggingCommand).resolves({});

    // Mock DynamoDB response
    dynamoMock.on(UpdateItemCommand).resolves({});

    const event = {
      videoId: 'test123',
      status: 'PROCESSING',
      bucketName: 'test-bucket',
      tableName: 'test-table'
    };
    const result = await handler(event, {} as any, () => {});

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body).message).toBe('Successfully updated video status');
  });

  it('should handle S3 tagging errors', async () => {
    s3Mock.on(PutObjectTaggingCommand).rejects(new Error('S3 Error'));
    dynamoMock.on(UpdateItemCommand).resolves({});

    const event = {
      videoId: 'test123',
      status: 'PROCESSING',
      bucketName: 'test-bucket',
      tableName: 'test-table'
    };
    const result = await handler(event, {} as any, () => {});

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body).message).toBe('Failed to update video status');
  });

  it('should handle DynamoDB update errors', async () => {
    s3Mock.on(PutObjectTaggingCommand).resolves({});
    dynamoMock.on(UpdateItemCommand).rejects(new Error('DynamoDB Error'));

    const event = {
      videoId: 'test123',
      status: 'PROCESSING',
      bucketName: 'test-bucket',
      tableName: 'test-table'
    };
    const result = await handler(event, {} as any, () => {});

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body).message).toBe('Failed to update video status');
  });
});
