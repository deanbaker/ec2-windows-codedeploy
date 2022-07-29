import { IAutoScalingGroup } from 'aws-cdk-lib/aws-autoscaling';
import { Construct } from "constructs";
import codedeploy = require('aws-cdk-lib/aws-codedeploy')
import codepipeline = require('aws-cdk-lib/aws-codepipeline')
import codepipeline_actions = require('aws-cdk-lib/aws-codepipeline-actions')
import cloudtrail = require('aws-cdk-lib/aws-cloudtrail')
import s3 = require('aws-cdk-lib/aws-s3')

export interface Ec2PipelineProps {
    asg: IAutoScalingGroup;
    objectKey: string;
    name?: string;
}

export class Ec2Pipeline extends Construct {

    constructor(scope: Construct, id: string, props: Ec2PipelineProps) {
        super(scope, id)

        const deployBucket = new s3.Bucket(this, `${props.name}-deployable-artefacts`, {
            publicReadAccess: false,
            versioned: true
        });

        const deploymentGroup = new codedeploy.ServerDeploymentGroup(this, 'DeploymentGroup', {
            deploymentGroupName: `${props.name}-deploymentGroup`,
            autoScalingGroups: [props.asg],
        });

        // Create the pipeline
        const pipeline = new codepipeline.Pipeline(this, 'MyAppPipeline', {
            pipelineName: `${props.name}-pipeline`
        });

        const trail = new cloudtrail.Trail(this, 'CloudTrail');
        trail.addS3EventSelector([{
            bucket: deployBucket,
            objectPrefix: props.objectKey,
        }], {
            readWriteType: cloudtrail.ReadWriteType.WRITE_ONLY,
        });

        const s3Artifact = new codepipeline.Artifact()
        const sourceAction = new codepipeline_actions.S3SourceAction({
            actionName: 'S3Source',
            bucketKey: props.objectKey,
            bucket: deployBucket,
            output: s3Artifact,
            trigger: codepipeline_actions.S3Trigger.EVENTS, // default: S3Trigger.POLL
        });

        const deployAction = new codepipeline_actions.CodeDeployServerDeployAction({
            actionName: 'CodeDeploy',
            input: s3Artifact,
            deploymentGroup,
        });

        pipeline.addStage({
            stageName: 'source',
            actions: [sourceAction]
        })
        pipeline.addStage({
            stageName: 'deploy',
            actions: [deployAction]
        })
    }
}