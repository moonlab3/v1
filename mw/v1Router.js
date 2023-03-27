const express = require('express');

var V1RouterWrapper = function (server) {
  var router = express.Router();
  const controller = require('./apiController')(server);

  router.get('/hscan/:connectorSerial/user/:userId', controller.hscanLoggedIn);
  router.put('/hscan/:connectorSerial/user/:userId/action/:action', controller.hscanAction);

  router.get('/user/:userId/status', controller.userStatus);
  router.get('/user/:userId/history', controller.userHistory);
  router.get('/user/:userId/favorite', controller.userFavo);

  router.get('/cp/:chargePointId', controller.cpGet);
  router.put('/cp/:chargePointId/action/:action', controller.cpPut);

  router.get('/host/:userId', controller.hostGet);
  return router;
}

module.exports = V1RouterWrapper;