
function DBController (dbms) {
  const messageHandler = require('../tools/messageHandler');
  const dbConnector = require('../tools/dbConnector')(dbms);
  var dbSpeedAvg = 0, trxCount = 0, requestCount = 0;
  var onGoingTrx = [];

  preProcess = (event, cwjy, callback) => {
    //console.log(`dbServer:preProcess: event: ${event}, cwjy: ${JSON.stringify(cwjy)}`);
  }

  showPerformance = () => {
    console.log(`dbServer:: total transactions: ${requestCount}, average processing time(ms): ${dbSpeedAvg}`);
  }
  noReturn = (cwjy) => {
    console.log(`dbServer:noReturn: cwjy: ${JSON.stringify(cwjy)}`);

    requestCount++;
    const query = messageHandler.makeQuery(cwjy);
    dbConnector.submit(query);
  }
  putnReturnTrxId = (cwjy) => {
    const trx = { usernConnector: cwjy.connectorSerial + cwjy.userId, trxId: trxCount++};
    console.log(`returntrxId:usernconnector:  ${trx.usernConnector} trxId: ${trx.trxId}`);
    onGoingTrx.push(trx);
    return trx.trxId;
  }
  getTrxId = (cwjy) => {
    const found = onGoingTrx.find(({usernConnector}) => usernConnector == cwjy.connectorSerial + cwjy.userId);
    if(!found)
      return -1;
    console.log(`getTrxId:usernconnector:  ${found.usernConnector} trxId: ${found.trxId}`);
    return found.trxId;
  }

  withReturn = async (cwjy, callback) => {
    requestCount++;
    var returnValue;
    if(cwjy.action == 'StartTransaction') {
      cwjy.trxId = putnReturnTrxId(cwjy);
    }
    else if(cwjy.action == 'StopTransaction') {
      //cwjy.trxId = getTrxId(cwjy);
      cwjy.trxId = cwjy.pdu.transactionId;
    }
    var query = messageHandler.makeQuery(cwjy);
    var result = await dbConnector.submitSync(query);
    console.log('withReturn result: ' + JSON.stringify(result));
    ////////////////////////////
    // todo
    // RemoteStartTransaction
    // 1. check the status of the connector
    // 2. on available, start charge. on booked, check the userid for booking.

    ///////////////////////////////////////////
    // result message making from here
    var temp = { conf: cwjy.action, connectorSerial: cwjy.connectorSerial, pdu: {} };
    switch (cwjy.action) {
      case 'UserHistory':
        returnValue = result;
        break;
      case 'Angry':
      case 'ConnectorInformation':
      case 'ConnectorCheck':                                          // DONE DONE DONE DONE 
        returnValue = result[0];
        break;
      case 'Authorize':                                               // DONE DONE DONE DONE
        temp.pdu = { idTagInfo: { status: result[0].authStatus } };
        //returnValue = messageHandler.makeConfirmationMessage('conf', temp);
        returnValue = temp;
        break;
      case 'StartTransaction':                                        // DONE DONE DONE DONE
      case 'StopTransaction':                                         // DONE DONE DONE DONE
        temp.pdu = {transionId: cwjy.trxId, idTagInfo: {status: "Accepted"}};
        returnValue = temp;
        //returnValue = messageHandler.makeConfirmationMessage('conf', temp);
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
        //returnValue = messageHandler.makeConfirmationMessage('conf', temp);
        returnValue = temp;
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
