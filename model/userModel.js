// userModel.js
const fs = require('fs');
require('dotenv').config();
const AWS = require('aws-sdk');
const { DynamoDB } = require("aws-sdk");
const dynamoDB = new DynamoDB({ region: process.env.AWS_Region });


function getAWSConfig() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
  const certs = [
    fs.readFileSync('C:/certs/ZscalerRootCertificate-2048-SHA256 1.pem').toString(),
    fs.readFileSync('C:/certs/AmazonRootCA1 1.pem').toString()
  ];
  return { sslCaCerts: certs };
}

const SESConfig = {
  accessKeyId: process.env.AWS_Access_Key,
  secretAccessKey: process.env.AWS_Secret_Access_Key,
  region: process.env.AWS_Region,
  ...getAWSConfig() // Merge SSL certificates into SESConfig
};

AWS.config.update(SESConfig);
const TableName = "Appstore-app-users";

class UserModel {
  async createUser(user) {
    const params = {
      TableName,
      Item: {
        "userid": { S: user.userid },
        "username": { S: user.username },
        "password": { S: user.password },
        "role": { S: user.role }
        // Add more attributes as needed
      }
    };

    try {
      await dynamoDB.putItem(params).promise();
      return true;
    } catch (err) {
      console.error("Error creating user:", err);
      return false;
    }
  }

  async getUser(username) {
    const params = {
      TableName,
      IndexName: 'usernameindex', // Assuming you've created a GSI called 'username-index'
      KeyConditionExpression: 'username = :username',
      ExpressionAttributeValues: {
        ':username': { S: username }
      },

      ProjectionExpression: "userid, username, password, #rl", // Using alias for 'role'
      ExpressionAttributeNames: {
        '#rl': 'role' // Alias for 'role' attribute
      }
    };
    try {
      const data = await dynamoDB.query(params).promise();
      return data.Items;
    } catch (err) {
      console.error("Error getting user:", err);
      return null;
    }
  }

  async getUserById(userid) {
    const params = {
      TableName,
      Key: {
        "userid": { S: userid }
      },
      ProjectionExpression: "userid, username, #rl", // Using alias for 'role'
      ExpressionAttributeNames: {
        '#rl': 'role' // Alias for 'role' attribute
      }
    };

    try {
      const data = await dynamoDB.getItem(params).promise();
      return data.Item;
    } catch (err) {
      console.error("Error getting user by ID:", err);
      return null;
    }
  }
}

module.exports = UserModel;



