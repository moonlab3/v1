const express = require('express');
const router = express.Router();
const controller = require('./apiController');

router.get('/:connectorSerial', controller.hscanNotLoggedIn)
router.get('/:connectorSerial/user/:userId', controller.hscanLoggedIn, controller.afterWork);
router.put('/:connectorSerial/user/:userId/action/:action', controller.hscanAction, controller.afterWork);


module.exports = router;