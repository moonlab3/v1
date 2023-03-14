const express = require('express');
const router = express.Router();
const controller = require('./apiController');

/*
router.get('/login/:userId', controller.hscanPut, controller.afterWork);      // for Test
router.put('/signup', controller.hscanPut, controller.afterWork);      // for Test
router.put('/card/:userId', controller.hscanPut, controller.afterWork);
*/

router.get('/:userId/status', controller.userStatus);
router.get('/:userId/history', controller.userHistory);

router.get('/:userId/favorite', controller.userFavo);

//////////////////////////////////////////
// name or id. choose one
// both?
//router.get('/:userId/favorite/cp/:cpName', controller.userFavo);
//router.put('/:userId/favorite/cp/:cpName', controller.userFavo);

//router.get('/:userId/favorite/cp/:cpId', controller.userFavo);
//router.put('/:userId/favorite/cp/:cpId', controller.userFavo);

module.exports = router;
