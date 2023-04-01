makeQuery = (cwjy) => {
  var query;
  //var req = cwjy.queryObj;
  switch (cwjy.action) {
    case 'ConnectorCheck':
    case 'ConnectorInformation':
      query = `SELECT status, occupyingUserId, occupyingEnd FROM connector 
              WHERE connectorSerial = '${cwjy.connectorSerial}'`;
      break;
    case 'Charge':
      break;
    case 'Reserve':
      break;
    case 'Angry':
      break;
    case 'Alarm':
      break;
    case 'Report':
      break;
    case 'BootNotification':
      query= `SELECT connectorSerial, connectorId FROM connector INNER JOIN chargepoint 
              ON chargepoint.vendor = '${cwjy.pdu.chargePointVendor}' AND chargepoint.model = '${cwjy.pdu.chargePointModel}'
              WHERE connector.chargePointId = chargepoint.chargePointId`;
      break;
    case 'Authorize':
      query= `SELECT authStatus FROM user WHERE userId = '${cwjy.pdu.idTag}'`;
      break;
    case 'HeartBeat':
      query= `UPDATE connector SET lastHeartbeat = CURRENT_TIMESTAMP 
                  WHERE connectorSerial = '${cwjy.connectorSerial}'`;
      break;
    case 'MeterValues':
      break;
    case 'StartTransaction':
      query = `UPDATE connector SET status = 'charging', occupyingUserId = '${cwjy.userId}' 
               WHERE connectorSerial = '${cwjy.connectorSerial}';
               INSERT INTO bill (started, connectorSerial, userId, trxId) 
               VALUES (CURRENT_TIMESTAMP, '${cwjy.connectorSerial}', ${cwjy.userId}, ${cwjy.trxCount});
               UPDATE bill INNER JOIN connector ON bill.connectorSerial = connector.connectorSerial
               SET bill.chargePointId = connector.chargePointId, bill.ownerId = connector.ownerId
               WHERE bill.trxId = ${cwjy.trxCount};`;
      break;
    case 'StatusNotification':
      query= `UPDATE connector SET status = '${cwjy.pdu.status}' WHERE connectorSerial = '${cwjy.connectorSerial}'`;
      break;
    case 'StopTransaction':
      query= `UPDATE connector SET status = 'finishing' WHERE connectorSerial = '${cwjy.connectorSerial}'`;
      break;
    case 'RemoteStartTransaction':
      query = `UPDATE connector SET status = 'Charging' WHERE connectorSerial = '${cwjy.connectorSerial}`;
      break;
    case 'RemoteStopTransaction':
      query = `UPDATE connector SET status = 'Finishing' WHERE connectorSerial = '${cwjy.connectorSerial}`;
      break;
    case 'ChangeAvailability':
    case 'ChangeConfiguration':
    case 'ClearCache':
    case 'DataTransfer':
    case 'GetConfiguration':
      break;
    case 'RemoteStartTransaction':
      query = `UPDATE connector SET status = 'charging' WHERE connectorSerial = '${cwjy.connectorSerial}`;
      break;
    case 'RemoteStopTransaction':
      query = `UPDATE connector SET status = 'charging' WHERE connectorSerial = '${cwjy.connectorSerial}`;
      break;
    case 'Reset':
      break;
  }
  return query;
}

makeMessage = (type, obj) => {
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
  makeMessage: makeMessage
}