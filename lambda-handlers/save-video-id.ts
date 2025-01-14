import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";

const client = new DynamoDBClient({});

export const handler = async (event: { videoId: string }) => {
  const params = {
    TableName: process.env.TABLE_NAME!,
    Item: marshall({
      videoId: event.videoId,
      status: "RECEIVED",
      timestamp: new Date().toISOString()
    })
  };

  await client.send(new PutItemCommand(params));

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Video ID saved successfully" })
  };
};
