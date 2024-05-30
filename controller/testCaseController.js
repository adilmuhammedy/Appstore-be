const TestCaseValidationModel = require('../model/testCaseModel');

const testCaseValidationController = {
    insertValidation: async (req, res) => {
        const validationModel = new TestCaseValidationModel();
        const result = await validationModel.insertValidation(app_id);
        if (result) {
            console.log('Validation record inserted successfully');
            res.send('Validation record inserted successfully');
        } else {
            console.log('Failed to insert validation record');
            res.status(500).send('Failed to insert validation record');
        }
    },

    updateValidation: async (req, res) => {
        const { app_id, testCase, status } = req.body;
        const validationModel = new TestCaseValidationModel();
        const result = await validationModel.updateValidation(app_id, testCase, status);
        if (result) {
            console.log('Validation record updated successfully');
            res.send(result);
        } else {
            console.log('Failed to update validation record');
            res.status(500).send('Failed to update validation record');
        }
    },

    getValidation: async (req, res) => {
        const  app_id  = req.params.id;
        const validationModel = new TestCaseValidationModel();
        const result = await validationModel.getValidation(app_id);
        if (result) {
            console.log('Validation record fetched successfully');
            res.send(result);
        } else {
            console.log('Failed to fetch validation record');
            res.status(404).send('Validation record not found');
        }
    },

    deleteValidation: async (req, res) => {
        const { app_id } = req.body;
        const validationModel = new TestCaseValidationModel();
        const result = await validationModel.deleteValidation(app_id);
        if (result) {
            console.log('Validation record deleted successfully');
            res.send('Validation record deleted successfully');
        } else {
            console.log('Failed to delete validation record');
            res.status(500).send('Failed to delete validation record');
        }
    }
};

module.exports = testCaseValidationController;
