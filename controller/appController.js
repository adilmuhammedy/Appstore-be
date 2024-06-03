const path = require('path');
const fs = require('fs');
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command, S3 } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();
const appModel = require('../model/appModel');
const testCaseModel = require('../model/testCaseModel');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');

// Configure AWS SDK
const s3Client = new S3Client({
  region: process.env.AWS_Region,
  credentials: {
    accessKeyId: process.env.AWS_Access_Key,
    secretAccessKey: process.env.AWS_Secret_Access_Key
  }
});

// Initialize DynamoDB client
const dynamoDBClient = new DynamoDBClient({
  region: process.env.AWS_Region,
  credentials: {
    accessKeyId: process.env.AWS_Access_Key,
    secretAccessKey: process.env.AWS_Secret_Access_Key,
  }
});


const appController = {
  uploadFilesAndSaveData: async (req, res) => {
    try {
      const app_id = uuidv4();
      const uploadDirName = `${app_id}`;
      if (!req.files) {
        console.error('No files uploaded');
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const uploadedFiles = [];
      const allowedFormats = ['.apk', '.png', '.jpg', '.jpeg', '.mp4', ''];
      const fileSizeLimit = 100 * 1024 * 1024;
      const filesArray = Object.values(req.files);
      const uploadPromises = filesArray.map(async (file) => {
        const fileExtension = path.extname(file.name).toLowerCase();
        if (!allowedFormats.includes(fileExtension)) {
          throw new Error(`File format not allowed for ${file.name}`);
        }
        const fileSize = file.size;
        if (fileSize > fileSizeLimit) {
          throw new Error(`File size exceeds the limit for ${file.name}`);
        }

        const fileTypes = ['video', 'screenshot', 'icon', 'apkfile'];
        // const fileName = `${req.body.apkName}_${fileTypes[filesArray.indexOf(file)]}_${Date.now()}${fileExtension}`;
        const fileName = file.name;
        const params = {
          Bucket: process.env.AWS_Bucket_name,
          Key: `${uploadDirName}/${fileName}`,
          Body: file.data,
        };

        const uploadResult = await s3Client.send(new PutObjectCommand(params));
        uploadedFiles.push(uploadResult.Location);
      });

      await Promise.all(uploadPromises);

      const applicationModel = new appModel(dynamoDBClient, s3Client);

      const appDetails = {
        app_id,
        appname: req.body.apkName,
        age_rating_id: req.body.ageRating,
        category_id: req.body.appCategory,
        tags: req.body.tags,
        short_description: req.body.appShortDescription,
        long_description: req.body.appLongDescription,
        support_url: req.body.supportUrl,
        website_url: req.body.websiteUrl,
        price: req.body.price,
        status: "Submitted",
      };
      const validations = [
        "APK Signature",
        "App Permissions",
        "Supported Devices and Screen Sizes",
        "Code Quality",
        "App content",
        "App security",
        "Performance",
        "Accessibility",
        "App store guidelines and policies",
        "App icons and screenshots"
      ];
      const testModel = new testCaseModel();
      const testcaseinsert = testModel.insertValidation(app_id, validations);
      // console.log(`newa validation created`,  testcaseinsert);
      const result = await applicationModel.createApplication(appDetails);
      if (result) {
        res.status(201).json({ message: "Application created successfully", uploadedFiles });
      } else {
        res.status(400).json({ message: "Error creating application" });
      }
    } catch (error) {
      console.error("Error creating application:", error);
      res.status(500).json({ message: `Internal server error, ${error}` });
    }
  },

  getApp: async (req, res) => {
    const app_id = req.params.id;
    const applicationModel = new appModel(dynamoDBClient, s3Client);
    try {
      const application = await applicationModel.getApplication(app_id);
      if (application) {
        res.status(200).json(application);
      } else {
        res.status(404).json({ message: "Application not found" });
      }
    } catch (err) {
      console.error("Error retrieving application:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  getAllApps: async (req, res) => {
    const applicationModel = new appModel(dynamoDBClient, s3Client);
    try {
      const applications = await applicationModel.getAllApplications();
      res.status(200).json(applications);
    } catch (err) {
      console.error("Error retrieving applications:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  updateApplication: async (req, res) => {
    const applicationModel = new appModel(dynamoDBClient, s3Client);
    const app_id = req.params.id;
    const updatedFields = req.body;

    try {
      const updatedApplication = await applicationModel.updateApplication(app_id, updatedFields);
      if (updatedApplication) {
        res.status(200).json({ message: "Application updated successfully", updatedApplication });
      } else {
        res.status(404).json({ message: "Application not found" });
      }
    } catch (err) {
      console.error("Error updating application:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  deleteApplication: async (req, res) => {
    const app_id = req.params.id;
    const applicationModel = new appModel(dynamoDBClient, s3Client);
    try {
      const result = await applicationModel.deleteApplication(app_id);
      if (result) {
        res.status(200).json({ message: "Application deleted successfully" });
      } else {
        res.status(404).json({ message: "Application not found" });
      }
    } catch (err) {
      console.error("Error deleting application:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  },
  getScreenshot: async (req, res) => {
    const applicationModel = new appModel(dynamoDBClient, s3Client);
    const app_id = req.params.id;
    const files = await applicationModel.getScreenshot(app_id);
    res.json(files);
  },
  deleteScreenshot: async (req, res) => {
    const applicationModel = new appModel(dynamoDBClient, s3Client);
    const app_id = req.body.app_id;
    const key = req.body.key;
    console.log(`got screenshot key`, key);
    const deleteresponse = await applicationModel.deleteScreenshot(key);
    res.json(deleteresponse);
  },
  uploadNewScreenshots: async (req, res) => {
    try {
      const app_id = req.body.app_id;
      const uploadDirName = `${app_id}`;
      let files = req.files.screenshot;
      if (!files) {
        console.error('No files uploaded');
        return res.status(400).json({ error: 'No files uploaded' });
      }
      // Normalize files to an array if it's a single file
      if (!Array.isArray(files)) {
        files = [files];
      }
      const uploadedFiles = [];
      const allowedFormats = ['.png', '.jpg', '.jpeg'];
      const fileSizeLimit = 100 * 1024 * 1024;

      const uploadPromises = files.map(async (file) => {
        const fileExtension = path.extname(file.name).toLowerCase();
        if (!allowedFormats.includes(fileExtension)) {
          throw new Error(`File format not allowed for ${file.name}`);
        }
        const fileSize = file.size;
        if (fileSize > fileSizeLimit) {
          throw new Error(`File size exceeds the limit for ${file.name}`);
        }
        const fileName = file.name;
        const params = {
          Bucket: process.env.AWS_Bucket_name,
          Key: `${uploadDirName}/${fileName}`,
          Body: file.data,
        };

        const command = new PutObjectCommand(params);
        const uploadResult = await s3Client.send(command);
      });

      const result = await Promise.all(uploadPromises);
      if (result) {
        return res.status(201).json({ message: 'Screenshots updated successfully', uploadedFiles });
      } else {
        res.status(400).json({ message: 'Error creating application' });
      }
    } catch (err) {
      console.error('Error updating screenshots:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  },
  getAppicon: async (req, res) => {
    const applicationModel = new appModel(dynamoDBClient, s3Client);
    const app_id = req.params.id;
    const files = await applicationModel.getAppicon(app_id);
    res.json(files);
  },
  updateAppIcon: async (req, res) => {
    try {
      const app_id = req.body.app_id;
      const uploadDirName = `${app_id}`;
      const file = req.files.appicon;
      if (!file) {
        console.error('No file uploaded');
        return res.status(400).json({ error: 'No file uploaded' });
      }
  
      const allowedFormats = ['.png', '.jpg', '.jpeg'];
      const fileSizeLimit = 100 * 1024 * 1024;
      const fileExtension = path.extname(file.name).toLowerCase();
  
      if (!allowedFormats.includes(fileExtension)) {
        throw new Error(`File format not allowed for ${file.name}`);
      }
  
      const fileSize = file.size;
      if (fileSize > fileSizeLimit) {
        throw new Error(`File size exceeds the limit for ${file.name}`);
      }
  
      // Delete existing app icon if it exists
      const listParams = {
        Bucket: process.env.AWS_Bucket_name,
        Prefix: `${uploadDirName}/appicon`
      };
  
      const listCommand = new ListObjectsV2Command(listParams);
      const existingAppIcons = await s3Client.send(listCommand);
      if (existingAppIcons.Contents.length > 0) {
        const deleteParams = {
          Bucket: process.env.AWS_Bucket_name,
          Key:existingAppIcons.Contents[0].Key
          // Delete: {
          //   Objects: existingAppIcons.Contents.map(obj => ({ Key: obj.Key }))
          // }
        };
        const deleteCommand = new DeleteObjectCommand(deleteParams);
        await s3Client.send(deleteCommand);
      }
      console.log(`old app icon deleted`);
      // Upload new app icon
      const params = {
        Bucket: process.env.AWS_Bucket_name,
        Key: `${uploadDirName}/appicon_${Date.now()}${fileExtension}`,
        Body: file.data,
      };
  
      const uploadCommand = new PutObjectCommand(params);
      const uploadResult = await s3Client.send(uploadCommand);
  
      res.status(201).json({ message: 'App icon updated successfully', uploadResult });
    } catch (err) {
      console.error('Error updating app icon:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  },
  getVideo: async (req, res) => {
    const applicationModel = new appModel(dynamoDBClient, s3Client);
    const app_id = req.params.id;
    const files = await applicationModel.getVideo(app_id);
    res.json(files);
  },
  updateAppVideo: async (req, res) => {
    try {
      const app_id = req.body.app_id;
      const uploadDirName = `${app_id}`;
      const file = req.files.appvideo;

      if (!file) {
        console.error('No file uploaded');
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const allowedFormats = ['.mp4'];
      const fileSizeLimit = 100 * 1024 * 1024;
      const fileExtension = path.extname(file.name).toLowerCase();

      if (!allowedFormats.includes(fileExtension)) {
        throw new Error(`File format not allowed for ${file.name}`);
      }

      const fileSize = file.size;
      if (fileSize > fileSizeLimit) {
        throw new Error(`File size exceeds the limit for ${file.name}`);
      }

      // Delete existing app icon if it exists
      const listParams = {
        Bucket: process.env.AWS_Bucket_name,
        Prefix: `${uploadDirName}/video`
      };

      const listCommand = new ListObjectsV2Command(listParams);
    const existingAppIcons = await s3Client.send(listCommand);
      if (existingAppIcons.Contents.length > 0) {
        const deleteParams = {
          Bucket: process.env.AWS_Bucket_name,
          Key:existingAppIcons.Contents[0].Key
          // Delete: {
          //   Objects: existingAppIcons.Contents.map(obj => ({ Key: obj.Key }))
          // }
        };
        const deleteCommand = new DeleteObjectCommand(deleteParams);
        await s3Client.send(deleteCommand);
      }


      const params = {
        Bucket: process.env.AWS_Bucket_name,
        Key: `${uploadDirName}/video_${Date.now()}${fileExtension}`,
        Body: file.data,
      };

      const command = new PutObjectCommand(params);
      const uploadResult = await s3Client.send(command);

      res.status(201).json({ message: 'App video updated successfully', uploadResult });
    } catch (err) {
      console.error('Error updating app video:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  },
  getApk: async (req, res) => {
    const applicationModel = new appModel(dynamoDBClient, s3Client);
    const app_id = req.params.id;
    const files = await applicationModel.getApk(app_id);
    res.json(files);
  },
  updateAppStatus: async (req, res) => {
    const applicationModel = new appModel(dynamoDBClient, s3Client);
    const app_id = req.params.id;
    const { status } = req.body;

    try {
      const updatedApplication = await applicationModel.updateAppStatus(app_id, status);
      if (updatedApplication) {
        res.status(200).json({ message: "Application status updated successfully", updatedApplication });
      } else {
        res.status(404).json({ message: "Application not found" });
      }
    } catch (err) {
      console.error("Error updating application status:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

module.exports = appController;
