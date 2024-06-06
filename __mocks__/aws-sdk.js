const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');

const putItemMock = jest.fn();

const dynamoDBClient = new DynamoDBClient();

dynamoDBClient.send = putItemMock; // Assign the mock function to the send method

module.exports = {
  DynamoDB: {
    // Mocking the DynamoDB class
    send: putItemMock // Mocking the send method
  }
};
