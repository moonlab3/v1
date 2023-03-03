
const express = require('express');
const router = express.Router();
const controller = require('./apiController');

router.get('/:userId', controller.hostGet);

module.exports = router;