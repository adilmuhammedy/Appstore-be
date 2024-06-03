const AWS = require('aws-sdk');
const ApplicationModel = require('../model/appModel'); // Adjust the import to your actual file path

jest.mock('aws-sdk', () => {
  const mDynamoDB = {
    putItem: jest.fn().mockReturnThis(),
    getItem: jest.fn().mockReturnThis(),
    scan: jest.fn().mockReturnThis(),
    updateItem: jest.fn().mockReturnThis(),
    deleteItem: jest.fn().mockReturnThis(),
    promise: jest.fn(),
  };
  const mS3 = {
    listObjectsV2: jest.fn().mockReturnThis(),
    deleteObjects: jest.fn().mockReturnThis(),
    getSignedUrl: jest.fn(),
    deleteObject: jest.fn().mockReturnThis(),
    promise: jest.fn(),
  };
  return {
    DynamoDB: jest.fn(() => mDynamoDB),
    S3: jest.fn(() => mS3),
  };
});

describe('ApplicationModel', () => {
  let applicationModel;
  let mDynamoDB;
  let mS3;

  beforeEach(() => {
    mDynamoDB = new AWS.DynamoDB();
    mS3 = new AWS.S3();
    applicationModel = new ApplicationModel(mDynamoDB, mS3);
  });

  it('should create an application successfully', async () => {
    mDynamoDB.putItem().promise.mockResolvedValue({});

    const app = {
      app_id: '1',
      appname: 'Example App',
      age_rating_id: '3',
      category_id: '2',
      tags: 'education,learning',
      short_description: 'An example educational app',
      long_description: 'This is a detailed description of the Example App, which provides educational content for children.',
      support_url: 'https://example.com/support',
      website_url: 'https://example.com',
      price: '0.99',
      status: 'active'
    };
    const result = await applicationModel.createApplication(app);

    expect(result).toBe(true);
    expect(mDynamoDB.putItem).toHaveBeenCalledWith({
      TableName: process.env.TableName,
      Item: {
        "app_id": { S: app.app_id.toString() },
        "appname": { S: app.appname },
        "age_rating_id": { S: app.age_rating_id },
        "category_id": { S: app.category_id },
        "tags": { S: app.tags },
        "short_description": { S: app.short_description },
        "long_description": { S: app.long_description },
        "support_url": { S: app.support_url },
        "website_url": { S: app.website_url },
        "price": { S: app.price },
        "status": { S: app.status }
      }
    });
  });

  it('should return false on error', async () => {
    mDynamoDB.putItem().promise.mockRejectedValue(new Error('DynamoDB error'));

    const app = {
      app_id: '1',
      appname: 'Example App',
      age_rating_id: '3',
      category_id: '2',
      tags: 'education,learning',
      short_description: 'An example educational app',
      long_description: 'This is a detailed description of the Example App, which provides educational content for children.',
      support_url: 'https://example.com/support',
      website_url: 'https://example.com',
      price: '0.99',
      status: 'active'
    };

    const result = await applicationModel.createApplication(app);

    expect(result).toBe(false);
    expect(mDynamoDB.putItem).toHaveBeenCalled();
  });

  // Add more tests as needed
});
