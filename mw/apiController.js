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
  //console.log(`hscan:get::http ip: ${req.ip}:${req.header}`);

///////////////////////////////////////////
// fetch booking occupying end
// fetch charging occupying end
// fetch charging status
  waitingJobs++;
  var cwjy = {action: 'ConnectorInformation', condition: 'value', type: 'http', queryObj: req.params};
  //var result = await connDBServer.sendAndReceive('get', cwjy);
  var result = await connDBServer.sendAndReceive(cwjy);

  //res.writeHead(200);
  res.json(result);
  /*
  for (var i = 0; i < result.length; i++) {
    for (var key in result[i]) {
      res.write(`${result[i]}`);
    }
  }
  */
  res.end();
  console.log(result);
  waitingJobs--;
  next();
}

hscanAction = async (req, res, next) => {
  waitingJobs++;
  var reqToCP = {connectorSerial: req.params.connectorSerial, pdu: {idTag: req.params.userId}};
  var cwjy, result;
      ////////////////////////////////////////////
      // todo
      // LED change for booked connector
      // send angry birds
      // cancel charging
  switch (req.params.action) {
    case 'Charge':
      cwjy = { action: 'ConnectorCheck', user: req.params.userId, connector: req.params.connectorSerial };
      result = await connDBServer.sendAndReceive(cwjy);
      if(result == 'Rejected') {
        waitingJobs--;
        res.json({userId: req.params.userId, responseCode: "Rejected", results: 
                  {connectors:[{connectorSerial: req.params.connectorSerial, status:'' }]}});
        return;
      }

      reqToCP.req = 'RemoteStartTransaction';
      //console.log('request to chargepoint: ' + JSON.stringify(reqToCP));
      result = await connCP.sendAndReceive(req.params.connectorSerial, reqToCP);
      console.log(result);
      if (result.pdu.status == 'Accepted') {
        cwjy = { action: 'Charge', user:req.params.userId, connector: req.params.connectorSerial };
        connDBServer.sendOnly(cwjy);
        console.log('charging accepted');
      }
      else {
        console.log('charging rejected');
      }
      res.json({userId: req.params.userId, responseCode: result.pdu.status,
                result: {connectorSerial: req.params.connectorSerial, status: 'hohoho'}});

      /////////////////////////////////////////
      // todo
      // occupyingEnd time calculation
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
  //res.json(result);
}

cpGet = (req, res, next) => {
  // show all connectors of the chargePoint
  // todo : add tables
  // fetch chargepoint information
  // fetch chargepoint list
  waitingJobs++;
  res.writeHead(200);
  res.write('heheh');
  res.end();
  waitingJobs--;
}

cpPut = (req, res, next) => {

}

afterWork = (req, conn) => {
}

wsReq = async (req, conn) => {
  var cwjy, result;

  var conf = { req: req.req, connectorSerial: req.connectorSerial, pdu:{}};
  switch(req.req) {
    case 'BootNotification':
      connCP.storeConnection(req.connectorSerial, conn);
      conf.pdu = {currentTime: Date.now(), interval: 300};
      cwjy = { action: req.req, connector: req.connectorSerial, pdu: req.pdu };
      conf.pdu.status = await connDBServer.sendAndReceive(cwjy);
      break;
    case 'HeartBeat':
      connCP.storeConnection(req.connectorSerial, conn);
      req.pdu.currentTime = Date.now();
      cwjy = { action: "HeartBeat", connector: req.connectorSerial, pdu: req.pdu };
      connDBServer.sendOnly(cwjy);
      conf.pdu = {currentTime: Date.now()};
      break;
    case 'StatusNotification':
      cwjy = { action: "Update", connector: req.connectorSerial, pdu: req.pdu };
      connDBServer.sendOnly(cwjy);
      break;
    case 'MeterValues':
      break;
    case 'Autorize':
      cwjy = { action: "Autorize", connector: req.connectorSerial, pdu: req.pdu };
      break;
    case 'StartTransaction':
      cwjy = { action: "StartCharging", connector: req.connectorSerial, pdu: req.pdu };
      conf.pdu.status = await connDBServer.sendAndReceive(cwjy);
      ///////////////////////////////
      // for RFID 
      break;
    case 'StopTransaction':
      cwjy = { action: "update", connector: req.connectorSerial, pdu: req.pdu };
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
  connCP.sendTo(req.connectorSerial, conn, 'conf', conf);
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
  var result = await connDBServer.sendAndReceive(cwjy);

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


