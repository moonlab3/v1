
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
  
  ///////////////////////////////////
  // deprecate noreturn
  noReturn = (cwjy) => {
    console.log(`dbServer:noReturn: cwjy: ${JSON.stringify(cwjy)}`);

    requestCount++;
    const query = messageHandler.makeQuery(cwjy);
    dbConnector.submit(query);
  }

  withReturn = async (cwjy, callback) => {
    requestCount++;
    var returnValue;
    if(cwjy.action == 'StartTransaction') {
      cwjy.trxId = trxCount++;
    }
    else if(cwjy.action == 'StopTransaction') {
      cwjy.trxId = cwjy.pdu.transactionId;
    }

    //console.log('withReturn called: ' + JSON.stringify(cwjy));
    var query = messageHandler.makeQuery(cwjy);
    //console.log('withReturn query: ' + query);
    var result = await dbConnector.submitSync(query);
    //console.log('withReturn result: ' + JSON.stringify(result));
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

    if(callback)
      callback(returnValue);
  }

  setTxCount = async() => {
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
