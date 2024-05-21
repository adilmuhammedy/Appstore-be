const express = require('express');
const router = express.Router();
const mobsfController = require('../controller/mobsfController');

/**
 * @swagger
 * tags:
 *   name: MobSF
 *   description: MobSF management
 */

/**
 * @swagger
 * /mobsf/savehashvalue:
 *   post:
 *     summary: Save hash value
 *     tags: [MobSF]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               app_id:
 *                 type: string
 *                 description: ID of the app
 *               hashvalue:
 *                 type: string
 *                 description: Hash value to be saved
 *     responses:
 *       200:
 *         description: Hash value inserted successfully
 *       500:
 *         description: Failed to insert hash value
 */
router.post('/savehashvalue', mobsfController.insertHashValue);

/**
 * @swagger
 * /mobsf/retrievehashvalue:
 *   get:
 *     summary: Retrieve hash value
 *     tags: [MobSF]
 *     parameters:
 *       - in: query
 *         name: app_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the app
 *     responses:
 *       200:
 *         description: Hash value fetched successfully
 *       500:
 *         description: Failed to fetch hash value
 */
router.get('/retrievehashvalue', mobsfController.gethashValue);

/**
 * @swagger
 * /mobsf/savejson:
 *   post:
 *     summary: Save JSON report
 *     tags: [MobSF]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               app_id:
 *                 type: string
 *                 description: ID of the app
 *               jsonReport:
 *                 type: object
 *                 description: JSON report data
 *     responses:
 *       200:
 *         description: JSON report inserted successfully
 *       500:
 *         description: Failed to insert JSON report
 */
router.post('/savejson', mobsfController.insertJsonReport);

/**
 * @swagger
 * /mobsf/getjsonreport:
 *   get:
 *     summary: Get JSON report
 *     tags: [MobSF]
 *     parameters:
 *       - in: query
 *         name: app_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the app
 *     responses:
 *       200:
 *         description: Pre-signed URL generated successfully
 *       404:
 *         description: No JSON report found
 *       500:
 *         description: Failed to fetch JSON report
 */
router.get('/getjsonreport', mobsfController.getjsonReport);

module.exports = router;
