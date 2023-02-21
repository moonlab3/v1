// websocket server with OCPP 1.6 protocol

const { createConnection } = require('mysql');

var WebSocketServer = require('websocket').server;
var wss;
var socketArray = [];
var callbackArray = [];


initServer = function(server) {
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
        //console.log('incoming request');
        returnCallback('general', incoming, connection);
      }
      else if (incoming.conf) {
        //console.log('incoming confirmation');
        returnCallback(incoming.connectorSerial, incoming, null);
      }
      else {
        console.log('wsServer::no req, no conf. wtf?');
      }
    });

    connection.on('close', () => {
      //removeSocket(connection)

    });

  });

  // end of receive and callback
}

getServer = function() {
  return wss;
}

showAllArray = function(comment) {
  //console.log(comment + ' done. registered clinets are below.')
  socketArray.forEach((entry) => {
    console.log(entry.id);
  })
}

storeSocket = function(connectorSerial, connection) {
  var found = socketArray.find(({id}) => id == connectorSerial);
  if(!found || found.conn.socket.readyState > 1) {
    removeSocket(connectorSerial);
    var sock = { id: `${connectorSerial}`, conn: connection };
    socketArray.push(sock);
    //showAllArray('push');
    //console.debug(`pushed into websocket array: ${connection.remoteAddresses}`);
  }
}

removeSocket = function(connectorSerial) {
  //var index = socketArray.indexOf(({ id }) => id == String(connectorSerial));
  var index = socketArray.findIndex(i => i.id == connectorSerial);
  //console.log(`removesocket "${connectorSerial}" index: ${index}`);
  if (index >= 0) {
    socketArray[index].conn.close();
    socketArray.splice(index, 1);
  }
  //showAllArray('pop');

}

send = function(connectorSerial, connection, obj) {

  var data;
  if(obj.req)
    data = makeBuffer('conf', obj);
  else
    data = makeBuffer('req', obj);

  if(connectorSerial == '') {
    connection.send(data);
  }
  else {
    var found = socketArray.find(({ id }) => id == connectorSerial);
    if (found) {
      found.conn.send(String(data));
      return true;
    }
    else {
      console.warn(`No such client. ${connectorSerial} needs rebooting.`);
      return false;
    }
  }

}

sendAndReceive = function(connectorSerial, req) {
  return new Promise((resolve, reject) => {
    send(connectorSerial, null, req);
    enlistCallback(connectorSerial, (result) => {
      //console.log('response received::::' + JSON.stringify(result));
      resolve(result);
    });
    //console.log('here we are');
    //delistCallback(connectorSerial);
  });
}

enlistCallback = function(connectorSerial, callback) {
  var cb = { id: connectorSerial, callback: callback };
  callbackArray.push(cb);
  /*
  console.log('callback listed ');
  callbackArray.forEach((entry) => {
    console.log(`"${entry.id}"`);
  });
  */
}

returnCallback = function(connectorSerial, param1, param2) {
    var found = callbackArray.find(({ id }) => id == connectorSerial);
    if(!found) {
      console.log('returncallback weve got problem.');
    }
    if(param2) {
      //console.log('return with two param:' + JSON.stringify(param1));
      found.callback(param1, param2);
    }
    else {
      //console.log('return with one param:' + JSON.stringify(param1));
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

makeBuffer = function(type, obj) {
  var buffer = `{"${type}": "${obj.req}", "connectorSerial": "${obj.connectorSerial}", "pdu": {  `;
  var pdu = obj.pdu;
  if(pdu.idTagInfo)
    buffer += `"idTagInfo": {"status": "${pdu.idTagInfo.status}"}, `;
  if(pdu.status)
    buffer += `"status": "${pdu.status}", `;
  if(pdu.connectorId)
    buffer += `"connectorId": "${pdu.connectorId}", `;
  if(pdu.currentTime)
    buffer += `"currentTime": ${pdu.currentTime}, `;
  if(pdu.interval)
    buffer += `"interval": ${pdu.interval}, `;
  if(pdu.transactionId)
    buffer += `"transactionId": ${pdu.transactionId}, `;
  if(pdu.type)
    buffer += `"type": "${pdu.type}", `;
  if(pdu.key)
    buffer += `"key": "${pdu.key}", `;
  if(pdu.value)
    buffer += `"value": "${pdu.value}", `;
  if(pdu.vendorId)
    buffer += `"vendorId": "${pdu.vendorId}", `;
  if(pdu.data)
    buffer += `"data": "${pdu.data}", `;
  if(pdu.color)
    buffer += `"color": "${pdu.color}", `;

  buffer = buffer.slice(0, buffer.length - 2) + `}}`;
  //console.debug('sending ' + buffer + 'length:' + buffer.length);
  return buffer;
}

module.exports = {
  initServer: initServer,
  getServer: getServer,
  storeSocket: storeSocket,
  removeSocket: removeSocket,
  send: send,
  sendAndReceive: sendAndReceive,
  enlistCallback: enlistCallback,
  delistCallback: delistCallback,
  showAllArray: showAllArray
}
