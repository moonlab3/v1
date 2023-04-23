
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
      console.log(JSON.stringify(connection.socket._peername));
      try {
        var incoming = JSON.parse(message.utf8Data);
        if (!incoming.messageType) {
          console.log('websocket server: message is not valid for this system');
          return;
        }
      } catch (e) {
        console.log('websocket server: message is not valid json format');
        return;
      }

      if (incoming.messageType == 2) {
        forwardTo('general', incoming, connection);
      }
      else if (incoming.messageType == 3) {
        forwardTo(incoming.evseSerial, incoming, null);
      }
      else {
        console.log('wss:incoming: no req, no conf. wtf?');
      }
    });

    connection.on('close', () => {
      //removeConnection(connection)
    });

  });

  showAllConnections = function () {
    socketArray.forEach((entry) => {
      console.log('wss:showAllConnections: ' + entry.id);
    });
  }

  storeConnection = function (evseSerial, connection, forceRemove) {
    var found = socketArray.find(({ id }) => id == evseSerial);
    if (!found || found.conn.socket.readyState > 1 || forceRemove) {
      removeConnection(evseSerial);
      var sock = { id: `${evseSerial}`, conn: connection };
      socketArray.push(sock);
    }
  }

  removeConnection = function (evseSerial) {
    var index = socketArray.findIndex(i => i.id == evseSerial);
    if (index >= 0) {
      socketArray[index].conn.close();
      socketArray.splice(index, 1);
    }

  }

  sendTo = function (evseSerial, connection, data) {
    //console.log(`websocketWrapper:sendTo: ${JSON.stringify(data)}`);
    if (evseSerial == '') {
      connection.send(JSON.stringify(data));
    }
    else {
      var found = socketArray.find(({ id }) => id == evseSerial);
      if (found) {
        found.conn.send(JSON.stringify(data));
        return true;
      }
      else {
        console.warn(`wss:sendTo: No such client. ${evseSerial} needs rebooting.`);
        return false;
      }
    }
  }

  sendAndReceive = function (evseSerial, data) {
    sendTo(evseSerial, null, data);
    return new Promise((resolve, reject) => {
      enlistForwarding(evseSerial, (result) => {
        delistForwarding(evseSerial);
        resolve(result);
      });
    });
  }

  enlistForwarding = function (evseSerial, callback) {
    var cb = { id: evseSerial, forward: callback };
    forwardingArray.push(cb);
  }

  forwardTo = function (evseSerial, param1, param2) {
    var found = forwardingArray.find(({ id }) => id == evseSerial);
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
  delistForwarding = function (evseSerial) {
    //var index = forwardingArray.indexOf(({ id }) => id == String(evseSerial));
    var index = forwardingArray.findIndex(i => i.id == evseSerial);
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
    showAllConnections
  }
  return websocketWrapper;
}

module.exports = WebSocketWrapper;