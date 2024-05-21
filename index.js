require('dotenv').config()
const express = require('express');
const AWS = require('aws-sdk')
const app = express();
const port = 5000;
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_Access_Key,
    secretAccessKey: process.env.AWS_Secret_Access_Key,
    region: process.env.AWS_Region,
    signatureVersion: 'v4',
    apiVersion: '2006-03-01'
});
AWS.config.update({ region: 'us-west-2' });

const bucket_name = "app-files"
app.get('/listBuckets', function (req, res) {
    s3.listBuckets(function (err, data) {
        if (err) {
            console.log("Error", err)
            res.send(err)
        } else {
            console.log("List of buckets", data.Buckets);
            res.send({ msg: "List of buckets", data: data.Buckets })
        }
    })
})

var bucketParams = {
    Bucket: bucket_name
};

app.post('/createBucket', function (req, res) {
    s3.createBucket(bucketParams, function (err, data) {
        if (err) {
            console.log("Error", err);
        } else {
            console.log("Bucket Created", data.Location);
            res.send({ msg: "Bucket created", data: data.Location })
        }
    });

})

app.get('/allObjects', function (req, res) {

})

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

