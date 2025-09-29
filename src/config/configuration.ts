export interface AwsConfig {
  accessKeyId: string | undefined;
  secretAccessKey: string | undefined;
  region: string;
  s3BucketName: string | undefined;
}

export interface DatabaseConfig {
  url: string | undefined;
}

export interface JwtConfig {
  accessSecret: string | undefined;
  refreshSecret: string | undefined;
  accessExpiration: string;
  refreshExpiration: string;
}

export interface AppConfig {
  port: number;
  environment: string;
  aws: AwsConfig;
  database: DatabaseConfig;
  jwt: JwtConfig;
}

export default (): AppConfig => ({
  port: parseInt(process.env.PORT || '3000', 10),
  environment: process.env.NODE_ENV || 'development',
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1',
    s3BucketName: process.env.AWS_S3_BUCKET_NAME,
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },
});
