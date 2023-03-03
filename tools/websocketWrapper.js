// websocket server with OCPP 1.6 protocol
const ocppHandler = require('./ocppHandler');

const WebSocketServer = require('websocket').server;
var wss;
var socketArray = [];
var callbackArray = [];

init= function(server) {
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
        console.log('wss::no req, no conf. wtf?');
      }
    });

    connection.on('close', () => {
      //removeConnection(connection)
    });

  });
  // end of receive and callback
}

getServer = function() {
  return wss;
}

showAllConnections = function(comment) {
  //console.log(comment + ' done. registered clinets are below.')
  socketArray.forEach((entry) => {
    console.log(entry.id);
  })
}

storeConnection = function(connectorSerial, connection) {
  var found = socketArray.find(({id}) => id == connectorSerial);
  if(!found || found.conn.socket.readyState > 1) {
    removeConnection(connectorSerial);
    var sock = { id: `${connectorSerial}`, conn: connection };
    socketArray.push(sock);
    //showAllConnections('push');
    //console.debug(`pushed into websocket array: ${connection.remoteAddresses}`);
  }
}

removeConnection = function(connectorSerial) {
  var index = socketArray.findIndex(i => i.id == connectorSerial);
  //console.log(`removeConnection "${connectorSerial}" index: ${index}`);
  if (index >= 0) {
    socketArray[index].conn.close();
    socketArray.splice(index, 1);
  }

}

send = function(connectorSerial, connection, data) {
    
  if(connectorSerial == '') {
    connection.send(ocppHandler.format('conf', data));
  }
  else {
    var found = socketArray.find(({ id }) => id == connectorSerial);
    if (found) {
      found.conn.send(ocppHandler.format('conf', data));
      return true;
    }
    else {
      console.warn(`No such client. ${connectorSerial} needs rebooting.`);
      return false;
    }
  }

}

sendAndReceive = function(connectorSerial, data) {
  return new Promise((resolve, reject) => {
    send(connectorSerial, null, ocppHandler.format('req', data));
    enlistCallback(connectorSerial, (result) => {
      //console.log('response received::::' + JSON.stringify(result));
      delistCallback(connectorSerial);
      resolve(result);
    });
  });
}

enlistCallback = function(connectorSerial, callback) {
  var cb = { id: connectorSerial, callback: callback };
  callbackArray.push(cb);
}

returnCallback = function(connectorSerial, param1, param2) {
    var found = callbackArray.find(({ id }) => id == connectorSerial);
    if(!found) {
      console.log('returncallback weve got problem.');
    }
    if(param2) {
      found.callback(param1, param2);
    }
    else {
      found.callback(param1);
    }
}
delistCallback = function(connectorSerial) {
  //var index = callbackArray.indexOf(({ id }) => id == String(connectorSerial));
  var index = callbackArray.findIndex(i => i.id == connectorSerial);
  //console.log(`delist "${connectorSerial}" index: ${index}`);
  if (index >= 0) {
    callbackArray.splice(index, 1);
  }
  else {
    console.error('delist weve got a problem. index: ' + index);
  }

}


module.exports = {
  init: init,
  getServer: getServer,
  storeConnection: storeConnection,
  removeConnection: removeConnection,
  send: send,
  sendAndReceive: sendAndReceive,
  enlistCallback: enlistCallback,
  delistCallback: delistCallback,
  showAllConnections: showAllConnections
}
