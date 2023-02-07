var WebSocketServer = require('websocket').server;
var wss;
var socketArray = [];


initServer = function(server) {
  wss = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false
  });
}

getServer = function() {
  return wss;
}

storeSocket = function(connectorSerial, connection) {
  var found = socketArray.find(({id}) => id == connectorSerial);
  if(!found || found.conn.socket.readyState > 1) {
    this.removeSocket(connectorSerial);
    var sock = { id: `${connectorSerial}`, conn: connection };
    socketArray.push(sock);
    console.log(`pushed into websocket array: ${connection.remoteAddresses}`);
  }
}

removeSocket = function(connectorSerial) {
  var index = socketArray.indexOf(({ id }) => id == connectorSerial);
  if (index > 0) {
    socketArray[index].conn.close();
    socketArray.splice(index, 1);
  }

}

//sendTo = function(connectorSerial, connection, obj) {
sendTo = function(connectorSerial, connection, type, obj) {
  var buffer = makeBuffer(type, obj);
  if(connectorSerial == '') {
    connection.send(buffer);
  }
  else {
    var found = socketArray.find(({ id }) => id == connectorSerial);
    if (found) {
      found.conn.send(String(data));
      return true;
    }
    else {
      console.log(`No such client. ${connectorSerial} needs rebooting.`);
      return false;
    }
  }

}

makeBuffer = function(type, obj) {
  var buffer = `{"${type}": "${obj.req}", "pdu": {  `;
  var pdu = obj.pdu;
  if(pdu.idTagInfo)
    buffer += `"idTagInfo": {"status": "${pdu.idTagInfo.status}"}, `;
  if(pdu.status)
    buffer += `"status": "${pdu.status}", `;
  if(pdu.connectorSerial)
    buffer += `"connectorSerial": "${pdu.connectorSerial}", `;
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
  console.log('sending ' + buffer + 'length:' + buffer.length);
  return buffer;
}

module.exports = {
  initServer: initServer,
  getServer: getServer,
  storeSocket: storeSocket,
  removeSocket: removeSocket,
  sendTo: sendTo
}
