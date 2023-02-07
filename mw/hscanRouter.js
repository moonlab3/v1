const express = require('express');
const router = express.Router();
const controller = require('./apiController');

router.get('/', controller.hscanPut, controller.afterWork);      // for Test
router.get('/connector/:connectorSerial/user/:userId', controller.hscanGet, controller.afterWork);
router.put('/connector/:connectorSerial/user/:userId/action/:action', controller.hscanPut, controller.afterWork);

module.exports = router;