const fs = require('fs');
require('dotenv').config();
const AWS = require('aws-sdk');

// Function to load SSL certificates
function getAWSConfig() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const certs = [
    fs.readFileSync('C:/certs/ZscalerRootCertificate-2048-SHA256 1.pem').toString(),
    fs.readFileSync('C:/certs/AmazonRootCA1 1.pem').toString()
  ];
  return { sslCaCerts: certs };
}

// Initialize S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_Access_Key,
  secretAccessKey: process.env.AWS_Secret_Access_Key,
  sslEnabled: false,
});

// AWS Configuration with SSL certificates
const SESConfig = {
  accessKeyId: process.env.AWS_Access_Key,
  secretAccessKey: process.env.AWS_Secret_Access_Key,
  region: process.env.AWS_Region,
  ...getAWSConfig()
};

AWS.config.update(SESConfig);

// Initialize DynamoDB DocumentClient
const docClient = new AWS.DynamoDB.DocumentClient();

class JsonModel {
   

    async getJsonReportUrl(app_id) {
        const fileName = `${app_id}.json`; // Name of the JSON file in S3
        const params = {
            Bucket: `adil-develop-app-json`,
            Key: `jsonReports/${fileName}`, // Path to the JSON file in S3
            Expires: 3600 // URL expires in 1 hour (adjust as needed)
        };
    
        try {
            const url = await s3.getSignedUrlPromise('getObject', params);
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
            await s3.deleteObject(params).promise();
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
                "app_id": app_id
            },
            UpdateExpression: "set #status = :status",
            ExpressionAttributeNames: {
                "#status": "status"
            },
            ExpressionAttributeValues: {
                ":status": status
            }
        };
    
        try {
            await docClient.update(params).promise();
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
            await s3.headObject(headParams).promise();
            console.log(`JSON file with name ${fileName} already exists in S3. No need to upload.`);
            return true; // Return true indicating that no upload is necessary
        } catch (err) {
            // If the headObject call throws an error, the file does not exist, so upload it
            if (err.code === 'NotFound') {
                try {
                    const data = await s3.upload(params).promise();
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
