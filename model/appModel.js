const fs = require('fs');
require('dotenv').config();
const { S3Client, ListObjectsV2Command, DeleteObjectsCommand, GetObjectCommand, DeleteObjectCommand, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { DynamoDBClient, PutItemCommand, GetItemCommand, ScanCommand, UpdateItemCommand, DeleteItemCommand } = require('@aws-sdk/client-dynamodb');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner'); // Required for signed URLs
const HashValueModel = require('./hashValueModel');
const JsonModel = require('./jsonModel');
const TestCaseModel = require('./testCaseModel');

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
  ...getAWSConfig(), // Merge SSL certificates into awsConfig
};

// Initialize S3 Client
const s3Client = new S3Client(awsConfig);

// Initialize DynamoDB Client
const dynamoDBClient = new DynamoDBClient(awsConfig);

const TableName = "Appstore-app-appdetails";

class ApplicationModel {
  constructor(dynamoDBClient, s3Client) {
    this.dynamoDB = dynamoDBClient;
    this.s3 = s3Client;
  }

  async createApplication(app) {
    const params = {
      TableName,
      Item: {
        "app_id": { S: app.app_id.toString() },
        "appname": { S: app.appname },
        "age_rating_id": { S: app.age_rating_id },
        "category_id": { S: app.category_id },
        "tags": { S: app.tags },
        "short_description": { S: app.short_description },
        "long_description": { S: app.long_description },
        "support_url": { S: app.support_url },
        "website_url": { S: app.website_url },
        "price": { S: app.price },
        "status": { S: app.status }
        // Add more attributes as needed
      }
    };

    try {
      await this.dynamoDB.send(new PutItemCommand(params));
      return true;
    } catch (err) {
      console.error("Error creating application:", err);
      return false;
    }
  }

  async getApplication(app_id) {
    const params = {
      TableName,
      Key: {
        "app_id": { S: app_id }
      }
    };
    try {
      const data = await this.dynamoDB.send(new GetItemCommand(params));
      return data.Item ? data.Item : null;
    } catch (err) {
      console.error("Error getting application:", err);
      return null;
    }
  }

  async getAllApplications() {
    const params = {
      TableName
    };

    try {
      const data = await this.dynamoDB.send(new ScanCommand(params));
      return data.Items;
    } catch (err) {
      console.error("Error getting all applications:", err);
      return [];
    }
  }

  async updateApplication(app_id, updatedFields) {
    let updateExpression = 'set';
    let ExpressionAttributeNames = {};
    let ExpressionAttributeValues = {};

    for (const [key, value] of Object.entries(updatedFields)) {
      updateExpression += ` #${key} = :${key},`;
      ExpressionAttributeNames[`#${key}`] = key;
      ExpressionAttributeValues[`:${key}`] = { S: value };
    }

    updateExpression = updateExpression.slice(0, -1); // Remove trailing comma

    const params = {
      TableName,
      Key: {
        "app_id": { S: app_id.toString() }
      },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames,
      ExpressionAttributeValues,
      ReturnValues: "ALL_NEW"
    };

    try {
      const data = await this.dynamoDB.send(new UpdateItemCommand(params));
      console.log('Updated application:', data.Attributes);
      return data.Attributes;
    } catch (err) {
      console.error("Error updating application:", err);
      return null;
    }
  }

  async deleteApplication(app_id) {
    const deleteFilesParams = {
      Bucket: process.env.AWS_Bucket_name,
      Prefix: `${app_id}/`
    };

    try {
      // List objects in the folder
      const listedObjects = await this.s3.send(new ListObjectsV2Command(deleteFilesParams));

      if (listedObjects.Contents.length === 0) {
        console.log('No files to delete.');
      } else {
        // Create delete parameters
        const deleteParams = {
          Bucket: process.env.AWS_Bucket_name,
          Delete: { Objects: listedObjects.Contents.map(({ Key }) => ({ Key })) }
        };

        // Delete the files
        await this.s3.send(new DeleteObjectsCommand(deleteParams));
        console.log('Files deleted successfully.');
      }

      const hashValueModel = new HashValueModel();
      const jsonModel = new JsonModel();
      const testCase = new TestCaseModel();
      // Delete the JSON report file
      const jsonDeleted = await jsonModel.deleteJsonFileFromS3(app_id);
      if (!jsonDeleted) {
        console.log('No JSON report file to delete or failed to delete.');
      }
      // Delete the hash value from DynamoDB
      const hashDeleted = await hashValueModel.deleteHashValue(app_id);
      if (!hashDeleted) {
        console.log('Failed to delete hash value.');
      }

      const testcaseDeleted = await testCase.deleteValidation(app_id);
      if (!testcaseDeleted) {
        console.log(`Failed to delete testcase result.`);
      }
      // Delete the application from DynamoDB
      const deleteAppParams = {
        TableName,
        Key: {
          "app_id": { S: app_id }
        }
      };

      await this.dynamoDB.send(new DeleteItemCommand(deleteAppParams));
      return true;
    } catch (err) {
      console.error("Error deleting application:", err);
      return false;
    }
  }

  async getScreenshot(app_id) {
    const params = {
      Bucket: process.env.AWS_Bucket_name,
      Prefix: `${app_id}/`
    };

    try {
      const data = await this.s3.send(new ListObjectsV2Command(params));
      const files = await Promise.all(data.Contents
        .filter(file => !file.Key.endsWith('.apk') && file.Key.includes(`${app_id}/screenshot`))
        .map(async file => {
          const url = await getSignedUrl(this.s3, new GetObjectCommand({
            Bucket: process.env.AWS_Bucket_name,
            Key: file.Key
          }), { expiresIn: 3600 });
          return { key: file.Key, url };
        }));

      return files;
    } catch (err) {
      console.error('Error listing files:', err);
      return [];
    }
  }

  async deleteScreenshot(key) {
    const params = {
      Bucket: process.env.AWS_Bucket_name,
      Key: key.toString()
    };

    try {
      await this.s3.send(new DeleteObjectCommand(params));
      console.log('Screenshot deleted successfully');
      return true;
    } catch (err) {
      console.error('Error deleting screenshot:', err);
      throw err;
    }
  }

  async getAppicon(app_id) {
    const params = {
      Bucket: process.env.AWS_Bucket_name,
      Prefix: `${app_id}/`
    };

    try {
      const data = await this.s3.send(new ListObjectsV2Command(params));
      const files = await Promise.all(data.Contents
        .filter(file => !file.Key.endsWith('.apk') && file.Key.includes(`${app_id}/appicon`))
        .map(async file => {
          const url = await getSignedUrl(this.s3, new GetObjectCommand({
            Bucket: process.env.AWS_Bucket_name,
            Key: file.Key
          }), { expiresIn: 3600 });
          return { key: file.Key, url };
        }));
      return files;
    } catch (err) {
      console.error('Error listing files:', err);
      return [];
    }
  }

  async getVideo(app_id) {
    const params = {
      Bucket: process.env.AWS_Bucket_name,
      Prefix: `${app_id}/`
    };

    try {
      const data = await this.s3.send(new ListObjectsV2Command(params));
      const files = await Promise.all(data.Contents
        .filter(file => !file.Key.endsWith('.apk') && file.Key.includes(`${app_id}/video`))
        .map(async file => {
          const url = await getSignedUrl(this.s3, new GetObjectCommand({
            Bucket: process.env.AWS_Bucket_name,
            Key: file.Key
          }), { expiresIn: 3600 });
          return { key: file.Key, url };
        }));
      return files;
    } catch (err) {
      console.error('Error listing files:', err);
      return [];
    }
  }

  async getApk(app_id) {
    const params = {
      Bucket: process.env.AWS_Bucket_name,
      Prefix: `${app_id}/`
    };

    try {
      const data = await this.s3.send(new ListObjectsV2Command(params));
      const apkFile = data.Contents.find(file => file.Key.endsWith('.apk'));
      if (apkFile) {
        const url = await getSignedUrl(this.s3, new GetObjectCommand({
          Bucket: process.env.AWS_Bucket_name,
          Key: apkFile.Key
        }), { expiresIn: 3600 });
        return { key: apkFile.Key, url };
      } else {
        console.error('APK file not found.');
        return null;
      }
    } catch (err) {
      console.error('Error listing files:', err);
      return null;
    }
  }

  async updateAppStatus(app_id, status) {
    const params = {
      TableName,
      Key: {
        "app_id": { S: app_id.toString() }
      },
      UpdateExpression: "set #status = :status",
      ExpressionAttributeNames: {
        "#status": "status"
      },
      ExpressionAttributeValues: {
        ":status": { S: status }
      },
      ReturnValues: "ALL_NEW"
    };

    try {
      const result = await this.dynamoDB.send(new UpdateItemCommand(params));
      return result.Attributes;
    } catch (err) {
      console.error("Error updating application status:", err);
      throw err;
    }
  }

}

// Example usage
// const appModel = new ApplicationModel(dynamoDBClient, s3Client);
// appModel.getApk("209cf276-f260-4911-9752-9f1e901add83")
// .then(apkInfo => {
//   if (apkInfo) {
//     console.log('APK Info:', apkInfo);
//   } else {
//     console.log('No APK file found.');
//   }
// })
// .catch(error => {
//   console.error('Error fetching APK:', error);
// });

module.exports = ApplicationModel;
