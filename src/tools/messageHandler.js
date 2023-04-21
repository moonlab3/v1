const SQL_RESERVE_DURATION = 1500;
const SQL_ANGRY_EXPIRY_DURATION = 1500;

makeQuery = (cwjy) => {
  var query;
  //var req = cwjy.queryObj;
  switch (cwjy.action) {
    case 'ConnectorCheck':                                                // DONE DONE DONE DONE
    case 'ConnectorInformation':                                          // DONE DONE DONE DONE
      query = `SELECT status, occupyingUserId, occupyingEnd, connectorId FROM connector 
              WHERE connectorSerial = '${cwjy.connectorSerial}'`;
      break;
    case 'ChargingStatus':
      query = `SELECT * FROM bill 
               WHERE userId = ${cwjy.userId} AND connectorSerial = '${cwjy.connectorSerial}' AND finished = null`;
      break;
    case 'Reserve':                                                       // DONE DONE DONE DONE
      query = `UPDATE connector
               SET status = 'Reserved', occupyingUserId = ${cwjy.userId}, 
               occupyingEnd = CURRENT_TIMESTAMP + ${SQL_RESERVE_DURATION}
               WHERE connectorSerial = '${cwjy.connectorSerial}'`;
      break;
    case 'Angry':
      //query = `INSERT INTO notification (recipientId, expiry, type) VALUES ('${cwjy.userId})`;
      /*
      query = `SELECT endPoint FROM user LEFT JOIN connector 
               ON connector.occupyingUserId = user.userId
               WHERE connector.connectorSerial = '${cwjy.connectorSerial}'`;
               */
      break;
    case 'Alarm':
      break;
    case 'Report':
      break;
    case 'UserHistory':
      query = `SELECT * FROM BILL WHERE userId = ${cwjy.userId}`;
      break;
    case 'BootNotification':                                                // DONE DONE DONE DONE
      query = `SELECT connectorSerial, connectorId FROM connector LEFT JOIN chargepoint 
              ON connector.chargePointId = chargepoint.chargePointId
              WHERE chargepoint.vendor = '${cwjy.pdu.chargePointVendor}' AND chargepoint.model = '${cwjy.pdu.chargePointModel}'`;
      break;
    case 'Authorize':                                                       // DONE DONE DONE DONE
      query= `SELECT authStatus FROM user WHERE userId = ${cwjy.pdu.idTag}`;
      break;
    case 'HeartBeat':                                                       // DONE DONE DONE DONE
      query= `UPDATE connector SET lastHeartbeat = CURRENT_TIMESTAMP 
              WHERE connectorSerial = '${cwjy.connectorSerial}'`;
      break;
    case 'MeterValues':
      break;
    case 'StartTransaction':
      query = `UPDATE connector SET status = 'Charging', occupyingUserId = ${cwjy.pdu.idTag} 
               WHERE connectorSerial = '${cwjy.connectorSerial}';
               INSERT INTO bill (started, connectorSerial, userId, trxId, bulkSoc, fullSoc) 
               VALUES (FROM_UNIXTIME(${cwjy.pdu.timeStamp} / 1000), '${cwjy.connectorSerial}', ${cwjy.pdu.idTag},
               ${cwjy.pdu.transactionId}, ${cwjy.pdu.bulkSoc}, ${cwjy.pdu.fullSoc});
               UPDATE bill LEFT JOIN connector ON bill.connectorSerial = connector.connectorSerial
               SET bill.chargePointId = connector.chargePointId, bill.ownerId = connector.ownerId
               WHERE bill.trxId = ${cwjy.pdu.transactionId};
               REPLACE INTO recent (userId, chargePointId)
               SELECT occupyingUserId, chargePointId FROM connector WHERE connectorSerial='${cwjy.connectorSerial}'`;
              // 1000: epoch to tiestamp
      break;
    case 'StatusNotification':
      if(cwjy.pdu.idTag)
        /////////////////////////////////////////////////////////////////
        // pdu.idTag? or userId
        query = `UPDATE connector SET status = '${cwjy.pdu.status}', occupyingUserId = ${cwjy.pdu.idTag}
                 WHERE connectorSerial = '${cwjy.connectorSerial}'`;
      else
        query = `UPDATE connector SET status = '${cwjy.pdu.status}', occupyingUserId = null, occupyingEnd = null
                 WHERE connectorSerial = '${cwjy.connectorSerial}'`;
      break;
    case 'StopTransaction':
      query= `UPDATE connector SET status = 'Finishing' WHERE connectorSerial = '${cwjy.connectorSerial}';
              UPDATE bill SET finished = FROM_UNIXTIME(${cwjy.pdu.timeStamp} / 1000), 
              termination = '${cwjy.pdu.reason}', meterStop = ${cwjy.pdu.meterStop} 
              WHERE trxId = ${cwjy.pdu.transactionId};`;
              // 1000: epoch to tiestamp
              //INSERT INTO notification (recipientId, expiry, type) 
              //VALUES ()`;

      break;
    case 'RemoteStartTransaction':
      query = `UPDATE connector SET status = 'Preparing', occupyingUserId = ${cwjy.userId}
               WHERE connectorSerial = '${cwjy.connectorSerial}`;
      break;
    case 'RemoteStopTransaction':
      query = `UPDATE connector SET status = 'Finishing' WHERE connectorSerial = '${cwjy.connectorSerial}'`;
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
  return query;
}

/////////////////////////////////////////////////////////////
// deprecate?
// don't need to make string
makeConfirmationMessage = (type, obj) => {
  var buffer = `{"${type}": "${obj.req}", "connectorSerial": "${obj.connectorSerial}", "pdu": {  `;
  var pdu = obj.pdu;
  if(pdu?.idTagInfo)
    buffer += `"idTagInfo": {"status": "${pdu.idTagInfo.status}"}, `;
  if(pdu?.status)
    buffer += `"status": "${pdu.status}", `;
  if(pdu?.connectorId)
    buffer += `"connectorId": "${pdu.connectorId}", `;
  if(pdu?.currentTime)
    buffer += `"currentTime": ${pdu.currentTime}, `;
  if(pdu?.interval)
    buffer += `"interval": ${pdu.interval}, `;
  if(pdu?.transactionId)
    buffer += `"transactionId": ${pdu.transactionId}, `;
  if(pdu?.type)
    buffer += `"type": "${pdu.type}", `;
  if(pdu?.key)
    buffer += `"key": "${pdu.key}", `;
  if(pdu?.value)
    buffer += `"value": "${pdu.value}", `;
  if(pdu?.vendorId)
    buffer += `"vendorId": "${pdu.vendorId}", `;
  if(pdu?.data)
    buffer += `"data": "${pdu.data}", `;
  if(pdu?.color)
    buffer += `"color": "${pdu.color}", `;

  buffer = buffer.slice(0, buffer.length - 2) + `}}`;
  console.debug('messageHandler: sending ' + buffer + 'length:' + buffer.length);
  return buffer;
}

module.exports = {
  makeQuery: makeQuery,
  makeConfirmationMessage: makeConfirmationMessage
}