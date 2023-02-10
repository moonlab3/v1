var wsClient = require('websocket').client;

var client = new wsClient();

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

client.on('connectFailed', function(error) {
  console.log('Connect Error' + error.toString());
});
function keyin() {
  var target = process.argv[2];
  var connser = process.argv[3];

  if (target == '' || connser == '') {
    console.log('usage: wstest.js {target} {connector} {user}');
    process.exit();
  }

  if(target == 'local') {
    client.connect('wss://127.0.0.1:3001/', 'hclab-protocol');
  }
  else {
    client.connect('wss://54.163.188.194:3001/', 'hclab-protocol');
  }
}
keyin();

client.on('connect', (connection) => {
  var connser = process.argv[3];
  var user = process.argv[4];

  connection.send(`{"req":"BootNotification", "pdu":{"connectorSerial":"${connser}", "chargePointModel":"hcLab001"}}`);
  
  var stdin = process.openStdin();
  stdin.on('data', (input) => {
    if(input == 'quit\n') {
      connection.close();
      process.exit();
    }
    switch (String(input)) {
      case 'auth\n':
        connection.send(`{"req":"Authorize", "pdu":{"idTag":"${user}"}}`);
        break;
      case 'heart\n':
        connection.send(`{"req":"HeartBeat", "pdu":{"connectorSerial":"${connser}"}}`);
        break;
      case 'start\n':
        connection.send(`{"req":"StartTransaction", "pdu":{"connectorId":3, "connectorSerial":"${connser}", 
                          "idTag":"${user}", "meterStart": 234, "timeStamp": ${Date.now()}, "bulkSoc": 234}}`);
        break;
      case 'stop\n':
        connection.send(`{"req":"StopTransaction", "pdu":{"connectorSerial":"${connser}", "transactionId":9983, 
                          "meterStop":393, "timeStamp": ${Date.now()}, "reason": "whatever"}}`);
        break;
      case 'status\n':
        connection.send(`{"req":"StatusNotification", "pdu":{"connectorId":2, "connectorSerial":"${connser}",
                          "errorCode":"error001", "status":"Charging", "timeStamp": ${Date.now()}}}`);
        break;
      case 'meter\n':
        connection.send(`{"req": "MeterValues", "pdu": { "connectorId": 2, "connectorSerial": "${connser}", 
                        "meterValue": {"timeStamp": "${Date.now()}", "transactionId": 123, "sampledValue": {"value":383.2}}}}`);
        break;
      case 'show\n':
        connection.send(`{"req":"ShowArray", "pdu":{"connectorSerial":"${connser}"}}`);
        break;
    }

  });
  connection.on('message', (message) => {
    console.log('rcved: ' + JSON.stringify(message.utf8Data));
    var pdu = JSON.parse(message.utf8Data).pdu;
    if(pdu.idTagInfo)
      console.log('idTagInfo: ' + JSON.stringify(pdu.idTagInfo));
    if(pdu.connectorSerial)
      console.log('connectorSerial: ' + JSON.stringify(pdu.connectorSerial));
    if(pdu.status)
      console.log('status: ' + JSON.stringify(pdu.status));
    if(pdu.connectorId)
      console.log('connectorId: ' + JSON.stringify(pdu.connectorId));
    if(pdu.transactionId)
      console.log('transactionId: ' + JSON.stringify(pdu.transactionId));
    if(pdu.currentTime)
      console.log('currentTime: ' + Date(pdu.currentTime));

  });


});
