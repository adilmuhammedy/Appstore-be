const AWS = require('aws-sdk');

const putItemMock = jest.fn();

AWS.DynamoDB = jest.fn().mockImplementation(() => {
  return {
    putItem: putItemMock
  };
});

module.exports = AWS;
