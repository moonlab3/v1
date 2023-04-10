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
    console.log('usage: wstest.js {target} {connector} {connectorId} {user}');
    process.exit();
  }

  if(target == 'local') {
    client.connect('wss://127.0.0.1:3001/', 'hclab-protocol');
  }
  else if(target == 'aws') {
    client.connect('wss://34.207.158.106:3001/', 'hclab-protocol');
  }
  else if (target == 'mac') {
    client.connect('wss://10.20.20.28:3001', 'hclab-protocol');
  }
  else {
    console.log('usage: wstest.js {target} {connector} {connectorId} {user}');
    process.exit();
  }
}
keyin();

client.on('connect', (connection) => {
  var repeatCount = 0;
  var connser = process.argv[3];
  var connid = process.argv[4];
  var user = process.argv[5];

  connection.send(`{"req":"BootNotification", "connectorSerial":"${connser}", 
        "pdu":{"chargePointModel":"hcLab1", "chargePointVendor": "test", "chargePointId": 1111}}`);
        /////////////////////////////////////////////// check cpID and connectorSerial
  
  var stdin = process.openStdin();
  stdin.on('data', (input) => {
    switch (String(input)) {
      case 'list\n':
        console.log('auth heart start stop avail reserve meter show res accept reject repeat');
      case 'auth\n':
        connection.send(`{"req":"Authorize", "connectorSerial": "${connser}", "pdu":{"idTag":"${user}"}}`);
        break;
      case 'heart\n':
        connection.send(`{"req":"HeartBeat", "connectorSerial":"${connser}", "pdu":{}}`);
        break;
      case 'start\n':
        connection.send(`{"req":"StartTransaction", "connectorSerial":"${connser}", "pdu":{"connectorId":3, 
                          "idTag":"${user}", "meterStart": 234, "timeStamp": ${Date.now()}, "bulkSoc": 12.1, "fullSoc": 72.7 }}`);
        break;
      case 'stop\n':
        connection.send(`{"req":"StopTransaction", "connectorSerial":"${connser}", "pdu":{"transactionId":9983, 
                          "meterStop":393, "timeStamp": ${Date.now()}, "reason": "whatever"}}`);
        break;
      case 'avail\n':
        connection.send(`{"req":"StatusNotification", "connectorSerial":"${connser}", "pdu":{"connectorId":${connid},
                          "errorCode":"error001", "status":"Available", "timeStamp": ${Date.now()}}}`);
        break;
      case 'reserve\n':
        connection.send(`{"req":"StatusNotification", "connectorSerial":"${connser}", "pdu":{"connectorId":2,
                         "errorCode":"error001", "status":"Reserved", "timeStamp": ${Date.now()}}}`);
        break;
      case 'meter\n':
        connection.send(`{"req": "MeterValues", "connectorSerial": "${connser}", "pdu": { "connectorId": ${connid}, 
                        "meterValue": {"timeStamp": "${Date.now()}", "transactionId": 123, "sampledValue": {"value":383.2}}}}`);
        break;
      case 'show\n':
        connection.send(`{"req":"ShowArray", "connectorSerial":"${connser}", "pdu":{}}`);
        break;
      case 'res\n':
        connection.send(`{"conf":"RemoteWhatever", "connectorSerial":"${connser}", "pdu":{}}`);
        break;
      case 'accept\n':
        connection.send(`{"conf":"RemoteStartTransaction", "connectorSerial":"${connser}", "pdu":{"status":"Accepted"}}`);
        break;
      case 'reject\n':
        connection.send(`{"conf":"RemoteStartTransaction", "connectorSerial":"${connser}", "pdu":{"status":"Rejected"}}`);
        break;
      case 'repeat\n':
        repeatCount = 0;
        repeat();
        break;
      case 'quit\n':
        connection.send(`{"req":"Quit", "connectorSerial":"${connser}", "pdu":{}}`);
        process.exit();
    }

    function repeat() {
      if (repeatCount < 10)
        setTimeout(repeat, 1000);
      connection.send(`{"req":"HeartBeat", "connectorSerial":"${connser}", "pdu":{}}`);
      repeatCount++;
    }

  });


  connection.on('message', (message) => {
    console.log('rcved: ' + JSON.stringify(message.utf8Data));
    var response = JSON.parse(message.utf8Data);
    if(response.pdu?.idTagInfo)
      console.log('idTagInfo: ' + JSON.stringify(response.pdu.idTagInfo));
    if(response?.connectorSerial)
      console.log('connectorSerial: ' + JSON.stringify(response.connectorSerial));
    if(response.pdu?.status)
      console.log('status: ' + JSON.stringify(response.pdu.status));
    if(response.pdu?.connectorId)
      console.log('connectorId: ' + JSON.stringify(response.pdu.connectorId));
    if(response.pdu?.transactionId)
      console.log('transactionId: ' + JSON.stringify(response.pdu.transactionId));
    if(response.pdu?.currentTime)
      console.log('currentTime: ' + Date(response.pdu.currentTime));

  });


});
