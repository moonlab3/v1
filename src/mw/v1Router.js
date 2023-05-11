const express = require('express');

var V1RouterWrapper = function (server) {
  var router = express.Router();
  const controller = require('./apiController')(server);

  router.get('/hscan', controller.waitAndGo, controller.hscanAction, controller.writeResponse);
  //parameters: userid, evseserial, action

  // hscan action is in one funtion
  // user related apis are divided in several functions
  // why? just for fun
  // JK. Which one looks better? which one is more efficient or productive?

  router.get('/user/chargingstatus', controller.getUserChargingStatus, controller.writeResponse); // parameters: userid
  router.get('/user/history', controller.getUserChargingHistory, controller.writeResponse);       // parameters: userid, from-date, to-date
  router.get('/user/favorite', controller.getUserFavo, controller.writeResponse);                 // parameters: userid
  router.get('/user/recent', controller.getUserRecentVisit, controller.writeResponse);            // deprecate. use favorite
  router.get('/chargepoint', controller.getChargePointInfo, controller.writeResponse);            // parameters: chargepointid or set of (lat, lng, rng)

  // CSMS (Charging Station Management System) API
  router.get('/host', controller.csmsBasic, controller.writeResponse);                            // parameters: userid
  router.get('/host/report', controller.csmsReport, controller.writeResponse);                    // parameters: userid, from-date, to-date

  router.put('/host', controller.csmsControl, controller.writeResponse);                          // 

  return router;
}

module.exports = V1RouterWrapper;