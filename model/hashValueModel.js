const fs = require('fs');
require('dotenv').config();
const AWS = require('aws-sdk');
const { DynamoDB } = require('aws-sdk');
const { hash } = require('bcrypt');
const dynamoDB = new DynamoDB({ region: process.env.AWS_Region });

function getAWSConfig() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const certs = [
    fs.readFileSync('C:/certs/ZscalerRootCertificate-2048-SHA256 1.pem').toString(),
    fs.readFileSync('C:/certs/AmazonRootCA1 1.pem').toString()
  ];
  return { sslCaCerts: certs };
}
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_Access_Key,
  secretAccessKey: process.env.AWS_Secret_Access_Key,
  sslEnabled: false,
});
const SESConfig = {
  accessKeyId: process.env.AWS_Access_Key,
  secretAccessKey: process.env.AWS_Secret_Access_Key,
  region: process.env.AWS_Region,
  ...getAWSConfig() // Merge SSL certificates into SESConfig
};

AWS.config.update(SESConfig);

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
          await dynamoDB.putItem(params).promise();
          return true;
        } catch (err) {
          if (err.code === 'ConditionalCheckFailedException') {
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
      const data = await dynamoDB.getItem(params).promise();
      if (data.Item) {
        return (data.Item.hashValue.S);
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
        await dynamoDB.deleteItem(params).promise();
        console.log(`Successfully deleted hash value for app_id: ${app_id}`);
        return true;
    } catch (err) {
        console.error("Error deleting hash value:", err);
        return false;
    }
}
  
}

module.exports = HashValueModel;



