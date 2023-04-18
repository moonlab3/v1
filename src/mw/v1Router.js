const express = require('express');

var V1RouterWrapper = function (server) {
  var router = express.Router();
  const controller = require('./apiController')(server);

  router.get('/hscan/:connectorSerial', controller.hscanNotLoggedIn);
  router.get('/hscan/:connectorSerial/user/:userId', controller.hscanLoggedIn);
  router.put('/hscan/:connectorSerial/user/:userId/action/:action', controller.waitAndGo, controller.hscanAction);
  // hscan action is in one funtion
  // user related apis are divided in several functions
  // why? just for fun
  // JK. Which one looks better? which one is more efficient or productive?


  router.get('/user/:userId/status', controller.userStatus);
  router.get('/user/:userId/history', controller.userHistory);
  router.get('/user/:userId/favorite', controller.userFavo);
  router.get('/user/:userId/recent', controller.userRecent);

  router.get('/cp/:chargePointId', controller.cpGet);
  router.put('/cp/:chargePointId/action/:action', controller.cpPut);

  router.get('/host/:userId', controller.hostGet);
  return router;
}

module.exports = V1RouterWrapper;