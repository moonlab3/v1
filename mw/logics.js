const connector = require('../tools/dbConnector');
const ocppHandler = require('../tools/ocppHandler');
var dbSpeedAvg = 0, trxCount = 0;

showPerformance = () => {
  console.log(`transactions: ${trxCount}, average processing time(ms): ${dbSpeedAvg}`);
}
singleSync = (cwjy) => {
  var query;
  console.log('singleSync called');
  switch (cwjy.type) {
    case 'http':
      query = httpHandler.req(cwjy.queryObj);
      break;
    case 'ocpp':
      query = ocppHandler.req(cwjy.queryObj);
      break;
  }
  var result = connector.submitSync(query);

  console.log('singleSync return ' + JSON.stringify(result) );
}

single = async (cwjy, callback) => {
  // cwjy handlig
  // cwjy handlig
  var query, returnValue;
  switch (cwjy.type) {
    case 'http':
      query = httpHandler.req(cwjy.queryObj);
      break;
    case 'ocpp':
      query = ocppHandler.req(cwjy.queryObj);
      break;
  }
  var result = await connector.submitSync(query);

  switch (cwjy.action) {
    case 'compare':
      returnValue = null;
      for (var index in result) {
        if (result[index].compare == cwjy.value) {
          returnValue = "Accepted";
          break;
        }
        if(!returnValue)
          returnValue = "Rejected";
      }
      break;
    case 'fetch':
      returnValue = result;
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
    var result = await connector.submitSync(query);
    if(cwjy.condition) {
      // condition handling
      return;
    }
  };

}

module.exports = {
  init: init,
  singleSync: singleSync,
  single: single,
  multiple: multiple,
  showPerformance: showPerformance
}