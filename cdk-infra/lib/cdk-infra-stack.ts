import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import iam = require('aws-cdk-lib/aws-iam');
import ec2 = require('aws-cdk-lib/aws-ec2')
import autoscaling = require('aws-cdk-lib/aws-autoscaling');
import elbv2 = require('aws-cdk-lib/aws-elasticloadbalancingv2')
import { Ec2LoadBalanced } from './ec2-loadbalanced';
import { Ec2Pipeline } from './ec2-pipeline';

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

    const name = 'Pitch'
    // Role for the EC2 instance to download the deployable artefact
    const ec2Role = new iam.Role(this, 'ec2-s3-readonly', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess')
      ]
    });

    const ec2Lb = new Ec2LoadBalanced(this, "ec2lb", {
      vpc: vpc,
      ami: webServerAMI,
      securityGroup: webserverSG,
      role: ec2Role,
      keypair: 'tutorial-rdp-keypair',
      name: name
    })

    new Ec2Pipeline(this, 'pipeline', {
      asg: ec2Lb.asg,
      objectKey: 'MyWebApp2.zip',
      name: name
    })
  }
}
