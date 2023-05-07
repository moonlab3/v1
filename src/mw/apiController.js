
function APIController(server) {
  const connDBServer = require('../tools/socketIOWrapper')('apiServer');
  const connCP = require('../tools/websocketWrapper')(server);
  var waitingJobs = 0;
  var lockArray = [];


  hscanAction = async (req, res) => {
    waitingJobs++;
    var reqToCP = { evseSerial: req.query.evse };

    /////////////////////////////////////////////////
    // always check EVSE status. Right? No?
    // further analysis is required
    var cwjy = { action: "EVSECheck", userId: req.query.user, evseSerial: req.query.evse};
    var result = await connDBServer.sendAndReceive(cwjy);
    if(!result) {
      console.log('result is null');
      res.send('theres nothing to show');
      waitingJobs--;
      return;
    }

    var response = {responseCode: 'Rejected', result: result};

    if(!req.query.user) {
      res.json(response);
      waitingJobs--;
      return;
    }

    switch (req.query.action) {
      case 'Check':
        break;
      case 'Charge':
        if (result.status == 'Available' ||
          ((result.status == 'Preparing' || result.status == 'Reserved' || result.status == 'Finishing')
            && result.occupyingUserId == req.query.user)) {
          console.log('hscanaction: its ok to charge');
        }
        else if(result.status == 'Unavailable'){
          // TODO
          // The EVSE is not booted
          // add more message to client
          response.responseCode = 'Rejected';
          break;
        }
        else if(result.status == 'Faulted') {
          // TODO
          // The EVSE is out of order
          // add more message to client
          response.responseCode = 'Faulted';
          break;
        }
        else {
          response.responseCode = 'Wrong';
          break;
        }

        /////////////////////////////////////////////
        // semaphore location   further analysis is required
        lockActionProcess(req.query.evse);

        reqToCP = { messageType: 2, action: 'RemoteStartTransaction', pdu: { idTag: req.query.user} };
        result = await connCP.sendAndReceive(req.query.evse, reqToCP);
        //console.log('start charge evse result: ' + JSON.stringify(result));
        if (result.pdu.status == 'Accepted') {
          cwjy = { action: "StatusNotification", userId: req.query.user, evseSerial: req.query.evse,
            pdu: { status: 'Preparing' } };
          console.log('hscanAction: EVSE says OK to charge');
          result = await connDBServer.sendAndReceive(cwjy);
          response.responseCode = 'Accepted';
          response.result.status = 'Preparing';
        }
        else {
          console.log('hscanAction: EVSE says Reject ');
          response.responseCode = 'Rejected';
        }

        /////////////////////////////////////////////
        // semaphore location   further analysis is required
        unlockActionProcess(req.params.evseSerial);
        break;
      case 'Blink':
        if (result.status == 'Reserved' && result.occupyingUserId == req.query.user) {
          reqToCP = {messageType: 2, action: 'DataTransfer', 
                    pdu: { vendorId: 'com.hclab', connectorId: result.connectorId, data: 'blink'}};
          //connCP.sendTo(req.query.evse, null, reqToCP);
          connCP.sendTo(req.query.evse, reqToCP);
          response.responseCode = 'Accepted';
        }
        else {
          response.responseCode = 'Rejected';
        }
        break;
      case 'Reserve':
        if(result.status == 'Available') {
          cwjy = { action: 'Reserve', userId: req.query.user, evseSerial: req.query.evse};
          reqToCP = { messageType: 2, action: 'DataTransfer', 
                    pdu: { vendorId: 'hclab.temp', connectorId: result.connectorId, data: 'yellow' } };
          //connCP.sendTo(req.query.evse, null, reqToCP);
          connCP.sendTo(req.query.evse, reqToCP);
          result = await connDBServer.sendAndReceive(cwjy);
          response.responseCode = 'Accepted';
        }
        else {
          response.responseCode = 'Rejected';
        }
        break;
      case 'Cancel':
        if(result.status == 'Charging' && result.occupyingUserId == req.params.userId) {
          cwjy = { action: 'ChargingStatus', userId: req.query.user, evseSerial: req.query.evse};
          result = await connDBServer.sendAndReceive(cwjy);
          reqToCP = {messageType: 2, action: 'RemoteStopTransaction', pdu: {transactionId: result.trxId}};
          //result = await connCP.sendAndReceive(req.params.evseSerial, reqToCP);
          result = await connCP.sendAndReceive(req.query.evse, reqToCP);

        }
        break;
      case 'Angry':
        if(result.status == 'Finishing') {
          cwjy = { action: 'Angry', userId: req.query.user, evseSerial: req.query.evse};
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

  getChargePointInfo= async (req, res) => {
    waitingJobs++;
    var cwjy;
    if (req.query.cp) {
      cwjy = { action: 'ShowAllEVSE', chargePointId: req.query.cp };
    }
    else if(req.query.lat && req.query.lng && req.query.rng) {
      cwjy = { action: 'ShowAllCP', lat: req.query.lat, lng: req.query.lng, rng: req.query.rng };
    }
    else {
      res.send('wrong URI');
      return;
    }
    var result = await connDBServer.sendAndReceive(cwjy);
    res.json(result);
    res.end();
    waitingJobs--;
  }

  csmsBasic = (req, res) => {
  }

  csmsReport = (req, res) => {
  }

  csmsControl = (req, res) => {
  }

  getUserChargingHistory = async (req, res) => {
    waitingJobs++;
    var cwjy = { action: "UserHistory", userId: req.params.userId};
    var result = await connDBServer.sendAndReceive(cwjy);

    res.json(result);
    res.end();
    waitingJobs--;

  }

  getUserFavo = (req, res) => {
  }
  getUserRecentVisit = (req, res) => {
  }
  getUserChargingStatus = async (req, res) => {
    waitingJobs++;
    var cwjy = { action: "ChargingStatus", userId: req.params.userId};
    var result = await connDBServer.sendAndReceive(cwjy);

    res.json(result);
    res.end();
    waitingJobs--;
  }


  evseBoot = async (req, conn) => {
    var conf = await connDBServer.sendAndReceive(req);
    if (conf.pdu.status == 'Accepted') {
      //connCP.storeConnection(req.pdu.chargeBoxSerialNumber, conn, true);
      //req.evseSerial = connCP.findEVSESerial(conn);
      req.evseSerial = conn;
    }
    else {
      console.log(`This EVSE(${req.pdu.chargeBoxSerialNumber}) is not authorized.`);
      //conn.close();
      connCP.removeConnection(conn);
      return;
    }
    //connCP.sendTo(req.evseSerial, null, conf);
    connCP.sendTo(conn, conf);
  }

  evseRequest = async (req, conn) => {
    //req.evseSerial = connCP.findEVSESerial(conn);
    req.evseSerial = conn;
    var conf;
    switch (req.action) {
      case 'HeartBeat':
      case 'MeterValues':
        //connCP.storeConnection(req.evseSerial, conn, false);
      case 'StatusNotification':
        connDBServer.sendOnly(req);
        conf = { messageType: 3, action: req.action, pdu: {} };
        break;
      case 'Authorize':
      case 'StartTransaction':
      case 'StopTransaction':
        conf = await connDBServer.sendAndReceive(req);
        break;
      case 'ShowArray':       // testOnly
        connCP.showAllConnections();
        break;
      case 'WhatsMySerial':       // testOnly
        break;
      case 'Quit':
        //connCP.removeConnection(req.evseSerial);
        connCP.removeConnection(conn);
        return;
    }
    //connCP.sendTo(req.evseSerial, null, conf);
    connCP.sendTo(conn, conf);
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

  consoleCommand = () => {
    var stdin = process.openStdin();
    stdin.on('data', (input) => {
      command = String(input).slice(0, input.length - 1).split(" ");
      switch (command[0]) {
        case 'empty':
          lockArray.length = 0;
          console.log('Array for evse semaphore is just emptied.');
          break;
        case 'socketlist':
          connCP.showAllConnections();
          break;
        case 'forwardlist':
          connCP.showAllForwards();
          break;
      }
    });
  }

  const apiController = {
    waitAndGo,
    //hscanNotLoggedIn,
    //hscanLoggedIn,
    hscanAction,
    getUserChargingHistory,
    getUserChargingStatus,
    getUserFavo,
    getUserRecentVisit,
    getChargePointInfo,
    evseBoot,
    evseRequest,
    csmsBasic,
    csmsReport,
    csmsControl
  }

  connCP.enlistForwarding('general', evseRequest);
  connCP.enlistForwarding('boot', evseBoot);
  consoleCommand();

  return apiController;
}

module.exports = APIController;