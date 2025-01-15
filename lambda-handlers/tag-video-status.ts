import { S3Client, PutObjectTaggingCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { Handler } from 'aws-lambda';

const s3 = new S3Client();
const dynamodb = new DynamoDBClient();

export interface Event {
  videoId: string;
  status: string;
  bucketName: string;
  tableName: string;
}

export const handler: Handler<Event> = async (event) => {
  try {
    const { videoId, status, bucketName, tableName } = event;

    // Update S3 object tags
    await s3.send(new PutObjectTaggingCommand({
      Bucket: bucketName,
      Key: `videos/${videoId}`,
      Tagging: {
        TagSet: [
          { Key: 'Status', Value: status },
          { Key: 'LastUpdated', Value: new Date().toISOString() }
        ]
      }
    }));

    // Update DynamoDB status
    await dynamodb.send(new UpdateItemCommand({
      TableName: tableName,
      Key: { videoId: { S: videoId } },
      UpdateExpression: 'SET #status = :status',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':status': { S: status } }
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Successfully updated video status',
        videoId,
        status
      })
    };
  } catch (error) {
    console.error('Error updating video status:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Failed to update video status',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
