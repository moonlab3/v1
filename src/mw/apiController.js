const json2html  = require('json2html');

function APIController(server) {
  const connDBServer = require('../tools/socketIOWrapper')('apiServer');
  const connCP = require('../tools/websocketWrapper')(server);
  var waitingJobs = 0;
  var lockArray = [];

  waitAndGo = (req, res, next) => {
    var index = lockArray.findIndex(item => item == req.body.evse);
    if (index >= 0) {
      res.write('please wait and try again.');
      res.end();
      return;
    }
    else {
      next();
    }
  }

  hScan = async (req, res, next) => {
    waitingJobs++;
    var reqToCP;
    var cwjy = { action: "EVSECheck", userId: req.body.user, evseSerial: req.body.evse};
    var result = await connDBServer.sendAndReceive(cwjy);
    if(!result || !req.body.user) {
      console.log('result is null');
      res.response = { responseCode: 'Rejected - Wrong Parameters', result: [] };
      next();
      return;
    }
    var response = {responseCode: 'Not Confirmed Yet', result: result};

    if(((result[0].status == 'Reserved' || result[0].status == 'Finishing') && result[0].occupyingUserId == req.body.user)
      || result[0].status == 'Available') {
      console.log('scan >> charge');
      lockActionProcess(req.body.evse);

      reqToCP = { messageType: 2, uuid: '123123', action: 'RemoteStartTransaction', pdu: { idTag: req.body.user } };
      result = await connCP.sendAndReceive(req.body.evse, reqToCP);
      console.log('start charge evse result: ' + JSON.stringify(result));
      if (!result) {
        console.log('timeout timeout');
        response.responseCode = 'Rejected-EVSE Problem';
        //////////////////////////////////////////////
        unlockActionProcess(req.body.evse);
        res.response = response;
        next();
        return;
      }
      if (result.pdu.status == 'Accepted') {
        cwjy = { action: "StatusNotification", userId: req.body.user, evseSerial: req.body.evse, pdu: { status: 'Preparing' } };
        console.log('hscanAction: EVSE says OK to charge');
        result = await connDBServer.sendAndReceive(cwjy);
        response.responseCode = 'Accepted';
        response.result[0].status = 'Preparing';
      }
      else {
        console.log('hscanAction: EVSE says Reject ');
        response.responseCode = 'Rejected-EVSE Problem';
      }

      cwjy = { action: "NewUserFavo", userId: req.body.user, chargePointId: req.body.cp, favo: 'recent' };
      connDBServer.sendOnly(cwjy);
      unlockActionProcess(req.body.evse);
    }
    else if (result[0].status == 'Reserved' && result[0].occupyingUserId != req.body.user) {
      console.log('scan >> other user reserved this. wait for 15 minutes')
    }
    else if (result[0].status == 'Finishing' && result[0].occupyingUserId != req.body.user) {
      console.log('scan >> Angry');
      cwjy = { action: 'Angry', userId: req.body.user, evseSerial: req.body.evse };
      result = await connDBServer.sendAndReceive(cwjy);
      console.log('angry: ' + result);
      if (result)
        response.responseCode = 'Accepted';
      else
        response.responseCode = 'Done Already';
    }
    else if (result[0].status == 'Charging' && result[0].occupyingUserId == req.body.user) {
      console.log('scan >> cancel');
      reqToCP = { messageType: 2, action: 'RemoteStopTransaction', pdu: { transactionId: result.trxId } };
      result = await connCP.sendAndReceive(req.body.evse, reqToCP);
      if (result) {
        if (result.pdu.status == 'Accepted') {
          response.responseCode = 'Accepted';
          response.result[0].status = 'Finishing';
        }
        else {
          response.responseCode = result.pdu.status;
        }
      }
      else {
        response.responseCode = 'Unavailable';
        console.log(`Communication Error. EVSE isn't responnding.`);
      }
    }
    else if (result[0].status == 'Charging' && result[0].occupyingUserId != req.body.user){
      console.log('scan >> Alarm');
      cwjy = { action: 'Alarm', userId: req.body.user, evseSerial: req.body.evse };
      connDBServer.sendOnly(cwjy);
      response.responseCode = 'Accepted';
    }
    else if (result[0].status == 'Unavailable') {
      response.responseCode = 'Temporarily Unavailable';
      console.log('scan >> evse is not availble.')
    }
    else if (result[0].status == 'Faulted') {
      response.responseCode = 'Faulted';
      console.log('scan >> evse is dead.')
    }
    else {
      console.log('error or special case');
    }
    res.response = response;
    next();

  }

  hAction = async (req, res, next) => {
    waitingJobs++;
    var response, cwjy, result, reqToCP;

    switch (req.body.action) {
      case 'Blink':
        reqToCP = { messageType: 2, uuid: '123123', action: 'DataTransfer', pdu: { vendorId: 'com.hclab', data: 'blink' } };
        //connCP.sendTo(req.body.evse, null, reqToCP);
        connCP.sendTo(req.body.evse, reqToCP);
        response.responseCode = 'Accepted';
        break;
      case 'Reserve':
        lockActionProcess(req.body.evse);
        cwjy = { action: 'Reserve', userId: req.body.user, evseSerial: req.body.evse };
        connDBServer.sendOnly(cwjy);

        reqToCP = { messageType: 2, uuid: '123123', action: 'DataTransfer', pdu: { vendorId: 'hclab.temp', data: 'yellow' } };
        connCP.sendTo(req.body.evse, reqToCP);

        response.responseCode = 'Accepted';
        unlockActionProcess(req.body.evse);
        break;
      case 'Cancel':
        var trxId;
        cwjy = { action: 'ChargingStatus', userId: req.body.user };
        result = connDBServer.sendAndReceive(cwjy);
        for (var i in result) {
          if(result[i].evseSerial == req.body.evseSerial)
            trxId = result[i].trxId;
        }

        reqToCP = { messageType: 2, uuid: '123123', action: 'RemoteStopTransaction', pdu: { transactionId: trxId } };
        result = await connCP.sendAndReceive(req.body.evse, reqToCP);
        if (result) {
          if (result.pdu.status == 'Accepted') {
            //cwjy = { action: '', userId: req.body.user, evseSerial: req.body.evse };
            //connDBServer.sendOnly(cwjy);
            response.responseCode = 'Accepted';
            response.result[0].status = 'Finishing';
          }
          else {
            // EVSE says no
            response.responseCode = result.pdu.status;
          }
        }
        else {
          response.responseCode = 'Unavailable';
          console.log(`Communication Error. EVSE isn't responnding.`);
        }
        break;
      case 'Alarm':
        cwjy = { action: 'Alarm', userId: req.body.user, evseSerial: req.body.evse };
        connDBServer.sendOnly(cwjy);
        response.responseCode = 'Accepted';
        break;
      case 'Angry':
        cwjy = { action: 'Angry', userId: req.body.user, evseSerial: req.body.evse };
        result = await connDBServer.sendAndReceive(cwjy);
        console.log('angry: ' + result);
        if (result)
          response.responseCode = 'Accepted';
        else
          response.responseCode = 'Done Already';
        break;
    }

    res.response = response;
    next();
  }

  getUserChargingStatus = async (req, res, next) => {
    waitingJobs++;
    var cwjy = { action: "ChargingStatus", userId: req.params.user};
    var result = await connDBServer.sendAndReceive(cwjy);

    for (var i in result) {

      //console.log(`now: ${new Date(Date.now())} started: ${result[i].started}`);
      var elapsed = new Date(Date.now() - new Date(result[i].started));
      result[i].elapsed = elapsed.getHours() + ":" + elapsed.getMinutes() + ":" + elapsed.getSeconds();
      result[i].currentSoc = result[i].bulkSoc + (result[i].meterNow - result[i].meterStart);
      result[i].price = (result[i].priceHCL + result[i].priceHost) * (result[i].meterNow - result[i].meterStart);
    }

    res.response = { responseCode: 'Accepted', result: result};
    next();
  }

  getUserChargingHistory = async (req, res, next) => {
    waitingJobs++;
    var cwjy = { action: "UserHistory", userId: req.params.user};
    var result = await connDBServer.sendAndReceive(cwjy);
    if(!result)
      res.response = { responseCode: 'Wrong Parameter', result: []};
    else
      res.response = { responseCode: 'Accepted', result: result };

    next();
  }

  getUserRecent = async (req, res, next) => {
    waitingJobs++;
    var cwjy = { action: "GetUserFavo", userId: req.params.user, favo: 'recent'};
    var result = await connDBServer.sendAndReceive(cwjy);
    if(!result)
      res.response = { responseCode: 'Wrong Parameter', result: []};
    else
      res.response = { responseCode: 'Accepted', result: result };

    next();
  }
  getUserFavo = async (req, res, next) => {
    waitingJobs++;
    var cwjy = { action: "GetUserFavo", userId: req.params.user, favo: 'favorite'};
    var result = await connDBServer.sendAndReceive(cwjy);
    if(!result)
      res.response = { responseCode: 'Wrong Parameter', result: []};
    else
      res.response = { responseCode: 'Accepted', result: result };

    next();
  }

  newUserFavo = async (req, res, next) => {
    waitingJobs++;
    if (!req.body) {
      res.response = { responseCode: 'Rejected', result: [] };
      next();
      return;
    }

    var cwjy = { action: "NewUserFavo", userId: req.body.user, chargePointId: req.body.cp, favo: 'favorite'};
    var result = await connDBServer.sendAndReceive(cwjy);
    //console.log('put result: ' + JSON.stringify(result));
    if(!result)
      res.response = { responseCode: 'Rejected', result: []};
    else
      res.response = { responseCode: 'Accepted', result: [] };

    next();
  }

  delUserFavo = async (req, res, next) => {

  }
  getChargePointInfo= async (req, res, next) => {
    waitingJobs++;
    var cwjy;
    if (req.params.cpId) {
      cwjy = { action: 'ShowAllEVSE', chargePointId: req.parmas.cp};
    }
    else if(req.query.lat && req.query.lng && req.query.rng) {
      cwjy = { action: 'ShowAllCP', lat: req.query.lat, lng: req.query.lng, rng: req.query.rng };
    }
    else {
      res.response = { responseCode: 'Rejected', result: [] };
      next();
      return;
    }
    var result = await connDBServer.sendAndReceive(cwjy);
    res.response = {responseCode: 'Accepted', result: result};
    next();

  }

  postDamageReport = (req, res, next) => {
    //////////////////////////////////////////////
    // images, writings
    cwjy = { action: 'Report', evseSerial: req.params.evse };
    result = connDBServer.sendOnly(cwjy);
    response.responseCode = "Accepted";

    res.response = response;
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
        conf = { messageType: 3, uuid: '234wer', action: req.action, pdu: req.pdu };
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

  csmsBasic = (req, res, next) => {
    console.log('/host');
  }

  csmsReport = (req, res, next) => {
    console.log('/host/report');
  }

  csmsControl = (req, res, next) => {
    console.log('/host/:userId' + req.params.userId);
  }


  

  writeResponse = (req, res) => {
    waitingJobs--;
    if (req.query.html || req.body.html) {
      var html = json2html.render(res.response);
      res.write(html);
    }
    else
      res.json(res.response);

    res.end();
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
    hScan,
    hAction,
    getUserChargingStatus,
    getUserChargingHistory,
    getUserRecent,
    getUserFavo,
    newUserFavo,
    delUserFavo,
    getChargePointInfo,
    postDamageReport,
    evseBoot,
    evseRequest,
    csmsBasic,
    csmsReport,
    csmsControl,
    writeResponse
  }

  connCP.enlistForwarding('general', evseRequest);
  connCP.enlistForwarding('boot', evseBoot);
  consoleCommand();

  return apiController;
}

module.exports = APIController;