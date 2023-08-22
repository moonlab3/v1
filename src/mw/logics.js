var constants = require('../lib/constants');

function DBController (dbms) {
//function DBController () {
  const dbConnector = require('../tools/dbConnector')(dbms);
  //const dbConnector = require('../tools/dbConnector')();
  var dbSpeedAvg = 0, trxCount = 0, requestCount = 0;

  preProcess = (event, cwjy, callback) => {
    //console.log(`dbServer:preProcess: event: ${event}, cwjy: ${JSON.stringify(cwjy)}`);
  }

  showPerformance = () => {
    console.log(`dbServer:: total transactions: ${requestCount}, average processing time(ms): ${dbSpeedAvg}`);
  }

  nnmRequest = async (cwjy, callback) => {

  }

  authRequest = async (cwjy, callback) => {
    var returnValue, query, result;
    switch (cwjy.action) {
      case 'AuthStatus':
        query = `SELECT userId, authStatus FROM user WHERE email = '${cwjy.email}'`;
        break;
      case 'SignUp':
        query = `UPDATE user SET password=SHA2('${cwjy.password}', 256) WHERE email = '${cwjy.email}'`;
        break;
      case 'Login':
        query = `SELECT userId FROM user WHERE email = '${cwjy.email}' AND password = SHA2('${cwjy.password}', 256)`;
        break;
    }
    result = await dbConnector.submitSync(query);

    switch (cwjy.action) {
      case 'AuthStatus':
      case 'SignUp':
      case 'Login':
        returnValue = result;
        break;
    }

    if(callback)
      callback(returnValue);
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
        // evseSerial
        query = `SELECT evseNickname, status, occupyingUserId, 
                        DATE_FORMAT(occupyingEnd, '%Y-%m-%d %H:%i:%s') AS occupyingEnd, connectorId
                 FROM evsecheck 
                 WHERE occupyingUserId = '${cwjy.userId}'`;
        break;
      case 'ChargingStatus':
        // chargePointId, userId, evseSerial, trxId, 
        query = `SELECT DATE_FORMAT(started, '%Y-%m-%d %H:%i:%s') AS started,
                        DATE_FORMAT(finished, '%Y-%m-%d %H:%i:%s') AS finished,
                        chargePointName, bulkSoc, fullSoc, meterStart, meterNow, totalkWh, priceHCL, priceHost,
                        evseSerial, evseNickname, trxId
                 FROM viewbillplus 
                 WHERE userId = '${cwjy.userId}' ORDER BY trxId DESC LIMIT 1`;
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
        // chargePointId
        query = `SELECT chargePointId, chargePointName, address, priceHCL, priceHost, priceExtra,
                        evseSerial, evseNickname, status, occupyingUserId, 
                        DATE_FORMAT(occupyingEnd, '%Y-%m-%d %H:%i:%s') AS occupyingEnd, capacity, connectorId
                 FROM evsebycp 
                 WHERE chargePointId = '${cwjy.chargePointId}'`;
        break;
      case 'ShowAllCPbyLoc':
        var box = getBox(cwjy.lat, cwjy.lng, cwjy.rng);
        query = `SELECT chargePointId, chargePointName, ownerId, lat, lng, locationDetail,
                        address, priceHCL, priceHost, priceExtra, evses, avails
                  FROM chargepoint 
                  WHERE lat < '${box.top}' AND lat > '${box.bottom}'
                  AND lng < '${box.right}' AND lng > '${box.left}'`;
        break;
      case 'ShowAllCPbyName':
        query = `SELECT chargePointId, chargePointName, ownerId, lat, lng, locationDetail,
                        address, priceHCL, priceHost, priceExtra, evses, avails
                  FROM chargepoint 
                  WHERE chargePointName LIKE '%${cwjy.name}%'`;
        break;
      case 'UserHistory':
        // chargePointId, userId, evseSerial, trxId
        query = `SELECT DATE_FORMAT(started, '%Y-%m-%d %H:%i:%s') AS started,
                        DATE_FORMAT(finished, '%Y-%m-%d %H:%i:%s') AS finished,
                        chargePointName, evseNickname, totalkWh, cost 
                 FROM viewbillplus 
                 WHERE userId = '${cwjy.userId}'`;
        break;
      case 'BootNotification':                                    
        query = `SELECT evseSerial, heartbeat 
                 FROM evse JOIN chargepoint 
                 ON evse.chargePointId = chargepoint.chargePointId AND evse.evseSerial = '${cwjy.evseSerial}'
                 WHERE chargepoint.vendor = '${cwjy.pdu.chargePointVendor}' 
                       AND chargepoint.model = '${cwjy.pdu.chargePointModel}'`;
        break;
      case 'Authorize':                                           
        query = `SELECT authStatus FROM user WHERE cardNumber = '${cwjy.pdu.idTag}'`;
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
        var A = cwjy.pdu.meterValue[0].sampledValue[2].value;
        var V = cwjy.pdu.meterValue[0].sampledValue[3].value;
        var t = cwjy.pdu.meterValue[0].sampledValue[4].value;
        var kw = Math.floor(A * V / 1000);
        query = `UPDATE evse SET lastHeartbeat = CURRENT_TIMESTAMP WHERE evseSerial = '${cwjy.evseSerial}';
                 UPDATE bill SET meterNow = '${kwh}' WHERE trxId = '${cwjy.pdu.transactionId}';
                 UPDATE bill SET totalkWh = meterNow - meterStart WHERE trxId = '${cwjy.pdu.transactionId}';
                 INSERT INTO evselogs (evseSerial, time, temp, V, A, kWh)
                 VALUES ('${cwjy.evseSerial}', CURRENT_TIMESTAMP, ${t}, ${V}, ${A}, ${kw}); `;
        break;
      case 'StartTransaction':
        cwjy.pdu.transactionId = trxCount++;
        query = `SELECT capacity FROM evse WHERE evseSerial = '${cwjy.evseSerial}'`;
        result = await dbConnector.submitSync(query);

        var est = Date.now() / 1000;
        if(cwjy.pdu.fullSoc > cwjy.pdu.bulkSoc > 0 ) {
          est += (cwjy.pdu.fullSoc - cwjy.pdu.bulkSoc) / result[0].capacity * 3600;
        }
        else {
          est = 0;
        }

        query = `SELECT userId FROM user WHERE cardNumber = '${cwjy.pdu.idTag}'`;
        result = await dbConnector.submitSync(query);
        var userId = result ? result[0].userId : cwjy.pdu.idTag;

        query = `UPDATE evse SET status = 'Charging', occupyingUserId = '${userId}', occupyingEnd = FROM_UNIXTIME(${est}) 
                  WHERE evseSerial = '${cwjy.evseSerial}';
                 INSERT INTO bill (started, evseSerial, userId, bulkSoc, fullSoc, meterStart, meterNow, trxId)
                  VALUES (FROM_UNIXTIME(${cwjy.pdu.timeStamp} / 1000), '${cwjy.evseSerial}', '${userId}',
                         '${cwjy.pdu.bulkSoc}', '${cwjy.pdu.fullSoc}', '${cwjy.pdu.meterStart}', 
                         '${cwjy.pdu.meterStart}', ${cwjy.pdu.transactionId});
                 UPDATE bill b INNER JOIN evse e ON b.evseSerial = e.evseSerial
                  SET b.chargePointId = e.chargePointId, b.evseNickname = e.evseNickname,  b.ownerId = e.ownerId
                  WHERE b.trxId = ${cwjy.pdu.transactionId};
                 INSERT INTO favorite (userId, chargePointId, recent)
                  SELECT occupyingUserId, chargePointId, CURRENT_TIMESTAMP FROM evse
                  WHERE evseSerial = '${cwjy.evseSerial}';`;
        /*
        // don't need. viewbillplus can hold the information
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
          console.warn('no transaction ongoing.');
          //console.log('logic error. no transaction ongoing.');
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
        break;
      case 'GetCPDetail':
        query = `SELECT chargePointName, chargePointId,  address, locationDetail, lat, lng,
                        priceHCL, priceHost, priceExtra, parkingCondition, evses, avails
                 FROM chargepoint
                 WHERE chargePointId = '${cwjy.chargePointId}'`;
        break;
      case 'IsFavorite':
        query = `SELECT COUNT(*) FROM favorite
                 WHERE userId = '${cwjy.userId}' AND chargePointId = '${cwjy.chargePointId}'`;
        break;
      case 'GetUserFavo':
        /*
        query = (cwjy.favo == 'favorite') ? `SELECT chargePointName, chargePointId, userId, favoriteOrder
                                              FROM favoriteinfos WHERE userId = '${cwjy.userId}'
                                              AND favoriteOrder IS NOT NULL ORDER BY favoriteOrder`
                                          : `SELECT chargePointName, chargePointId, userId, 
                                              DATE_FORMAT(recent, '%Y-%m-%d %H:%i:%s') as recent
                                              FROM favoriteinfos WHERE userId = '${cwjy.userId}'
                                              AND recent IS NOT NULL ORDER BY recent`;
                                              */
        query = (cwjy.favo == 'favorite') ? `SELECT c.chargePointName AS chargePointName, f.chargePointId AS chargePointId,
                                                    f.favoriteOrder AS favoriteOrder, c.priceHCL AS priceHCL,
                                                    c.priceHost AS priceHost, c.priceExtra AS priceExtra,
                                                    c.parkingCondition AS parkingCondition, c.avails AS avails
                                              FROM favorite f JOIN chargepoint c ON f.chargePointId = c.chargePointId
                                              WHERE userId = '${cwjy.userId}'
                                              AND favoriteOrder IS NOT NULL ORDER BY favoriteOrder`
                                          : `SELECT c.chargePointName AS chargePointName, f.chargePointId AS chargePointId,
                                                    f.favoriteOrder AS favoriteOrder, c.priceHCL AS priceHCL,
                                                    c.priceHost AS priceHost, c.priceExtra AS priceExtra,
                                                    c.parkingCondition AS parkingCondition,
                                              DATE_FORMAT(recent, '%Y-%m-%d %H:%i:%s') as recent, c.avails AS avails
                                              FROM favorite f JOIN chargepoint c ON f.chargePointId = c.chargePointId
                                              WHERE userId = '${cwjy.userId}'
                                              AND recent IS NOT NULL ORDER BY recent`;
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
            result = (result) ? `UPDATE favorite SET recent = CURRENT_TIMESTAMP
                                  WHERE userId = '${cwjy.userId}' AND chargePointId = '${cpid}'`
                              : `INSERT INTO favorite (userId, chargePointId, recent)
                                  VALUES ('${cwjy.userId}', '${cpid}', CURRENT_TIMESTAMP)`;
          }
          else {
            console.warn('logic error. no such chargepointid.');
          }
        }
        else {
          query = null;
          break;
        }
        break;
      case 'DelUserFavo':
        query = `DELETE FROM favorite WHERE userId='${cwjy.userId}' AND chargePointId='${cwjy.chargePointId}'
                                            AND recent IS NULL`;
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
      case 'IsFavorite':
      case 'GetUserFavo':
      case 'NewUserFavo':
        if(!result)
          returnValue = null;
        else
          returnValue = result;
        break;
      case 'Authorize':     
        returnValue = (!result) ? { idTagInfo: { status: 'Invalid' } } 
                                : { idTagInfo: { status: result[0].authStatus } };
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
    console.debug('setTxCount: ' + trxCount);
  }

  const dbController = {
    preProcess,
    showPerformance,
    extRequest,
    nnmRequest,
    authRequest,
    setTxCount
  }

  return dbController;
}

module.exports = DBController;
