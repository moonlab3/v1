const config = require('config');
const dbms = config.get('dbms');
const dbConnector = require('../tools/dbConnector')(dbms);
const messageHandler = require('../tools/messageHandler');
var dbSpeedAvg = 0, trxCount = 0;

preProcess = (event, cwjy, callback) => {
  console.log(`dbServer:preProcess: event: ${event}, cwjy: ${JSON.stringify(cwjy)}`);

}

showPerformance = () => {
  console.log(`dbServer:: transactions: ${trxCount}, average processing time(ms): ${dbSpeedAvg}`);
}
noReturn = (cwjy) => {
  var query = messageHandler.makeQuery(cwjy);
  var result = dbConnector.submitSync(query);

  console.log('dbServer:noReturn: result: ' + JSON.stringify(result) );
}

withReturn = async (cwjy, callback) => {
  // cwjy handling
  // cwjy handling
  var returnValue;
  var query = messageHandler.makeQuery(cwjy);
  var result = await dbConnector.submitSync(query);
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
      if(result[0].status == 'available' || result[0].status == 'preparing' || result[0].status == 'finishing')
        returnValue = 'Accepted';
      else if (result[0].status == 'reserved' && result[0].occupyingUserId == cwjy.queryObj.userId)
        returnValue = 'Accepted';
      else
        returnValue = 'Rejected';
      //////////////////////////////
      // create BILL record
      break;

    case 'Authorize':
      console.log('Authorize: ' + result);
      break;
    case 'StartTransaction':
      console.log('StartTransaction: ' + result);
      break;
    case 'StatusNotification':
      break;
    case 'BootNotification':
      var temp = {req: cwjy.action, connectorSerial:cwjy.connectorSerial, 
                  pdu: {currentTime: Date.now(), interval: 60}};
      for (var index in result) {
        if (result[index].connectorSerial == cwjy.connectorSerial) {
          temp.pdu.status = "Accepted";
          temp.pdu.connectorId = result[index].connectorId;
          break;
        }
        if(!temp)
          temp.pdu.status = "Rejected";
      }
      returnValue = messageHandler.makeMessage('conf', temp);
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