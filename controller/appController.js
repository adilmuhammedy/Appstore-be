const path = require('path');
const fs = require('fs');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();
const appModel = require('../model/appModel');

// Configure AWS SDK
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_Access_Key,
  secretAccessKey: process.env.AWS_Secret_Access_Key,
  sslEnabled: false,
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

        const uploadResult = await s3.upload(params).promise();
        uploadedFiles.push(uploadResult.Location);
      });

      await Promise.all(uploadPromises);

      const applicationModel = new appModel();

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

      const result = await applicationModel.createApplication(appDetails);
      if (result) {
        res.status(201).json({ message: "Application created successfully", uploadedFiles });
      } else {
        res.status(400).json({ message: "Error creating application" });
      }
    } catch (err) {
      console.error("Error creating application:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  getApp: async (req, res) => {
    const app_id = req.params.id;
    const applicationModel = new appModel();
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
    const applicationModel = new appModel();
    try {
      const applications = await applicationModel.getAllApplications();
      res.status(200).json(applications);
    } catch (err) {
      console.error("Error retrieving applications:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  updateApplication: async (req, res) => {
    const applicationModel = new appModel();
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
    const applicationModel = new appModel();
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
    const applicationModel = new appModel();
    const app_id = req.params.id;
    const files = await applicationModel.getScreenshot(app_id);
    res.json(files);
  },
  getAppicon: async (req, res) => {
    const applicationModel = new appModel();
    const app_id = req.params.id;
    const files = await applicationModel.getAppicon(app_id);
    res.json(files);
  },
  getVideo: async (req, res) => {
    const applicationModel = new appModel();
    const app_id = req.params.id;
    const files = await applicationModel.getVideo(app_id);
    res.json(files);
  },
  getApk: async (req, res) => {
    const applicationModel = new appModel();
    const app_id = req.params.id;
    const files = await applicationModel.getApk(app_id);
    res.json(files);
  }
};

module.exports = appController;
