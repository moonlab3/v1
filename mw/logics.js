
function DBController (dbms) {
  const messageHandler = require('../tools/messageHandler');
  const dbConnector = require('../tools/dbConnector')(dbms);
  var dbSpeedAvg = 0, trxCount = 0;

  preProcess = (event, cwjy, callback) => {
    //console.log(`dbServer:preProcess: event: ${event}, cwjy: ${JSON.stringify(cwjy)}`);
  }

  showPerformance = () => {
    console.log(`dbServer:: total charging transactions: ${trxCount}, average processing time(ms): ${dbSpeedAvg}`);
  }
  noReturn = (cwjy) => {

    switch (cwjy.action) {
      case 'Charge':
        cwjy.trxCount = trxCount++;
        break;
    }
    var query = messageHandler.makeQuery(cwjy);
    var result = dbConnector.submitSync(query);
    console.log('dbServer:noReturn: result: ' + JSON.stringify(result));
  }

  withReturn = async (cwjy, callback) => {
    // cwjy handling
    // cwjy handling
    var returnValue;
    var query = messageHandler.makeQuery(cwjy);
    var result = await dbConnector.submitSync(query);
    console.log('withReturn result: ' + result + 'stringify ' + JSON.stringify(result));
    ////////////////////////////
    // todo
    // RemoteStartTransaction
    // 1. check the status of the connector
    // 2. on available, start charge. on booked, check the userid for booking.
    switch (cwjy.action) {
      case 'ConnectorInformation':
        returnValue = result[0];
        break;
      case 'ConnectorCheck':
        if (result[0].status == 'available' || result[0].status == 'preparing' || result[0].status == 'finishing')
          returnValue = 'Accepted';
        else if (result[0].status == 'reserved' && result[0].occupyingUserId == cwjy.userId)
          returnValue = 'Accepted';
        else
          returnValue = 'Rejected';
        break;

      case 'Authorize':
        if (result[0].count == 1)
        var temp = { req: cwjy.action, connectorSerial: cwjy.connectorSerial, pdu: {} };
        returnValue = messageHandler.makeMessage('conf', temp);
        break;
      case 'StartTransaction':
        //console.log('StartTransaction: ' + result);
        //////////////////////////////
        // create BILL record
        break;
      case 'StopTransaction':
        //console.log('StopTransaction: ' + result);
        var temp = { req: cwjy.action, connectorSerial: cwjy.connectorSerial, pdu: {} };
        returnValue = messageHandler.makeMessage('conf', temp);
        break;
      case 'StatusNotification':
        break;
      case 'BootNotification':
        var temp = {
          req: cwjy.action, connectorSerial: cwjy.connectorSerial,
          pdu: { currentTime: Date.now(), interval: 60 }
        };
        for (var index in result) {
          if (result[index].connectorSerial == cwjy.connectorSerial) {
            temp.pdu.status = "Accepted";
            temp.pdu.connectorId = result[index].connectorId;
            break;
          }
          if (!temp)
            temp.pdu.status = "Rejected";
        }
        returnValue = messageHandler.makeMessage('conf', temp);
        break;
    }

    //console.log('withReturn: ' + returnValue);
    callback(returnValue);
  }

  setTxCount = async () => {
    var query = `SELECT MAX(trxId) AS max FROM bill;`;
    var result = await dbConnector.submitSync(query);
    trxCount = result[0].max + 1;
    console.log('setTxCount: ' + trxCount);
  }
  const dbController = {
    preProcess,
    showPerformance,
    noReturn,
    withReturn,
    setTxCount
  }

  return dbController;
}

module.exports = DBController;
