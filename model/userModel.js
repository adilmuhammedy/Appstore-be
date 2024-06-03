const fs = require('fs');
require('dotenv').config();
const { DynamoDBClient, PutItemCommand, QueryCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const credentials = {
  accessKeyId: process.env.AWS_Access_Key,
  secretAccessKey: process.env.AWS_Secret_Access_Key
};

const dynamoDBClient = new DynamoDBClient({ region: process.env.AWS_Region, credentials });

function getAWSConfig() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    const certs = [
        fs.readFileSync('C:/certs/ZscalerRootCertificate-2048-SHA256 1.pem').toString(),
        fs.readFileSync('C:/certs/AmazonRootCA1 1.pem').toString()
    ];
    return { sslCaCerts: certs };
}

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
            await dynamoDBClient.send(new PutItemCommand(params));
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
            const data = await dynamoDBClient.send(new QueryCommand(params));
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
            const data = await dynamoDBClient.send(new GetItemCommand(params));
            return data.Item;
        } catch (err) {
            console.error("Error getting user by ID:", err);
            return null;
        }
    }
}

module.exports = UserModel;
