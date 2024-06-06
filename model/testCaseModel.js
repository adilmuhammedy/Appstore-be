const { DynamoDBClient, PutItemCommand, UpdateItemCommand, GetItemCommand, DeleteItemCommand } = require('@aws-sdk/client-dynamodb');

const tableName = "Appstore-app-validations"; // Name of your DynamoDB table for test case validations

const dynamoDBClient = new DynamoDBClient({ region: process.env.AWS_REGION });

class TestCaseValidationModel {
    async insertValidation(app_id) {
        const item = {
            "app_id": { S: app_id },
            "APK Signature": { S: "not done" },
            "App Permissions": { S: "not done" },
            "Vulnerability": { S: "not done" },
            "Code Quality": { S: "not done" },
            "App content": { S: "not done" },
            "App security": { S: "not done" },
            "Performance": { S: "not done" },
            "Accessibility": { S: "not done" },
            "App store guidelines and policies": { S: "not done" },
            "App icons and screenshots": { S: "not done" },
        };

        const params = {
            TableName: tableName,
            Item: item,
            ConditionExpression: "attribute_not_exists(app_id)" // Ensures no existing item with the same app_id exists
        };

        try {
            await dynamoDBClient.send(new PutItemCommand(params));
            return true;
        } catch (err) {
            if (err.name === 'ConditionalCheckFailedException') {
                console.log("Entry for the corresponding app_id already exists. No insertion performed.");
                return false;
            } else {
                console.error("Error creating validation record:", err);
                return false;
            }
        }
    }

    async updateValidation(app_id, test_case, status) {
        const params = {
            TableName: tableName,
            Key: { "app_id": { S: app_id } },
            UpdateExpression: `SET #test_case = :status`,
            ExpressionAttributeNames: {
                '#test_case': test_case
            },
            ExpressionAttributeValues: {
                ':status': { S: status }
            },
            ReturnValues: 'ALL_NEW'
        };

        try {
            const result = await dynamoDBClient.send(new UpdateItemCommand(params));
            return result.Attributes;
        } catch (err) {
            console.error("Error updating validation record:", err);
            return false;
        }
    }

    async getValidation(app_id) {
        const params = {
            TableName: tableName,
            Key: { "app_id": { S: app_id } }
        };

        try {
            const data = await dynamoDBClient.send(new GetItemCommand(params));
            if (data.Item) {
                return data.Item;
            } else {
                console.log(`No validation record found for app_id: ${app_id}`);
                return null;
            }
        } catch (err) {
            console.error("Error retrieving validation record:", err);
            throw new Error('Error retrieving validation record');
        }
    }

    async deleteValidation(app_id) {
        const params = {
            TableName: tableName,
            Key: { "app_id": { S: app_id } }
        };

        try {
            await dynamoDBClient.send(new DeleteItemCommand(params));
            console.log(`Successfully deleted validation record for app_id: ${app_id}`);
            return true;
        } catch (err) {
            console.error("Error deleting validation record:", err);
            return false;
        }
    }
}

module.exports = TestCaseValidationModel;
