const json2html  = require('json2html');

function APIController(server) {
  const connDBServer = require('../tools/socketIOWrapper')('apiServer');
  const connCP = require('../tools/websocketWrapper')(server);
  var waitingJobs = 0;
  var lockArray = [];

  hscanAction = async (req, res, next) => {
    waitingJobs++;
    var reqToCP = { evseSerial: req.query.evse };

    /////////////////////////////////////////////////
    // always check EVSE status. Right? No?
    // further analysis is required

    var cwjy = { action: "EVSECheck", userId: req.query.user, evseSerial: req.query.evse};
    var result = await connDBServer.sendAndReceive(cwjy);
    if(!result) {
      console.log('result is null');
      waitingJobs--;
      res.response = { responseCode: 'Rejected', result: [] };
      next();
      return;
    }

    var response = {responseCode: 'Rejected', result: result};

    if(!req.query.user) {
      res.response = response;
      waitingJobs--;
      next();
      return;
    }
    if (req.query.action == 'Scan') {
      console.log(`hscanhscanhscan: [${result[0].occupyingUserId}] == [${req.query.user}]`);
      switch (result[0].status) {
        case 'Available':
          req.query.action = 'Charge';
          console.log('scan >> charge');
          break;
        case 'Charging':
          if (result[0].occupyingUserId == req.query.user) {
            req.query.action = 'Cancel';
            console.log('scan >> cancel');
          }
          else {
            req.query.action = 'Alarm';
            console.log('scan >> Alarm');
          }
          break;
        case 'Finishing':
          req.query.action = 'Angry';
          console.log('scan >> Angry');
          break;
      }
    }

    switch (req.query.action) {
      case 'Charge':
        if (result[0].status == 'Available' ||
          ((result[0].status == 'Preparing' || result[0].status == 'Reserved' || result[0].status == 'Finishing')
            && result[0].occupyingUserId == req.query.user)) {
          console.log('hscanaction: its ok to charge');
        }
        else if(result[0].status == 'Unavailable'){
          // TODO
          // The EVSE is not booted
          // add more message to client
          response.responseCode = 'Rejected';
          break;
        }
        else if(result[0].status == 'Faulted') {
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
        console.log('start charge evse result: ' + JSON.stringify(result));
        if (result.pdu.status == 'Accepted') {
          cwjy = { action: "StatusNotification", userId: req.query.user, evseSerial: req.query.evse,
            pdu: { status: 'Preparing' } };
          console.log('hscanAction: EVSE says OK to charge');
          result = await connDBServer.sendAndReceive(cwjy);
          response.responseCode = 'Accepted';
          response.result[0].status = 'Preparing';
        }
        else {
          console.log('hscanAction: EVSE says Reject ');
          response.responseCode = 'Rejected';
        }

        /////////////////////////////////////////////
        // semaphore location   further analysis is required
        unlockActionProcess(req.query.evse);
        break;
      case 'Blink':
        if (result[0].status == 'Reserved' && result[0].occupyingUserId == req.query.user) {
          reqToCP = {messageType: 2, action: 'DataTransfer', 
                    pdu: { vendorId: 'com.hclab', data: 'blink'}};
          //connCP.sendTo(req.query.evse, null, reqToCP);
          connCP.sendTo(req.query.evse, reqToCP);
          response.responseCode = 'Accepted';
        }
        else {
          response.responseCode = 'Rejected';
        }
        break;
      case 'Reserve':
        if(result[0].status == 'Available') {
          lockActionProcess(req.query.evse);
          cwjy = { action: 'Reserve', userId: req.query.user, evseSerial: req.query.evse};
          reqToCP = { messageType: 2, action: 'DataTransfer', 
                    pdu: { vendorId: 'hclab.temp', data: 'yellow' } };
          //connCP.sendTo(req.query.evse, null, reqToCP);
          connCP.sendTo(req.query.evse, reqToCP);
          //result = await connDBServer.sendAndReceive(cwjy);
          connDBServer.sendOnly(cwjy);
          response.responseCode = 'Accepted';
          unlockActionProcess(req.query.evse);
        }
        else {
          response.responseCode = 'Rejected';
        }
        break;
      case 'Cancel':
        if(result[0].status == 'Charging' && result[0].occupyingUserId == req.query.user) {
          reqToCP = {messageType: 2, action: 'RemoteStopTransaction', pdu: {transactionId: result.trxId}};
          //result = await connCP.sendAndReceive(req.params.evseSerial, reqToCP);
          result = await connCP.sendAndReceive(req.query.evse, reqToCP);
          if(result) {
            if (result.pdu.status == 'Accepted') {
              cwjy = { action: 'ChargingStatus', userId: req.query.user, evseSerial: req.query.evse };
              //result = await connDBServer.sendAndReceive(cwjy);
              connDBServer.sendOnly(cwjy);
              response.responseCode = 'Accepted';
            }
            else {
              // EVSE error
              response.responseCode = result.pdu.status; 
            }
          }
          else {
            response.responseCode = 'Unavailable';
            console.log(`Communication Error. EVSE isn't responnding.`);
          }
        }
        break;
      case 'Alarm':
        if(result[0].status == 'Charging') {
          cwjy = { action: 'Alarm', userId: req.query.user, evseSerial: req.query.evse};
          //result = await connDBServer.sendAndReceive(cwjy);
          connDBServer.sendOnly(cwjy);
          response.responseCode = 'Accepted';
        }
        else {
          response.responseCode = 'Rejected';
        }
        break;
      case 'Angry':
        if(result[0].status == 'Finishing') {
          cwjy = { action: 'Angry', userId: req.query.user, evseSerial: req.query.evse};
          result = await connDBServer.sendAndReceive(cwjy);
          console.log('angry: ' + result);
          if(result)
            response.responseCode = 'Accepted';
          else
            response.responseCode = 'Done Already';
        }
        else {
          response.responseCode = 'Rejected';
        }
        break;
      case 'Report':
        cwjy = { action: 'Report', userId: req.query.user, evseSerial: req.query.evse };
        result = await connDBServer.sendAndReceive(cwjy);
        response.responseCode = "Accepted";
        break;
    }

    res.response = response;
    next();

    waitingJobs--;
  }

  getChargePointInfo= async (req, res, next) => {
    waitingJobs++;
    var cwjy;
    if (req.query.cp) {
      cwjy = { action: 'ShowAllEVSE', chargePointId: req.query.cp };
    }
    else if(req.query.lat && req.query.lng && req.query.rng) {
      cwjy = { action: 'ShowAllCP', lat: req.query.lat, lng: req.query.lng, rng: req.query.rng };
    }
    else {
      res.response = { responseCode: 'Rejected', result: [] };
      next();
      waitingJobs--;
      return;
    }
    var result = await connDBServer.sendAndReceive(cwjy);
    res.response = {responseCode: 'Accepted', result: result};
    next();

    waitingJobs--;
  }

  csmsBasic = (req, res, next) => {
  }

  csmsReport = (req, res, next) => {
  }

  csmsControl = (req, res, next) => {
  }

  getUserChargingHistory = async (req, res, next) => {
    waitingJobs++;
    var cwjy = { action: "UserHistory", userId: req.query.user};
    var result = await connDBServer.sendAndReceive(cwjy);
    if(!result)
      res.response = { responseCode: 'Wrong Parameter', result: []};
    else
      res.response = { responseCode: 'Accepted', result: result };

    next();
    waitingJobs--;
  }

  getUserFavo = (req, res, next) => {
  }
  getUserRecentVisit = (req, res, next) => {
  }
  getUserChargingStatus = async (req, res, next) => {
    waitingJobs++;
    var cwjy = { action: "ChargingStatus", userId: req.query.user, evseSerial: req.query.evse};
    var result = await connDBServer.sendAndReceive(cwjy);

    waitingJobs--;

    res.response = { responseCode: 'Accepted', result: result};
    next();
  }


  evseBoot = async (req, origin) => {
    req.evseSerial = origin;
    var conf = await connDBServer.sendAndReceive(req);
    if (conf.pdu.status !== 'Accepted') {
      console.log(`This EVSE(${origin}) is not authorized.`);
      connCP.removeConnection(origin);
      return;
    }
    connCP.sendTo(origin, conf);
  }

  evseRequest = async (req, origin) => {
    req.evseSerial = origin;
    var conf;
    switch (req.action) {
      case 'Heartbeat':
      case 'MeterValues':
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
        connCP.removeConnection(origin);
        return;
    }
    connCP.sendTo(origin, conf);
  }

  lockActionProcess = (evseSerial) => {
    var found = lockArray.find(item => item == evseSerial);
    if(found) {
      console.log (`apiController: [${evseSerial}] is already locked`);
      return false;
    }
    console.log('lock: ' + evseSerial);
    lockArray.push(evseSerial);
    return true;
  }

  unlockActionProcess = (evseSerial) => {
    console.log('unlock: ' + evseSerial);
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

  writeResponse = (req, res) => {
    if (req.query.html) {
      var html = json2html.render(res.response);
      res.write(html);
    }
    else
      res.json(res.response);

    res.end();
  }

  consoleCommand = () => {
    var stdin = process.openStdin();
    stdin.on('data', (input) => {
      command = String(input).slice(0, input.length - 1);
      switch (command) {
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
        case 'waiting':
          console.log('waiting jobs: ' + waitingJobs);
      }
    });
  }

  const apiController = {
    waitAndGo,
    writeResponse,
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