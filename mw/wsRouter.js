const wsServer = require('../tools/wsServer');
const controller = require('./apiController');

function wsRouter() {
  //var wss = wsServer.getServer();

  wsServer.enlistCallback('general', controller.wsReq);
  
  /*
  wss.on('request', function (request) {
    var connection = request.accept('hclab-protocol', request.origin);

    connection.on('message', (message) => {
      var incoming = JSON.parse(message.utf8Data);
      console.log('wsRouter received: ' + String(incoming));
      if (incoming.req) {
        controller.cpReq(incoming, connection);
        controller.afterWork(incoming, connection);
      }
      else if (incoming.conf) {
        controller.cpConf(incoming, connection);
      }
    });

    connection.on('close', () => {

    });

  });
  */

}

module.exports = wsRouter;