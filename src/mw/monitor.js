const SQL_HEARTBEAT_LIMIT_MMDD = 1000;
const SQL_ANGRY_EXPIRY_MMDD = 1500;
const SQL_FINISHING_EXPIRY_MMDD = 1000;
const SQL_WAITING_EXPIRY_MMDD = 0;

function DBMonitor(dbConnector) {
  var toDBsvr;

  async function watch() {
    var query, result, cwjy;

    //////////////////////////////////////////
    // heartbeat
    query = `SELECT evseSerial, lastHeartbeat FROM evse 
             WHERE lastHeartBeat < CURRENT_TIMESTAMP - ${SQL_HEARTBEAT_LIMIT_MMDD}` ;
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
          expiryAfter = SQL_ANGRY_EXPIRY_MMDD;
          break;
        case 'Finishing':
          expiryAfter = SQL_FINISHING_EXPIRY_MMDD;
          break;
        case 'Waiting':
          expiryAfter = SQL_WAITING_EXPIRY_MMDD;
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