//const HTTPParser = require('http-parser-js');

function APIController(server) {
  const connDBServer = require('../tools/socketIOWrapper')('apiServer');
  const connCP = require('../tools/websocketWrapper')(server);
  var waitingJobs = 0;
  var lockArray = [];

  hscanLoggedIn = async (req, res) => {
    //console.log(`hscan:get::http ip: ${req.ip}:${req.header}`);

    ///////////////////////////////////////////
    // fetch booking occupying end
    // fetch charging occupying end
    // fetch charging status
    waitingJobs++;
    var cwjy = { action: 'ConnectorInformation', connectorSerial: req.params.connectorSerial, userId: req.params.userId};
    var result = await connDBServer.sendAndReceive(cwjy);

    res.json(result);
    /*
    for (var i = 0; i < result.length; i++) {
      for (var key in result[i]) {
        res.write(`${result[i]}`);
      }
    }
    */
    res.end();
    console.log('apiController:hscan: ' + result);
    waitingJobs--;
  }

  hscanAction = async (req, res) => {
    waitingJobs++;
    var reqToCP = { connectorSerial: req.params.connectorSerial, pdu: { idTag: req.params.userId } };
    var cwjy, result;
    ////////////////////////////////////////////
    // todo
    // LED change for booked connector
    // send angry birds
    // cancel charging
    switch (req.params.action) {
      case 'Charge':
        cwjy = { action: 'ConnectorCheck', userId: req.params.userId, connectorSerial: req.params.connectorSerial };
        result = await connDBServer.sendAndReceive(cwjy);
        if (result == 'Rejected') {
          waitingJobs--;
          res.json({
            userId: req.params.userId, responseCode: "Rejected", results:
              { connectors: [{ connectorSerial: req.params.connectorSerial, status: '' }] }
          });
          return;
        }

        /////////////////////////////////////////////
        // semaphore location
        lockActionProcess(req.params.connectorSerial);

        reqToCP.req = 'RemoteStartTransaction';
        result = await connCP.sendAndReceive(req.params.connectorSerial, reqToCP);
        console.log('apiServer:hScanAction: ' + result);
        if (result.pdu.status == 'Accepted') {

          //////////////////////////////////////////////////////
          // I think these lines have to move to wsReq:StartTransaction case.
          // There's a chance still the coupler is not plugged.
          /*
          cwjy = { action: 'Charge', userId: req.params.userId, connectorSerial: req.params.connectorSerial };
          connDBServer.sendOnly(cwjy);
          console.log('apiServer:hscanAction: charging accepted');
          */
        }
        else {
          console.log('apiServer:hscanAction: charging rejected');
        }
        res.json({
          userId: req.params.userId, responseCode: result.pdu.status,
          result: { connectorSerial: req.params.connectorSerial, status: 'hohoho' }
        });

        break;
      case 'Blink':
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

    waitingJobs--;
    //unlockActionProcess(req.params.connectorSerial);
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

  wsReq = async (req, conn) => {
    var cwjy;

    var conf = { req: req.req, connectorSerial: req.connectorSerial, pdu: {} };
    switch (req.req) {
      case 'BootNotification':
        connCP.storeConnection(req.connectorSerial, conn);
        conf.pdu = { currentTime: Date.now(), interval: 300 };
        cwjy = { action: req.req, connectorSerial: req.connectorSerial, pdu: req.pdu };
        conf = await connDBServer.sendAndReceive(cwjy);
        break;
      ////////////////////////////////////////////////////////////////
      // almost same tasks
      case 'HeartBeat':
        connCP.storeConnection(req.connectorSerial, conn);
        req.pdu.currentTime = Date.now();
        conf.pdu = { currentTime: Date.now() };
      case 'StatusNotification':
      case 'MeterValues':
        cwjy = { action: req.req, connectorSerial: req.connectorSerial, pdu: req.pdu };
        connDBServer.sendOnly(cwjy);
        break;
      case 'Authorize':
        cwjy = { action: req.req, userId: req.pdu.idTag, connectorSerial: req.connectorSerial, pdu: req.pdu };
        conf = connDBServer.sendAndReceive(cwjy);
        break;
      case 'StartTransaction':
        cwjy = { action: req.req, userId: req.pdu.idTag, connectorSerial: req.connectorSerial,
                  bulkSoc: req.pdu.bulkSoc, fullSoc: req.pdu.fullSoc, meterStart: req.pdu.meterStart };
        conf = await connDBServer.sendAndReceive(cwjy);
        ///////////////////////////////
        // semaphore location
        unlockActionProcess(req.connectorSerial);
        /////////////////////////////////////////
        // todo
        // occupyingEnd time calculation
        ///////////////////////////////
        // for RFID 
        break;
      case 'StopTransaction':
        cwjy = { action: req.req, userId: req.pdu.idTag, connectorSerial: req.connectorSerial, pdu: req.pdu };
        conf = await connDBServer.sendAndReceive(cwjy);
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
    connCP.sendTo(req.connectorSerial, conn, conf);
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
    var cwjy = { action: 'fetch', condition: 'value', type: 'http', queryObj: req.params };
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

  lockActionProcess = (connectorSerial) => {
    var found = lockArray.find(item => item == connectorSerial);
    if(found) {
      console.log (`apiController: [${connectorSerial}] is already locked`);
      return false;
    }
    lockArray.push(connectorSerial);
    return true;
  }

  unlockActionProcess = (connectorSerial) => {
    var index = lockArray.findIndex(item => item == connectorSerial);
    if (index >= 0) {
      lockArray.splice(index, 1);
    }
    else {
      console.log(`apiController: Can't find [${connectorSerial}].`);
    }
  }
  
  waitAndGo = (req, res, next) => {
    //console.log('waitandgo called. client want ' + r)
    var index = lockArray.findIndex(item => item == req.params.connectorSerial);
    if (index >= 0) {
      res.write('please wait and try again.');
      res.end();
      return;
    }
    else {
      next();
    }
  }

  const apiController = {
    waitAndGo,
    hscanLoggedIn,
    hscanAction,
    userHistory,
    userStatus,
    userFavo,
    cpGet,
    cpPut,
    wsReq,
    wsConf,
    hostGet
  }

  connCP.enlistCallback('general', wsReq);

  return apiController;
}

module.exports = APIController;