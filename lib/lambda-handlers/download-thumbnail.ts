import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import axios from 'axios';

const s3 = new S3Client({ region: process.env.AWS_REGION });

export const handler = async (event: { videoId: string }) => {
  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
  if (!YOUTUBE_API_KEY) {
    throw new Error('YOUTUBE_API_KEY environment variable is required');
  }

  const { videoId } = event;
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

  try {
    // Download thumbnail
    const response = await axios.get(thumbnailUrl, { responseType: 'arraybuffer' });

    // Upload to S3
    const putCommand = new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: `thumbnails/${videoId}.jpg`,
      Body: response.data,
      ContentType: 'image/jpeg',
      Tagging: 'status=thumbnail-downloaded'
    });

    await s3.send(putCommand);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Thumbnail downloaded and saved successfully',
        videoId
      })
    };
  } catch (error) {
    console.error('Error downloading thumbnail:', error);
    let errorMessage = 'Unknown error occurred';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Failed to download thumbnail',
        error: errorMessage
      })
    };
  }
};
