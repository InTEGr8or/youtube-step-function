import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as sfnTasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';

export class YoutubeStepFunctionStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, {
      ...props,
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
      },
    });

    // Validate required environment variables
    const bucketName = process.env.BUCKET_NAME;
    const youtubeApiKey = process.env.YOUTUBE_API_KEY;
    const tableName = process.env.DYNAMODB_TABLE_NAME;

    if (!bucketName || !youtubeApiKey || !tableName) {
      console.error('Missing environment variables:');
      console.error(`BUCKET_NAME: ${bucketName}`);
      console.error(`YOUTUBE_API_KEY: ${youtubeApiKey ? '*****' : 'missing'}`);
      console.error(`DYNAMODB_TABLE_NAME: ${tableName}`);
      throw new Error('Missing required environment variables. Please check .envrc configuration');
    }

    // S3 bucket to store video assets
    const videoBucket = s3.Bucket.fromBucketName(this, 'VideoBucket', bucketName);

    const videoTable = new dynamodb.Table(this, 'VideoTable', {
      tableName: tableName,
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
        YOUTUBE_API_KEY: youtubeApiKey
      }
    });

    // Grant permissions
    videoBucket.grantPut(downloadThumbnail);
    videoBucket.grantPutAcl(downloadThumbnail);
    videoTable.grantReadWriteData(saveVideoId);

    // Step Function definition with error handling and conditional branching
    const definition = new sfn.Pass(this, 'Start')
      .next(new sfnTasks.LambdaInvoke(this, 'SaveVideoIdTask', {
        lambdaFunction: saveVideoId,
        outputPath: '$.Payload',
        retryOnServiceExceptions: true
      }))
      .next(new sfn.Choice(this, 'CheckVideoStatus')
        .when(sfn.Condition.stringEquals('$.status', 'PROCESSING'),
          new sfnTasks.LambdaInvoke(this, 'DownloadThumbnailTask', {
            lambdaFunction: downloadThumbnail,
            outputPath: '$.Payload',
            retryOnServiceExceptions: true
          })
            .next(new sfnTasks.LambdaInvoke(this, 'TagVideoStatus', {
              lambdaFunction: new lambda.Function(this, 'TagVideoStatusFunction', {
                runtime: lambda.Runtime.NODEJS_20_X,
                code: lambda.Code.fromAsset('lambda-handlers'),
                handler: 'tag-video-status.handler',
                environment: {
                  BUCKET_NAME: videoBucket.bucketName,
                  TABLE_NAME: videoTable.tableName
                }
              }),
              outputPath: '$.Payload'
            }))
        )
        .otherwise(new sfn.Fail(this, 'InvalidVideoStatus', {
          cause: 'Video status is not PROCESSING',
          error: 'INVALID_STATUS'
        }))
      );

    // Create the state machine
    this.stateMachine = new sfn.StateMachine(this, 'YoutubeProcessingStateMachine', {
      definitionBody: sfn.DefinitionBody.fromChainable(definition),
      timeout: cdk.Duration.minutes(15)
    });

    // Create API Gateway REST API
    const api = new apigateway.RestApi(this, 'YoutubeProcessorApi', {
      restApiName: 'Youtube Processor API',
      description: 'API for triggering YouTube video processing',
      deployOptions: {
        stageName: 'prod'
      }
    });

    // Output API endpoint URL
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'The URL of the API Gateway endpoint'
    });

    // Add POST /process endpoint
    const processResource = api.root.addResource('process');
    processResource.addMethod('POST', new apigateway.AwsIntegration({
      service: 'states',
      action: 'StartExecution',
      integrationHttpMethod: 'POST',
      options: {
        credentialsRole: new iam.Role(this, 'ApiGatewayStepFunctionsRole', {
          assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
          inlinePolicies: {
            StepFunctionsAccess: new iam.PolicyDocument({
              statements: [
                new iam.PolicyStatement({
                  actions: ['states:StartExecution'],
                  resources: [this.stateMachine.stateMachineArn]
                })
              ]
            })
          }
        }),
        requestTemplates: {
          'application/json': JSON.stringify({
            input: "$util.escapeJavaScript($input.json('$'))",
            stateMachineArn: this.stateMachine.stateMachineArn
          })
        },
        integrationResponses: [{
          statusCode: '200',
          responseTemplates: {
            'application/json': JSON.stringify({
              executionArn: "$input.path('$.executionArn')",
              startDate: "$input.path('$.startDate')"
            })
          }
        }],
        passthroughBehavior: apigateway.PassthroughBehavior.NEVER
      }
    }), {
      methodResponses: [{
        statusCode: '200',
        responseModels: {
          'application/json': apigateway.Model.EMPTY_MODEL
        }
      }]
    });

    // Expose state machine ARN
    this.stateMachineArn = this.stateMachine.stateMachineArn.toString();
  }


  // Public properties for testing
  public readonly stateMachine: sfn.StateMachine;
  public readonly stateMachineArn: string;
}
