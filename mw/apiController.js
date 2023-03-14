const connDBServer = require('../tools/socketIOWrapper');
const connCP = require('../tools/websocketWrapper');
var waitingJobs = 0;
//const HTTPParser = require('http-parser-js');

hscanNotLoggedIn = async (req, res, next) => {
  ///////////////////////////////////////////////////
  // will be deprecated
  // 
}

hscanLoggedIn = async (req, res, next) => {
  console.log(`hscan:get::http ip: ${req.ip}:${req.header}`);

  waitingJobs++;
  var cwjy = {action: 'fetch', condition: 'value', type: 'http', queryObj: req.params};
  var result = await connDBServer.sendAndReceive('single', cwjy);

  res.writeHead(200);
  for (var i = 0; i < result.length; i++) {
    for (var key in result[i]) {
      res.write(`key: ${key} value: ${result[i][key]}`);
    }
  }
  res.end();
  waitingJobs--;
  next();
}

hscanAction = async (req, res, next) => {
  waitingJobs++;
  var reqToCP = {req: req.params.action, connectorSerial: req.params.connectorSerial, 
                pdu: {idTag: req.params.userId}};
  var cwjy, result;
  switch (req.params.action) {
    case 'Charge':
      ////////////////////////////////////////////
      // todo
      // ask if it's ok to start charge.
      cwjy = { action: 'StartCharging', condition: 'ok', type: 'http', 
              value: req.params.userId, queryObj: req.params };
      result = await connDBServer.sendAndReceive('single', cwjy);
      if(result == 'Rejected') {
        //res.writeHead(200);
        waitingJobs--;
        res.json({userId: req.params.userId, responseCode: "Fail", results: 
                  {connectors:[{connectorSerial: req.params.connectorSerial, status:'' }]}});
        //res.end();
      }

      result = await connCP.sendAndReceive(req.params.userId, reqToCP);
      if (result == 'ok') {
        cwjy = { action: 'update', condition: '', type: 'http', queryObj: req.params };
        result = await connDBServer.sendAndReceive('single', cwjy);
      }
      else {
        //////////////////////////////////////
        // todo
        // reesponse: error because of the connector's malfunction
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

  //res.writeHead(200);
  waitingJobs--;
  res.json(result);
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
      cwjy = { action: "BootNotification", type: "ocpp", condition: "have", value: req.connectorSerial, queryObj: req };
      conf.pdu.status = await connDBServer.sendAndReceive('single', cwjy);
      break;
    case 'HeartBeat':
      connCP.storeConnection(req.connectorSerial, conn);
      req.pdu.currentTime = Date.now();
      cwjy = { action: "update", type: "ocpp", condition: "", value: "", queryObj: req };
      connDBServer.send(cwjy);
      conf.pdu = {currentTime: Date.now()};
      break;
    case 'StatusNotification':
      cwjy = { action: "update", type: "ocpp", condition: "", value: "", queryObj: req };
      connDBServer.send(cwjy);
      break;
    case 'MeterValues':
      break;
    case 'StartTransaction':
      ///////////////////////////////
      // for RFID 
      break;
    case 'StopTransaction':
      break;
    case 'ShowArray':
      /////////////////////////////////////
      // for test only
      connCP.showAllConnections('ws call');
      break;
    case 'Quit':
      /////////////////////////////////////
      // for test only
      connCP.removeConnection(req.connectorSerial);
      return;
  }
  connCP.send(req.connectorSerial, conn, conf);
}

wsConf = (req, conn) => {
  ///////////////////////////////////////////
  // will be deprecated.
  // sendAndReceive takes care of confirmation return
}

hostGet = (req, res) => {

}

userHistory = async (req, res) => {
  //console.log(`hscan:get::http ip: ${req.ip}:${req.header}`);

  waitingJobs++;
  var cwjy = {action: 'fetch', condition: 'value', type: 'http', queryObj: req.params};
  var result = await connDBServer.sendAndReceive('single', cwjy);

  res.writeHead(200);
  for (var i = 0; i < result.length; i++) {
    for (var key in result[i]) {
      res.write(`key: ${key} value: ${result[i][key]}`);
    }
  }
  res.end();
  waitingJobs--;

}

userStatus = (req, res) => {
}

userFavo = (req, res) => {
}
module.exports = {
  hscanNotLoggedIn: hscanNotLoggedIn,
  hscanLoggedIn: hscanLoggedIn,
  hscanAction: hscanAction,
  userHistory: userHistory,
  userStatus: userStatus,
  userFavo: userFavo,
  cpGet: cpGet,
  cpPut: cpPut,
  wsReq: wsReq,
  wsConf: wsConf,
  hostGet: hostGet,
  afterWork: afterWork
};

///////////////////////////////////////////
// fetch booking occupying end
// fetch charging occupying end
// LED change for booked connector
// send angry birds
// cancel charging
// fetch charging status
// fetch charpoint information
// fetch chargepoint list

