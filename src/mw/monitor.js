var constants = require('../lib/constants');

function DBMonitor(dbConnector) {
  var toDBsvr;

  async function watch() {
    var query, result, cwjy;

    //////////////////////////////////////////
    // heartbeat
    query = `SELECT evseSerial, lastHeartbeat FROM evse 
             WHERE lastHeartBeat < DATE_SUB(NOW(), INTERVAL ${constants.SQL_HEARTBEAT_LIMIT} MINUTE` ;
    result = await dbConnector.submitSync(query);
    for (var i in result) {
      // status change to faulted?
      cwjy =  {action: 'StatusNotification', evseSerial: result[i].evseSerial,
               pdu: {status: 'Unavailable', timeStamp: Date.now()}};
      //console.log(`watch: ${JSON.stringify(result[i])} is now unavailable`);
      //toDBsvr(cwjy);
    }

    //////////////////////////////////////////
    // notification all

    query = `SELECT * FROM notification WHERE expiry IS NULL`;
    result = await dbConnector.submitSync(query);

    for (var i in result) {
      var expiryAfter;

      switch (result[i].type) {
        case 'Angry':
          expiryAfter = constants.SQL_ANGRY_EXPIRY;
          break;
        case 'Finishing':
          expiryAfter = constants.SQL_FINISHING_EXPIRY;
          break;
        case 'Waiting':
          expiryAfter = constants.SQL_WAITING_EXPIRY;
          break;
      }
      query = `UPDATE notification SET expiry = FROM_UNIXTIME(${Date.now()}) / 1000 + ${expiryAfter} 
               WHERE recipientId = '${result[i].recipientId}' AND evseSerial = '${result[i].evseSerial}' AND expiry IS NULL`;
      //console.log(`${i} : [${JSON.stringify(result[i])}] [${query}]`);
      dbConnector.submit(query);
      // send notification
      // send notification
      // send notification
    };

    query = `SELECT * FROM notification WHERE expiry > CURRENT_TIMESTAMP`;
    result = await dbConnector.submitSync(query);
    for (var i in result) {
      query = `DELETE FROM notification WHERE 
                recipientId = '${result[i].recipientId}' AND expiry = '${result[i].expiry}'`;
      dbConnector.submit(query);
    };

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