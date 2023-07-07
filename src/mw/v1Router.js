const express = require('express');

var V1RouterWrapper = function (server) {
  var router = express.Router();
  const controller = require('./apiController')(server);
  const auth = require('./auth')();

  // hscan action is in one funtion
  // user related apis are divided in several functions
  // why? just for fun
  // JK. Which one looks better? which one is more efficient or productive?
  router.post('/authentication/sendauthmail', auth.sendAuthMail, controller.writeResponse);
  router.get('/authentication/email', auth.emailAuth, controller.writeResponse);

  router.put('/hscan/scan', controller.waitAndGo, controller.hScan, controller.writeResponse);
  router.put('/hscan/action', controller.waitAndGo, controller.hAction, controller.writeResponse);

  router.post('/hscan/report/:evse', controller.postDamageReport, controller.writeResponse);


  router.get('/user/status/:user', controller.getUserStatus, controller.writeResponse); // parameters: userid
  router.get('/user/chargingstatus/:user', controller.getUserChargingStatus, controller.writeResponse); // parameters: userid
  router.get('/user/history/:user', controller.getUserChargingHistory, controller.writeResponse);       // parameters: userid, from-date, to-date
  router.get('/chargepointlist', controller.getChargePointList, controller.writeResponse);            // parameters: chargepointid or set of (lat, lng, rng)
  router.get('/chargepoint/:cp', controller.getChargePointInfo, controller.writeResponse);            // parameters: chargepointid or set of (lat, lng, rng)

  router.get('/user/favorite/:user', controller.getUserFavo, controller.writeResponse);                 // parameters: userid
  router.get('/user/recent/:user', controller.getUserRecent, controller.writeResponse);                 // parameters: userid
  router.post('/user/favorite', controller.newUserFavo, controller.writeResponse);                 // parameters: userid
  router.delete('/user/favorite', controller.delUserFavo, controller.writeResponse);

  // CSMS (Charging Station Management System) API
  /*    not yet
  router.get('/host/report', controller.csmsReport, controller.writeResponse);                    // parameters: userid, from-date, to-date
  router.get('/host/:userId', controller.csmsBasic, controller.writeResponse);                            // parameters: userid
  router.put('/host', controller.csmsControl, controller.writeResponse);                          // 
  */

  return router;
}

module.exports = V1RouterWrapper;