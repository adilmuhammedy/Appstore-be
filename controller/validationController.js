const fs = require('fs');
const AdmZip = require('adm-zip');
const forge = require('node-forge');
const AppModel = require('../model/appModel');
const axios = require('axios');
const { Readable } = require('stream');
const AWS = require('aws-sdk');
require('dotenv').config();

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_Access_Key,
  secretAccessKey: process.env.AWS_Secret_Access_Key,
  sslEnabled: false,
});
// Function to extract files from the APK
function extractFileFromZip(zipBuffer, filePath) {
  const zip = new AdmZip(zipBuffer);
  const entry = zip.getEntry(filePath);
  if (entry) {
    return entry.getData();
  }
  throw new Error(`File ${filePath} not found in the APK.`);
}

// Function to verify APK signature
async function verifyApkSignature(apkUrl) {
  try {
    // Download APK file
    const response = await axios.get(apkUrl, { responseType: 'arraybuffer' });
    const apkBuffer = response.data;

    // Extract the signature and the certificate
    const signature = extractFileFromZip(apkBuffer, 'META-INF/CERT.RSA');
    const manifest = extractFileFromZip(apkBuffer, 'META-INF/MANIFEST.MF');
    const cert = forge.pki.certificateFromPem(signature.toString('utf8'));
    console.log(`cert`,cert);
    // Verify the certificate
    const verified = cert.verify(cert);
    if (!verified) {
      return { valid: false, message: 'Certificate verification failed.' };
    }

    // Extract and verify the signature file
    const p7Asn1 = forge.asn1.fromDer(signature.toString('binary'));
    const p7 = forge.pkcs7.messageFromAsn1(p7Asn1);
    p7.content = forge.util.createBuffer(manifest.toString('binary'));
    const validity = p7.verify();

    if (validity) {
      return { valid: true, message: 'APK signature is valid.' };
    } else {
      return { valid: false, message: 'APK signature is invalid.' };
    }
  } catch (error) {
    return { valid: false, message: `Error verifying APK signature: ${error.message}` };
  }
}



const apksign = async (req, res) => {
  try {
    const appmodel = new AppModel();
    const  app_id  = req.body.app_id;
    // Fetch APK URL from AppModel
    const apkUrl = await appmodel.getApk(app_id);
    console.log(`apkUrl`,apkUrl.url);
    // Verify APK signature
    const result = await verifyApkSignature(apkUrl.url);
    console.log( `result`,result.message);
    res.json(result);
  } catch (error) {
    res.status(500).json({ valid: false, message: `Error: ${error.message}` });
  }
};

module.exports = { apksign };
