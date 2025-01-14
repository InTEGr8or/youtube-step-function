import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import axios from "axios";

const s3Client = new S3Client({});
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY!;

export const handler = async (event: { videoId: string }) => {
  // Get video details from YouTube API
  const response = await axios.get(
    `https://www.googleapis.com/youtube/v3/videos`,
    {
      params: {
        part: "snippet",
        id: event.videoId,
        key: YOUTUBE_API_KEY
      }
    }
  );

  const thumbnailUrl = response.data.items[0].snippet.thumbnails.maxres?.url ||
                       response.data.items[0].snippet.thumbnails.high?.url;

  if (!thumbnailUrl) {
    throw new Error("No thumbnail found for video");
  }

  // Download thumbnail
  const thumbnailResponse = await axios.get(thumbnailUrl, {
    responseType: "arraybuffer"
  });

  // Upload to S3
  const params = {
    Bucket: process.env.BUCKET_NAME!,
    Key: `thumbnails/${event.videoId}.jpg`,
    Body: thumbnailResponse.data,
    ContentType: "image/jpeg"
  };

  await s3Client.send(new PutObjectCommand(params));

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Thumbnail downloaded successfully" })
  };
};
