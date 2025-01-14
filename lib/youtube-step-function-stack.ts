import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as sfnTasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export class YoutubeStepFunctionStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 bucket to store video assets
    const videoBucket = new s3.Bucket(this, 'VideoBucket', {
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [{
        expiration: cdk.Duration.days(90)
      }]
    });

    // DynamoDB table to track video processing status
    const videoTable = new dynamodb.Table(this, 'VideoTable', {
      partitionKey: { name: 'videoId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // Lambda functions
    const saveVideoId = new lambda.Function(this, 'SaveVideoId', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('lambda-handlers'),
      handler: 'save-video-id.handler',
      environment: {
        TABLE_NAME: videoTable.tableName
      }
    });

    const downloadThumbnail = new lambda.Function(this, 'DownloadThumbnail', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('lambda-handlers'),
      handler: 'download-thumbnail.handler',
      environment: {
        BUCKET_NAME: videoBucket.bucketName,
        YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY || ''
      }
    });

    // Grant permissions
    videoBucket.grantPut(downloadThumbnail);
    videoBucket.grantPutAcl(downloadThumbnail);
    videoTable.grantReadWriteData(saveVideoId);

    // Step Function definition
    const definition = new sfn.Pass(this, 'Start')
      .next(new sfnTasks.LambdaInvoke(this, 'SaveVideoIdTask', {
        lambdaFunction: saveVideoId,
        outputPath: '$.Payload'
      }))
      .next(new sfnTasks.LambdaInvoke(this, 'DownloadThumbnailTask', {
        lambdaFunction: downloadThumbnail,
        outputPath: '$.Payload'
      }));

    // Create the state machine
    this.stateMachine = new sfn.StateMachine(this, 'YoutubeProcessingStateMachine', {
      definitionBody: sfn.DefinitionBody.fromChainable(definition),
      timeout: cdk.Duration.minutes(15)
    });

    // Expose state machine ARN
    this.stateMachineArn = this.stateMachine.stateMachineArn.toString();
  }


  // Public properties for testing
  public readonly stateMachine: sfn.StateMachine;
  public readonly stateMachineArn: string;
}
