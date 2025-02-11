import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";

const client = new DynamoDBClient({});

export const handler = async (event: { videoId: string }) => {
  console.log('Event:', event);
  const params = {
    TableName: process.env.TABLE_NAME!,
    Item: marshall({
      videoId: event.videoId,
      status: "RECEIVED",
      timestamp: new Date().toISOString()
    })
  };

  console.log('Params:', params);
  await client.send(new PutItemCommand(params));

  return {
    statusCode: 200,
    status: "RECEIVED", // Return the status
    body: JSON.stringify({ message: "Video ID saved successfully" }),
  };
};
