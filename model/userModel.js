const fs = require('fs');
// require('dotenv').config();
const { DynamoDBClient, PutItemCommand, QueryCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const {docClient} = require('../config');
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
            await docClient.send(new PutItemCommand(params));
            return true;
        } catch (err) {
            console.log("Error creating user:", err);
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
            const data = await docClient.send(new QueryCommand(params));
            return data.Items.length>0 ?data.Items : null ;
    }
}

module.exports = UserModel;
