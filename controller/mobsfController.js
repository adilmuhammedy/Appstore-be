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