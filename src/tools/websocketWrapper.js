
function WebSocketWrapper(server) {
  const WebSocketServer = require('websocket').server;
  var wss;
  var socketArray = [];
  var callbackArray = [];

  wss = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false
  });

  // start of receive and callback
  wss.on('request', function (request) {
    var connection = request.accept('hclab-protocol', request.origin);

    connection.on('message', (message) => {
      var incoming = JSON.parse(message.utf8Data);
      if (incoming.req) {
        returnCallback('general', incoming, connection);
      }
      else if (incoming.conf) {
        returnCallback(incoming.connectorSerial, incoming, null);
      }
      else {
        console.log('wss:incoming: no req, no conf. wtf?');
      }
    });

    connection.on('close', () => {
      //removeConnection(connection)
    });

  });

  showAllConnections = function (comment) {
    socketArray.forEach((entry) => {
      console.log('wss:showAllConnections: ' + entry.id);
    });
  }

  storeConnection = function (connectorSerial, connection) {
    var found = socketArray.find(({ id }) => id == connectorSerial);
    if (!found || found.conn.socket.readyState > 1) {
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
      enlistCallback(connectorSerial, (result) => {
        delistCallback(connectorSerial);
        resolve(result);
      });
    });
  }

  enlistCallback = function (connectorSerial, callback) {
    var cb = { id: connectorSerial, callback: callback };
    callbackArray.push(cb);
  }

  returnCallback = function (connectorSerial, param1, param2) {
    var found = callbackArray.find(({ id }) => id == connectorSerial);
    if (!found) {
      console.log('wss:returnCallback: returncallback weve got problem.');
      return;
    }
    if (param2) {
      found.callback(param1, param2);
    }
    else {
      found.callback(param1);
    }
  }
  delistCallback = function (connectorSerial) {
    //var index = callbackArray.indexOf(({ id }) => id == String(connectorSerial));
    var index = callbackArray.findIndex(i => i.id == connectorSerial);
    if (index >= 0) {
      callbackArray.splice(index, 1);
    }
    else {
      console.error('wss:delistCallback: delist weve got a problem. index: ' + index);
    }

  }

  const websocketWrapper = {
    storeConnection,
    removeConnection,
    sendTo,
    sendAndReceive,
    enlistCallback,
    delistCallback,
    showAllConnections
  }
  return websocketWrapper;
}

module.exports = WebSocketWrapper;