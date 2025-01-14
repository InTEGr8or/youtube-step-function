import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import ytdl from 'ytdl-core';

const s3 = new S3Client({ region: process.env.AWS_REGION });

interface Event {
  videoId: string;
}

export const handler = async (event: Event) => {
  const { videoId } = event;

  try {
    // Get video info
    const info = await ytdl.getInfo(videoId);

    // Download video
    const videoStream = ytdl(videoId, { quality: 'highest' });

    // Upload to S3
    const uploadParams = {
      Bucket: process.env.BUCKET_NAME!,
      Key: `videos/${videoId}/${info.videoDetails.title}.mp4`,
      Body: videoStream,
    };

    await s3.send(new PutObjectCommand(uploadParams));

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Video processed successfully',
        videoId,
        title: info.videoDetails.title,
      }),
    };
  } catch (error) {
    console.error('Error processing video:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error processing video',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
