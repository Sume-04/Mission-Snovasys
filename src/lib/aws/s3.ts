import "server-only";
import { S3Client } from "@aws-sdk/client-s3";
import { awsCredentialsProvider } from "@vercel/oidc-aws-credentials-provider";

export function getS3Client() {
  const region = process.env.AWS_REGION;

  if (!region) {
    throw new Error("AWS_REGION is missing");
  }

  // Vercel production uses its OIDC identity.
  if (process.env.VERCEL === "1") {
    const roleArn = process.env.AWS_ROLE_ARN;

    if (!roleArn) {
      throw new Error("AWS_ROLE_ARN is missing");
    }

    return new S3Client({
      region,
      credentials: awsCredentialsProvider({
        roleArn,
      }),
    });
  }

  // Local development uses the AWS CLI credential profile.
  return new S3Client({
    region,
  });
}

export function getS3BucketName() {
  const bucketName = process.env.S3_BUCKET_NAME;

  if (!bucketName) {
    throw new Error("S3_BUCKET_NAME is missing");
  }

  return bucketName;
}