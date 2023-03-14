const wss = require('../tools/websocketWrapper');
const controller = require('./apiController');

function wsRouter() {

  wss.enlistCallback('general', controller.wsReq);
  
}

module.exports = wsRouter;