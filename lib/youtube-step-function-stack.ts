import { Stack, StackProps, Duration, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { createLambdaFunctions, YoutubeLambdaFunctions } from './lambda-functions';

export class YoutubeStepFunctionStack extends Stack {
  public readonly videoBucket: s3.Bucket;
  public readonly metadataTable: dynamodb.Table;
  public readonly stateMachine: stepfunctions.StateMachine;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Create S3 bucket for video assets with stable configuration
    this.videoBucket = new s3.Bucket(this, 'VideoBucket', {
      bucketName: `youtube-videos-${this.account}-${this.region}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      lifecycleRules: [
        {
          expiration: Duration.days(365)
        }
      ],
      removalPolicy: RemovalPolicy.RETAIN
    });

    // Create DynamoDB table for metadata with stable configuration
    this.metadataTable = new dynamodb.Table(this, 'MetadataTable', {
      tableName: `YoutubeMetadata-${this.account}-${this.region}`,
      partitionKey: { name: 'videoId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
      timeToLiveAttribute: 'expirationTime',
      stream: dynamodb.StreamViewType.NEW_IMAGE
    });

    // Add Global Secondary Index for status queries
    this.metadataTable.addGlobalSecondaryIndex({
      indexName: 'StatusIndex',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.ALL
    });

    // Add Local Secondary Index for channel queries
    this.metadataTable.addLocalSecondaryIndex({
      indexName: 'ChannelIndex',
      sortKey: { name: 'channelId', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL
    });

    // Define Step Function states
    // Create Lambda functions
    const lambdaFunctions = createLambdaFunctions(this);

    // Define Step Function states
    const fetchMetadata = new tasks.LambdaInvoke(this, 'FetchMetadata', {
      lambdaFunction: lambdaFunctions.fetchMetadata,
      resultPath: '$.metadata',
      outputPath: '$.Payload'
    }).addRetry({
      errors: ['States.ALL'],
      interval: Duration.seconds(5),
      maxAttempts: 3,
      backoffRate: 2
    });

    const processVideo = new stepfunctions.Pass(this, 'ProcessVideo', {
      result: stepfunctions.Result.fromObject({ status: 'PROCESSING' }),
      resultPath: '$.processResult'
    });

    const checkTranscript = new stepfunctions.Choice(this, 'CheckTranscriptAvailable')
      .when(stepfunctions.Condition.booleanEquals('$.hasTranscript', true),
        new stepfunctions.Pass(this, 'TranscriptAvailable'))
      .otherwise(new stepfunctions.Pass(this, 'NoTranscript'));

    const saveMetadata = new stepfunctions.Pass(this, 'SaveMetadata', {
      parameters: {
        'videoId.$': '$.videoId',
        'status': 'COMPLETED'
      }
    });

    // Create state machine definition
    const downloadVideo = new tasks.LambdaInvoke(this, 'DownloadVideo', {
      lambdaFunction: lambdaFunctions.downloadVideo,
      resultPath: '$.downloadResult',
      outputPath: '$.Payload'
    }).addRetry({
      errors: ['States.ALL'],
      interval: Duration.seconds(5),
      maxAttempts: 3,
      backoffRate: 2
    });

    const extractThumbnail = new tasks.LambdaInvoke(this, 'ExtractThumbnail', {
      lambdaFunction: lambdaFunctions.extractThumbnail,
      resultPath: '$.thumbnailResult',
      outputPath: '$.Payload'
    }).addRetry({
      errors: ['States.ALL'],
      interval: Duration.seconds(5),
      maxAttempts: 3,
      backoffRate: 2
    });

    const processTranscript = new tasks.LambdaInvoke(this, 'ProcessTranscript', {
      lambdaFunction: lambdaFunctions.processTranscript,
      resultPath: '$.transcriptResult',
      inputPath: '$.metadata.Payload',
      outputPath: '$.Payload'
    }).addRetry({
      errors: ['States.ALL'],
      interval: Duration.seconds(5),
      maxAttempts: 3,
      backoffRate: 2
    });

    const definition = fetchMetadata
      .next(downloadVideo)
      .next(extractThumbnail)
      .next(processTranscript)
      .next(checkTranscript)
      .next(saveMetadata);

    // Create state machine with stable configuration
    this.stateMachine = new stepfunctions.StateMachine(this, 'VideoProcessingStateMachine', {
      stateMachineName: `YoutubeProcessing-${this.account}-${this.region}`,
      definition,
      timeout: Duration.minutes(30),
      removalPolicy: RemovalPolicy.RETAIN
    });

    // Grant permissions
    this.videoBucket.grantReadWrite(this.stateMachine);
    this.metadataTable.grantWriteData(this.stateMachine);
  }
}
