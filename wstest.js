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
    console.log('usage: wstest.js {target} {connector} {connectorId}');
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
    console.log('usage: wstest.js {target} {connector} {connectorId}');
    process.exit();
  }
}
keyin();

client.on('connect', (connection) => {
  var repeatCount = 0;
  var connser = process.argv[3];
  var connid = process.argv[4];
  var command;

  connection.send(`{"req":"BootNotification", "connectorSerial":"${connser}", 
        "pdu":{"chargePointModel":"hcLab1", "chargePointVendor": "hclab" }}`);
        /////////////////////////////////////////////// check cpID and connectorSerial
  
  var stdin = process.openStdin();
  stdin.on('data', (input) => {
    if(process.platform == 'darwin') {
      command = String(input).slice(0, input.length - 1).split(" ");
      console.log('Running on MacOS');
    }
    else if(process.platform == 'win32') {
      command = String(input).slice(0, input.length - 2).split(" ");
      console.log('Running on Windows');
    }
    switch (command[0]) {
      case 'list':
        console.log('auth heart start stop avail reserve meter show res accept reject repeat');
        break;
      case 'auth':
        if(command[1])
          connection.send(`{"req":"Authorize", "connectorSerial": "${connser}", "pdu":{"idTag":"${command[1]}"}}`);
        else
          console.log('usage: auth {userid}');
        break;
      case 'heart':
        connection.send(`{"req":"HeartBeat", "connectorSerial":"${connser}", "pdu":{}}`);
        break;
      case 'start':
        if(command[1])
          connection.send(`{"req":"StartTransaction", "connectorSerial":"${connser}", "pdu":{"connectorId": ${connid}, 
                          "idTag":"${command[1]}", "meterStart": 234, "timeStamp": ${Date.now()}, "bulkSoc": 12.1, "fullSoc": 72.7 }}`);
        else
          console.log('usage: start {userid}');
        break;
      case 'stop':
        connection.send(`{"req":"StopTransaction", "connectorSerial":"${connser}", "pdu":{"transactionId": ${command[1]}, 
                          "meterStop":393, "timeStamp": ${Date.now()}, "reason": "whatever"}}`);
        break;
      case 'status':
        if(command[1])
          connection.send(`{"req":"StatusNotification", "connectorSerial":"${connser}", "pdu":{"connectorId":${connid},
                            "errorCode":"error001", "status":"${command[1]}", "timeStamp": ${Date.now()}}}`);
        else
          console.log('usage: status {StatusCode}');
        break;
      case 'meter':
        if(command[1])
          connection.send(`{"req": "MeterValues", "connectorSerial": "${connser}", "pdu": { "connectorId": ${connid}, 
                        "meterValue": {"timeStamp": "${Date.now()}", "transactionId": ${command[1]}, "sampledValue": {"value":${command[2]}}}}}`);
        else
          console.log('usage: meter {trxId} {meerValue}');
        break;
      case 'show':
        connection.send(`{"req":"ShowArray", "connectorSerial":"${connser}", "pdu":{}}`);
        break;
      case 'response':
        connection.send(`{"conf":"${command[1]}", "connectorSerial":"${connser}", "pdu":{}}`);
        break;
      case 'accept':
        connection.send(`{"conf":"RemoteStartTransaction", "connectorSerial":"${connser}", "pdu":{"status":"Accepted"}}`);
        break;
      case 'reject':
        connection.send(`{"conf":"RemoteStartTransaction", "connectorSerial":"${connser}", "pdu":{"status":"Rejected"}}`);
        break;
      case 'repeat':
        repeatCount = 0;
        repeat(Number(command[1]));
        break;
      case 'quit':
        connection.send(`{"req":"Quit", "connectorSerial":"${connser}", "pdu":{}}`);
        process.exit();
    }

    function repeat(count) {
      if (repeatCount < count)
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
