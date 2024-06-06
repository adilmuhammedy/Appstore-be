const fs = require('fs');
require('dotenv').config();
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const { S3Client } = require('@aws-sdk/client-s3');
// Read SSL certificates
const certs = [
    fs.readFileSync('C:/certs/ZscalerRootCertificate-2048-SHA256 1.pem').toString(),
    fs.readFileSync('C:/certs/AmazonRootCA1 1.pem').toString()
];

// Set NODE_TLS_REJECT_UNAUTHORIZED
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Initialize DynamoDBClient with SSL certificates
const dynamoClient = new DynamoDBClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        sessionToken: process.env.AWS_SESSION_TOKEN
    },
});
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      sessionToken: process.env.AWS_SESSION_TOKEN
    }
  });

const docClient = DynamoDBDocumentClient.from(dynamoClient);

module.exports = { docClient, s3Client };
