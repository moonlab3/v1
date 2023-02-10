const wsServer = require('../tools/wsServer');
const controller = require('./apiController');

function wsRouter() {
  var wss = wsServer.getServer();
  
  wss.on('request', function (request) {
    var connection = request.accept('hclab-protocol', request.origin);

    //console.log(`conn.socket: ${connection.socket}`);
    //console.log(`conn.remoteaddress: ${connection.remoteAddress}`);
    //console.log(`conn.socket.readyState: ${connection.socket.readyState}`);
    connection.on('message', (message) => {
      var incoming = JSON.parse(message.utf8Data);
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

}

module.exports = wsRouter;