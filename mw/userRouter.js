const express = require('express');
const router = express.Router();
const controller = require('./apiController');

/*
router.get('/login/:userId', controller.hscanPut, controller.afterWork);      // for Test
//router.put('/signup', controller.hscanPut, controller.afterWork);      // for Test
router.put('/card/:userId', controller.hscanPut, controller.afterWork);
router.get('/favorite/:userId', controller.hscanGet);
router.put('/favorite/:userId/cp/:cpName', controller.hscanPut);
router.put('/favorite/:userId/cp/:cpId', controller.hscanPut);

router.get('/status/:userId', controller.hscanGet);
router.get('/history/:userId', controller.hscanGet);
*/


router.get('/login/:userId', controller.hscanPut, controller.afterWork);      // for Test
router.put('/signup', controller.cpGet);

module.exports = router;
