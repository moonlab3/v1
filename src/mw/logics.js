const OCPP_HEARTBEAT_INTERVAL_SECS = 60;

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
  /*
  noReturn = (cwjy) => {
    console.log(`dbServer:noReturn: cwjy: ${JSON.stringify(cwjy)}`);

    requestCount++;
    const query = messageHandler.makeQuery(cwjy);
    dbConnector.submit(query);
  }
  */

  nnmRequest = async (cwjy, callback) => {

  }

  extRequest = async (cwjy, callback) => {
    requestCount++;
    var returnValue, query, result, temp;
    switch (cwjy.action) {
      case 'StartTransaction':
        cwjy.pdu.transactionId = trxCount++;
        //////////////////////////////////////////
        // calculation for occupyingEnd
        query = `SELECT capacity FROM connector WHERE connectorSerial = '${cwjy.connectorSerial}'`;
        result = await dbConnector.submitSync(query);
        break;
      case 'Angry':
        break;
    }

    //console.log('withReturn called: ' + JSON.stringify(cwjy));
    query = messageHandler.makeQuery(cwjy);
    //console.log('withReturn query: ' + query);
    result = await dbConnector.submitSync(query);
    if(!result) {
      returnValue = null;
      cwjy.action = null;
    }

    ///////////////////////////////////////////
    // result message making from here
    temp = { messageType: 3, action: cwjy.action, pdu: {} };
    switch (cwjy.action) {
      
      // don't have meaningful response
      //case 'Hearbeat':
      //case 'MeterValue':
      //case 'StatusNotification':
      case 'UserHistory':
        returnValue = result;
        break;
      case 'Alarm':
      case 'Report':
      case 'Reserve':
        break;
      case 'ChargingStatus':
      case 'Angry':
      case 'ConnectorInformation':
      case 'ConnectorCheck':                                          // DONE DONE DONE DONE 
        returnValue = result[0];
        break;
      case 'Authorize':                                               // DONE DONE DONE DONE
        temp.pdu = { idTagInfo: { status: result[0].authStatus } };
        //returnValue = temp;
      case 'StartTransaction':                                        // DONE DONE DONE DONE
      case 'StopTransaction':                                         // DONE DONE DONE DONE
        //temp.pdu = {transionId: cwjy.trxId, idTagInfo: {status: "Accepted"}};
        returnValue = temp;
        break;
      case 'BootNotification':
        temp.pdu = { currentTime: Date.now(), interval: OCPP_HEARTBEAT_INTERVAL_SECS } ;
        for (var index in result) {
          if (result[index].connectorSerial == cwjy.connectorSerial) {
            temp.pdu.status = "Accepted";
            temp.pdu.connectorId = result[index].connectorId;
            break;
          }
          if (!temp)
            temp.pdu.status = "Rejected";
        }
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
    extRequest,
    nnmRequest,
    setTxCount
  }

  return dbController;
}

module.exports = DBController;
