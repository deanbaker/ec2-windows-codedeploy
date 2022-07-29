import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import iam = require('aws-cdk-lib/aws-iam');
import s3 = require('aws-cdk-lib/aws-s3')
import ec2 = require('aws-cdk-lib/aws-ec2')
import autoscaling = require('aws-cdk-lib/aws-autoscaling');
import elbv2 = require('aws-cdk-lib/aws-elasticloadbalancingv2')
import codedeploy = require('aws-cdk-lib/aws-codedeploy')


// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class CdkInfraStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Existing keypair to use
    const keypair = 'tutorial-rdp-keypair'

    // VPC to deploy
    const vpc = ec2.Vpc.fromLookup(this, 'DefaultVPC', { isDefault: true })

    // SG to use - look to parameterise.
    const webserverSG = ec2.SecurityGroup.fromLookupByName(this, 'webserver-sg', 'launch-wizard-1', vpc)

    // AMI to use
    const webServerAMI = new ec2.LookupMachineImage({
      name: 'aspnet-web-server',
      windows: true
    })

    // Where we will host our artefacts to depoloy
    const deployBucket = new s3.Bucket(this, 'MyDeployableAssets', {
      publicReadAccess: false
    });

    // Role for the EC2 instance to download the deployable artefact
    const ec2Role = new iam.Role(this, 'ec2-s3-readonly', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess')
      ]
    });

    const asg = new autoscaling.AutoScalingGroup(this, 'ASG', {
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.LARGE),
      machineImage: webServerAMI,
      securityGroup: webserverSG,
      role: ec2Role,
      keyName: keypair,
      associatePublicIpAddress: true,
      desiredCapacity: 2,
    });

    const lb = new elbv2.ApplicationLoadBalancer(this, 'lb', {
      vpc,
      internetFacing: true
    });

    const httpListener = lb.addListener("http", {
      port: 80
    })

    const targetGroup = httpListener.addTargets("TG", {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [asg]
    })

    const deploymentGroup = new codedeploy.ServerDeploymentGroup(this, 'DeploymentGroup', {
      autoScalingGroups: [asg]
    });
  }
}
