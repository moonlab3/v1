const express = require('express');
const router = express.Router();
const controller = require('./apiController');

router.get('/:connectorSerial/user/:userId', controller.hscanGet, controller.afterWork);
router.put('/:connectorSerial/user/:userId/action/:action', controller.hscanPut, controller.afterWork);


module.exports = router;