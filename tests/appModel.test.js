const { DynamoDBClient, PutItemCommand, GetItemCommand } = require("@aws-sdk/client-dynamodb");
const { S3Client } = require("@aws-sdk/client-s3");
const { marshall } = require("@aws-sdk/util-dynamodb"); // Import marshall function
const ApplicationModel = require("../model/appModel"); // Adjust the import to your actual file path
const { mockClient } = require('aws-sdk-client-mock');


const {docClient,s3Client} = require('../config');
 
// Mock the DynamoDBClient
const ddbMock = mockClient(docClient);
const s3mock = mockClient(s3Client);

describe("ApplicationModel", () => {
  let applicationModel;

  beforeEach(() => {
    applicationModel = new ApplicationModel(ddbMock, s3mock);
  });
  afterEach(() => {
    ddbMock.reset();
});

  it("should create an application successfully", async () => {
    ddbMock.on(PutItemCommand).resolves({});

    const app = {
      app_id: "1",
      appname: "Example App",
      age_rating_id: "3",
      category_id: "2",
      tags: "education,learning",
      short_description: "An example educational app",
      long_description:
        "This is a detailed description of the Example App, which provides educational content for children.",
      support_url: "https://example.com/support",
      website_url: "https://example.com",
      price: "0.99",
      status: "active",
    };

    const params = {
        TableName: "Appstore-app-appdetails",
        Item: marshall(app), // Marshall the app object
      };
      const command = new PutItemCommand(params); // Create PutItemCommand
      const result = await applicationModel.createApplication(app);
  
      expect(result).toBe(true);
      expect(ddbMock.commandCalls(PutItemCommand, params)).toHaveLength(1);
    });

  it("should return false on error", async () => {
    ddbMock.on(PutItemCommand).rejects(new Error("DynamoDB error"));

    const app = {
      app_id: "1",
      appname: "Example App",
      age_rating_id: "3",
      category_id: "2",
      tags: "education,learning",
      short_description: "An example educational app",
      long_description:
        "This is a detailed description of the Example App, which provides educational content for children.",
      support_url: "https://example.com/support",
      website_url: "https://example.com",
      price: "0.99",
      status: "active",
    };

    const params = {
        TableName: "Appstore-app-appdetails",
        Item: marshall(app), // Marshall the app object
      };
      const command = new PutItemCommand(params); // Create PutItemCommand
      const result = await applicationModel.createApplication(app);
      expect(result).toBe(false);
      expect(ddbMock.commandCalls(PutItemCommand, params)).toHaveLength(1);
  });

  
  describe("getApplication", () => {
    let applicationModel;
  
    beforeEach(() => {
      applicationModel = new ApplicationModel(ddbMock, s3mock);
    });
  
    afterEach(() => {
      ddbMock.reset();
    });
  
    it("should return the application when it exists", async () => {
      // Mock the response from DynamoDB
      const mockApp = {
        app_id: { S: "1" },
        appname: { S: "Example App" },
        age_rating_id: { S: "3" },
        category_id: { S: "2" },
        tags: { S: "education,learning" },
        short_description: { S: "An example educational app" },
        long_description: { S: "This is a detailed description of the Example App" },
        support_url: { S: "https://example.com/support" },
        website_url: { S: "https://example.com" },
        price: { S: "0.99" },
        status: { S: "active" },
      };
  
      const expectedApp = {
        app_id: {S:"1"},
        appname: {S:"Example App"},
        age_rating_id: {S:"3"},
        category_id: {S:"2"},
        tags: {S:"education,learning"},
        short_description: {S:"An example educational app"},
        long_description: {S:"This is a detailed description of the Example App"},
        support_url: {S:"https://example.com/support"},
        website_url: {S:"https://example.com"},
        price: {S:"0.99"},
        status: {S:"active"},
      };
  
      ddbMock.on(GetItemCommand).resolves({ Item: mockApp });
  
      // Call the function and check the result
      const result = await applicationModel.getApplication("1");
  
      expect(result).toEqual(expectedApp);
      expect(ddbMock.commandCalls(GetItemCommand)).toHaveLength(1);
    });
  
    it("should return null when the application does not exist", async () => {
      // Mock the response from DynamoDB when the item does not exist
      ddbMock.on(GetItemCommand).resolves({});
  
      // Call the function and check the result
      const result = await applicationModel.getApplication("nonexistent_id");
  
      expect(result).toBeNull();
      expect(ddbMock.commandCalls(GetItemCommand)).toHaveLength(1);
    });
  
    it("should handle errors gracefully", async () => {
      // Mock the rejection of the DynamoDB request
      const errorMessage = "DynamoDB error";
      ddbMock.on(GetItemCommand).rejects(new Error(errorMessage));
  
      // Call the function and check that it returns null
      const result = await applicationModel.getApplication("1");
  
      expect(result).toBeNull();
      expect(ddbMock.commandCalls(GetItemCommand)).toHaveLength(1);
    });
  });
});