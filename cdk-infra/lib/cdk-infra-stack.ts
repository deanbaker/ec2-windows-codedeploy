import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as ec2 from 'aws-cdk-lib/aws-ec2'


// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class CdkInfraStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

 


    // VPC to deploy
    const vpc = ec2.Vpc.fromLookup(this, 'DefaultVPC', { isDefault: true })

    // SG to use - look to parameterise.
    const webserverSG = ec2.SecurityGroup.fromLookupByName(this, 'webserver-sg', 'launch-wizard-1', vpc)

    // AMI to use
    const webServerAMI = new ec2.LookupMachineImage({
      name: 'nameaspnet-web-server',
      windows: true
    })

    // Where we will host our artefacts to depoloy
    const deployBucket = new s3.Bucket(this, 'MyDeployableAssets');

    // Role for the EC2 instance to download the deployable artefact
    const ec2Role = new iam.Role(this, 'ec2-s3-readonly', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess')
      ]
    });



  }
}
