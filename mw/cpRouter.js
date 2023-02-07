
const express = require('express');
const router = express.Router();
const controller = require('./apiController');


router.get('/', controller.cpGet, controller.afterWork);      // for Test
router.get('/chargepoint/:chargepoint', controller.cpGet, controller.afterWork);
router.put('/chargepoint/:chargepoint/action/:action', controller.cpPut, controller.afterWork);

module.exports = router;