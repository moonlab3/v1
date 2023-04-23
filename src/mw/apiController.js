
function APIController(server) {
  const connDBServer = require('../tools/socketIOWrapper')('apiServer');
  const connCP = require('../tools/websocketWrapper')(server);
  var waitingJobs = 0;
  var lockArray = [];

  hscanNotLoggedIn = async (req, res) => {
    waitingJobs++;
    var cwjy = { action: "ConnectorInformation", evseSerial: req.params.evseSerial, userId: null};
    var result = await connDBServer.sendAndReceive(cwjy);

    res.json(result);
    res.end();
    waitingJobs--;
  }
  hscanLoggedIn = async (req, res) => {
    ///////////////////////////////////////////
    // fetch booking occupying end
    // fetch charging occupying end
    // fetch charging status
    waitingJobs++;
    var cwjy = { action: "ConnectorInformation", evseSerial: req.params.evseSerial, userId: req.params.userId};
    var result = await connDBServer.sendAndReceive(cwjy);

    res.json(result);
    res.end();
    //console.log('apiController:hscan: ' + JSON.stringify(result));
    waitingJobs--;
  }

  hscanAction = async (req, res) => {
    waitingJobs++;
    var reqToCP = { evseSerial: req.params.evseSerial };
    ////////////////////////////////////////////
    // todo
    // send angry birds
    // cancel charging

    /////////////////////////////////////////////////
    // always check connector status. Right? No?
    // further analysis is required
    var cwjy = { action: "ConnectorCheck", userId: req.params.userId, evseSerial: req.params.evseSerial };
    var result = await connDBServer.sendAndReceive(cwjy);
    var response = { userId: req.params.userId, 
                    result: { evseSerial: req.params.evseSerial, status: result.status} };

    switch (req.params.action) {
      case 'Charge':
        //console.log(`Charge:: at ${req.params.evseSerial} status: ${result.status} occupied by ${result.occupyingUserId} requested by ${req.params.userId}`);
        if (result.status == 'Available' ||
          ((result.status == 'Preparing' || result.status == 'Reserved' || result.status == 'Finishing')
            && result.occupyingUserId == req.params.userId)) {
          console.log('hscanaction: its ok to charge');
        }
        else {
          response.responseCode = 'Rejected';
          break;
        }

        /////////////////////////////////////////////
        // semaphore location   further analysis is required
        lockActionProcess(req.params.evseSerial);

        reqToCP = { messageType: 2, action: 'RemoteStartTransaction', pdu: { idTag: req.params.userId } };
        result = await connCP.sendAndReceive(req.params.evseSerial, reqToCP);
        if (result.pdu.status == 'Accepted') {
          cwjy = {
            action: "StatusNotification", userId: req.params.userId, evseSerial: req.params.evseSerial,
            pdu: { status: 'Preparing' }
          };
          result = await connDBServer.sendAndReceive(cwjy);
        }
        else {
          response.responseCode = 'Rejected';
          break;
        }
        response.responseCode = 'Accepted';
        response.result.status = 'Preparing';

        /////////////////////////////////////////////
        // semaphore location   further analysis is required
        unlockActionProcess(req.params.evseSerial);
        break;
      case 'Blink':
        if (result.status == 'Reserved' && result.occupyingUerId == req.params.userId) {
          reqToCP = {messageType: 2, action: 'DataTransfer', 
                    pdu: { vendorId: 'com.hclab', connectorId: result.connectorId, data: 'blink'}};
          connCP.sendTo(req.params.evseSerial, null, reqToCP);
          response.responseCode = 'Accepted';
        }
        else {
          response.responseCode = 'Rejected';
        }
        break;
      //////////////////////////////////////////////////////////////////////////
      // DataTransfer for Reserve and ChangeLED
      // DataTransfer for Reserve and ChangeLED
      // DataTransfer for Reserve and ChangeLED
      // DataTransfer for Reserve and ChangeLED
      case 'Reserve':
        if(result.status == 'Available') {
          cwjy = { action: 'Reserve', userId: req.params.userId, evseSerial: req.params.evseSerial };
          reqToCP = { messageType: 2, action: 'DataTransfer', 
                    pdu: { vendorId: 'hclab.temp', connectorId: result.connectorId, data: 'yellow' } };
          connCP.sendTo(req.params.evseSerial, null, reqToCP);
          result = await connDBServer.sendAndReceive(cwjy);
          response.responseCode = 'Accepted';
        }
        else {
          response.responseCode = 'Rejected';
        }
        break;
      case 'Cancel':
        if(result.status == 'Charging' && result.occupyingUserId == req.params.userId) {
          cwjy = { action: 'ChargingStatus', userId: req.params.userId, evseSerial: req.params.evseSerial };
          result = await connDBServer.sendAndReceive(cwjy);
          reqToCP = {messageType: 2, action: 'RemoteStopTransaction', pdu: {transactionId: result.trxId}};
          result = await connCP.sendAndReceive(req.params.evseSerial, reqToCP);

        }
        break;
      case 'Angry':
        if(result.status == 'Finishing') {
          cwjy = { action: 'Angry', userId: req.params.userId, evseSerial: req.params.evseSerial };
          result = await connDBServer.sendAndReceive(cwjy);
          response.responseCode = 'Accepted';
        }
        else {
          response.responseCode = 'Rejected';
        }
        break;
      case 'Alarm':
        if(result.status == 'Charging') {
          response.responseCode = 'Accepted';
        }
        else {
          response.responseCode = 'Rejected';
        }
        break;
      case 'Report':
        if(result.status == 'Charging') {
          response.responseCode = "Accepted";
        }
        else {
          response.responseCode = "Rejected";
        }
        break;
    }

    res.json(response);
    waitingJobs--;
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

  hostGet = (req, res) => {

  }

  userHistory = async (req, res) => {
    //console.log(`hscan:get::http ip: ${req.ip}:${req.header}`);

    waitingJobs++;
    var cwjy = { action: "UserHistory", userId: req.params.userId};
    var result = await connDBServer.sendAndReceive(cwjy);

    res.json(result);
    res.end();
    waitingJobs--;

  }

  userRecent = (req, res) => {
  }
  userStatus = async (req, res) => {
    waitingJobs++;
    var cwjy = { action: "ChargingStatus", userId: req.params.userId};
    var result = await connDBServer.sendAndReceive(cwjy);

    res.json(result);
    res.end();
    waitingJobs--;
  }

  userFavo = (req, res) => {
  }


  wsReq = async (req, conn) => {
    /*
    if(!req.evseSerial) {
      console.log('apiController: message format is not valid for this system');
      connCP.sendTo(req.evseSerial, conn, {conf: req.req, pdu: {status:'Communication Format Error'}});
      return;
    }
    */

    var conf = { messageType: 3, action: req.action, pdu: {} };
    switch (req.action) {
      case 'BootNotification':
        connCP.storeConnection(req.pdu.chargeBoxSerialNumber, conn, true);
        conf = await connDBServer.sendAndReceive(req);
        break;
      ////////////////////////////////////////////////////////////////
      // almost same tasks
      case 'HeartBeat':
        connCP.storeConnection(req.evseSerial, conn, false);
        conf.pdu = { currentTime: Date.now() };
      case 'StatusNotification':
      case 'MeterValues':
        //cwjy = { action: req.action, evseSerial: req.evseSerial, pdu: req.pdu };
        connDBServer.sendOnly(req);
        break;
      case 'Authorize':
      case 'StartTransaction':
      case 'StopTransaction':
        //cwjy = { action: req.action, evseSerial: req.evseSerial, pdu: req.pdu};
        conf = await connDBServer.sendAndReceive(req);
        /////////////////////////////////////////
        // todo
        // occupyingEnd time calculation
        ///////////////////////////////
        // for RFID 
        break;
      case 'ShowArray':
        connCP.showAllConnections();
        break;
      case 'Quit':
        connCP.removeConnection(req.evseSerial);
        return;
    }
    connCP.sendTo(req.evseSerial, conn, conf);
  }

  lockActionProcess = (evseSerial) => {
    var found = lockArray.find(item => item == evseSerial);
    if(found) {
      console.log (`apiController: [${evseSerial}] is already locked`);
      return false;
    }
    lockArray.push(evseSerial);
    return true;
  }

  unlockActionProcess = (evseSerial) => {
    var index = lockArray.findIndex(item => item == evseSerial);
    if (index >= 0) {
      lockArray.splice(index, 1);
    }
    else {
      console.log(`apiController: Can't find [${evseSerial}].`);
    }
  }
  
  waitAndGo = (req, res, next) => {
    //console.log('waitandgo called. client want ' + r)
    var index = lockArray.findIndex(item => item == req.params.evseSerial);
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
    hscanNotLoggedIn,
    hscanLoggedIn,
    hscanAction,
    userHistory,
    userStatus,
    userFavo,
    userRecent,
    cpGet,
    cpPut,
    wsReq,
    hostGet
  }

  connCP.enlistForwarding('general', wsReq);

  return apiController;
}

module.exports = APIController;