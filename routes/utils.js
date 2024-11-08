const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /api/status:
 *   get:
 *     summary: Retorna o status da API
 *     responses:
 *       200:
 *         description: Status da API
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 */
router.get('/status', (req, res) => {
    res.json({ status: 'Ok' });
});

module.exports = router;
