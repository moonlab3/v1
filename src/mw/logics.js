const OCPP_HEARTBEAT_INTERVAL_SECS = 60;
const SQL_RESERVE_DURATION = 1500;
const SQL_ANGRY_EXPIRY_DURATION = 1500;

function DBController (dbms) {
  const dbConnector = require('../tools/dbConnector')(dbms);
  var dbSpeedAvg = 0, trxCount = 0, requestCount = 0;

  preProcess = (event, cwjy, callback) => {
    //console.log(`dbServer:preProcess: event: ${event}, cwjy: ${JSON.stringify(cwjy)}`);
  }

  showPerformance = () => {
    console.log(`dbServer:: total transactions: ${requestCount}, average processing time(ms): ${dbSpeedAvg}`);
  }

  nnmRequest = async (cwjy, callback) => {

  }

  extRequest = async (cwjy, callback) => {
    requestCount++;
    var returnValue, query, result, temp;
    switch (cwjy.action) {
      case 'EVSECheck':
      case 'EVSEInformation':
        query = `SELECT status, occupyingUserId, occupyingEnd FROM evse
                 WHERE evseSerial = '${cwjy.evseSerial}'`;
        result = await dbConnector.submitSync(query);
        break;
      case 'ChargingStatus':
        query = `SELECT * FROM bill 
               WHERE userId = '${cwjy.userId}' AND evseSerial = '${cwjy.evseSerial}' AND finished = null`;
        result = await dbConnector.submitSync(query);
        break;
      case 'Reserve':                                                       // DONE DONE DONE DONE
        query = `UPDATE evse
               SET status = 'Reserved', occupyingUserId = '${cwjy.userId}', 
               occupyingEnd = CURRENT_TIMESTAMP + ${SQL_RESERVE_DURATION}
               WHERE evseSerial = '${cwjy.evseSerial}'`;
        result = await dbConnector.submitSync(query);
        break;
      case 'Angry':
        //query = `INSERT INTO notification (recipientId, expiry, type) VALUES ('${cwjy.userId})`;
        break;
      case 'Alarm':
        break;
      case 'Report':
        break;
      case 'UserHistory':
        query = `SELECT * FROM BILL WHERE userId = '${cwjy.userId}'`;
        result = await dbConnector.submitSync(query);
        break;
      case 'BootNotification':                                    
        query = `SELECT evseSerial FROM evse LEFT JOIN chargepoint 
              ON evse.chargePointId = chargepoint.chargePointId AND evse.evseSerial = '${cwjy.pdu.chargeBoxSerialNumber}'
              WHERE chargepoint.vendor = '${cwjy.pdu.chargePointVendor}' AND chargepoint.model = '${cwjy.pdu.chargePointModel}'`;
        result = await dbConnector.submitSync(query);
        break;
      case 'Authorize':                                           
        query = `SELECT authStatus FROM user WHERE userId = '${cwjy.pdu.idTag}'`;
        result = await dbConnector.submitSync(query);
        break;
      case 'HeartBeat':                                           
        query = `UPDATE evse SET lastHeartbeat = CURRENT_TIMESTAMP 
              WHERE evseSerial = '${cwjy.evseSerial}'`;
        result = await dbConnector.submitSync(query);
        break;
      case 'MeterValues':
        break;
      case 'StartTransaction':
        cwjy.pdu.transactionId = trxCount++;
        query = `SELECT capacity FROM evse WHERE evseSerial = '${cwjy.evseSerial}'`;
        result = await dbConnector.submitSync(query);

        //////////////////////////////////////////
        // calculation for occupyingEnd

        query = `UPDATE evse SET status = 'Charging', occupyingUserId = '${cwjy.pdu.idTag}' 
               WHERE evseSerial = '${cwjy.evseSerial}';
               INSERT INTO bill (started, evseSerial, userId, trxId, bulkSoc, fullSoc) 
               VALUES (FROM_UNIXTIME(${cwjy.pdu.timeStamp} / 1000), '${cwjy.evseSerial}', '${cwjy.pdu.idTag}',
               '${cwjy.pdu.transactionId}', '${cwjy.pdu.bulkSoc}', '${cwjy.pdu.fullSoc}');
               UPDATE bill LEFT JOIN evse ON bill.evseSerial = evse.evseSerial
               SET bill.chargePointId = evse.chargePointId, bill.ownerId = evse.ownerId
               WHERE bill.trxId = '${cwjy.pdu.transactionId}';
               REPLACE INTO recent (userId, chargePointId)
               SELECT occupyingUserId, chargePointId FROM evse WHERE evseSerial='${cwjy.evseSerial}'`;
        // 1000: epoch to tiestamp
        result = await dbConnector.submitSync(query);
        break;
      case 'StatusNotification':
        if (cwjy.userId)
          /////////////////////////////////////////////////////////////////
          // pdu.idTag? or userId
          query = `UPDATE evse SET status = '${cwjy.pdu.status}', occupyingUserId = '${cwjy.userId}'
                 WHERE evseSerial = '${cwjy.evseSerial}'`;
        else
          query = `UPDATE evse SET status = '${cwjy.pdu.status}', occupyingUserId = null, occupyingEnd = null
                 WHERE evseSerial = '${cwjy.evseSerial}'`;
        result = await dbConnector.submitSync(query);
        break;
      case 'StopTransaction':
        query = `UPDATE evse SET status = 'Finishing' WHERE evseSerial = '${cwjy.evseSerial}';
              UPDATE bill SET finished = FROM_UNIXTIME(${cwjy.pdu.timeStamp} / 1000), 
              termination = '${cwjy.pdu.reason}', meterStop = '${cwjy.pdu.meterStop}' 
              WHERE trxId = '${cwjy.pdu.transactionId}';`;
        // 1000: epoch to tiestamp
        //INSERT INTO notification (recipientId, expiry, type) 
        //VALUES ()`;

        result = await dbConnector.submitSync(query);
        break;
      case 'RemoteStartTransaction':
        query = `UPDATE evse SET status = 'Preparing', occupyingUserId = '${cwjy.userId}'
               WHERE evseSerial = '${cwjy.evseSerial}`;
        result = await dbConnector.submitSync(query);
        break;
      case 'RemoteStopTransaction':
        query = `UPDATE evse SET status = 'Finishing' WHERE evseSerial = '${cwjy.evseSerial}'`;
        result = await dbConnector.submitSync(query);
        break;
      case 'ChangeAvailability':
      case 'ChangeConfiguration':
      case 'ClearCache':
      case 'DataTransfer':
      case 'GetConfiguration':
        break;
      case 'Reset':
        break;
    }

    temp = { messageType: 3, action: cwjy.action, pdu: {} };
    console.log(`logics query result: ${JSON.stringify(result)}`);

    ///////////////////////////////////////////
    // result message making from here
    switch (cwjy.action) {
      case 'UserHistory':
        returnValue = result;
        break;
      case 'Alarm':
      case 'Report':
      case 'Reserve':
        break;
      case 'ChargingStatus':
      case 'Angry':
      case 'EVSEInformation':
      case 'EVSECheck':     
        //if(!result || !result[0])
        if(!result)
          returnValue = null;
        else
          returnValue = result[0];
        break;
      case 'Authorize':     
        //if(!result || !result[0])
        if(!result)
          temp.pdu = { idTagInfo: { status: 'Invalid' } };
        else
          temp.pdu = { idTagInfo: { status: result[0].authStatus } };
      case 'StartTransaction': 
      case 'StopTransaction':  
      case 'StatusNotification':
        returnValue = temp;
        break;
      case 'BootNotification':
        //if(!result || !result[0])
        if(!result)
          temp.pdu = { currentTime: Date.now(), interval: OCPP_HEARTBEAT_INTERVAL_SECS, status: 'Rejected' };
        else {
          temp.pdu = { currentTime: Date.now(), interval: OCPP_HEARTBEAT_INTERVAL_SECS, status: 'Accepted' };
          query = `UPDATE evse SET booted = FROM_UNIXTIME(${Date.now()} / 1000), status = 'Available'
                   WHERE evseSerial = '${cwjy.pdu.chargeBoxSerialNumber}'`;
          dbConnector.submit(query);
        }
        /*
        for (var index in result) {
          if (result[index].evseSerial == cwjy.evseSerial) {
            temp.pdu.status = "Accepted";
            break;
          }
          if (!temp)
            temp.pdu.status = "Rejected";
        }
        */
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
