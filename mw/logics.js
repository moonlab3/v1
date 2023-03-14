const dbConnector = require('../tools/dbConnector');
const ocppHandler = require('../tools/ocppHandler');
var dbSpeedAvg = 0, trxCount = 0;

preProcess = (event, cwjy, callback) => {
  console.log(`event: ${event}, cwjy: ${JSON.stringify(cwjy)}, callback: ${callback}`);

}

showPerformance = () => {
  console.log(`transactions: ${trxCount}, average processing time(ms): ${dbSpeedAvg}`);
}
singleSync = (cwjy) => {
  var query;
  //console.log('singleSync called');
  switch (cwjy.type) {
    case 'http':
      query = httpHandler.makeQuery(cwjy.queryObj);
      break;
    case 'ocpp':
      query = ocppHandler.makeQuery(cwjy.queryObj);
      break;
  }
  var result = dbConnector.submitSync(query);

  console.log('singleSync return ' + JSON.stringify(result) );
}

single = async (cwjy, callback) => {
  // cwjy handling
  // cwjy handling
  var query, returnValue;
  switch (cwjy.type) {
    case 'http':
      query = httpHandler.makeQuery(cwjy.queryObj);
      break;
    case 'ocpp':
      query = ocppHandler.makeQuery(cwjy.queryObj);
      break;
  }
  var result = await dbConnector.submitSync(query);

      ////////////////////////////
      // todo
      // RemoteStartTransaction
      // 1. check the status of the connector
      // 2. on available, start charge. on booked, check the userid for booking.
  switch (cwjy.action) {
    case 'StartCharging':
      if(result.status == 'available')
        returnValue = 'Accepted';
      else if (result.status == 'reserved' && result.occupyingUserId == cwjy.queryObj.userId)
        returnValue = 'Accepted';
      else 
        returnValue = 'Rejected';
      break;

    case 'BootNotification':
      returnValue = null;
      /////////////////////////////////////
      // for the case of boot notification
      for (var index in result) {
        if (result[index].compare == cwjy.condition) {
          returnValue = "Accepted";
          break;
        }
        if(!returnValue)
          returnValue = "Rejected";
      }
      // for the case of boot notification
      //////////////////////////////////////

      break;
    case 'fetch':
      returnValue = result;
      break;
    case 'update':
      returnValue = 'ok';
      break;
  }

  callback(returnValue);
}

multiple = async (cwjys, callback) => {
  for(let cwjy of cwjys) {
    switch(cwjy.type) {
      case 'http':
        break;
      case 'ocpp':
        break;
    }
    var result = await dbConnector.submitSync(query);
    if(cwjy.condition) {
      // condition handling
      return;
    }
  };

}

module.exports = {
  //init: init,
  preProcess: preProcess,
  singleSync: singleSync,
  single: single,
  multiple: multiple,
  showPerformance: showPerformance
}