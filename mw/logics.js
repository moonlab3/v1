
function DBController (dbms) {
  const messageHandler = require('../tools/messageHandler');
  const dbConnector = require('../tools/dbConnector')(dbms);
  var dbSpeedAvg = 0, trxCount = 0, requestCount = 0;

  preProcess = (event, cwjy, callback) => {
    //console.log(`dbServer:preProcess: event: ${event}, cwjy: ${JSON.stringify(cwjy)}`);
  }

  showPerformance = () => {
    console.log(`dbServer:: total transactions: ${requestCount}, average processing time(ms): ${dbSpeedAvg}`);
  }
  noReturn = (cwjy) => {

    requestCount++;
    var query = messageHandler.makeQuery(cwjy);
    var result = dbConnector.submitSync(query);
    //console.log('dbServer:noReturn: result: ' + JSON.stringify(result));
  }

  withReturn = async (cwjy, callback) => {
    requestCount++;
    var returnValue;
    if(cwjy.action == 'StartTransaction')
      cwjy.trxCount = trxCount++;
    var query = messageHandler.makeQuery(cwjy);
    var result = await dbConnector.submitSync(query);
    console.log('withReturn result: ' + result + 'stringify ' + JSON.stringify(result));
    ////////////////////////////
    // todo
    // RemoteStartTransaction
    // 1. check the status of the connector
    // 2. on available, start charge. on booked, check the userid for booking.

    ///////////////////////////////////////////
    // result message making from here
    var temp = { req: cwjy.action, connectorSerial: cwjy.connectorSerial, pdu: {} };
    switch (cwjy.action) {
      case 'ConnectorInformation':
        returnValue = result[0];
        break;
      case 'ConnectorCheck':                                          // DONE DONE DONE DONE 
        returnValue = {status: result[0].status, occupyingUserId: result[0].occupyingUserId};
        break;
      case 'Authorize':                                               // DONE DONE DONE DONE
        temp.pdu = { idTagInfo: { status: result[0].authStatus } };
        returnValue = messageHandler.makeConfirmationMessage('conf', temp);
        break;
      case 'StartTransaction':                                        // DONE DONE DONE DONE
        temp.pdu = {transionId: cwjy.trxCount, idTagInfo: {status: "Accepted"}};
      case 'StopTransaction':                                         // DONE DONE DONE DONE
        returnValue = messageHandler.makeConfirmationMessage('conf', temp);
        break;
      case 'StatusNotification':
        break;
      case 'BootNotification':
        temp.pdu = { currentTime: Date.now(), interval: 60 } ;
        for (var index in result) {
          if (result[index].connectorSerial == cwjy.connectorSerial) {
            temp.pdu.status = "Accepted";
            temp.pdu.connectorId = result[index].connectorId;
            break;
          }
          if (!temp)
            temp.pdu.status = "Rejected";
        }
        returnValue = messageHandler.makeConfirmationMessage('conf', temp);
        break;
    }

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
