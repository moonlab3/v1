// websocket wrapper for charge point communication.

function WebSocketWrapper(server) {
  const WebSocketServer = require('websocket').server;
  var wss;
  var socketArray = [];
  var forwardingArray = [];

  wss = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false
  });

  wss.on('request', function (request) {
    var connection = request.accept('hclab-protocol', request.origin);

    connection.on('message', (message) => {

      try {
        var incoming = JSON.parse(message.utf8Data);
        var parsed = { messageType: incoming[0], action: incoming[1], pdu: incoming[2] };
        if (parsed.messageType < 2 || parsed.messageType > 4) {
          console.log('websocket server: message is not valid. (messageType: 2, 3 or 4)');
          return;
        }
      } catch (e) {
        console.log('websocket server: message is not valid');
        return;
      }
      switch (parsed.messageType) {
        case 2:
          if(parsed.action == 'BootNotification') {
            storeConnection(request.origin, connection, true);
            forwardTo('boot', parsed, request.origin);
          }
          else {
            forwardTo('general', parsed, request.origin);
          }
          break;
        case 3:
          forwardTo(request.origin, parsed, null);
          break;
        case 4:
          break;
      }

    });

    connection.on('close', () => {
      console.log('connection close is called');
      //removeConnection(connection)
    });

  });

  showAllForwards = () => {
    forwardingArray.forEach((entry) => {
      console.log('showAllConnections: ' + entry.origin );
    });
  }
  showAllConnections = () => {
    socketArray.forEach((entry) => {
      console.log('showAllConnections: ' + entry.origin );
    });
  }

  ////////////////////////////////////////////
  // unique ID for identifying evse
  // not IP. It's constantly changing. not every hour tho
  // JSTech will cover this up. 
  storeConnection = function (origin, connection, forceRemove) {
    var found = socketArray.find( i  => i.origin == origin);
    if (!found || found.conn.socket.readyState > 1 || forceRemove) {
      removeConnection(origin);
      var sock = { origin: `${origin}`, conn: connection };
      socketArray.push(sock);
      //console.log(`store connection:  ${JSON.stringify(sock)}`);
    }
  }

  removeConnection = function (origin) {
    var index = socketArray.findIndex(i => i.origin == origin);
    if (index >= 0) {
      socketArray[index].conn.close();
      socketArray.splice(index, 1);
    }

  }

  sendTo = function (origin, data) {
    //console.log(`websocketWrapper:sendTo: ${JSON.stringify(data)}`);
    var sending = [data.messageType, data.action, data.pdu];
    console.log('sending: ' + JSON.stringify(sending));

    var found = socketArray.find(i => i.origin == origin);
    if (found) {
      found.conn.send(JSON.stringify(sending));
      return true;
    }
    else {
      console.warn(`wss:sendTo: No such client. ${origin} needs rebooting.`);
      return false;
    }
  }

  sendAndReceive = function (origin, data) {
    sendTo(origin, data);
    return new Promise((resolve, reject) => {
      enlistForwarding(origin, (result) => {
        delistForwarding(origin);
        resolve(result);
      });
    });
  }

  enlistForwarding = function (origin, callback) {
    var cb = { origin: origin, forward: callback };
    forwardingArray.push(cb);
  }

  forwardTo = function (origin, param1, param2) {
    var found = forwardingArray.find( i => i.origin == origin);
    if (!found) {
      console.log('wss:forwardTo: forwardTo weve got problem.');
      return;
    }
    if (param2) {
      found.forward(param1, param2);
    }
    else {
      found.forward(param1);
    }
  }
  delistForwarding = function (origin) {
    var index = forwardingArray.findIndex(i => i.origin == origin);
    if (index >= 0) {
      forwardingArray.splice(index, 1);
    }
    else {
      console.error('wss:delistForwarding: delist weve got a problem. index: ' + index);
    }

  }

  const websocketWrapper = {
    storeConnection,
    removeConnection,
    sendTo,
    sendAndReceive,
    enlistForwarding,
    delistForwarding,
    showAllConnections,
    showAllForwards
  }
  return websocketWrapper;
}

module.exports = WebSocketWrapper;