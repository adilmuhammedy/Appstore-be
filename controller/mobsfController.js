const express = require('express');
const JsonModel = require('../model/jsonModel')
const HashValueModel = require('../model/hashValueModel');
const path = require('path');
const fs = require('fs');
const { file } = require('pdfkit');


const mobsfController = {
     insertHashValue: async(req,res) => {
        const app_id=req.body.app_id;
        const hashValue=req.body.hashvalue
        const hashValueModel = new HashValueModel();
        const result = await hashValueModel.InsertHashValue(app_id, hashValue);
        if (result) {
          console.log('Hash value inserted successfully');
          res.send('Hash value inserted successfully');
        } else {
          console.log('Failed to insert hash value');
        }

      },
      gethashValue: async(req, res) => {
        const app_id = req.query.app_id; 
        const hashValueModel = new HashValueModel();
        const result = await hashValueModel.getHashValue(app_id);
        if (result) {
            console.log('Hash value fetched successfully');
            res.send(result);
          } else {
            console.log('Failed to fetch hash value');
          }
      },
      insertJsonReport: async(req,res) => {
        const jsonModel = new JsonModel();
        const app_id = req.body.app_id
        const jsonReport = req.body.jsonReport
        const result = await jsonModel.uploadJsonFileToS3(app_id,jsonReport)
        if (result) {
            res.send(result)
            console.log('json report inserted to s3 successfully');
          } else {
            console.log('Failed to insert json report');
          }
      },
      getjsonReport: async (req, res) => {
        const jsonModel = new JsonModel();
        const app_id = req.query.app_id; 
        const url = await jsonModel.getJsonReportUrl(app_id); // Corrected function call
        if (url) {
            console.log('Pre-signed URL generated successfully');
            res.status(200).json({ url }); // Send the pre-signed URL
        } else {
            console.log('No JSON report found');
            res.status(404).json({ message: 'No JSON report found' }); // Send 404 if not found
        }
      }

}


module.exports = mobsfController;





// const savejsonReport = async (req, res) => {
//     const { jsonReport, app_id } = req.body;
//     try {
//         if (!jsonReport || typeof jsonReport !== 'object') {
//             return res.status(400).json({ error: 'Invalid JSON report data' });
//         }
//         // Generate a unique filename for the JSON report
//         const timestamp = Date.now();
//         const filename = `jsonReport_${timestamp}.json`;
//         // Specify the directory where you want to save the JSON file
//         const saveDir = "C:\\Projects\\Allgo\\Files\\jsonFiles";
//         // Check if the directory exists, if not, create it
//         if (!fs.existsSync(saveDir)) {
//             fs.mkdirSync(saveDir, { recursive: true });
//         }
//         // Construct the full path for saving the file
//         const savePath = path.join(saveDir, filename);
//         // Write the JSON data to the file
//         fs.writeFileSync(savePath, JSON.stringify(jsonReport));
//         await AppModel.update({ status: 'Analyzed' }, { where: { app_id: app_id } });
//         // Save app_id and filename to PostgreSQL database
//         const existingReport = await JsonFileModel.findOne({ where: { app_id: app_id } });
//         if (existingReport) {
//             existingReport.json_filename = filename;
//             await existingReport.save();
//             //update json file name
//             return res.status(200).json(existingReport);
//         } else {
//             // Report doesn't exist, create a new result
//             const newReport = await JsonFileModel.create({ app_id: app_id, json_filename: filename });
//             // Update the status of the app to "Analyzed"
//             return res.status(201).json(newReport);
//         }
//     } catch (error) {
//         console.error('Error saving JSON report:', error);
//         return res.status(500).json({ error: 'Error saving JSON report' });
//     }
// };

// const retrievejsonReport = async (req, res) => {
//     const { app_id } = req.query;
//     try {
//         // Retrieve the filename associated with the app_id from the database
//         const scan = await JsonFileModel.findOne({ where: { app_id } });
//         if (!scan) {
//             return res.status(404).json({ error: 'file not found' });
//         }
//         const filename = scan.json_filename;
//         // Construct the full path to the JSON file using the retrieved filename
//         const filePath = path.join("C:\\Projects\\Allgo\\Files\\jsonFiles", filename);
//         // Read the JSON data from the file
//         const jsonData = fs.readFileSync(filePath, 'utf8');
//         const parsedData = JSON.parse(jsonData);
//         // Access specific details from the parsed data
//         const specificDetails = {
//             appname: parsedData.app_name,
//             version: parsedData.version,
//             apptype: parsedData.app_type,
//             size: parsedData.size,
//             md5: parsedData.md5,
//             sha1: parsedData.sha1,
//             sha256: parsedData.sha256,
//             packagename: parsedData.package_name

//             // Add more properties as needed
//         };
//         // Send the JSON data back to the frontend
//         return res.status(200).json({ specificDetails });
//     } catch (error) {
//         console.error('Error retrieving JSON report:', error);
//         return res.status(500).json({ error: 'Error retrieving JSON report' });
//     }
// };

// const saveHashValue = async (req, res) => {
//     const { hashvalue, app_id } = req.body;
//     try {
//         // Check if the hash value already exists for the given app_id
//         const existingHashValue = await HashValueModel.findOne({ where: { app_id: app_id } });
//         if (existingHashValue) {
//             // If hash value already exists, update it
//             existingHashValue.hashValue = hashvalue;
//             await existingHashValue.save();
//             return res.status(200).json({ message: 'Hash value updated successfully' });
//         } else {
//             // If hash value doesn't exist, create a new record
//             await HashValueModel.create({ app_id: app_id, hashValue: hashvalue });
//             return res.status(201).json({ message: 'Hash value saved successfully' });
//         }
//     } catch (error) {
//         console.error('Error saving hash value:', error);
//         return res.status(500).json({ error: 'Error saving hash value' });
//     }
// };
// const retrievehashValue = async (req, res) => {
//     const { app_id } = req.query;
//     try {
//         // Retrieve the filename associated with the app_id from the database
//         const scan = await HashValueModel.findOne({ where: { app_id } });
//         // Send the JSON data back to the frontend
//         // console.log(`helo`, scan.hashValue);
//         const hashValue = scan.hashValue
//         return res.status(200).json({ hashValue });
//     } catch (error) {
//         console.error('Error retrieving hashvalue:', error);
//         return res.status(500).json({ error: 'Error retrieving hashvalue' });
//     }
// };

// module.exports = {
//     savejsonReport, retrievejsonReport, saveHashValue, retrievehashValue
// };