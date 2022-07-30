import ec2 = require('aws-cdk-lib/aws-ec2');
import autoscaling = require('aws-cdk-lib/aws-autoscaling');
import iam = require('aws-cdk-lib/aws-iam');
import elbv2 = require('aws-cdk-lib/aws-elasticloadbalancingv2')
import { Construct } from 'constructs';
import { AutoScalingGroup, IAutoScalingGroup } from 'aws-cdk-lib/aws-autoscaling';
import { IApplicationLoadBalancerTarget } from 'aws-cdk-lib/aws-elasticloadbalancingv2';

export interface Ec2LoadBalancedProps {
    vpc: ec2.IVpc;
    ami: ec2.IMachineImage; // the machine to bootstrap
    securityGroup: ec2.ISecurityGroup;
    role: iam.Role;
    name?: string;
    keypair: string;
}

export class Ec2LoadBalanced extends Construct {

    public readonly asg: AutoScalingGroup;

    constructor(scope: Construct, id: string, props: Ec2LoadBalancedProps) {
        super(scope, id);

        this.asg = new autoscaling.AutoScalingGroup(this, 'ASG', {
            vpc: props.vpc,
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.LARGE),
            machineImage: props.ami,
            securityGroup: props.securityGroup,
            role: props.role,
            keyName: props.keypair,
            associatePublicIpAddress: true,
            desiredCapacity: 2,
            autoScalingGroupName: `${props.name} EC2 ASG`
        });

        const lb = new elbv2.ApplicationLoadBalancer(this, 'lb', {
            vpc: props.vpc,
            internetFacing: true
        });

        const httpListener = lb.addListener("http", {
            port: 80,
        })

        const targetGroup = httpListener.addTargets("TG", {
            port: 80,
            protocol: elbv2.ApplicationProtocol.HTTP,
            targets: [this.asg]
        })
    }
}