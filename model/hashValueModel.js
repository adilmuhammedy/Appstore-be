const fs = require('fs');
require('dotenv').config();
const { DynamoDBClient, PutItemCommand, GetItemCommand, DeleteItemCommand } = require('@aws-sdk/client-dynamodb');
const { S3Client } = require('@aws-sdk/client-s3');
const { hash } = require('bcrypt');

function getAWSConfig() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const certs = [
    fs.readFileSync('C:/certs/ZscalerRootCertificate-2048-SHA256 1.pem').toString(),
    fs.readFileSync('C:/certs/AmazonRootCA1 1.pem').toString()
  ];
  return { sslCaCerts: certs };
}

// AWS Configuration with SSL certificates
const awsConfig = {
  region: process.env.AWS_Region,
  credentials: {
    accessKeyId: process.env.AWS_Access_Key,
    secretAccessKey: process.env.AWS_Secret_Access_Key,
  },
  ...getAWSConfig() // Merge SSL certificates into awsConfig
};

// Initialize DynamoDB Client
const dynamoDBClient = new DynamoDBClient(awsConfig);

// Initialize S3 Client
const s3Client = new S3Client(awsConfig);

const hashValuesTableName = "Appstore-app-hashvalues"; // Name of your DynamoDB table for hash values

class HashValueModel {
  async InsertHashValue(app_id, hashValue) {
    const params = {
      TableName: hashValuesTableName,
      Item: {
        "app_id": { S: app_id.toString() },
        "hashValue": { S: hashValue }
      },
      ConditionExpression: "attribute_not_exists(app_id)"
    };

    try {
      await dynamoDBClient.send(new PutItemCommand(params));
      return true;
    } catch (err) {
      if (err.name === 'ConditionalCheckFailedException') {
        console.log("Entry for the corresponding app_id already exists. No insertion performed.");
        return true;
      } else {
        console.error("Error creating hash value:", err);
        return false;
      }
    }
  }

  async getHashValue(app_id) {
    const params = {
      TableName: hashValuesTableName,
      Key: {
        "app_id": { S: app_id.toString() }
      }
    };

    try {
      const data = await dynamoDBClient.send(new GetItemCommand(params));
      if (data.Item) {
        return data.Item.hashValue.S;
      } else {
        console.log(`No hash value found for app_id: ${app_id}`);
        return null;
      }
    } catch (err) {
      console.error("Error retrieving hash value:", err);
      throw new Error('Error retrieving hash value');
    }
  }

  async deleteHashValue(app_id) {
    const params = {
      TableName: hashValuesTableName,
      Key: {
        "app_id": { S: app_id.toString() }
      }
    };

    try {
      await dynamoDBClient.send(new DeleteItemCommand(params));
      console.log(`Successfully deleted hash value for app_id: ${app_id}`);
      return true;
    } catch (err) {
      console.error("Error deleting hash value:", err);
      return false;
    }
  }
}

module.exports = HashValueModel;
