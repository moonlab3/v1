const connDBServer = require('../tools/socketIOWrapper');
const connCP = require('../tools/websocketWrapper');
var waitingJobs = 0;
//const HTTPParser = require('http-parser-js');

hscanGet = async (req, res, next) => {
  console.log(`hscan:get::http ip: ${req.ip}:${req.header}`);

  waitingJobs++;
  var cwjy = {action: 'fetch', condition: 'value', type: 'http', req: req.params};
  var result = await connDBServer.sendAndReceive('single', cwjy);

  res.writeHead(200);
  for (var i = 0; i < result.length; i++) {
    for (var key in result[i]) {
      res.write(`key: ${key} value: ${result[i][key]}`);
    }
  }
  res.end();
  waitingJobs--;
  /*
  sockDBServer.emit('single', cwjy, (result) => {
    res.writeHead(200);
    for(var i = 0; i < result.length; i++) {
      for(var key in result[i]) {
        res.write(`key: ${key} value: ${result[i][key]}`);
      }
    }
    res.end();
  });
  */

  next();
}

hscanPut = async (req, res, next) => {
  waitingJobs++;
  var reqToCP = {req: req.params.action, connectorSerial: req.params.connectorSerial, pdu: {idTag: req.params.userId}};
  var cwjy, result;
  switch (req.params.action) {
    case 'Charge':
      result = await connCP.sendAndReceive(req.params.userId, reqToCP);
      if (result == 'ok') {
        cwjy = { action: 'update', condition: '', type: 'http', req: req.params };
        result = await connDBServer.sendAndReceive('single', cwjy);
      }

      break;
    case 'Reserve':
      break;
    case 'Angry':
      break;
    case 'Alarm':
      break;
    case 'Report':
      break;
  }

  res.writeHead(200);
  res.write(JSON.stringify(result));
  res.end();
  waitingJobs--;
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

}

afterWork = (req, conn) => {
  //connCP.send('', conn, req);
}

wsReq = async (req, conn) => {
  var cwjy, result;

  var conf = { req: req.req, connectorSerial: req.connectorSerial, pdu:{}};
  switch(req.req) {
    case 'BootNotification':
      connCP.storeConnection(req.connectorSerial, conn);
      conf.pdu = {currentTime: Date.now(), interval: 300};
      cwjy = { action: "compare", type: "ocpp", condition: "have", value: req.connectorSerial, queryObj: req };
      conf.pdu.status = await connDBServer.sendAndReceive('single', cwjy);
      /*
      for (var index in result) {
        if (result[index].connectorSerial == req.connectorSerial) {
          conf.pdu.status = "Accepted";
          break;
        }
      }
      if (!conf.pdu.status) {
        conf.pdu.status = "Rejected";
      }
      */
      break;
    case 'HeartBeat':
      connCP.storeConnection(req.connectorSerial, conn);
      req.pdu.currentTime = Date.now();
      cwjy = { action: "update", type: "ocpp", condition: "", value: "", queryObj: req };
      connDBServer.send(cwjy);
      
      //////////////////////////////////////////
      //////////////////////////////////////////  think
      //////////////////////////// 
      conf.pdu = {currentTime: Date.now()};
      break;
    case 'StatusNotification':
      cwjy = { action: "update", type: "ocpp", condition: "", value: "", queryObj: req };
      connDBServer.send(cwjy);
      break;
    case 'ShowArray':
      connCP.showAllConnections('ws call');
      break;
    case 'Quit':
      connCP.removeConnection(req.connectorSerial);
      return;
  }

  connCP.send(req.connectorSerial, conn, conf);
  /*
  var conf = {req: req.req, connectorSerial: req.connectorSerial, 
          pdu: {currentTime: Date.now(), interval: 300}};

  var cwjy = { action: "fetch", type: "ocpp", condition: "ok", queryObj: req };
  */
  
}

wsConf = (req, conn) => {
}

hostGet = (req, res) => {

}

module.exports = {
  hscanGet: hscanGet,
  hscanPut: hscanPut,
  cpGet: cpGet,
  cpPut: cpPut,
  wsReq: wsReq,
  wsConf: wsConf,
  hostGet: hostGet,
  afterWork: afterWork
};

