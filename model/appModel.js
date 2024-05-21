const fs = require('fs');
require('dotenv').config();
const AWS = require('aws-sdk');
const { DynamoDB } = require('aws-sdk');
const dynamoDB = new DynamoDB({ region: process.env.AWS_Region });
const HashValueModel = require('./hashValueModel');
const JsonModel = require('./jsonModel');

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
const TableName = "Appstore-app-appdetails";


class ApplicationModel {
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
        "price" : {S : app.price}, 
        "status": { S: app.status }
        // Add more attributes as needed
      }
    };

    try {
      await dynamoDB.putItem(params).promise();
      return true;
    } catch (err) {
      console.error("Error creating application:", err);
      return false;
    }
  }

  async getApplication(app_id) {
    console.log(app_id);
    const params = {
      TableName,
      Key: {
        "app_id": { S: app_id }
      }
    };

    try {
      const data = await dynamoDB.getItem(params).promise();
      return data.Item;
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
      const data = await dynamoDB.scan(params).promise();
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
      const data = await dynamoDB.updateItem(params).promise();
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
      const listedObjects = await s3.listObjectsV2(deleteFilesParams).promise();

      if (listedObjects.Contents.length === 0) {
        console.log('No files to delete.');
      } else {
        // Create delete parameters
        const deleteParams = {
          Bucket: process.env.AWS_Bucket_name,
          Delete: { Objects: [] }
        };

        listedObjects.Contents.forEach(({ Key }) => {
          deleteParams.Delete.Objects.push({ Key });
        });

        // Delete the files
        await s3.deleteObjects(deleteParams).promise();
        console.log('Files deleted successfully.');
      }

      const hashValueModel = new HashValueModel();
      const jsonModel = new JsonModel();

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
      // Delete the application from DynamoDB
      const deleteAppParams = {
        TableName,
        Key: {
          "app_id": { S: app_id }
        }
      };

      await dynamoDB.deleteItem(deleteAppParams).promise();
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
      const data = await s3.listObjectsV2(params).promise();
      const files = data.Contents
        .filter(file => !file.Key.endsWith('.apk') && file.Key.includes(`${app_id}/screenshot`)) // Filter out .apk files and only include files starting with "screenshot"
        .map(file => {
          return {
            key: file.Key,
            url: s3.getSignedUrl('getObject', {
              Bucket: process.env.AWS_Bucket_name,
              Key: file.Key,
              Expires: 60 * 60
            })
          };
        });
      
      return files;
    } catch (err) {
      console.error('Error listing files:', err);
      return [];
    }
  }
  async getAppicon(app_id) {
    const params = {
      Bucket: process.env.AWS_Bucket_name,
      Prefix: `${app_id}/`
    };

    try {
      console.log(`got app id req app icon`, app_id);
      const data = await s3.listObjectsV2(params).promise();
      const files = data.Contents
        .filter(file => !file.Key.endsWith('.apk') && file.Key.includes(`${app_id}/appicon`)) // Filter out .apk files and only include files starting with "screenshot"
        .map(file => {
          return {
            key: file.Key,
            url: s3.getSignedUrl('getObject', {
              Bucket: process.env.AWS_Bucket_name,
              Key: file.Key,
              Expires: 60 * 60
            })
          };
        });
        console.log(`filessss`,files);
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
      const data = await s3.listObjectsV2(params).promise();
      const files = data.Contents
        .filter(file => !file.Key.endsWith('.apk') && file.Key.includes(`${app_id}/video`)) // Filter out .apk files and only include files starting with "screenshot"
        .map(file => {
          return {
            key: file.Key,
            url: s3.getSignedUrl('getObject', {
              Bucket: process.env.AWS_Bucket_name,
              Key: file.Key,
              Expires: 60 * 60
            })
          };
        });
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
      const data = await s3.listObjectsV2(params).promise();
      const apkFile = data.Contents.find(file => file.Key.endsWith('.apk')); // Find the first .apk file
      if (apkFile) {
        const url = s3.getSignedUrl('getObject', {
          Bucket: process.env.AWS_Bucket_name,
          Key: apkFile.Key,
          Expires: 60 * 60 // Expiry time in seconds
        });
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

}

module.exports = ApplicationModel;

























// const { Sequelize, DataTypes } = require('sequelize');
// const sequelize = require('../config');

// const Application = sequelize.define('application', {
//   app_id: {
//     type: DataTypes.INTEGER,
//     primaryKey: true,
//     autoIncrement: true
//   },
//   appname: {
//     type: DataTypes.STRING
//   },
//   age_rating_id: {
//     type: DataTypes.STRING
//   },
//   category_id: {
//     type: DataTypes.STRING
//   },
//   tags: {
//     type: DataTypes.STRING
//   },
//   short_description: {
//     type: DataTypes.TEXT
//   },
//   long_description: {
//     type: DataTypes.TEXT
//   },
//   support_url: {
//     type: DataTypes.STRING
//   },
//   website_url: {
//     type: DataTypes.STRING
//   },
//   status: {
//     type: DataTypes.STRING
//   }
// },
//   {
//     timestamps: true,
//     freezeTableName: true,

//   });
// // Application.sync({ force: true })
// sequelize.sync()
//   .then(() => {
//     console.log('App Tables have been created if not exist.');
//   });

// module.exports = Application;