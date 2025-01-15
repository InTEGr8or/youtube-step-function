import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import axios from 'axios';
import { S3 } from 'aws-sdk';
import { DynamoDB } from 'aws-sdk';

const s3 = new S3();
const dynamoDb = new DynamoDB.DocumentClient();
const bucketName = process.env.BUCKET_NAME;
const tableName = process.env.TABLE_NAME;
const youtubeApiKey = process.env.YOUTUBE_API_KEY;

if (!bucketName || !tableName || !youtubeApiKey) {
  throw new Error('Missing required environment variables');
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const videoId = event.queryStringParameters?.videoId;
    if (!videoId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing videoId parameter' })
      };
    }

    // Fetch metadata from YouTube API
    const response = await axios.get(`https://www.googleapis.com/youtube/v3/videos`, {
      params: {
        part: 'snippet',
        id: videoId,
        key: youtubeApiKey
      }
    });

    const metadata = response.data.items[0].snippet;

    // Save metadata to S3
    await s3.putObject({
      Bucket: bucketName,
      Key: `metadata/${videoId}.json`,
      Body: JSON.stringify(metadata),
      ContentType: 'application/json'
    }).promise();

    // Update status in DynamoDB
    await dynamoDb.update({
      TableName: tableName,
      Key: { videoId },
      UpdateExpression: 'SET #status = :status, metadata = :metadata',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':status': 'METADATA_FETCHED',
        ':metadata': metadata
      }
    }).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Metadata fetched successfully', metadata })
    };
  } catch (error) {
    console.error('Error fetching metadata:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to fetch metadata', error: errorMessage })
    };
  }
};
