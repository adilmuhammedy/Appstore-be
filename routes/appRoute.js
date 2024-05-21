const express = require('express');
const router = express.Router();
const appController = require('../controller/appController');

/**
 * @swagger
 * tags:
 *   name: Apps
 *   description: App management
 */

/**
 * @swagger
 * /app/upload:
 *   post:
 *     summary: Upload files and save app data
 *     tags: [Apps]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               apkName:
 *                 type: string
 *                 description: Name of the APK
 *               ageRating:
 *                 type: string
 *                 description: Age rating of the app
 *               appCategory:
 *                 type: string
 *                 description: Category of the app
 *               tags:
 *                 type: string
 *                 description: Tags associated with the app
 *               appShortDescription:
 *                 type: string
 *                 description: Short description of the app
 *               appLongDescription:
 *                 type: string
 *                 description: Long description of the app
 *               supportUrl:
 *                 type: string
 *                 description: Support URL for the app
 *               websiteUrl:
 *                 type: string
 *                 description: Website URL for the app
 *               price:
 *                 type: string
 *                 description: Price of the app
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Files to be uploaded
 *     responses:
 *       201:
 *         description: Application created successfully
 *       400:
 *         description: No files uploaded or error creating application
 *       500:
 *         description: Internal server error
 */
router.post('/upload', appController.uploadFilesAndSaveData);

/**
 * @swagger
 * /app/getApps:
 *   get:
 *     summary: Get all apps
 *     tags: [Apps]
 *     responses:
 *       200:
 *         description: A list of all apps
 *       500:
 *         description: Internal server error
 */
router.get('/getApps', appController.getAllApps);

/**
 * @swagger
 * /app/{id}:
 *   get:
 *     summary: Get app by ID
 *     tags: [Apps]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The app ID
 *     responses:
 *       200:
 *         description: Application data
 *       404:
 *         description: Application not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', appController.getApp);

/**
 * @swagger
 * /app/screenshots/{id}:
 *   get:
 *     summary: Get screenshots by app ID
 *     tags: [Apps]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The app ID
 *     responses:
 *       200:
 *         description: Screenshots for the app
 *       500:
 *         description: Internal server error
 */
router.get('/screenshots/:id', appController.getScreenshot);

/**
 * @swagger
 * /app/icons/{id}:
 *   get:
 *     summary: Get app icon by ID
 *     tags: [Apps]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The app ID
 *     responses:
 *       200:
 *         description: App icon
 *       500:
 *         description: Internal server error
 */
router.get('/icons/:id', appController.getAppicon);

/**
 * @swagger
 * /app/videos/{id}:
 *   get:
 *     summary: Get video by app ID
 *     tags: [Apps]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The app ID
 *     responses:
 *       200:
 *         description: Videos for the app
 *       500:
 *         description: Internal server error
 */
router.get('/videos/:id', appController.getVideo);

/**
 * @swagger
 * /app/delete/{id}:
 *   delete:
 *     summary: Delete app by ID
 *     tags: [Apps]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The app ID
 *     responses:
 *       200:
 *         description: Application deleted successfully
 *       404:
 *         description: Application not found
 *       500:
 *         description: Internal server error
 */
router.delete('/delete/:id', appController.deleteApplication);

/**
 * @swagger
 * /app/update/{id}:
 *   put:
 *     summary: Update app by ID
 *     tags: [Apps]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The app ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               appname:
 *                 type: string
 *                 description: Name of the app
 *               age_rating_id:
 *                 type: string
 *                 description: Age rating of the app
 *               category_id:
 *                 type: string
 *                 description: Category of the app
 *               tags:
 *                 type: string
 *                 description: Tags associated with the app
 *               short_description:
 *                 type: string
 *                 description: Short description of the app
 *               long_description:
 *                 type: string
 *                 description: Long description of the app
 *               support_url:
 *                 type: string
 *                 description: Support URL for the app
 *               website_url:
 *                 type: string
 *                 description: Website URL for the app
 *               price:
 *                 type: string
 *                 description: Price of the app
 *     responses:
 *       200:
 *         description: Application updated successfully
 *       404:
 *         description: Application not found
 *       500:
 *         description: Internal server error
 */
router.put('/update/:id', appController.updateApplication);

/**
 * @swagger
 * /app/fetchapkfile/{id}:
 *   get:
 *     summary: Fetch APK file by app ID
 *     tags: [Apps]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The app ID
 *     responses:
 *       200:
 *         description: APK file for the app
 *       500:
 *         description: Internal server error
 */
router.get('/fetchapkfile/:id', appController.getApk);

module.exports = router;
