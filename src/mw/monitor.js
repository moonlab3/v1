const SQL_HEARTBEAT_LIMIT = 1000;
function DBMonitor(dbConnector) {
  var toDBsvr;

  async function watch() {
    var query, result, cwjy;

    //////////////////////////////////////////
    // heartbeat
    query = `SELECT connectorSerial, lastHeartBeat FROM connector 
             WHERE lastHeartBeat < CURRENT_TIMESTAMP - ${SQL_HEARTBEAT_LIMIT}` ;
    //result = await dbConnector.submitSync(query);
    for (var i in result) {
      //console.log(`watch: ${JSON.stringify(result[i])}`);
      // status change to faulted?
      cwjy =  {action: 'StatusNotification', connectorSerial: result[i].connectorSerial,
               pdu: {status: 'Unavailable', timeStamp: Date.now()}};
      //toDBsvr(cwjy);
    }

    //////////////////////////////////////////
    // angry


    /////////////////////////////////////////
    // finishing Alarm

    query = `SELECT * FROM angry`;
    //result = await dbConnector.submitSync(query);
    /*
    for (var i in result) {
    };
    */

  };

  function registerSender(sendingFunction) {
    console.log('registerSender: assigned');
    toDBsvr = sendingFunction;
  }

  const dbMonitor = {
    watch,
    registerSender
  }
  return dbMonitor;
}

module.exports = DBMonitor;