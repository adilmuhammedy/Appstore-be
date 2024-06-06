const fs = require('fs');
require('dotenv').config();
const { S3Client, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { DynamoDBClient, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// Function to load SSL certificates
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
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN
  },
  ...getAWSConfig() // Merge SSL certificates into awsConfig
};

// Initialize S3 Client
const s3Client = new S3Client(awsConfig);

// Initialize DynamoDB Client
const dynamoDBClient = new DynamoDBClient(awsConfig);

class JsonModel {

    async getJsonReportUrl(app_id) {
        const fileName = `${app_id}.json`; // Name of the JSON file in S3
        const params = {
            Bucket: `adil-develop-app-json`,
            Key: `jsonReports/${fileName}`, // Path to the JSON file in S3
        };

        try {
            const command = new GetObjectCommand(params);
            const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // URL expires in 1 hour
            return url;
        } catch (err) {
            console.error("Error generating pre-signed URL:", err);
            throw new Error('Error generating pre-signed URL');
        }
    }

    async deleteJsonFileFromS3(app_id) {
        const fileName = `${app_id}.json`; // Name of the file to delete

        const params = {
            Bucket: 'adil-develop-app-json',
            Key: `jsonReports/${fileName}` // Path to the file in S3
        };

        try {
            const command = new DeleteObjectCommand(params);
            await s3Client.send(command);
            console.log(`JSON file deleted from S3: ${fileName}`);
            return true;
        } catch (err) {
            console.error("Error deleting JSON file from S3:", err);
            return false;
        }
    }

    async updateDynamoDBStatus(app_id, status) {
        const params = {
            TableName: "Appstore-app-appdetails",
            Key: {
                "app_id": { S: app_id }
            },
            UpdateExpression: "set #status = :status",
            ExpressionAttributeNames: {
                "#status": "status"
            },
            ExpressionAttributeValues: {
                ":status": { S: status }
            }
        };

        try {
            const command = new UpdateItemCommand(params);
            await dynamoDBClient.send(command);
            console.log(`Status updated to "${status}" for application ID ${app_id} in DynamoDB.`);
        } catch (error) {
            console.error("Error updating status in DynamoDB:", error);
            throw new Error('Error updating status in DynamoDB');
        }
    }

    async uploadJsonFileToS3(app_id, jsonReport) {
        const jsonReportString = JSON.stringify(jsonReport);
        const fileName = `${app_id}.json`; // Naming the file with app_id
        const params = {
            Bucket: `adil-develop-app-json`,
            Key: `jsonReports/${fileName}`, // Path to store the file in S3
            Body: jsonReportString,
            ContentType: "application/json"
        };

        // Check if the file already exists in S3
        const headParams = {
            Bucket: `adil-develop-app-json`,
            Key: `jsonReports/${fileName}`
        };

        try {
            // Check if the object exists
            const headCommand = new HeadObjectCommand(headParams);
            await s3Client.send(headCommand);
            console.log(`JSON file with name ${fileName} already exists in S3. No need to upload.`);
            return true; // Return true indicating that no upload is necessary
        } catch (err) {
            if (err.name === 'NotFound') {
                try {
                    const putCommand = new PutObjectCommand(params);
                    const data = await s3Client.send(putCommand);
                    console.log(`JSON file uploaded to S3: ${data.Location}`);
                    await this.updateDynamoDBStatus(app_id, "Analyzed");
                    return data.Location; // S3 URL of the uploaded JSON file
                } catch (uploadErr) {
                    console.error("Error uploading JSON file to S3:", uploadErr);
                    throw new Error('Error uploading JSON file to S3');
                }
            } else {
                console.error("Error checking S3 for existing JSON file:", err);
                throw new Error('Error checking S3 for existing JSON file');
            }
        }
    }
}

module.exports = JsonModel;
