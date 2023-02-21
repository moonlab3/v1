const config = require('config');
const dbserver = config.get('dbserver');
const sockDBServer = require('socket.io-client')(`http://${dbserver.host}:${dbserver.port}`);
const wsServer = require('../tools/wsServer');
var waitingJobs = 0;
const HTTPParser = require('http-parser-js');


//init = function()
hscanGet = (req, res, next) => {
  //console.log(`hscan:get::http requested: ${req.params}`);
  var queryObj = { todo: "get", table: "connector", select: "",
                    conditions: [{key: "connectorSerial", value: req.params.connectorSerial},
                                {key:"userId", value: req.params.userId}]};
  waitingJobs++;
  sockDBServer.emit(queryObj.todo, queryObj, (result) => {
    res.writeHead(200);
    for(var i = 0; i < result.length; i++) {
      for(var key in result[i]) {
        res.write(`key: ${key} value: ${result[i][key]}`);
      }
    }
    res.end();
    waitingJobs--;
  });

  next();
}

hscanPut = async (req, res, next) => {

  var requestToCP = {req: req.params.action, connectorSerial: req.params.connectorSerial, pdu: {idTag: req.params.userId}};
  var result = await wsServer.sendAndReceive(req.params.connectorSerial, requestToCP);
  wsServer.delistCallback(req.params.connectorSerial);

  //console.log('hscanput result: ' + JSON.stringify(result));
  res.writeHead(200);
  res.write(JSON.stringify(result));
  res.end();

  /*
  var queryObj = { todo: "update", table: "connector",
              set: [{key: "occupyingUserId", value: req.params.userId}, {key: "status", value: "charging"},
                    {key: "occupyingEnd", value: 2345345345}],
              conditions: [{key: "connectorSerial", value: req.params.connectorSerial}]};
  */

}

cpGet = (req, res, next) => {
  // show all connectors of the chargePoint
  // todo : add tables
  waitingJobs++;
  res.writeHead(200);
  res.write('heheh');
  res.end();
  waitingJobs--;
}

cpPut = (req, res, next) => {
  var queryObj =
  {
    todo: "join",
    inquiries: [{
      table: "chargepoint",
      select: "locationDetail, priceHCL, priceHost, address",
      conditions: [
        {
          key: "key1",
          value: "value1"
        },
        {
          key: "key2",
          value: "value2"
        }
      ]
    }]
  };

}

afterWork = (req, conn) => {
  //wsServer.send('', conn, req);
}

wsReq = (req, conn) => {
  //console.debug(`wsReq:: req: ${req.req} pdu: ${JSON.stringify(req.pdu)}`);
  var queryObj;
  switch(req.req) {
    case 'BootNotification':
      wsServer.storeSocket(req.connectorSerial, conn);
      queryObj = {todo: "get", table: "connector", select: "*",
                  conditions: [{key: "connectorSerial", value: req.connectorSerial}]};
      break;
    case 'Authorize':
      req.pdu.idTag = '';
      req.pdu.idTagInfo = {};
      req.pdu.idTagInfo.status = 'Accepted';
      break;
    case 'HeartBeat':
      wsServer.storeSocket(req.connectorSerial, conn);
      req.pdu.currentTime = Date.now();
      break;
    case 'MeterValues':
      req.pdu.connectorId = 0;
      break;
    case 'StartTransaction':
      req.pdu.connectorId = 0;
      req.pdu.idTagInfo = {};
      req.pdu.idTagInfo.status = 'Accepted';
      queryObj = {todo: "put", table: "chargepoint", select: "*",
                  conditions: [{key: "connectorSerial", value: req.connectorSerial}]};
      break;
    case 'StatusNotification':
      req.pdu.connectorId = 0;
      req.pdu.status = '';
      break;
    case 'StopTransaction':
      req.pdu.connectorId = 0;
      req.pdu.transactionId = 0;
      queryObj = {todo: "put", table: "chargepoint", select: "*",
                  conditions: [{key: "connectorSerial", value: req.connectorSerial}]};
      break;
    case 'ShowArray':
      wsServer.showAllArray('ws call');
      break;
    case 'Quit':
      wsServer.removeSocket(req.connectorSerial);
      return;
  }
  wsServer.send(req.connectorSerial, conn, req);
  if (queryObj.todo) {
    sockDBServer.emit(queryObj.todo, queryObj, () => {
    });
  }
}

wsConf = (req, conn) => {
}


module.exports = {
  //init: init,
  hscanGet: hscanGet,
  hscanPut: hscanPut,
  cpGet: cpGet,
  cpPut: cpPut,
  wsReq: wsReq,
  wsConf: wsConf,
  afterWork: afterWork
};