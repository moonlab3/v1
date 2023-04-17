
function APIController(server) {
  const connDBServer = require('../tools/socketIOWrapper')('apiServer');
  const connCP = require('../tools/websocketWrapper')(server);
  var waitingJobs = 0;
  var lockArray = [];

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
    console.log('apiController:hscan: ' + JSON.stringify(result));
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
       console.log(`Charge:: at ${req.params.connectorSerial} status: ${result.status} occupied by ${result.occupyingUserId} requested by ${req.params.userId}`);
       if(result.status == 'Available' || 
       ((result.status == 'Preparing' || result.status == 'Reserved' || result.status == 'Finishing') 
        && result.occupyingUserId == req.params.userId) ){
          console.log('hscanaction: its ok to charge');
       }
       else {
         response.responseCode = 'Rejected';
         break;
       }

        /////////////////////////////////////////////
        // semaphore location   further analysis is required
        lockActionProcess(req.params.connectorSerial);

        reqToCP.req = 'RemoteStartTransaction';
        reqToCP.pdu = {idTag: req.params.userId};
        result = await connCP.sendAndReceive(req.params.connectorSerial, reqToCP);
        if (result.pdu.status == 'Accepted') {
          cwjy = { action: "StatusNotification", userId: req.params.userId, connectorSerial: req.params.connectorSerial,
                   pdu: {status: 'Preparing'} };
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
          reqToCP.req = 'DataTransfer';
          reqToCP.pdu = { vendorId: 'com.hclab', connectorId: result.connectorId, data: 'blink'};
          //result = await connCP.sendAndReceive(req.params.connectorSerial, reqToCP);
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
          reqToCP.req = 'DataTransfer';
          reqToCP.pdu = {vendorId: 'com.hclab', connectorId: result.connectorId, data: 'yellow'};
          connCP.sendTo(req.params.connectorSerial, null, reqToCP);
          result = await connDBServer.sendAndReceive(cwjy);
          response.responseCode = 'Accepted';
        }
        else {
          response.responseCode = 'Rejected';
        }
        break;
      case 'Cancel':
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

    //res.writeHead(200);
    res.json(result);
    /*
    for (var i = 0; i < result.length; i++) {
      for (var key in result[i]) {
        res.write(`key: ${key} value: ${result[i][key]}`);
      }
    }
    */
    res.end();
    waitingJobs--;

  }

  userStatus = (req, res) => {
  }

  userFavo = (req, res) => {
  }


  wsReq = async (req, conn) => {
    var cwjy;

    var conf = { conf: req.req, connectorSerial: req.connectorSerial, pdu: {} };
    switch (req.req) {
      case 'BootNotification':
        connCP.storeConnection(req.connectorSerial, conn, true);
        conf.pdu = { currentTime: Date.now(), interval: 300 };
        cwjy = { action: req.req, connectorSerial: req.connectorSerial, pdu: req.pdu };
        conf = await connDBServer.sendAndReceive(cwjy);
        break;
      ////////////////////////////////////////////////////////////////
      // almost same tasks
      case 'HeartBeat':
        connCP.storeConnection(req.connectorSerial, conn, false);
        req.pdu.currentTime = Date.now();
        conf.pdu = { currentTime: Date.now() };
      case 'StatusNotification':
      case 'MeterValues':
        cwjy = { action: req.req, connectorSerial: req.connectorSerial, pdu: req.pdu };
        connDBServer.sendOnly(cwjy);
        break;
      case 'Authorize':
        cwjy = { action: req.req, userId: req.pdu.idTag, connectorSerial: req.connectorSerial, pdu: req.pdu };
        conf = await connDBServer.sendAndReceive(cwjy);
        break;
      case 'StartTransaction':
        cwjy = { action: req.req, userId: req.pdu.idTag, connectorSerial: req.connectorSerial,
                  bulkSoc: req.pdu.bulkSoc, fullSoc: req.pdu.fullSoc, meterStart: req.pdu.meterStart };
        conf = await connDBServer.sendAndReceive(cwjy);

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
    hscanLoggedIn,
    hscanAction,
    userHistory,
    userStatus,
    userFavo,
    cpGet,
    cpPut,
    wsReq,
    hostGet
  }

  connCP.enlistCallback('general', wsReq);

  return apiController;
}

module.exports = APIController;