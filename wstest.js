var wsClient = require('websocket').client;

var client = new wsClient();

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

client.on('connectFailed', function(error) {
  console.log('Connect Error' + error.toString());
});

var eol;

function keyin() {
  var target = process.argv[2];
  var connser = process.argv[3];

  if (process.platform == 'win32') {
    eol = 2;
    console.log('Running on Windows');
  }
  else {
    eol = 1;
    console.log('Running on Linux or MacOS');
  }

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
  var repeatCount = 0, repeats = 0;
  var connser = process.argv[3];
  var connid = process.argv[4];
  var command;

  connection.send(`{"req":"BootNotification", "connectorSerial":"${connser}", 
        "pdu":{"chargePointModel":"hcLab1", "chargePointVendor": "hclab" }}`);
        /////////////////////////////////////////////// check cpID and connectorSerial
  
  var stdin = process.openStdin();
  stdin.on('data', (input) => {
    command = String(input).slice(0, input.length - eol).split(" ");
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
        if(command[1] && command[2] && command[3])
          connection.send(`{"req":"StartTransaction", "connectorSerial":"${connser}", "pdu":{"connectorId": ${connid}, 
                          "idTag":"${command[1]}", "meterStart": ${command[3]}, "timeStamp": ${Date.now()}, "bulkSoc": ${command[2]}, "fullSoc": 72.7 }}`);
        else
          console.log('usage: start {userid} {bulkSoc} {meterStart}');
        break;
      case 'stop':
        if(command[1] && command[2] && command[3])
          connection.send(`{"req":"StopTransaction", "connectorSerial":"${connser}", "pdu":{"transactionId": ${command[1]}, 
                          "meterStop":${command[2]}, "timeStamp": ${Date.now()}, "reason": "${command[3]}"}}`);
        else
          console.log('usage: stop {transactionId} {meterStop} {reason}');
        break;
      case 'status':
        if(command[1])
          connection.send(`{"req":"StatusNotification", "connectorSerial":"${connser}", "pdu":{"connectorId":${connid},
                            "errorCode":"error001", "status":"${command[1]}", "timeStamp": ${Date.now()}}}`);
        else
          console.log('usage: status {Available Preparing Charging Finishing Reserved Unavailable}');
        break;
      case 'meter':
        if(command[1])
          connection.send(`{"req": "MeterValues", "connectorSerial": "${connser}", "pdu": { "connectorId": ${connid}, 
                        "meterValue": {"timeStamp": "${Date.now()}", "transactionId": ${command[1]}, "sampledValue": {"value":${command[2]}}}}}`);
        else
          console.log('usage: meter {trxId} {meterValue}');
        break;
      case 'show':
        connection.send(`{"req":"ShowArray", "connectorSerial":"${connser}", "pdu":{}}`);
        break;
      case 'response':
        if(command[1])
          connection.send(`{"conf":"${command[1]}", "connectorSerial":"${connser}", "pdu":{"status": "${command[2]}"}}`);
        else
          console.log('usage: response {transaction name} {accept or reject}');
        break;
      case 'repeat':
        repeatCount = 0;
        repeats = Number(command[1]);
        if(repeats > 0) {
          repeat();
        }
        else
          console.log('usage: repeat {repeat count}');
        break;
      case 'quit':
        connection.send(`{"req":"Quit", "connectorSerial":"${connser}", "pdu":{}}`);
        process.exit();
    }

    function repeat() {
      if (repeatCount < repeats)
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
