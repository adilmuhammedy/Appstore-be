const AWS = require('aws-sdk');
const { DynamoDB } = require('aws-sdk');
const dynamoDB = new DynamoDB.DocumentClient({ region: process.env.AWS_REGION });

const tableName = "Appstore-app-validations"; // Name of your DynamoDB table for test case validations

class TestCaseValidationModel {
    async insertValidation(app_id) {
        // Construct the item object with app_id and test case columns initialized to "not done"
        const item = {
            "app_id": app_id,
            "APK Signature": "not done",
            "App Permissions": "not done",
            "Supported Devices and Screen Sizes": "not done",
            "Code Quality": "not done",
            "App content": "not done",
            "App security": "not done",
            "Performance": "not done",
            "Accessibility": "not done",
            "App store guidelines and policies": "not done",
            "App icons and screenshots": "not done",
        };
    
        const params = {
            TableName: tableName,
            Item: item,
            ConditionExpression: "attribute_not_exists(app_id)" // Ensures no existing item with the same app_id exists
        };
    
        try {
            await dynamoDB.put(params).promise();
            return true;
        } catch (err) {
            if (err.code === 'ConditionalCheckFailedException') {
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
            Key: {
                "app_id": app_id
            },
            UpdateExpression: `SET #test_case = :status`,
            ExpressionAttributeNames: {
                '#test_case': test_case
            },
            ExpressionAttributeValues: {
                ':status': status
            },
            ReturnValues: 'ALL_NEW'
        };

        try {
            const result = await dynamoDB.update(params).promise();
            return result.Attributes;
        } catch (err) {
            console.error("Error updating validation record:", err);
            return false;
        }
    }

    async getValidation(app_id) {
        const params = {
            TableName: tableName,
            Key: {
                "app_id": app_id
            }
        };
        try {
            const data = await dynamoDB.get(params).promise();
            if (data.Item) {
                console.log(data.Item);
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
            Key: {
                "app_id": app_id
            }
        };

        try {
            await dynamoDB.delete(params).promise();
            console.log(`Successfully deleted validation record for app_id: ${app_id}`);
            return true;
        } catch (err) {
            console.error("Error deleting validation record:", err);
            return false;
        }
    }
}

module.exports = TestCaseValidationModel;
