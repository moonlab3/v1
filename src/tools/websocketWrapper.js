
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
    //storeConnection(request.origin, connection, true);

    connection.on('message', (message) => {
      //console.log('request.origin: ' + request.origin);

      try {
        var incoming = JSON.parse(message.utf8Data);
        var parsed = { messageType: incoming[0], action: incoming[1], pdu: incoming[2] };
        if (parsed.messageType < 2 || parsed.messageType > 4) {
          console.log('websocket server: message is not valid for this system');
          return;
        }
      } catch (e) {
        console.log('websocket server: message is not valid json format');
        return;
      }
      switch (parsed.messageType) {
        case 2:
          if(parsed.action == 'BootNotification') {
            //forwardTo('boot', parsed, connection);
            storeConnection(request.origin, connection, true);
            forwardTo('boot', parsed, request.origin);
          }
          else {
            //forwardTo('general', parsed, connection);
            forwardTo('general', parsed, request.origin);
          }
          break;
        case 3:
          //forwardTo(findEVSESerial(connection), parsed, null);
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
      console.log('showAllConnections: ' + entry.evseSerial );
    });
  }
  showAllConnections = () => {
    socketArray.forEach((entry) => {
      console.log('showAllConnections: ' + entry.evseSerial + ' from ' + JSON.stringify(entry.peer));
    });
  }
  findEVSESerial = function(connection) {
    var found = socketArray.find(({ peer }) => peer == connection.socket._peername);
    //console.log('found this: ' + found);
    return found.evseSerial;
  }

  ////////////////////////////////////////////
  // unique ID for identifying evse
  // not IP. It's constantly changing. not every hour tho
  // JSTech will cover this up. 
  storeConnection = function (evseSerial, connection, forceRemove) {
    var found = socketArray.find( i  => i.evseSerial == evseSerial);
    if (!found || found.conn.socket.readyState > 1 || forceRemove) {
      removeConnection(evseSerial);
      //var sock = { evseSerial: `${evseSerial}`, peer: connection.socket._peername, conn: connection };
      var sock = { evseSerial: `${evseSerial}`, conn: connection };
      socketArray.push(sock);
      //console.log(`store connection:  ${JSON.stringify(sock)}`);
    }
  }

  removeConnection = function (evseSerial) {
    var index = socketArray.findIndex(i => i.evseSerial == evseSerial);
    if (index >= 0) {
      socketArray[index].conn.close();
      socketArray.splice(index, 1);
    }

  }

  //sendTo = function (evseSerial, connection, data) {
  sendTo = function (evseSerial, data) {
    //console.log(`websocketWrapper:sendTo: ${JSON.stringify(data)}`);
    var sending = [data.messageType, data.action, data.pdu];
    console.log('sending: ' + JSON.stringify(sending));

    var found = socketArray.find(i => i.evseSerial == evseSerial);
    if (found) {
      found.conn.send(JSON.stringify(sending));
      return true;
    }
    else {
      console.warn(`wss:sendTo: No such client. ${evseSerial} needs rebooting.`);
      return false;
    }
  }

  sendAndReceive = function (evseSerial, data) {
    sendTo(evseSerial, data);
    return new Promise((resolve, reject) => {
      enlistForwarding(evseSerial, (result) => {
        delistForwarding(evseSerial);
        resolve(result);
      });
    });
  }

  enlistForwarding = function (evseSerial, callback) {
    var cb = { evseSerial: evseSerial, forward: callback };
    forwardingArray.push(cb);
  }

  forwardTo = function (evseSerial, param1, param2) {
    var found = forwardingArray.find( i => i.evseSerial == evseSerial);
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
    var index = forwardingArray.findIndex(i => i.evseSerial == evseSerial);
    if (index >= 0) {
      forwardingArray.splice(index, 1);
    }
    else {
      console.error('wss:delistForwarding: delist weve got a problem. index: ' + index);
    }

  }

  const websocketWrapper = {
    storeConnection,
    findEVSESerial,
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