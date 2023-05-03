const express = require('express');

var V1RouterWrapper = function (server) {
  var router = express.Router();
  const controller = require('./apiController')(server);

  //router.get('/hscan/:evseSerial/user/:userId', controller.hscanLoggedIn);
  //router.put('/hscan/:evseSerial/user/:userId/action/:action', controller.waitAndGo, controller.hscanAction);
  router.get('/hscan', controller.waitAndGo, controller.hscanAction);

  // hscan action is in one funtion
  // user related apis are divided in several functions
  // why? just for fun
  // JK. Which one looks better? which one is more efficient or productive?


  router.get('/user/chargingstatus', controller.getUserChargingStatus);
  router.get('/user/history', controller.getUserChargingHistory);
  router.get('/user/favorite', controller.getUserFavo);
  router.get('/user/recent', controller.getUserRecentVisit);

  router.get('/chargepoint', controller.getChargePointInfo);
  //router.get('/cp/lat/:lat/lng/:lng/rng/:rng', controller.getChargePointList);

  router.get('/host/:userId', controller.getHostBasic);
  router.get('/host/:userId/detail', controller.getHostDetail);
  return router;
}

module.exports = V1RouterWrapper;