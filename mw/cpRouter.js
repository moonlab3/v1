
const express = require('express');
const router = express.Router();
const controller = require('./apiController');


router.get('/', controller.cpGet);
router.get('/:chargePointId', controller.cpGet, controller.afterWork);
router.put('/:chargePointId/action/:action', controller.cpPut, controller.afterWork);

module.exports = router;