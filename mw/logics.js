const dbConnector = require('../tools/dbConnector');
const ocppHandler = require('../tools/ocppHandler');
const httpHandler = require('../tools/httpHandler');
var dbSpeedAvg = 0, trxCount = 0;

preProcess = (event, cwjy, callback) => {
  console.log(`event: ${event}, cwjy: ${JSON.stringify(cwjy)}`);

}

showPerformance = () => {
  console.log(`transactions: ${trxCount}, average processing time(ms): ${dbSpeedAvg}`);
}
noReturn = (cwjy) => {
  var query;
  switch (cwjy.type) {
    case 'http':
      query = httpHandler.makeQuery(cwjy);
      break;
    case 'ocpp':
      query = ocppHandler.makeQuery(cwjy);
      break;
  }
  var result = dbConnector.submitSync(query);

  console.log('noreturn result: ' + JSON.stringify(result) );
}

withReturn = async (cwjy, callback) => {
  // cwjy handling
  // cwjy handling
  var query, returnValue;
  switch (cwjy.type) {
    case 'http':
      query = httpHandler.makeQuery(cwjy);
      break;
    case 'ocpp':
      query = ocppHandler.makeQuery(cwjy);
      break;
  }
  var result = await dbConnector.submitSync(query);
      ////////////////////////////
      // todo
      // RemoteStartTransaction
      // 1. check the status of the connector
      // 2. on available, start charge. on booked, check the userid for booking.
  switch (cwjy.action) {
    case 'ConnectorCheck':
      if(result[0].status == 'available')
        returnValue = 'Accepted';
      else if (result[0].status == 'reserved' && result[0].occupyingUserId == cwjy.queryObj.userId)
        returnValue = 'Accepted';
      else
        returnValue = 'Rejected';
      //////////////////////////////
      // create BILL record
      break;

    case 'BootNotification':
      returnValue = null;
      for (var index in result) {
        if (result[index].connectorSerial == cwjy.condition) {
          returnValue = "Accepted";
          break;
        }
        if(!returnValue)
          returnValue = "Rejected";
      }
      break;
  }

  //console.log('withReturn: ' + returnValue);
  callback(returnValue);
}

module.exports = {
  preProcess: preProcess,
  noReturn: noReturn,
  withReturn: withReturn,
  showPerformance: showPerformance
}