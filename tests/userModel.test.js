const UserModel = require('../model/userModel');
const { mockClient } = require('aws-sdk-client-mock');
const { DynamoDBClient, PutItemCommand, QueryCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const {docClient} =require('../config');
// Mock the DynamoDBClient
const ddbMock = mockClient(docClient);

describe('UserModel', () => {
    let userModel;

    beforeAll(() => {
        userModel = new UserModel();
    });

    afterEach(() => {
        ddbMock.reset();
    });

    describe('createUser', () => {
        let userModel;
    
        beforeEach(() => {
            userModel = new UserModel();
        });
    
        afterEach(() => {
            ddbMock.reset();
        });
    
        it('should create a new user', async () => {
            ddbMock.on(PutItemCommand).resolves({});
            const user = {
                userid: 'testUser123',
                username: 'testuser',
                password: 'testpassword',
                role: 'user'
            };
            const result = await userModel.createUser(user);
            expect(result).toBeTruthy();
        });
    
        it('should return false if there is an error creating user', async () => {
            ddbMock.on(PutItemCommand).rejects(new Error('Unable to create user'));
            const invalidUser = {
                userid: 'invalidUser',
                username: '',
                password: '',
                role: ''
            };
            const result = await userModel.createUser(invalidUser);
            expect(result).toBeFalsy();
        });
    });

    describe('getUser', () => {
        it('should get user by username', async () => {
            ddbMock.on(QueryCommand).resolves({
                Items: [
                    { 
                        username: { S: 'testuser' },
                    }
                ]
            });
            const result = await userModel.getUser('testuser');
            expect(result).toBeDefined();
            expect(result[0].username.S).toBe('testuser');
        });

        it('should return null if user does not exist', async () => {
            ddbMock.on(QueryCommand).resolves({ Items: [] });
            const result = await userModel.getUser('nonexistentuser');
            expect(result).toBeNull();
        });
    });

});
