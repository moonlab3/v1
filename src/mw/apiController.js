
function APIController(server) {
  const connDBServer = require('../tools/socketIOWrapper')('apiServer');
  const connCP = require('../tools/websocketWrapper')(server);
  var waitingJobs = 0;
  var lockArray = [];

  hscanNotLoggedIn = async (req, res) => {
    waitingJobs++;
    var cwjy = { action: "ConnectorInformation", connectorSerial: req.params.connectorSerial, userId: null};
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
    var cwjy = { action: "ConnectorInformation", connectorSerial: req.params.connectorSerial, userId: req.params.userId};
    var result = await connDBServer.sendAndReceive(cwjy);

    res.json(result);
    res.end();
    //console.log('apiController:hscan: ' + JSON.stringify(result));
    waitingJobs--;
  }

  hscanAction = async (req, res) => {
    waitingJobs++;
    var reqToCP = { connectorSerial: req.params.connectorSerial };
    ////////////////////////////////////////////
    // todo
    // send angry birds
    // cancel charging

    /////////////////////////////////////////////////
    // always check connector status. Right? No?
    // further analysis is required
    var cwjy = { action: "ConnectorCheck", userId: req.params.userId, connectorSerial: req.params.connectorSerial };
    var result = await connDBServer.sendAndReceive(cwjy);
    var response = { userId: req.params.userId, 
                    result: { connectorSerial: req.params.connectorSerial, status: result.status} };

    switch (req.params.action) {
      case 'Charge':
        //console.log(`Charge:: at ${req.params.connectorSerial} status: ${result.status} occupied by ${result.occupyingUserId} requested by ${req.params.userId}`);
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
        lockActionProcess(req.params.connectorSerial);

        reqToCP = { messageType: 2, action: 'RemoteStartTransaction', pdu: { idTag: req.params.userId } };
        result = await connCP.sendAndReceive(req.params.connectorSerial, reqToCP);
        if (result.pdu.status == 'Accepted') {
          cwjy = {
            action: "StatusNotification", userId: req.params.userId, connectorSerial: req.params.connectorSerial,
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
        unlockActionProcess(req.params.connectorSerial);
        break;
      case 'Blink':
        if (result.status == 'Reserved' && result.occupyingUerId == req.params.userId) {
          reqToCP = {messageType: 2, action: 'DataTransfer', 
                    pdu: { vendorId: 'com.hclab', connectorId: result.connectorId, data: 'blink'}};
          connCP.sendTo(req.params.connectorSerial, null, reqToCP);
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
          cwjy = { action: 'Reserve', userId: req.params.userId, connectorSerial: req.params.connectorSerial };
          reqToCP = { messageType: 2, action: 'DataTransfer', 
                    pdu: { vendorId: 'hclab.temp', connectorId: result.connectorId, data: 'yellow' } };
          connCP.sendTo(req.params.connectorSerial, null, reqToCP);
          result = await connDBServer.sendAndReceive(cwjy);
          response.responseCode = 'Accepted';
        }
        else {
          response.responseCode = 'Rejected';
        }
        break;
      case 'Cancel':
        if(result.status == 'Charging' && result.occupyingUserId == req.params.userId) {
          cwjy = { action: 'ChargingStatus', userId: req.params.userId, connectorSerial: req.params.connectorSerial };
          result = await connDBServer.sendAndReceive(cwjy);
          reqToCP = {messageType: 2, action: 'RemoteStopTransaction', pdu: {transactionId: result.trxId}};
          result = await connCP.sendAndReceive(req.params.connectorSerial, reqToCP);

        }
        break;
      case 'Angry':
        if(result.status == 'Finishing') {
          cwjy = { action: 'Angry', userId: req.params.userId, connectorSerial: req.params.connectorSerial };
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
    if(!req.connectorSerial) {
      console.log('apiController: message format is not valid for this system');
      connCP.sendTo(req.connectorSerial, conn, {conf: req.req, pdu: {status:'Communication Format Error'}});
      return;
    }
    */

    var cwjy;
    var conf = { messageType: 3, action: req.action, pdu: {} };
    switch (req.action) {
      case 'BootNotification':
        connCP.storeConnection(req.connectorSerial, conn, true);
        //cwjy = { action: req.action, connectorSerial: req.connectorSerial, pdu: req.pdu };
        conf = await connDBServer.sendAndReceive(req);
        break;
      ////////////////////////////////////////////////////////////////
      // almost same tasks
      case 'HeartBeat':
        connCP.storeConnection(req.connectorSerial, conn, false);
        conf.pdu = { currentTime: Date.now() };
      case 'StatusNotification':
      case 'MeterValues':
        //cwjy = { action: req.action, connectorSerial: req.connectorSerial, pdu: req.pdu };
        connDBServer.sendOnly(req);
        break;
      case 'Authorize':
      case 'StartTransaction':
      case 'StopTransaction':
        //cwjy = { action: req.action, connectorSerial: req.connectorSerial, pdu: req.pdu};
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
        connCP.removeConnection(req.connectorSerial);
        return;
    }
    connCP.sendTo(req.connectorSerial, conn, conf);
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