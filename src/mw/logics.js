var constants = require('../lib/constants');

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
    var returnValue, query, result;
    switch (cwjy.action) {
      case 'GetSerial':
        query = `SELECT evseSerial FROM evsecheck WHERE evseNickname = '${cwjy.evseNickname}'`;
        break;
      case 'EVSECheck':
        query = `SELECT evseSerial, status, occupyingUserId FROM evse WHERE evseNickname = '${cwjy.evseNickname}'`;
        break;
      case 'UserStatus':
        query = `SELECT evseSerial, evseNickname, status, occupyingUserId, 
                        DATE_FORMAT(occupyingEnd, '%Y-%m-%e %H:%i:%s') as occupyingEnd, connectorId
                        FROM evsecheck WHERE occupyingUserId = '${cwjy.userId}'`;
        break;
      case 'ChargingStatus':
        query = `SELECT DATE_FORMAT(started, '%Y-%m-%e %H:%i:%s') as started,
                        DATE_FORMAT(finished, '%Y-%m-%e %H:%i:%s') as finished,
                        chargePointId, chargePointName, userId, evseSerial, evseNickname, bulkSoc, fullSoc, trxId,
                        meterStart, meterNow, priceHCL, priceHost
                        FROM viewbillplus WHERE userId = '${cwjy.userId}' ORDER BY trxId DESC LIMIT 1`;
        break;
      case 'Reserve':
        query = `UPDATE evse SET status = 'Reserved', occupyingUserId = '${cwjy.userId}', 
               occupyingEnd = DATE_ADD(NOW(), INTERVAL ${constants.SQL_RESERVE_DURATION} MINUTE)
               WHERE evseSerial = '${cwjy.evseSerial}'`;
        break;
      case 'Angry':
        query = `SELECT occupyingUserId FROM evsecheck WHERE evseSerial = '${cwjy.evseSerial}'`;
        var target = await dbConnector.submitSync(query);
        query = `SELECT * FROM notification WHERE recipientId = '${target[0].occupyingUserId}'`;
        result = await dbConnector.submitSync(query);
        query = (!result) ? `INSERT INTO notification (evseSerial, recipientId, type)
                              VALUES ('${cwjy.evseSerial}', '${target[0].occupyingUserId}', 'Angry')`
                          : null;
        /*
        if(!result)
          query = `INSERT INTO notification (evseSerial, recipientId, type)
                    VALUES ('${cwjy.evseSerial}', '${target[0].occupyingUserId}', 'Angry')`;
        else
          query = null;
          */
        break;
      case 'Alarm':
        query = `INSERT INTO notification (evseSerial, recipientId, type)
                  VALUES ('${cwjy.evseSerial}', '${cwjy.userId}', 'Waiting')`;
        break;
      case 'Report':
        break;
      case 'ShowAllEVSE':
        query = `SELECT chargePointId, chargePointName, address, priceHCL, priceHost, priceExtra,
                        evseSerial, evseNickname, status, occupyingUserId, 
                        DATE_FORMAT(occupyingEnd, '%Y-%m-%e %H:%i:%s') as occupyingEnd, capacity, connectorId
                        FROM evsebycp WHERE chargePointId = '${cwjy.chargePointId}'`;
        break;
      case 'ShowAllCPbyLoc':
        var box = getBox(cwjy.lat, cwjy.lng, cwjy.rng);
        query = `SELECT chargePointId, chargePointName, ownerId, lat, lng, locationDetail,
                        address, priceHCL, priceHost, priceExtra FROM chargepoint 
                  WHERE lat < '${box.top}' AND lat > '${box.bottom}'
                  AND lng < '${box.right}' AND lng > '${box.left}'`;
        break;
      case 'ShowAllCPbyName':
        query = `SELECT chargePointId, chargePointName, ownerId, lat, lng, locationDetail,
                        address, priceHCL, priceHost, priceExtra FROM chargepoint 
                  WHERE chargePointName LIKE '%${cwjy.name}%'`;
        break;
      case 'UserHistory':
        query = `SELECT DATE_FORMAT(started, '%Y-%m-%e %H:%i:%s') as started,
                        DATE_FORMAT(finished, '%Y-%m-%e %H:%i:%s') as finished,
                        chargePointId, chargePointName, userId, evseSerial, evseNickname, trxId, totalkWh, cost 
                        FROM viewbillplus WHERE userId = '${cwjy.userId}'`;
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
        /*
        var kWh;
        for ( var i in cwjy.pdu.meterValue) {
          for ( var j in cwjy.pdu.meterValue[i].sampledValue) {
            if(cwjy.pdu.meterValue[i].sampledValue[j].measurand == 'Energy.Active.Import.Register')
              kWh = cwjy.pdu.meterValue[i].sampledValue[j].value;
            
          }
        }
        */
        var kwh = cwjy.pdu.meterValue[0].sampledValue[0].value;
        query = `UPDATE evse SET lastHeartbeat = CURRENT_TIMESTAMP 
                  WHERE evseSerial = '${cwjy.evseSerial}';
                 UPDATE bill set meterNow = '${kwh}'
                  WHERE trxId = '${cwjy.pdu.transactionId}';`;
        //console.log('metermeter: ' + JSON.stringify(cwjy.pdu));
        //console.log('metermeter: ' + query);
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
                 INSERT INTO bill (started, evseSerial, userId, bulkSoc, fullSoc, meterStart, meterNow, trxId)
                  VALUES (FROM_UNIXTIME(${cwjy.pdu.timeStamp} / 1000), '${cwjy.evseSerial}', '${cwjy.pdu.idTag}',
                  '${cwjy.pdu.bulkSoc}', '${cwjy.pdu.fullSoc}', '${cwjy.pdu.meterStart}', 
                  '${cwjy.pdu.meterStart}', ${cwjy.pdu.transactionId});
                 INSERT INTO favorite (userId, chargePointId, recent)
                  SELECT occupyingUserId, chargePointId, CURRENT_TIMESTAMP FROM evse
                  WHERE evseSerial = '${cwjy.evseSerial}';`;
        /*
        query = `UPDATE evse SET status = 'Charging', occupyingUserId = '${cwjy.pdu.idTag}', occupyingEnd = FROM_UNIXTIME(${est}) 
                  WHERE evseSerial = '${cwjy.evseSerial}';
                 INSERT INTO bill (started, evseSerial, userId, trxId, bulkSoc, fullSoc, meterStart, meterNow)
                  VALUES (FROM_UNIXTIME(${cwjy.pdu.timeStamp} / 1000), '${cwjy.evseSerial}', '${cwjy.pdu.idTag}',
                  '${cwjy.pdu.transactionId}', '${cwjy.pdu.bulkSoc}', '${cwjy.pdu.fullSoc}', 
                  '${cwjy.pdu.meterStart}', '${cwjy.pdu.meterStart}');
                 UPDATE bill LEFT JOIN evse ON bill.evseSerial = evse.evseSerial
                  SET bill.chargePointId = evse.chargePointId, bill.ownerId = evse.ownerId,
                    bill.evseNickname = evse.evseNickname
                  WHERE bill.trxId = '${cwjy.pdu.transactionId}';
                 INSERT INTO favorite (userId, chargePointId, recent)
                  SELECT occupyingUserId, chargePointId, CURRENT_TIMESTAMP FROM evse
                  WHERE evseSerial = '${cwjy.evseSerial}';`;
                  */
        // 1000: epoch to tiestamp
        break;
      case 'StopTransaction':
        query = `SELECT meterStart, priceHCL, priceHost FROM viewbillplus WHERE trxId = '${cwjy.pdu.transactionId}'`;
        result = await dbConnector.submitSync(query);
        if(!result) {
          console.log('logic error. no transaction ongoing.');
          query = '';
          break;
        }
        var totalkWh = Number(cwjy.pdu.meterStop) - Number(result[0].meterStart);
        var costhcl = totalkWh * Number(result[0].priceHCL);
        var costhost = totalkWh * Number(result[0].priceHost);
        query = `UPDATE evse SET status = 'Finishing' WHERE evseSerial = '${cwjy.evseSerial}';
                 UPDATE bill SET finished = FROM_UNIXTIME(${cwjy.pdu.timeStamp} / 1000), cost = '${costhcl + costhost}',
                  costHCL = '${costhcl}', costHost='${costhost}', termination = '${cwjy.pdu.reason}', 
                  meterNow = '${cwjy.pdu.meterStop}', totalkWh = '${totalkWh}'
                  WHERE trxId = '${cwjy.pdu.transactionId}';`;
        break;
      case 'StatusNotification':
        query = (cwjy.userId) ? `UPDATE evse SET status = '${cwjy.pdu.status}', occupyingUserId = '${cwjy.userId}'
                                  WHERE evseSerial = '${cwjy.evseSerial}'`
                              : `UPDATE evse SET status = '${cwjy.pdu.status}', occupyingUserId = NULL, occupyingEnd = NULL
                                  WHERE evseSerial = '${cwjy.evseSerial}'`;
        /*
        if (cwjy.userId)
          query = `UPDATE evse SET status = '${cwjy.pdu.status}', occupyingUserId = '${cwjy.userId}'
                    WHERE evseSerial = '${cwjy.evseSerial}'`;
        else
          query = `UPDATE evse SET status = '${cwjy.pdu.status}', occupyingUserId = NULL, occupyingEnd = NULL
                    WHERE evseSerial = '${cwjy.evseSerial}'`;
        */
        break;
      case 'GetUserFavo':
        query = (cwjy.favo == 'favorite') ? `SELECT chargePointName, chargePointId, userId, favoriteOrder
                                              FROM favoriteinfos WHERE userId = '${cwjy.userId}'
                                              AND favoriteOrder IS NOT NULL ORDER BY favoriteOrder`
                                          : `SELECT chargePointName, chargePointId, userId, 
                                              DATE_FORMAT(recent, '%Y-%m-%e %H:%i:%s') as recent
                                              FROM favoriteinfos WHERE userId = '${cwjy.userId}'
                                              AND recent IS NOT NULL ORDER BY recent`;
        /*
        if(cwjy.favo == 'favorite')
          query = `SELECT * FROM favoriteinfos WHERE userId = '${cwjy.userId}' AND favoriteOrder IS NOT NULL
                    ORDER BY favoriteOrder`;
        else if(cwjy.favo == 'recent')
          query = `SELECT * FROM favoriteinfos WHERE userId = '${cwjy.userId}' AND recent IS NOT NULL
                    ORDER BY recent`;
                    */
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
          query = `SELECT chargePointId AS cpid FROM evse WHERE occupyingUserId = '${cwjy.userId}'`;
          result = await dbConnector.submitSync(query);
          var cpid = result[0].cpid;
          if(cpid) {
            query = `SELECT * FROM favorite WHERE userId = '${cwjy.userId}' AND chargePointId = '${cpid}'`;
            result = await dbConnector.submitSync(query);
            if(result) {
              //console.log('visited before');
              query = `UPDATE favorite SET recent = CURRENT_TIMESTAMP 
                      WHERE userId = '${cwjy.userId}' AND chargePointId = '${cpid}'`;
            }
            else {
              //console.log('newly visited');
              query = `INSERT INTO favorite (userId, chargePointId, recent)
                      VALUES ('${cwjy.userId}', '${cpid}', CURRENT_TIMESTAMP)`;
            }
          }
          else {
            console.log('logic error. no such chargepointid.');
          }
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

    ///////////////////////////////////////////
    // result message making from here
    switch (cwjy.action) {
      case 'GetSerial':
      case 'UserHistory':
      case 'ShowAllEVSE':
      case 'ShowAllCPbyLoc':
      case 'ShowAllCPbyName':
      case 'Alarm':
      case 'Report':
      case 'Reserve':
      case 'UserStatus':
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
        returnValue = (!result) ? { idTagInfo: { status: 'Invalid' } } : { idTagInfo: { status: result[0].authStatus } };
        /*
        if(!result)
          returnValue = { idTagInfo: { status: 'Invalid' } };
        else
          returnValue = { idTagInfo: { status: result[0].authStatus } };
        */
        break;
      case 'Heartbeat':
        returnValue = { currentTime: Date.now() };
        break;
      case 'StartTransaction': 
        returnValue = { transactionId: cwjy.pdu.transactionId, idTagInfo: { status: 'Accepted' } };
        break;
      case 'StopTransaction':  
      case 'StatusNotification':
      case 'MeterValues':
        returnValue = {};
        break;
      case 'BootNotification':
        if(!result)
          returnValue = { currentTime: Date.now(), interval: 0, status: 'Rejected' };
        else {
          returnValue = { currentTime: Date.now(), interval: result[0].heartbeat , status: 'Accepted' };
          var now = Date.now() / 1000;
          query = `UPDATE evse SET booted = FROM_UNIXTIME(${now}), lastHeartbeat = FROM_UNIXTIME(${now}),
                    status = 'Available', occupyinguserid = NULL, occupyingEnd = NULL
                    WHERE evseSerial = '${cwjy.evseSerial}'`;
          //console.log('date:' + query);
          dbConnector.submit(query);
        }
        break;
    }

    if(callback)
      callback(returnValue);
  }

  getBox = (lat, lng, rng)  => {
    var latPerKM = ( 1 / (constants.EARTH_RADIUS * 1 * (Math.PI / 180))) / 1000;
    var lngPerKM = ( 1 / (constants.EARTH_RADIUS * 1 * (Math.PI / 180) * Math.cos(lat * Math.PI / 180))) / 1000;

    var box = { top: (parseFloat(lat) + (rng * latPerKM)), 
                bottom: (parseFloat(lat) - (rng * latPerKM)),
                right: (parseFloat(lng) + (rng * lngPerKM)),
                left: (parseFloat(lng) - (rng * lngPerKM)) };
    return box;
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
