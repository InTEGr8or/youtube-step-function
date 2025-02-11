import axios from 'axios';
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import { parse } from 'csv-parse/sync';

describe('YouTube API Key Test', () => {
  it('should be able to access the YouTube Data API with the provided key', async () => {
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
      throw new Error('YOUTUBE_API_KEY environment variable is not set.');
    }

    // Read video IDs from test/videos.csv
    let videoId;
    try {
      const csvData = fs.readFileSync('test/videos.csv', 'utf-8');
      const records = parse(csvData, {
        columns: false,
        skip_empty_lines: true,
      });
      // Get the video ID from the first record (first line)
      videoId = records[0][0].match(/v=([^&]+)/)?.[1] || records[0][0].match(/youtu\.be\/([^?]+)/)?.[1];
      if (!videoId) {
        throw new Error("Could not extract video ID from CSV data.");
      }
    } catch (error: any) {
      throw new Error(`Error reading or parsing CSV file: ${error.message}`);
    }


    try {
      const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/videos`,
        {
          params: {
            part: 'snippet',
            id: videoId,
            key: apiKey,
          },
        }
      );

      expect(response.status).toBe(200);
    } catch (error:any) {
      if (error.response) {
        expect.fail(`YouTube API request failed with status: ${error.response.status} and data: ${JSON.stringify(error.response.data)}`);
      } else {
        expect.fail(`YouTube API request failed: ${error.message}`);
      }
    }
  });
});