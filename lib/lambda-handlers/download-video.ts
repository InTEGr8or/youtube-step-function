import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Handler } from 'aws-lambda';
import { Readable } from 'stream';
import ytdl from 'ytdl-core';

const s3 = new S3Client({ region: process.env.AWS_REGION });

interface DownloadVideoEvent {
  videoId: string;
  bucketName: string;
}

export const handler: Handler<DownloadVideoEvent> = async (event) => {
  try {
    const { videoId, bucketName } = event;

    // Validate video ID
    if (!ytdl.validateID(videoId)) {
      throw new Error(`Invalid YouTube video ID: ${videoId}`);
    }

    // Get video info
    const info = await ytdl.getInfo(videoId);
    const videoFormat = ytdl.chooseFormat(info.formats, { quality: 'highest' });

    // Create readable stream from YouTube
    const videoStream = ytdl.downloadFromInfo(info, { format: videoFormat });

    // Upload to S3
    const key = `videos/${videoId}/${Date.now()}.${videoFormat.container}`;
    await s3.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: videoStream as Readable,
      ContentType: videoFormat.mimeType,
      Metadata: {
        'video-id': videoId,
        'title': info.videoDetails.title,
        'duration': info.videoDetails.lengthSeconds
      }
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Video downloaded successfully',
        s3Key: key,
        videoDetails: info.videoDetails
      })
    };
  } catch (error) {
    console.error('Error downloading video:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Failed to download video',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
