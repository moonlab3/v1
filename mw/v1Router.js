const express = require('express');
const router = express.Router();
const controller = require('./apiController');

router.get('/hscan/:connectorSerial', controller.hscanNotLoggedIn)
router.get('/hscan/:connectorSerial/user/:userId', controller.hscanLoggedIn);
router.put('/hscan/:connectorSerial/user/:userId/action/:action', controller.hscanAction);

router.get('/user/:userId/status', controller.userStatus);
router.get('/user/:userId/history', controller.userHistory);
router.get('/user/:userId/favorite', controller.userFavo);

router.get('/cp/:chargePointId', controller.cpGet);
router.put('/cp/:chargePointId/action/:action', controller.cpPut);

router.get('/host/:userId', controller.hostGet);

module.exports = router;