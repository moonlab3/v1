
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
        if (!incoming.req && !incoming.conf) {
          console.log('websocket server: message is not valid for this system');
          return;
        }
      } catch (e) {
        console.log('websocket server: message is not valid json format');
        return;
      }

      if (incoming.req) {
        forwardTo('general', incoming, connection);
      }
      else if (incoming.conf) {
        forwardTo(incoming.connectorSerial, incoming, null);
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

  storeConnection = function (connectorSerial, connection, forceRemove) {
    var found = socketArray.find(({ id }) => id == connectorSerial);
    if (!found || found.conn.socket.readyState > 1 || forceRemove) {
      removeConnection(connectorSerial);
      var sock = { id: `${connectorSerial}`, conn: connection };
      socketArray.push(sock);
    }
  }

  removeConnection = function (connectorSerial) {
    var index = socketArray.findIndex(i => i.id == connectorSerial);
    if (index >= 0) {
      socketArray[index].conn.close();
      socketArray.splice(index, 1);
    }

  }

  sendTo = function (connectorSerial, connection, data) {
    //console.log(`websocketWrapper:sendTo: ${JSON.stringify(data)}`);
    if (connectorSerial == '') {
      connection.send(JSON.stringify(data));
    }
    else {
      var found = socketArray.find(({ id }) => id == connectorSerial);
      if (found) {
        found.conn.send(JSON.stringify(data));
        return true;
      }
      else {
        console.warn(`wss:sendTo: No such client. ${connectorSerial} needs rebooting.`);
        return false;
      }
    }
  }

  sendAndReceive = function (connectorSerial, data) {
    sendTo(connectorSerial, null, data);
    return new Promise((resolve, reject) => {
      enlistForwarding(connectorSerial, (result) => {
        delistForwarding(connectorSerial);
        resolve(result);
      });
    });
  }

  enlistForwarding = function (connectorSerial, callback) {
    var cb = { id: connectorSerial, forward: callback };
    forwardingArray.push(cb);
  }

  forwardTo = function (connectorSerial, param1, param2) {
    var found = forwardingArray.find(({ id }) => id == connectorSerial);
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
  delistForwarding = function (connectorSerial) {
    //var index = forwardingArray.indexOf(({ id }) => id == String(connectorSerial));
    var index = forwardingArray.findIndex(i => i.id == connectorSerial);
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