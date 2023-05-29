const EARTH_RADIUS = 6371;
const SQL_RESERVE_DURATION_MINUTE = 15;
//const SQL_FAVORITE_CODE_PART = 200;

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
        query = `SELECT * FROM evsecheck WHERE evseSerial = '${cwjy.evseSerial}'`; break;
      case 'ChargingStatus':
        query = `SELECT * FROM billstatus WHERE userId = '${cwjy.userId}' AND finished IS NULL`;
        break;
      case 'Reserve':
        //var reserveUntil = (Date.now() + (SQL_RESERVE_DURATION_MINUTE * 60 * 1000)) / 1000;
        //query = `UPDATE evse SET status = 'Reserved', occupyingUserId = '${cwjy.userId}', 
               //occupyingEnd = FROM_UNIXTIME(${reserveUntil})
               //WHERE evseSerial = '${cwjy.evseSerial}'`;
        query = `UPDATE evse SET status = 'Reserved', occupyingUserId = '${cwjy.userId}', 
               occupyingEnd = DATE_ADD(NOW(), INTERVAL + ${SQL_RESERVE_DURATION_MINUTE} MINUTE)
               WHERE evseSerial = '${cwjy.evseSerial}'`;
        break;
      case 'Angry':
        query = `SELECT * FROM evsecheck WHERE evseSerial = '${cwjy.evseSerial}'`;
        var target = await dbConnector.submitSync(query);
        query = `SELECT * FROM notification WHERE recipientId = '${target[0].occupyingUserId}'`;
        result = await dbConnector.submitSync(query);
        if(!result)
          query = `INSERT INTO notification (evseSerial, recipientId, type)
                    VALUES ('${cwjy.evseSerial}', '${target[0].occupyingUserId}', 'Angry')`;
        else
          query = null;
        break;
      case 'Alarm':
        query = `INSERT INTO notification (evseSerial, recipientId, type)
                  VALUES ('${cwjy.evseSerial}', '${cwjy.userId}', 'Waiting')`;
        break;
      case 'Report':
        break;
      case 'ShowAllEVSE':
        query = `SELECT * FROM evsebycp WHERE chargePointId = '${cwjy.chargePointId}'`;
        break;
      case 'ShowAllCP':
        var box = getBox(cwjy.lat, cwjy.lng, cwjy.rng);
        query = `SELECT * FROM cpbasic 
                  WHERE lat < '${box.top}' AND lat > '${box.bottom}'
                  AND lng < '${box.right}' AND lng > '${box.left}'`;
        console.log(query);
        break;
      case 'UserHistory':
        query = `SELECT * FROM billstatus WHERE userId = '${cwjy.userId}'`;
        break;
      case 'BootNotification':                                    
        query = `SELECT evseSerial, heartbeat FROM evse JOIN chargepoint 
                  ON evse.chargePointId = chargepoint.chargePointId AND evse.evseSerial = '${cwjy.evseSerial}'
                  WHERE chargepoint.vendor = '${cwjy.pdu.chargePointVendor}' 
                  AND chargepoint.model = '${cwjy.pdu.chargePointModel}'`;
        break;
      case 'Authorize':                                           
        query = `SELECT authStatus FROM user WHERE userId = '${cwjy.pdu.idTag}'`;
        break;
      case 'Heartbeat':                                           
        query = `UPDATE evse SET lastHeartbeat = CURRENT_TIMESTAMP 
              WHERE evseSerial = '${cwjy.evseSerial}'`;
        break;
      case 'MeterValues':
        ///////////////////////////////////////////////////////
        // TODO
        // process metervalue 
        query = `UPDATE evse SET lastHeartbeat = CURRENT_TIMESTAMP 
                  WHERE evseSerial = '${cwjy.evseSerial}';
                 UPDATE bill set meterNow = '${cwjy.pdu.meterValue.sampledValue.value}'
                  WHERE trxId = '${cwjy.pdu.transactionId}';`;
        break;
      case 'StartTransaction':
        cwjy.pdu.transactionId = trxCount++;
        query = `SELECT capacity FROM evse WHERE evseSerial = '${cwjy.evseSerial}'`;
        result = await dbConnector.submitSync(query);

        var est = Date.now() / 1000;
        if(cwjy.pdu.fullSoc > cwjy.pdu.bulkSoc > 0 )
          est += (cwjy.pdu.fullSoc - cwjy.pdu.bulkSoc) / result[0].capacity * 3600;

        query = `UPDATE evse SET status = 'Charging', occupyingUserId = '${cwjy.pdu.idTag}', occupyingEnd = FROM_UNIXTIME(${est}) 
                  WHERE evseSerial = '${cwjy.evseSerial}';
                 INSERT INTO bill (started, evseSerial, userId, trxId, bulkSoc, fullSoc, meterStart)
                  VALUES (FROM_UNIXTIME(${cwjy.pdu.timeStamp} / 1000), '${cwjy.evseSerial}', '${cwjy.pdu.idTag}',
                  '${cwjy.pdu.transactionId}', '${cwjy.pdu.bulkSoc}', '${cwjy.pdu.fullSoc}', '${cwjy.pdu.meterStart}');
                 UPDATE bill LEFT JOIN evse ON bill.evseSerial = evse.evseSerial
                  SET bill.chargePointId = evse.chargePointId, bill.ownerId = evse.ownerId
                  WHERE bill.trxId = '${cwjy.pdu.transactionId}';
                 INSERT INTO favorite (userId, chargePointId, recent)
                  SELECT occupyingUserId, chargePointId, CURRENT_TIMESTAMP FROM evse
                  WHERE evseSerial = '${cwjy.evseSerial}';`;
        // 1000: epoch to tiestamp
        break;
      case 'StopTransaction':
        query = `SELECT meterStart, priceHCL, priceHost FROM bill JOIN chargepoint 
                  ON bill.chargePointId = chargepoint.chargePointId WHERE trxId = '${cwjy.pdu.transactionId}'`;
        result = await dbConnector.submitSync(query);
        var totalkWh = Number(cwjy.pdu.meterStop) - Number(result[0].meterStart);
        var costhcl = totalkWh * Number(result[0].pricehcl);
        var costhost = totalkWh * Number(result[0].pricehost);
        query = `UPDATE evse SET status = 'Finishing' WHERE evseSerial = '${cwjy.evseSerial}';
                 UPDATE bill SET finished = FROM_UNIXTIME(${cwjy.pdu.timeStamp} / 1000), cost = '${costhcl + costhost}',
                  costHCL = '${costhcl}', costHost='${costhost}', termination = '${cwjy.pdu.reason}', 
                  meterNow = '${cwjy.pdu.meterStop}', totalkWh = '${totalkWh}'
                  WHERE trxId = '${cwjy.pdu.transactionId}';`;
        break;
      case 'StatusNotification':
        if (cwjy.userId)
          query = `UPDATE evse SET status = '${cwjy.pdu.status}', occupyingUserId = '${cwjy.userId}'
                    WHERE evseSerial = '${cwjy.evseSerial}'`;
        else
          query = `UPDATE evse SET status = '${cwjy.pdu.status}', occupyingUserId = NULL, occupyingEnd = NULL
                    WHERE evseSerial = '${cwjy.evseSerial}'`;
        break;
      case 'GetUserFavo':
        if(cwjy.favo == 'favorite')
          query = `SELECT * FROM favoriteinfos WHERE userId = '${cwjy.userId}' AND favoriteOrder IS NOT NULL
                    ORDER BY favoriteOrder`;
        else if(cwjy.favo == 'recent')
          query = `SELECT * FROM favoriteinfos WHERE userId = '${cwjy.userId}' AND recent IS NOT NULL
                    ORDER BY recent`;
        break;
      case 'NewUserFavo':
        if(cwjy.favo == 'favorite') {
          query = `SELECT MAX(favoriteOrder) AS max FROM favorite WHERE userId = '${cwjy.userId}'`;
          result = await dbConnector.submitSync(query);
          var order = result ? result[0].max + 1 : 1;
          query = `INSERT INTO favorite (userId, chargePointId, favoriteOrder)
                    VALUES ('${cwjy.userId}', '${cwjy.chargePointId}', ${order})`;
        }
        else if(cwjy.favo == 'recent') {
          query = `INSERT INTO favorite (userId, chargePointId, recent)
                    VALUES ('${cwjy.userId}', '${cwjy.chargePointId}', CURRENT_TIMESTAMP)`;
        }
        else {
          query = null;
          break;
        }
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
    result = await dbConnector.submitSync(query);

    temp = { messageType: 3, uuid: '12123', action: cwjy.action, pdu: {} };

    ///////////////////////////////////////////
    // result message making from here
    switch (cwjy.action) {
      case 'UserHistory':
      case 'ShowAllEVSE':
      case 'ShowAllCP':
      case 'Alarm':
      case 'Report':
      case 'Reserve':
      case 'ChargingStatus':
      case 'Angry':
      case 'EVSECheck':     
      case 'GetUserFavo':
      case 'NewUserFavo':
        if(!result)
          returnValue = null;
        else
          returnValue = result;
        break;
      case 'Authorize':     
        if(!result)
          temp.pdu = { idTagInfo: { status: 'Invalid' } };
        else
          temp.pdu = { idTagInfo: { status: result[0].authStatus } };
        returnValue = temp;
        break;
      case 'Heartbeat':
        temp.pdu = { currentTime: Date.now()};
        returnValue = temp;
        break;
      case 'StartTransaction': 
        temp.pdu = {transactionId: cwjy.pdu.transactionId, idTagInfo: { status: 'Accepted'}};
      case 'StopTransaction':  
      case 'StatusNotification':
      case 'MeterValues':
        returnValue = temp;
        break;
      case 'BootNotification':
        if(!result)
          temp.pdu = { currentTime: Date.now(), interval: 0, status: 'Rejected' };
        else {
          temp.pdu = { currentTime: Date.now(), interval: result[0].heartbeat , status: 'Accepted' };
          query = `UPDATE evse SET booted = FROM_UNIXTIME(${Date.now()} / 1000), status = 'Available',
                    occupyinguserid = NULL, occupyingEnd = NULL
                    WHERE evseSerial = '${cwjy.evseSerial}'`;
          dbConnector.submit(query);
        }
        returnValue = temp;
        break;
    }

    if(callback)
      callback(returnValue);
  }

  getBox = (lat, lng, rng)  => {
    var latPerKM = ( 1 / (EARTH_RADIUS * 1 * (Math.PI / 180))) / 1000;
    var lngPerKM = ( 1 / (EARTH_RADIUS * 1 * (Math.PI / 180) * Math.cos(lat * Math.PI / 180))) / 1000;

    var box = {top: (parseFloat(lat) + (rng * latPerKM)), 
               bottom: (parseFloat(lat) - (rng * latPerKM)),
               right: (parseFloat(lng) + (rng * lngPerKM)),
               left: (parseFloat(lng) - (rng * lngPerKM))};
    return box;
  }

  setTxCount = async() => {
    var query = `SELECT MAX(trxId) AS max FROM billstatus;`;
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
