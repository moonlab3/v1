const wss = require('../tools/websocketWrapper');
const controller = require('./apiController');

function wsRouter() {
  //var wss = wsServer.getServer();

  wss.enlistCallback('general', controller.wsReq);
  
}

module.exports = wsRouter;