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
      query = `UPDATE connector SET status = 'charging'
              WHERE connectorSerial = '${cwjy.connectorSerial}';
              INSERT INTO bill (started, chargePointId, connectorSerial, ownerId, userId)
              VALUES (CURRENT_TIMESTAMP, )`;
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
      query= `SELECT connectorSerial FROM connector JOIN chargepoint ON connector.chargePointId = ${cwjy.pdu.chargePointId}
                  WHERE vendor = '${cwjy.pdu.chargePointVendor}' AND model = '${cwjy.pdu.chargePointModel}'`;
      break;
    case 'Authorize':
      query= `SELECT COUNT(*) FROM connector 
                  WHERE connectorSerial = '${cwjy.connectorSerial}' AND occupyingUserId = '${cwjy.pdu.idTag}'`;
      break;
    case 'HeartBeat':
      query= `UPDATE connector SET lastHeartbeat = CURRENT_TIMESTAMP 
                  WHERE connectorSerial = '${cwjy.connectorSerial}'`;
      break;
    case 'MeterValues':
      break;
    case 'StartTransaction':
      query= `SELECT COUNT(*) FROM connector 
                  WHERE connectorSerial = '${cwjy.connectorSerial}'`;
      break;
    case 'StatusNotification':
      query= `UPDATE connector SET status = '${cwjy.pdu.status}' 
                  WHERE connectorSerial = '${cwjy.connectorSerial}'`;
      break;
    case 'StopTransaction':
      query= `SELECT COUNT(*) FROM connector 
                  WHERE connectorSerial = '${cwjy.connectorSerial}'`;
      break;
    case 'RemoteStartTransaction':
      query = `UPDATE connector SET status = 'charging' WHERE connectorSerial = '${cwjy.connectorSerial}`;
      break;
    case 'RemoteStopTransaction':
      query = `UPDATE connector SET status = 'charging' WHERE connectorSerial = '${cwjy.connectorSerial}`;
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